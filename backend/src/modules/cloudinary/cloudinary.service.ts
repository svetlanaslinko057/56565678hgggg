import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

export interface SignatureResponse {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
  resourceType: string;
}

@Injectable()
export class CloudinaryService implements OnModuleInit {
  private readonly logger = new Logger(CloudinaryService.name);
  private isConfigured = false;

  onModuleInit() {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
      this.isConfigured = true;
      this.logger.log('Cloudinary configured successfully');
    } else {
      this.logger.warn('Cloudinary credentials not configured - upload functionality disabled');
    }
  }

  /**
   * Check if Cloudinary is properly configured
   */
  isReady(): boolean {
    return this.isConfigured;
  }

  /**
   * Generate signed upload parameters for frontend direct upload
   */
  generateSignature(
    folder: string = 'avatars',
    resourceType: string = 'image',
  ): SignatureResponse {
    if (!this.isConfigured) {
      throw new Error('Cloudinary not configured');
    }

    const timestamp = Math.round(Date.now() / 1000);
    
    const params = {
      timestamp,
      folder,
    };

    const signature = cloudinary.utils.api_sign_request(
      params,
      process.env.CLOUDINARY_API_SECRET!,
    );

    return {
      signature,
      timestamp,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
      apiKey: process.env.CLOUDINARY_API_KEY!,
      folder,
      resourceType,
    };
  }

  /**
   * Direct upload from backend (for server-side uploads)
   */
  async uploadImage(
    fileBuffer: Buffer | string,
    options: {
      folder?: string;
      publicId?: string;
      transformation?: any;
    } = {},
  ): Promise<{ url: string; publicId: string; width: number; height: number }> {
    if (!this.isConfigured) {
      throw new Error('Cloudinary not configured');
    }

    return new Promise((resolve, reject) => {
      const uploadOptions: any = {
        folder: options.folder || 'avatars',
        resource_type: 'image',
      };

      if (options.publicId) {
        uploadOptions.public_id = options.publicId;
        uploadOptions.overwrite = true;
      }

      if (options.transformation) {
        uploadOptions.transformation = options.transformation;
      }

      // If it's a base64 string
      if (typeof fileBuffer === 'string') {
        cloudinary.uploader.upload(fileBuffer, uploadOptions, (error, result) => {
          if (error) {
            this.logger.error('Cloudinary upload failed', error);
            reject(error);
          } else {
            resolve({
              url: result!.secure_url,
              publicId: result!.public_id,
              width: result!.width,
              height: result!.height,
            });
          }
        });
      } else {
        // For buffer uploads, use upload_stream
        const uploadStream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) {
              this.logger.error('Cloudinary upload failed', error);
              reject(error);
            } else {
              resolve({
                url: result!.secure_url,
                publicId: result!.public_id,
                width: result!.width,
                height: result!.height,
              });
            }
          },
        );
        uploadStream.end(fileBuffer);
      }
    });
  }

  /**
   * Delete an image from Cloudinary
   */
  async deleteImage(publicId: string): Promise<boolean> {
    if (!this.isConfigured) {
      throw new Error('Cloudinary not configured');
    }

    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        invalidate: true,
      });
      return result.result === 'ok';
    } catch (error) {
      this.logger.error('Cloudinary delete failed', error);
      return false;
    }
  }

  /**
   * Generate optimized URL with transformations
   */
  getOptimizedUrl(
    publicId: string,
    options: {
      width?: number;
      height?: number;
      crop?: string;
      quality?: string;
      format?: string;
    } = {},
  ): string {
    if (!this.isConfigured) {
      return `https://api.dicebear.com/7.x/avataaars/svg?seed=${publicId}`;
    }

    const transformations: string[] = [];
    
    if (options.width) transformations.push(`w_${options.width}`);
    if (options.height) transformations.push(`h_${options.height}`);
    if (options.crop) transformations.push(`c_${options.crop}`);
    if (options.quality) transformations.push(`q_${options.quality}`);
    if (options.format) transformations.push(`f_${options.format}`);

    // Default transformations for avatars
    if (transformations.length === 0) {
      transformations.push('c_fill', 'w_200', 'h_200', 'g_face', 'q_auto', 'f_auto');
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    return `https://res.cloudinary.com/${cloudName}/image/upload/${transformations.join(',')}/${publicId}`;
  }
}
