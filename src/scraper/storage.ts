import crypto from "node:crypto";
import path from "node:path";
import fs from "node:fs";

/**
 * Storage utilities for the scraper — rewritten for GPU backend.
 *
 * Previously used Supabase Storage for image bucket management and uploads.
 * Now stores images locally in a /tmp/scraper-images directory.
 *
 * TODO: Implement a proper file storage solution (GPU backend file endpoint, S3, etc.)
 */

const LOCAL_STORAGE_DIR = process.env.SCRAPER_STORAGE_DIR || "/tmp/scraper-images";

export async function ensureBucket(name: string) {
  const dir = path.join(LOCAL_STORAGE_DIR, name);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function sha256(buf: Buffer) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

export function storageKeyFromHash(hash: string, ext: string) {
  const yyyy = new Date().getFullYear();
  const mm = String(new Date().getMonth() + 1).padStart(2, "0");
  return path.posix.join(yyyy.toString(), mm, `${hash}.${ext.replace(/^\./, "")}`);
}

export async function uploadImage(
  bucket: string,
  fileKey: string,
  buffer: Buffer,
  contentType: string
) {
  const dir = path.join(LOCAL_STORAGE_DIR, bucket);
  const fullPath = path.join(dir, fileKey);
  const parentDir = path.dirname(fullPath);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }
  fs.writeFileSync(fullPath, buffer);
  console.log(`[Storage] Saved image to ${fullPath} (${contentType}, ${buffer.byteLength} bytes)`);
  return fileKey;
}

export async function imageMeta(buffer: Buffer) {
  try {
    const sharp = (await import("sharp")).default;
    const meta = await sharp(buffer).metadata();
    return {
      width: meta.width ?? null,
      height: meta.height ?? null,
      format: meta.format ?? null,
    };
  } catch {
    // If sharp is unavailable or fails, return nulls; image upload will still succeed
    return { width: null as number | null, height: null as number | null, format: null as string | null };
  }
}
