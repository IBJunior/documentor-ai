// Image utility functions for content scripts

// Supported image formats for LanguageModel API
export const SUPPORTED_FORMATS = ['image/png', 'image/jpeg', 'image/webp'];

// Formats that can be converted to PNG
export const CONVERTIBLE_FORMATS = [
  'image/svg+xml',
  'image/bmp',
  'image/gif',
  'image/x-icon',
  'image/avif',
  'image/tiff',
];

/**
 * Converts an image blob to PNG using Canvas API
 * @param imageBlob - The image blob to convert
 * @returns Promise that resolves to a PNG blob
 */
export async function convertImageToPNG(imageBlob: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(imageBlob);

    img.onload = () => {
      try {
        // Create canvas with image dimensions
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        // Draw image to canvas
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Failed to get canvas context');
        }
        ctx.drawImage(img, 0, 0);

        // Convert canvas to PNG blob
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(url);
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert image to PNG'));
          }
        }, 'image/png');
      } catch (error) {
        URL.revokeObjectURL(url);
        reject(error);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for conversion'));
    };

    img.src = url;
  });
}

/**
 * Validates image format and converts to PNG if needed
 * @param imageBlob - The image blob to validate
 * @returns Promise that resolves to a validated/converted blob
 * @throws Error if format is unsupported
 */
export async function validateAndConvertImage(imageBlob: Blob): Promise<Blob> {
  const mimeType = imageBlob.type.toLowerCase();

  // Check if format is already supported
  if (SUPPORTED_FORMATS.includes(mimeType)) {
    return imageBlob;
  }

  // Check if format can be converted
  if (CONVERTIBLE_FORMATS.includes(mimeType)) {
    console.log(`Converting ${mimeType} to PNG...`);
    return await convertImageToPNG(imageBlob);
  }

  // Unsupported format
  throw new Error(
    `Unsupported image format: ${mimeType}. ` +
      `Supported formats: PNG, JPEG, WebP. ` +
      `Convertible formats: SVG, BMP, GIF, ICO, AVIF, TIFF.`
  );
}

/**
 * Converts a blob to base64 data URL using FileReader
 * @param blob - The blob to convert
 * @returns Promise that resolves to a base64 data URL string
 * @throws Error if conversion fails
 */
export async function convertBlobToBase64(blob: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert blob to base64'));
      }
    };

    reader.onerror = () => reject(new Error('FileReader error'));
    reader.readAsDataURL(blob);
  });
}
