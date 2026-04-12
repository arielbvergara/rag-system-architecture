import { v2 as cloudinary } from "cloudinary";
import { config } from "../config";
import type { CloudinaryImage } from "../types";

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

export async function listImages(): Promise<CloudinaryImage[]> {
  const result = await cloudinary.api.resources({
    type: "upload",
    resource_type: "image",
    prefix: config.cloudinary.folder,
    max_results: 500,
  });

  return result.resources.map(
    (r: {
      public_id: string;
      url: string;
      secure_url: string;
      format: string;
      width: number;
      height: number;
      created_at: string;
    }): CloudinaryImage => ({
      publicId: r.public_id,
      url: r.url,
      secureUrl: r.secure_url,
      format: r.format,
      width: r.width,
      height: r.height,
      createdAt: r.created_at,
    })
  );
}

export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
}
