import { v2 as cloudinary, type UploadApiResponse, type UploadApiOptions } from "cloudinary";
import { Readable } from "stream";
import { config } from "./index.js";

// Initialize Cloudinary SDK
cloudinary.config({
  cloud_name: config.cloudinaryCloudName,
  api_key: config.cloudinaryApiKey,
  api_secret: config.cloudinaryApiSecret,
  secure: true,
});

/**
 * Upload an in-memory buffer directly to Cloudinary using a stream.
 * Prevents writing files to Render's ephemeral disk.
 */
export const uploadStreamToCloudinary = (
  buffer: Buffer,
  options: UploadApiOptions
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error || !result) {
          return reject(error || new Error("Cloudinary upload failed: No result returned"));
        }
        resolve(result);
      }
    );

    const readable = new Readable();
    readable._read = () => {};
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
};

/**
 * Delete an asset from Cloudinary using its public_id
 */
export const deleteFromCloudinary = async (
  publicId: string,
  resourceType: "image" | "raw" | "video" = "raw"
): Promise<any> => {
  try {
    return await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
  } catch (error) {
    console.error(`❌ Failed to delete Cloudinary asset ${publicId}:`, error);
    throw error;
  }
};

export { cloudinary };
export default cloudinary;
