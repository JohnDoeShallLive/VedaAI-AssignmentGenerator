import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

const isCloudinaryConfigured = 
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_SECRET;

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log('[cloudinary]: Cloudinary service configured and active');
} else {
  console.warn('[cloudinary]: Cloudinary credentials missing. Falling back to local disk uploads.');
}

/**
 * Uploads a file buffer directly to Cloudinary.
 * Returns the secure Cloudinary URL.
 */
export async function uploadToCloudinary(
  fileBuffer: Buffer,
  folder: string,
  fileName: string
): Promise<string | null> {
  if (!isCloudinaryConfigured) {
    return null;
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `vedaai/${folder}`,
        public_id: fileName.split('.')[0] + '-' + Date.now(),
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) {
          console.error('[cloudinary-error]: Failed to stream to Cloudinary:', error.message || error);
          reject(error);
        } else if (result) {
          resolve(result.secure_url);
        } else {
          resolve(null);
        }
      }
    );

    // Write buffer into readable stream to pipe into Cloudinary stream
    const readable = new Readable();
    readable.push(fileBuffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
}
