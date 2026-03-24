# Frontend Integration Guide — Interior AI Backend
> React Native Expo Mobile App

**Base URL:** `http://<your-server-ip>:3001`
**Swagger Docs:** `http://localhost:3001/api/docs`

---

## Table of Contents

1. [Setup & Configuration](#1-setup--configuration)
2. [Authentication Flow](#2-authentication-flow)
3. [Token Management](#3-token-management)
4. [API Reference](#4-api-reference)
   - [Auth Endpoints](#41-auth-endpoints)
   - [Design Endpoints](#42-design-endpoints)
   - [OpenAI Prompt & Image Generation](#43-openai-prompt--image-generation)
   - [Flux Image Generation](#44-flux-image-generation)
5. [Image Upload (Expo)](#5-image-upload-expo)
6. [Complete Flow Example](#6-complete-flow-example)
7. [Error Handling](#7-error-handling)
8. [Data Models](#8-data-models)

---

## 1. Setup & Configuration

### Install dependencies

```bash
npx expo install expo-image-picker expo-secure-store expo-file-system
npm install axios
```

### API client setup

```ts
// lib/api.ts
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = 'http://<your-server-ip>:3001'; // use your machine's local IP for device testing

export const api = axios.create({
  baseURL: BASE_URL,
});

// Attach access token to every request
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshed = await refreshTokens();
      if (refreshed) {
        original.headers.Authorization = `Bearer ${refreshed}`;
        return api(original);
      }
    }
    return Promise.reject(error);
  },
);
```

> **Local IP tip:** On macOS run `ifconfig | grep "inet "` to find your LAN IP (e.g. `192.168.1.5`). Use that instead of `localhost` when testing on a physical device.

---

## 2. Authentication Flow

### 2.1 Email / Password Sign Up

```ts
// POST /auth/signup
const signup = async (name: string, email: string, password: string) => {
  const { data } = await api.post('/auth/signup', { name, email, password });
  // data: { access_token: string, refresh_token: string }
  await SecureStore.setItemAsync('access_token', data.access_token);
  await SecureStore.setItemAsync('refresh_token', data.refresh_token);
  return data;
};
```

**Request body:**
```json
{
  "name": "Alice",
  "email": "alice@example.com",
  "password": "secret123"
}
```

**Response (201):**
```json
{
  "access_token": "eyJhbGci...",
  "refresh_token": "eyJhbGci..."
}
```

**Error:** `400 Bad Request` — `"Email already exists"`

---

### 2.2 Email / Password Sign In

```ts
// POST /auth/signin
const signin = async (email: string, password: string) => {
  const { data } = await api.post('/auth/signin', { email, password });
  await SecureStore.setItemAsync('access_token', data.access_token);
  await SecureStore.setItemAsync('refresh_token', data.refresh_token);
  return data;
};
```

**Response (200):**
```json
{
  "access_token": "eyJhbGci...",
  "refresh_token": "eyJhbGci..."
}
```

**Error:** `403 Forbidden` — `"Credentials Invalid"`

---

### 2.3 Get Current User (`/auth/me`)

Call this after login to load the user's profile — name, email, and account creation date.

```ts
// GET /auth/me  (requires Authorization: Bearer <access_token>)
const getMe = async () => {
  const { data } = await api.get('/auth/me');
  return data;
};
```

**Response (200):**
```json
{
  "name": "Alice",
  "email": "alice@example.com",
  "createdAt": "2026-03-17T12:34:56.789Z"
}
```

**Error:** `401 Unauthorized` — missing or expired access token.

> **Tip:** Call this on app launch (after restoring tokens from `SecureStore`) to verify the session is still valid and populate your auth context/store.

```ts
// Example: restore session on app boot
const restoreSession = async () => {
  try {
    const user = await getMe();
    // Session valid — set user in state
    setUser(user);
  } catch {
    // Token expired or logged out — redirect to login
    setUser(null);
  }
};
```

---

### 2.5 Google OAuth (Expo)

The backend expects a Google `idToken` — get it from `expo-auth-session` or `@react-native-google-signin/google-signin`, then send it:

```ts
// POST /auth/oauth/google
const googleLogin = async (idToken: string) => {
  const { data } = await api.post('/auth/oauth/google', { idToken });
  await SecureStore.setItemAsync('access_token', data.access_token);
  await SecureStore.setItemAsync('refresh_token', data.refresh_token);
  return data;
};
```

**Request body:**
```json
{ "idToken": "ya29.a0Af..." }
```

**Response (200):** Same token pair as signin.

> **Note:** Set `GOOGLE_CLIENT_ID` in the server `.env` to your Google OAuth client ID.

---

### 2.6 Apple Sign In (Expo)

Use `expo-apple-authentication` to get the `identityToken`, then send:

```ts
import * as AppleAuthentication from 'expo-apple-authentication';

const appleLogin = async () => {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  const fullName = credential.fullName
    ? `${credential.fullName.givenName ?? ''} ${credential.fullName.familyName ?? ''}`.trim()
    : undefined;

  // POST /auth/oauth/apple
  const { data } = await api.post('/auth/oauth/apple', {
    identityToken: credential.identityToken,
    fullName, // optional, only available on first sign-in
  });

  await SecureStore.setItemAsync('access_token', data.access_token);
  await SecureStore.setItemAsync('refresh_token', data.refresh_token);
  return data;
};
```

> **Note:** Set `APPLE_CLIENT_ID` in the server `.env` to your Apple Service ID.

---

### 2.7 Logout

```ts
// POST /auth/logout  (requires Authorization: Bearer <access_token>)
const logout = async () => {
  await api.post('/auth/logout');
  await SecureStore.deleteItemAsync('access_token');
  await SecureStore.deleteItemAsync('refresh_token');
};
```

---

## 3. Token Management

| Token | Expiry | Storage |
|-------|--------|---------|
| `access_token` | 15 minutes | `SecureStore` |
| `refresh_token` | 7 days | `SecureStore` |

The `access_token` is validated on the server on every protected request. If it's expired or the user is logged out (no `refreshToken` in DB), the server returns `401`.

### Refresh tokens

```ts
// POST /auth/refresh  (requires Authorization: Bearer <refresh_token>)
const refreshTokens = async (): Promise<string | null> => {
  try {
    const refreshToken = await SecureStore.getItemAsync('refresh_token');
    if (!refreshToken) return null;

    const { data } = await axios.post(
      `${BASE_URL}/auth/refresh`,
      {},
      { headers: { Authorization: `Bearer ${refreshToken}` } },
    );

    await SecureStore.setItemAsync('access_token', data.access_token);
    await SecureStore.setItemAsync('refresh_token', data.refresh_token);
    return data.access_token;
  } catch {
    // Refresh failed — force user to log in again
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
    return null;
  }
};
```

> Both tokens are rotated on every refresh — always save both new values.

---

## 4. API Reference

### 4.1 Auth Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/auth/health` | None | Health check |
| `POST` | `/auth/signup` | None | Register with email/password |
| `POST` | `/auth/signin` | None | Login with email/password |
| `GET` | `/auth/me` | `access_token` | Get current user profile |
| `POST` | `/auth/refresh` | `refresh_token` | Rotate both tokens |
| `POST` | `/auth/logout` | `access_token` | Invalidate session |
| `POST` | `/auth/oauth/google` | None | Google login |
| `POST` | `/auth/oauth/apple` | None | Apple login |

---

### 4.2 Design Endpoints

#### Create Design

```
POST /designs
Authorization: Bearer <access_token>
Content-Type: application/json
```

```ts
const createDesign = async (design: CreateDesignPayload) => {
  const { data } = await api.post('/designs', design);
  return data; // Design object
};
```

**Request body:**
```json
{
  "category": "INTERIOR",
  "originalImageUrl": "https://example.com/original.jpg",
  "resultImageUrl": "https://example.com/result.jpg",
  "location": "Living Room",
  "style": "Modern",
  "colorPalette": "Warm Neutrals",
  "seedUsed": null
}
```

| Field | Type | Required | Values |
|-------|------|----------|--------|
| `category` | string | ✅ | `INTERIOR`, `EXTERIOR`, `LANDSCAPE`, `NEW_FLOORING` |
| `originalImageUrl` | string | ✅ | URL of uploaded image |
| `resultImageUrl` | string | ❌ | URL of AI-generated result |
| `location` | string | ✅ | e.g. `"Living Room"`, `"Backyard"` |
| `style` | string | ✅ | e.g. `"Modern"`, `"Bohemian"` |
| `colorPalette` | string | ✅ | e.g. `"High-Contrast"`, `"Warm Neutrals"` |
| `seedUsed` | number\|null | ❌ | AI seed for reproducibility |

**Response (201):** Full `Design` object (see [Data Models](#8-data-models))

---

### 4.3 OpenAI Prompt & Image Generation

All endpoints under `/openai-prompt-generation`.

---

#### GET /openai-prompt-generation/get-picture-generation
**Auth required.** Generates a detailed image prompt from a saved design (text only, no image upload).

```ts
const generatePrompt = async (designId: string) => {
  const { data } = await api.get('/openai-prompt-generation/get-picture-generation', {
    params: { designId },
  });
  return data; // { success: true, prompt: "A breathtaking modern living room..." }
};
```

**Response:**
```json
{
  "success": true,
  "prompt": "A breathtaking modern living room bathed in warm afternoon sunlight..."
}
```

---

#### POST /openai-prompt-generation/public-generate-prompt
**No auth.** Uploads a room image + designId → returns GPT-4o-mini room description.

```ts
const generatePromptWithImage = async (designId: string, imageUri: string) => {
  const formData = new FormData();
  formData.append('designId', designId);
  formData.append('image', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'room.jpg',
  } as any);

  const { data } = await api.post(
    '/openai-prompt-generation/public-generate-prompt',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return data;
};
```

**Response:**
```json
{
  "success": true,
  "prompt": "A rectangular room with vaulted ceilings...",
  "designDirective": "Redesign this space in Modern style with a Warm Neutrals color palette...",
  "tokens": { "input": 420, "output": 280, "total": 700 },
  "cost": 0.000231
}
```

---

#### POST /openai-prompt-generation/public-generate-image
**No auth.** Uploads room image + designId → returns a DALL-E 3 generated image URL.

```ts
const generateImage = async (designId: string, imageUri: string) => {
  const formData = new FormData();
  formData.append('designId', designId);
  formData.append('image', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'room.jpg',
  } as any);

  const { data } = await api.post(
    '/openai-prompt-generation/public-generate-image',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return data;
};
```

**Response:**
```json
{
  "success": true,
  "imageUrl": "https://oaidalleapi...dalle3_generated.png",
  "roomDescription": "A rectangular room...",
  "designDirective": "Redesign this exact room in Modern style...",
  "fullPromptSentToDalle": "You are generating a photorealistic interior design render...",
  "tokens": { "input": 420, "output": 280, "total": 700 },
  "cost": {
    "roomDescription": 0.000231,
    "imageGeneration": 0.04,
    "total": 0.040231
  }
}
```

---

#### POST /openai-prompt-generation/public-generate-image-dto
**No auth.** Like above but takes design params directly (no saved design in DB needed).

```ts
const generateImageFromDto = async (
  imageUri: string,
  style: string,
  colorPalette: string,
  location: string,
  category: string,
) => {
  const formData = new FormData();
  formData.append('style', style);
  formData.append('colorPalette', colorPalette);
  formData.append('location', location);
  formData.append('category', category);
  formData.append('image', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'room.jpg',
  } as any);

  const { data } = await api.post(
    '/openai-prompt-generation/public-generate-image-dto',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return data;
};
```

**Response:** Same structure as `public-generate-image`.

---

#### POST /openai-prompt-generation/public-advanced-edit
**No auth.** Advanced pipeline (mocked CV: room segmentation, depth map, floor detection). Takes image + designId + a natural language prompt for what to add.

```ts
const advancedEdit = async (designId: string, prompt: string, imageUri: string) => {
  const formData = new FormData();
  formData.append('designId', designId);
  formData.append('prompt', prompt);
  formData.append('image', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'room.jpg',
  } as any);

  const { data } = await api.post(
    '/openai-prompt-generation/public-advanced-edit',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return data;
};
```

**Response:**
```json
{
  "success": true,
  "imageUrl": "https://mocked-dalle-edit-url.com/edited.png",
  "promptUsed": "Follow depth map and segmentation boundaries strictly...",
  "cost": { "imageEditGeneration": 0.02, "total": 0.02 },
  "pipelineLog": [
    "Room Segmentation (Success)",
    "MiDaS Depth Map (Success)",
    "Floor Plan Masking (Success)",
    "OpenAI DALL-E Edit (Success)"
  ]
}
```

> **Note:** The CV pipeline is currently mocked. The returned `imageUrl` is a placeholder. Real implementation requires a Python microservice for MiDaS + SAM.

---

### 4.4 Flux Image Generation

#### POST /flux-image-generation/flux-image-generation
**Auth required.** Runs an image-to-image job via Flux Pro. Takes design params + image. Polls BFL API until result is ready (~10–60 seconds).

```ts
const generateFluxImage = async (
  imageUri: string,
  category: string,
  location: string,
  style: string,
  colorPalette: string,
) => {
  const formData = new FormData();
  formData.append('category', category);
  formData.append('location', location);
  formData.append('style', style);
  formData.append('colorPalette', colorPalette);
  formData.append('image', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'room.jpg',
  } as any);

  // This can take up to 60 seconds — show a loading state
  const { data } = await api.post(
    '/flux-image-generation/flux-image-generation',
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 90000, // 90s timeout
    },
  );
  return data;
};
```

**Response:**
```json
{
  "success": true,
  "imageUrl": "https://cdn.bfl.ai/results/...",
  "promptUsed": "must: keep the dimensions same...\ninterior\nLiving Room\nModern\nWarm earth tones"
}
```

> Set `BFL_API_KEY` in `.env` to your Black Forest Labs API key.

---

## 5. Image Upload (Expo)

### Pick image from library

```ts
import * as ImagePicker from 'expo-image-picker';

const pickImage = async (): Promise<string | null> => {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 0.8,
  });

  if (result.canceled) return null;
  return result.assets[0].uri;
};
```

### Take photo with camera

```ts
const takePhoto = async (): Promise<string | null> => {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) return null;

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    quality: 0.8,
  });

  if (result.canceled) return null;
  return result.assets[0].uri;
};
```

### Add to `app.json` (permissions)

```json
{
  "expo": {
    "plugins": [
      [
        "expo-image-picker",
        {
          "photosPermission": "Allow Interior AI to access your photos.",
          "cameraPermission": "Allow Interior AI to use your camera."
        }
      ]
    ]
  }
}
```

---

## 6. Complete Flow Example

This is the recommended end-to-end flow for generating an AI redesign:

```
User picks room photo
       ↓
POST /designs  (create design record, save originalImageUrl)
       ↓
POST /openai-prompt-generation/public-generate-image-dto
       or
POST /flux-image-generation/flux-image-generation  (auth required)
       ↓
Receive imageUrl  (DALL-E 3 or Flux Pro result)
       ↓
PATCH /designs/:id  (save resultImageUrl back — when endpoint added)
       ↓
Display result to user
```

### Example screen code

```tsx
import React, { useState } from 'react';
import { View, Image, Button, ActivityIndicator, Text } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../lib/api';

export default function DesignScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const generate = async () => {
    if (!imageUri) return;
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('style', 'Modern Minimalist');
      formData.append('colorPalette', 'Warm earth tones');
      formData.append('location', 'Living Room');
      formData.append('category', 'INTERIOR');
      formData.append('image', { uri: imageUri, type: 'image/jpeg', name: 'room.jpg' } as any);

      const { data } = await api.post(
        '/openai-prompt-generation/public-generate-image-dto',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 },
      );

      setResultUrl(data.imageUrl);
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Button title="Pick Room Photo" onPress={pick} />
      {imageUri && <Image source={{ uri: imageUri }} style={{ width: '100%', height: 200, marginTop: 12 }} />}
      <Button title="Generate AI Redesign" onPress={generate} disabled={!imageUri || loading} />
      {loading && <ActivityIndicator size="large" style={{ marginTop: 20 }} />}
      {error && <Text style={{ color: 'red', marginTop: 8 }}>{error}</Text>}
      {resultUrl && <Image source={{ uri: resultUrl }} style={{ width: '100%', height: 300, marginTop: 12 }} />}
    </View>
  );
}
```

---

## 7. Error Handling

All errors follow NestJS's default format:

```json
{
  "statusCode": 403,
  "message": "Credentials Invalid",
  "error": "Forbidden"
}
```

| Status | Meaning | Common causes |
|--------|---------|---------------|
| `400` | Bad Request | Missing/invalid fields, email already exists |
| `401` | Unauthorized | Missing or expired `access_token` |
| `403` | Forbidden | Wrong password, invalid refresh token, logged out |
| `404` | Not Found | Design not found or belongs to another user |
| `500` | Internal Server Error | OpenAI/Flux API failure |

### Helper

```ts
export const getErrorMessage = (error: any): string => {
  const msg = error?.response?.data?.message;
  if (Array.isArray(msg)) return msg.join(', ');
  return msg ?? 'Something went wrong. Please try again.';
};
```

---

## 8. Data Models

### UserProfile (from `/auth/me`)

```ts
interface UserProfile {
  name: string;
  email: string;
  createdAt: string; // ISO date string
}
```

### User (from JWT payload)

```ts
interface JwtPayload {
  sub: string;    // user UUID
  email: string;
  name: string;
  iat: number;
  exp: number;
}
```

### Design

```ts
interface Design {
  id: string;
  userId: string;
  category: 'INTERIOR' | 'EXTERIOR' | 'LANDSCAPE' | 'NEW_FLOORING';
  originalImageUrl: string;
  resultImageUrl: string | null;
  location: string;
  style: string;
  colorPalette: string;
  seedUsed: bigint | null;
  createdAt: string; // ISO date string
}
```

### Auth Tokens

```ts
interface AuthTokens {
  access_token: string;   // JWT, expires in 15 minutes
  refresh_token: string;  // JWT, expires in 7 days
}
```

---

## Quick Reference

```
BASE URL: http://<ip>:3001
Swagger:  http://localhost:3001/api/docs

── Auth ──────────────────────────────────────
POST  /auth/signup              { name, email, password }
POST  /auth/signin              { email, password }
GET   /auth/me                  Bearer: access_token → { name, email, createdAt }
POST  /auth/refresh             Bearer: refresh_token
POST  /auth/logout              Bearer: access_token
POST  /auth/oauth/google        { idToken }
POST  /auth/oauth/apple         { identityToken, fullName? }

── Designs ───────────────────────────────────
POST  /designs                  Bearer: access_token + JSON body

── OpenAI (no auth) ──────────────────────────
POST  /openai-prompt-generation/public-generate-prompt       multipart
POST  /openai-prompt-generation/public-generate-image        multipart
POST  /openai-prompt-generation/public-generate-image-dto    multipart
POST  /openai-prompt-generation/public-advanced-edit         multipart

── OpenAI (auth required) ────────────────────
GET   /openai-prompt-generation/get-picture-generation?designId=<id>

── Flux (auth required) ──────────────────────
POST  /flux-image-generation/flux-image-generation           multipart
```
