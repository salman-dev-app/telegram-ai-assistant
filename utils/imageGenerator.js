import axios from 'axios';
import { logger } from './logger.js';

export class ImageGenerator {
  /**
   * Generate image using Stability AI API (Recommended)
   * Requires STABILITY_API_KEY environment variable
   */
  static async generateWithStabilityAI(prompt, apiKey) {
    try {
      const response = await axios.post(
        'https://api.stability.ai/v1/generate',
        {
          prompt: prompt,
          steps: 30,
          cfg_scale: 7.5,
          width: 512,
          height: 512,
          samples: 1,
          sampler: 'k_dpmpp_2m'
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000
        }
      );

      if (response.data && response.data.artifacts && response.data.artifacts[0]) {
        return Buffer.from(response.data.artifacts[0].base64, 'base64');
      }
      return null;
    } catch (error) {
      logger.error('Stability AI generation failed:', error.message);
      return null;
    }
  }

  /**
   * Generate image using Hugging Face API
   * Requires HUGGING_FACE_API_KEY environment variable
   */
  static async generateWithHuggingFace(prompt, apiKey) {
    try {
      const response = await axios.post(
        'https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-dev',
        { inputs: prompt },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 120000,
          responseType: 'arraybuffer'
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Hugging Face generation failed:', error.message);
      return null;
    }
  }

  /**
   * Generate image using Replicate API
   * Requires REPLICATE_API_KEY environment variable
   */
  static async generateWithReplicate(prompt, apiKey) {
    try {
      // Create prediction
      const predictionResponse = await axios.post(
        'https://api.replicate.com/v1/predictions',
        {
          version: 'cd463d4d7a0c9ab8e63a1b2c0e0e0e0e0e0e0e0e',
          input: {
            prompt: prompt,
            num_outputs: 1,
            num_inference_steps: 50,
            guidance_scale: 7.5
          }
        },
        {
          headers: {
            'Authorization': `Token ${apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      const predictionId = predictionResponse.data.id;

      // Poll for completion
      let prediction = predictionResponse.data;
      let attempts = 0;
      const maxAttempts = 60; // 5 minutes with 5 second intervals

      while (prediction.status !== 'succeeded' && prediction.status !== 'failed' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000));

        const statusResponse = await axios.get(
          `https://api.replicate.com/v1/predictions/${predictionId}`,
          {
            headers: {
              'Authorization': `Token ${apiKey}`
            },
            timeout: 10000
          }
        );

        prediction = statusResponse.data;
        attempts++;
      }

      if (prediction.status === 'succeeded' && prediction.output && prediction.output[0]) {
        const imageResponse = await axios.get(prediction.output[0], {
          responseType: 'arraybuffer',
          timeout: 30000
        });
        return imageResponse.data;
      }

      return null;
    } catch (error) {
      logger.error('Replicate generation failed:', error.message);
      return null;
    }
  }

  /**
   * Main function to generate image with fallback support
   * Tries multiple APIs in order of preference
   */
  static async generateImage(prompt, config = {}) {
    const {
      stabilityApiKey = process.env.STABILITY_API_KEY,
      huggingFaceApiKey = process.env.HUGGING_FACE_API_KEY,
      replicateApiKey = process.env.REPLICATE_API_KEY
    } = config;

    logger.info(`Attempting to generate image with prompt: "${prompt.substring(0, 50)}..."`);

    // Try Stability AI first (most reliable)
    if (stabilityApiKey) {
      logger.info('Trying Stability AI API...');
      const result = await this.generateWithStabilityAI(prompt, stabilityApiKey);
      if (result) {
        logger.info('Image generated successfully with Stability AI');
        return result;
      }
    }

    // Fallback to Hugging Face
    if (huggingFaceApiKey) {
      logger.info('Trying Hugging Face API...');
      const result = await this.generateWithHuggingFace(prompt, huggingFaceApiKey);
      if (result) {
        logger.info('Image generated successfully with Hugging Face');
        return result;
      }
    }

    // Fallback to Replicate
    if (replicateApiKey) {
      logger.info('Trying Replicate API...');
      const result = await this.generateWithReplicate(prompt, replicateApiKey);
      if (result) {
        logger.info('Image generated successfully with Replicate');
        return result;
      }
    }

    logger.error('All image generation APIs failed or not configured');
    return null;
  }
}
