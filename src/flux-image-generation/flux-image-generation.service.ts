import { Injectable, InternalServerErrorException } from '@nestjs/common';

@Injectable()
export class FluxImageGenerationService {
  async generateImage(
    dto: { category: string; location: string; style: string; colorPalette: string },
    imageBuffer: Buffer,
  ) {
    // Generate the exact prompt structure requested
    const prompt = `must : keep the dimensions same (i.e windows door area)

setting :-
${dto.category}
${dto.location}
${dto.style}
${dto.colorPalette}`;

    const base64Image = imageBuffer.toString('base64');

    console.log(`\n=== FLUX PRO API ===`);
    console.log(`[Prompt Sent]:\n${prompt}`);
    console.log(`[Image Sent]: ${imageBuffer.length} bytes`);

    const apiKey = process.env.BFL_API_KEY;
    if (!apiKey) {
      throw new InternalServerErrorException('MISSING_API_KEY: BFL_API_KEY is not defined in .env');
    }

    try {
      // 1. Submit the job
      // Note: Assuming he latest available image-to-image model endpoint for BFL
      const submitResponse = await fetch('https://api.bfl.ml/v1/flux-pro-1.0-image-to-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Key': apiKey,
        },
        body: JSON.stringify({
          prompt,
          image: `data:image/jpeg;base64,${base64Image}`,
          prompt_upsampling: false,
          strength: 0.8, // standard image to image strength
        }),
      });

      if (!submitResponse.ok) {
        const errDetails = await submitResponse.text();
        throw new Error(`BFL Job Submission Failed: ${submitResponse.status} - ${errDetails}`);
      }

      const submitData = await submitResponse.json();
      const jobId = submitData.id;

      console.log(`[BFL API] Job Submitted Successfully! Job ID: ${jobId}`);
      console.log(`[BFL API] Polling for result...`);

      // 2. Poll for the result
      let generatedImageUrl = null;
      let attempt = 0;
      const maxAttempts = 30; // Max 1 minute polling (2 seconds x 30)

      while (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 2000)); // wait 2 seconds
        attempt++;

        const pollResponse = await fetch(`https://api.bfl.ml/v1/get_result?id=${jobId}`, {
          method: 'GET',
          headers: {
            'X-Key': apiKey,
          },
        });

        if (!pollResponse.ok) {
          console.log(`[BFL API] Polling error: ${pollResponse.status}`);
          continue;
        }

        const pollData = await pollResponse.json();
        const status = pollData.status;

        if (status === 'Ready') {
          generatedImageUrl = pollData.result.sample;
          console.log(`[BFL API] Job Completed! Output URL retrieved.`);
          break;
        } else if (status === 'Failed' || status === 'Error') {
          throw new Error(`BFL Job Failed with status: ${status}`);
        }

        // If status is "Pending" or "In Progress", continue looping
      }

      if (!generatedImageUrl) {
        throw new Error('BFL API Polling timed out. Image generation took too long.');
      }

      console.log(`=========================\n`);

      return {
        imageUrl: generatedImageUrl,
        promptUsed: prompt,
      };
    } catch (error) {
      console.error('Flux Pro generation failed:', error?.message ?? error);
      throw new InternalServerErrorException('Failed to generate image via Flux.');
    }
  }
}
