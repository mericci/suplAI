/**
 * AES-256-GCM Symmetric Encryption Utility
 *
 * Used to encrypt/decrypt sensitive credentials stored in the database
 * (e.g., tax authority passwords for external system authentication).
 *
 * The ciphertext is a colon-separated string:
 *   <iv_b64>:<auth_tag_b64>:<ciphertext_b64>
 *
 * Requirements:
 *   - ENCRYPTION_MASTER_KEY env var: 64-character hex string (32 bytes / 256 bits)
 *   - Generate a key: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 *
 * Security properties:
 *   - AES-256-GCM provides authenticated encryption (confidentiality + integrity)
 *   - Each encryption uses a unique random IV (prevents ciphertext reuse attacks)
 *   - Auth tag verification prevents tampering
 */

import crypto from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_BYTES = 32; // 256 bits
const IV_BYTES = 16; // 128 bits
const SEPARATOR = ':';

function getMasterKey(): Buffer {
  const hex = process.env.ENCRYPTION_MASTER_KEY;
  if (!hex) {
    throw new Error(
      'Missing required environment variable: ENCRYPTION_MASTER_KEY',
    );
  }
  const key = Buffer.from(hex, 'hex');
  if (key.length !== KEY_BYTES) {
    throw new Error(
      'ENCRYPTION_MASTER_KEY must be a 64-character hex string (32 bytes / 256 bits). '
        + "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
    );
  }
  return key;
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Returns a colon-separated payload: <iv_b64>:<auth_tag_b64>:<ciphertext_b64>
 */
export function encrypt(plaintext: string): string {
  const key = getMasterKey();
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    iv.toString('base64'),
    authTag.toString('base64'),
    encrypted.toString('base64'),
  ].join(SEPARATOR);
}

/**
 * Decrypts a ciphertext produced by `encrypt()`.
 * @throws if the key is invalid, format is wrong, or ciphertext has been tampered with
 */
export function decrypt(ciphertext: string): string {
  const key = getMasterKey();
  const parts = ciphertext.split(SEPARATOR);

  if (parts.length !== 3) {
    throw new Error(
      'Invalid ciphertext format. Expected: <iv_b64>:<auth_tag_b64>:<ciphertext_b64>',
    );
  }

  const [ivB64, authTagB64, encryptedB64] = parts as [string, string, string];
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(authTagB64, 'base64');
  const encrypted = Buffer.from(encryptedB64, 'base64');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString(
    'utf8',
  );
}

/**
 * Returns true if ENCRYPTION_MASTER_KEY is present and valid.
 */
export function isEncryptionConfigured(): boolean {
  try {
    getMasterKey();
    return true;
  } catch {
    return false;
  }
}
