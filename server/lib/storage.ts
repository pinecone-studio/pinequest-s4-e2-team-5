import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import type { S3ClientConfig } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { extname } from "path";

/**
 * Cloudflare R2 storage service using AWS S3 compatible SDK
 */
export class R2Storage {
  private s3Client: S3Client;
  private bucket: string;
  private publicUrl: string | undefined;

  constructor() {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucket = process.env.R2_BUCKET_NAME;
    const endpoint = process.env.R2_ENDPOINT;
    const publicUrl = process.env.R2_PUBLIC_URL;

    if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
      throw new Error("Missing required R2 environment variables");
    }

    this.bucket = bucket;
    this.publicUrl = publicUrl;

    const endpointUrl = endpoint ?? `https://${accountId}.r2.cloudflarestorage.com`;

    const config: S3ClientConfig = {
      endpoint: endpointUrl,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      // R2 uses auto region
      region: "auto",
    };

    this.s3Client = new S3Client(config);
  }

  /**
   * Upload a file buffer to R2
   * @param fileBuffer - Buffer of the file to upload
   * @param originalFilename - Original filename (used for extension)
   * @param contentType - MIME type of the file
   * @returns Public URL of the uploaded file
   */
  async uploadFile(
    fileBuffer: Buffer,
    originalFilename: string,
    contentType: string
  ): Promise<string> {
    // Generate unique filename: uuid + timestamp + original extension
    const ext = extname(originalFilename).toLowerCase();
    const id = uuidv4();
    const timestamp = Date.now();
    const key = `${id}-${timestamp}${ext}`;

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
      })
    );

    // Construct public URL
    if (this.publicUrl) {
      return `${this.publicUrl}/${key}`;
    }

    // Fallback to constructing from endpoint
    const endpoint = process.env.R2_ENDPOINT
      ?? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
    return `${endpoint}/${this.bucket}/${key}`;
  }
}

// Export a singleton instance for use across the app
export const r2Storage = new R2Storage();
