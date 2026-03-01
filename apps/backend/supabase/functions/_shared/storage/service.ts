/**
 * Storage Service
 *
 * Handles file upload and management with Supabase Storage
 */

import { supabase } from '../lib/supabase.ts';
import { logger } from '../utils/logger.ts';
import { getErrorMessage } from '../utils/error.ts';

interface UploadOptions {
  bucket: string;
  path: string;
  file: File | Blob;
  contentType?: string;
  upsert?: boolean;
}

interface UploadResult {
  path: string;
  publicUrl: string;
}

/**
 * Upload a file to Supabase Storage
 */
export async function uploadFile(
  options: UploadOptions,
): Promise<UploadResult> {
  try {
    const {
      bucket, path, file, contentType, upsert = false,
    } = options;

    logger.info('Uploading file', { bucket, path, size: file.size });

    // Validate file size (max 50MB by default)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      throw new Error(
        `File size exceeds maximum of ${maxSize / 1024 / 1024}MB`,
      );
    }

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        contentType: contentType ?? (file as File).type,
        upsert,
      });

    if (error) {
      logger.error('File upload error', {
        bucket,
        path,
        error: getErrorMessage(error),
      });
      throw new Error(`Upload failed: ${getErrorMessage(error)}`);
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(data.path);

    logger.info('File uploaded successfully', { bucket, path: data.path });

    return {
      path: data.path,
      publicUrl,
    };
  } catch (error) {
    logger.error('File upload failed', { error: getErrorMessage(error) });
    throw error;
  }
}

/**
 * Delete a file from storage
 */
export async function deleteFile(bucket: string, path: string): Promise<void> {
  try {
    logger.info('Deleting file', { bucket, path });

    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) {
      logger.error('File deletion error', {
        bucket,
        path,
        error: getErrorMessage(error),
      });
      throw new Error(`Delete failed: ${getErrorMessage(error)}`);
    }

    logger.info('File deleted successfully', { bucket, path });
  } catch (error) {
    logger.error('File deletion failed', { error: getErrorMessage(error) });
    throw error;
  }
}

/**
 * Get a signed URL for private file access
 */
export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn = 3600,
): Promise<string> {
  try {
    logger.info('Generating signed URL', { bucket, path, expiresIn });

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error ?? !data) {
      logger.error('Signed URL generation error', {
        bucket,
        path,
        error: getErrorMessage(error),
      });
      throw new Error('Failed to generate signed URL');
    }

    return data.signedUrl;
  } catch (error) {
    logger.error('Signed URL generation failed', {
      error: getErrorMessage(error),
    });
    throw error;
  }
}

/**
 * List files in a bucket
 */
export async function listFiles(bucket: string, path = ''): Promise<string[]> {
  try {
    logger.info('Listing files', { bucket, path });

    const { data, error } = await supabase.storage.from(bucket).list(path);

    if (error) {
      logger.error('File listing error', {
        bucket,
        path,
        error: getErrorMessage(error),
      });
      throw new Error(`List failed: ${getErrorMessage(error)}`);
    }

    const filePaths = data.map((file) => file.name);
    logger.info('Files listed successfully', {
      bucket,
      path,
      count: filePaths.length,
    });

    return filePaths;
  } catch (error) {
    logger.error('File listing failed', { error: getErrorMessage(error) });
    throw error;
  }
}
