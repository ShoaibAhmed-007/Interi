# Frontend Integration: Design + Flux Generate

This document explains only the two endpoints you asked for:
- Create Design API (`POST /designs`)
- Flux Image Generate API (`POST /flux-image-generation/flux-image-generation`)

## Base URL

Use your backend base URL:
- Local example: `http://localhost:3001`
- Device/LAN example: `http://<your-local-ip>:3001`

Both APIs require JWT access token in header:

`Authorization: Bearer <access_token>`

---

## 1) Create Design

### URL
`POST /designs`

Full URL example:
`http://localhost:3001/designs`

### What it expects (request)
Content-Type: `application/json`

```json
{
  "category": "INTERIOR",
  "originalImageUrl": "interior-app/uploads/abc123.jpg",
  "location": "Living Room",
  "style": "Modern",
  "colorPalette": "Warm Neutrals",
  "seedUsed": null
}
```

### Request fields
- `category` (required): one of `INTERIOR | EXTERIOR | LANDSCAPE | NEW_FLOORING`
- `originalImageUrl` (required): original image key/url (usually your uploaded image key)
- `location` (required): room/location text
- `style` (required): style text
- `colorPalette` (required): palette text
- `seedUsed` (optional): numeric seed or null

### What it returns
Returns the created `Design` row.

Typical response example:

```json
{
  "id": "design-uuid",
  "userId": "user-uuid-from-jwt",
  "category": "INTERIOR",
  "originalImageUrl": "interior-app/uploads/abc123.jpg",
  "resultImageUrl": null,
  "location": "Living Room",
  "style": "Modern",
  "colorPalette": "Warm Neutrals",
  "seedUsed": null,
  "createdAt": "2026-03-26T12:00:00.000Z"
}
```

---

## 2) Flux Image Generate

### URL
`POST /flux-image-generation/flux-image-generation`

Full URL example:
`http://localhost:3001/flux-image-generation/flux-image-generation`

### What it expects (request)
Content-Type: `application/json`

```json
{
  "designId": "design-uuid"
}
```

### Request fields
- `designId` (required): id of a design already created by `POST /designs`

### What it returns
The API response includes generated image links and metadata.

Typical response example:

```json
{
  "success": true,
  "imageUrl": "https://...public...jpg",
  "presignedUrl": "https://...signed-download-url...",
  "promptUsed": "Do not change dimensions...",
  "s3Key": "interior-app/generated/xyz.jpg"
}
```

### What backend also does internally
When this endpoint succeeds, backend also:
- updates `Design.resultImageUrl`
- inserts a row in `DesignHistory` with:
  - `userId`
  - `designId`
  - `originalImageKey`
  - `resultImageKey`
  - `createdAt`

---

## 3) Frontend Flow (Recommended)

1. User uploads/selects original image and gets image key/url.
2. Frontend calls `POST /designs` with user choices (`category`, `location`, `style`, `colorPalette`).
3. Save returned `design.id` on frontend state.
4. Frontend calls `POST /flux-image-generation/flux-image-generation` with that `designId`.
5. Show `imageUrl` or `presignedUrl` in UI.
6. For history screen, call `GET /design-history` (JWT required) to get latest-first history entries for that user.

---

## 4) Quick Frontend Example

```ts
// 1) create design
const created = await api.post('/designs', {
  category: 'INTERIOR',
  originalImageUrl: uploadKey,
  location: 'Living Room',
  style: 'Modern',
  colorPalette: 'Warm Neutrals',
  seedUsed: null,
});

const designId = created.data.id;

// 2) generate image with flux
const generated = await api.post('/flux-image-generation/flux-image-generation', {
  designId,
});

// generated.data.imageUrl / generated.data.presignedUrl
```

---

## 5) Common Errors

- `401 Unauthorized`: JWT missing/expired
- `400 Bad Request`: invalid payload (example: missing `designId`)
- `404 Not Found`: design not found for given `designId`
- `500 Internal Server Error`: generation/provider/network failure
