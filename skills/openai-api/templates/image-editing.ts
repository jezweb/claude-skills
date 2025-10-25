/**
 * OpenAI Images API - Image Editing Examples (GPT-Image-1)
 *
 * This template demonstrates:
 * - Basic image editing
 * - Compositing multiple images
 * - Transparent backgrounds
 * - Different output formats
 * - Compression settings
 *
 * NOTE: Image editing uses multipart/form-data, not JSON
 */

import fs from 'fs';
import FormData from 'form-data';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// =============================================================================
// BASIC IMAGE EDITING
// =============================================================================

async function basicEdit() {
  const formData = new FormData();
  formData.append('model', 'gpt-image-1');
  formData.append('image', fs.createReadStream('./input-image.jpg'));
  formData.append('prompt', 'Change the sky to a sunset with orange and pink colors');
  formData.append('size', '1024x1024');

  const response = await fetch('https://api.openai.com/v1/images/edits', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      ...formData.getHeaders(),
    },
    body: formData,
  });

  const data: any = await response.json();
  console.log('Edited image URL:', data.data[0].url);

  return data.data[0].url;
}

// =============================================================================
// COMPOSITE TWO IMAGES
// =============================================================================

async function compositeImages() {
  const formData = new FormData();
  formData.append('model', 'gpt-image-1');
  formData.append('image', fs.createReadStream('./woman.jpg'));
  formData.append('image_2', fs.createReadStream('./logo.png'));
  formData.append('prompt', 'Add the logo to the woman\'s top, as if stamped into the fabric.');
  formData.append('input_fidelity', 'high'); // Stay close to original
  formData.append('size', '1024x1024');

  const response = await fetch('https://api.openai.com/v1/images/edits', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      ...formData.getHeaders(),
    },
    body: formData,
  });

  const data: any = await response.json();
  console.log('Composite image URL:', data.data[0].url);

  return data.data[0].url;
}

// =============================================================================
// REMOVE BACKGROUND (Transparent)
// =============================================================================

async function removeBackground() {
  const formData = new FormData();
  formData.append('model', 'gpt-image-1');
  formData.append('image', fs.createReadStream('./product.jpg'));
  formData.append('prompt', 'Remove the background, keeping only the product.');
  formData.append('format', 'png'); // Required for transparency
  formData.append('background', 'transparent');
  formData.append('size', '1024x1024');

  const response = await fetch('https://api.openai.com/v1/images/edits', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      ...formData.getHeaders(),
    },
    body: formData,
  });

  const data: any = await response.json();
  console.log('Transparent background URL:', data.data[0].url);

  // Download and save
  const imageResponse = await fetch(data.data[0].url);
  const buffer = Buffer.from(await imageResponse.arrayBuffer());
  fs.writeFileSync('product-no-bg.png', buffer);
  console.log('Saved to: product-no-bg.png');

  return data.data[0].url;
}

// =============================================================================
// INPUT FIDELITY OPTIONS
// =============================================================================

async function fidelityComparison() {
  const baseFormData = () => {
    const formData = new FormData();
    formData.append('model', 'gpt-image-1');
    formData.append('image', fs.createReadStream('./portrait.jpg'));
    formData.append('prompt', 'Add sunglasses to the person');
    return formData;
  };

  // Low fidelity (more creative freedom)
  const lowFidelity = baseFormData();
  lowFidelity.append('input_fidelity', 'low');

  const lowResponse = await fetch('https://api.openai.com/v1/images/edits', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      ...lowFidelity.getHeaders(),
    },
    body: lowFidelity,
  });

  const lowData: any = await lowResponse.json();
  console.log('Low fidelity URL:', lowData.data[0].url);

  // High fidelity (stay closer to original)
  const highFidelity = baseFormData();
  highFidelity.append('input_fidelity', 'high');

  const highResponse = await fetch('https://api.openai.com/v1/images/edits', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      ...highFidelity.getHeaders(),
    },
    body: highFidelity,
  });

  const highData: any = await highResponse.json();
  console.log('High fidelity URL:', highData.data[0].url);

  return { low: lowData.data[0].url, high: highData.data[0].url };
}

// =============================================================================
// OUTPUT FORMATS AND COMPRESSION
// =============================================================================

async function formatComparison() {
  const basePrompt = 'Add a blue sky to the background';

  // PNG (supports transparency, larger file)
  const pngFormData = new FormData();
  pngFormData.append('model', 'gpt-image-1');
  pngFormData.append('image', fs.createReadStream('./scene.jpg'));
  pngFormData.append('prompt', basePrompt);
  pngFormData.append('format', 'png');

  const pngResponse = await fetch('https://api.openai.com/v1/images/edits', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      ...pngFormData.getHeaders(),
    },
    body: pngFormData,
  });

  const pngData: any = await pngResponse.json();
  console.log('PNG format URL:', pngData.data[0].url);

  // JPEG (smaller file, no transparency)
  const jpegFormData = new FormData();
  jpegFormData.append('model', 'gpt-image-1');
  jpegFormData.append('image', fs.createReadStream('./scene.jpg'));
  jpegFormData.append('prompt', basePrompt);
  jpegFormData.append('format', 'jpeg');
  jpegFormData.append('output_compression', '80'); // 0-100

  const jpegResponse = await fetch('https://api.openai.com/v1/images/edits', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      ...jpegFormData.getHeaders(),
    },
    body: jpegFormData,
  });

  const jpegData: any = await jpegResponse.json();
  console.log('JPEG format URL:', jpegData.data[0].url);

  // WebP (best compression, supports transparency)
  const webpFormData = new FormData();
  webpFormData.append('model', 'gpt-image-1');
  webpFormData.append('image', fs.createReadStream('./scene.jpg'));
  webpFormData.append('prompt', basePrompt);
  webpFormData.append('format', 'webp');
  webpFormData.append('output_compression', '85');

  const webpResponse = await fetch('https://api.openai.com/v1/images/edits', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      ...webpFormData.getHeaders(),
    },
    body: webpFormData,
  });

  const webpData: any = await webpResponse.json();
  console.log('WebP format URL:', webpData.data[0].url);

  return { png: pngData.data[0].url, jpeg: jpegData.data[0].url, webp: webpData.data[0].url };
}

// =============================================================================
// COMMON EDITING TASKS
// =============================================================================

async function commonEdits() {
  // 1. Color correction
  const colorCorrect = new FormData();
  colorCorrect.append('model', 'gpt-image-1');
  colorCorrect.append('image', fs.createReadStream('./photo.jpg'));
  colorCorrect.append('prompt', 'Increase brightness and saturation, make colors more vibrant');

  // 2. Object removal
  const objectRemoval = new FormData();
  objectRemoval.append('model', 'gpt-image-1');
  objectRemoval.append('image', fs.createReadStream('./scene.jpg'));
  objectRemoval.append('prompt', 'Remove the person from the background');

  // 3. Style transfer
  const styleTransfer = new FormData();
  styleTransfer.append('model', 'gpt-image-1');
  styleTransfer.append('image', fs.createReadStream('./photo.jpg'));
  styleTransfer.append('prompt', 'Transform this photo into a watercolor painting style');

  // 4. Add text/overlay
  const addText = new FormData();
  addText.append('model', 'gpt-image-1');
  addText.append('image', fs.createReadStream('./poster.jpg'));
  addText.append('prompt', 'Add the text "SALE" in large bold letters at the top');

  console.log('Common editing tasks prepared');

  return { colorCorrect, objectRemoval, styleTransfer, addText };
}

// =============================================================================
// ERROR HANDLING
// =============================================================================

async function withErrorHandling() {
  try {
    const formData = new FormData();
    formData.append('model', 'gpt-image-1');
    formData.append('image', fs.createReadStream('./input.jpg'));
    formData.append('prompt', 'Edit the image');

    const response = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        ...formData.getHeaders(),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API error: ${error.error?.message}`);
    }

    const data: any = await response.json();
    return data.data[0].url;
  } catch (error: any) {
    if (error.message.includes('file not found')) {
      console.error('Input image file not found');
    } else if (error.message.includes('rate limit')) {
      console.error('Rate limit exceeded - wait and retry');
    } else {
      console.error('Unexpected error:', error.message);
    }

    throw error;
  }
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

async function main() {
  console.log('=== OpenAI Image Editing (GPT-Image-1) Examples ===\n');

  console.log('Note: This script requires input images to run.');
  console.log('Create test images first or modify the file paths.\n');

  // Uncomment the examples you want to run:

  // console.log('1. Basic Edit:');
  // await basicEdit();
  // console.log();

  // console.log('2. Composite Images:');
  // await compositeImages();
  // console.log();

  // console.log('3. Remove Background:');
  // await removeBackground();
  // console.log();
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export {
  basicEdit,
  compositeImages,
  removeBackground,
  fidelityComparison,
  formatComparison,
  commonEdits,
  withErrorHandling,
};
