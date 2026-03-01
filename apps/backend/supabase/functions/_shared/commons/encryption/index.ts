/**
 * AES-256-GCM Symmetric Encryption Utility (Web Crypto API)
 *
 * Deno-compatible version using SubtleCrypto instead of node:crypto.
 * Produces the same ciphertext format as the Node.js version:
 *   <iv_b64>:<auth_tag_b64>:<ciphertext_b64>
 *
 * Requirements:
 *   - ENCRYPTION_MASTER_KEY env var: 64-character hex string (32 bytes / 256 bits)
 */

const KEY_BYTES = 32; // 256 bits
const IV_BYTES = 16; // 128 bits — standard for AES-GCM
const TAG_BYTES = 16; // 128 bits auth tag
const SEPARATOR = ':';

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

async function getMasterKey(): Promise<CryptoKey> {
  const hex = Deno.env.get('ENCRYPTION_MASTER_KEY');
  if (!hex) {
    throw new Error('Missing required environment variable: ENCRYPTION_MASTER_KEY');
  }
  const keyBytes = hexToBytes(hex);
  if (keyBytes.length !== KEY_BYTES) {
    throw new Error(
      'ENCRYPTION_MASTER_KEY must be a 64-character hex string (32 bytes / 256 bits).',
    );
  }
  return crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Returns a colon-separated payload: <iv_b64>:<auth_tag_b64>:<ciphertext_b64>
 */
export async function encrypt(plaintext: string): Promise<string> {
  const key = await getMasterKey();
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const encoded = new TextEncoder().encode(plaintext);

  // AES-GCM returns ciphertext || authTag concatenated
  const raw = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, tagLength: TAG_BYTES * 8 }, key, encoded);
  const full = new Uint8Array(raw);
  const ciphertext = full.slice(0, full.length - TAG_BYTES);
  const authTag = full.slice(full.length - TAG_BYTES);

  return [
    btoa(String.fromCharCode(...iv)),
    btoa(String.fromCharCode(...authTag)),
    btoa(String.fromCharCode(...ciphertext)),
  ].join(SEPARATOR);
}

/**
 * Decrypts a ciphertext produced by `encrypt()`.
 * @throws if the key is invalid, format is wrong, or ciphertext has been tampered with
 */
export async function decrypt(ciphertext: string): Promise<string> {
  const key = await getMasterKey();
  const parts = ciphertext.split(SEPARATOR);

  if (parts.length !== 3) {
    throw new Error('Invalid ciphertext format. Expected: <iv_b64>:<auth_tag_b64>:<ciphertext_b64>');
  }

  const [ivB64, authTagB64, encryptedB64] = parts as [string, string, string];
  const iv = Uint8Array.from(atob(ivB64), (c) => c.charCodeAt(0));
  const authTag = Uint8Array.from(atob(authTagB64), (c) => c.charCodeAt(0));
  const encrypted = Uint8Array.from(atob(encryptedB64), (c) => c.charCodeAt(0));

  // SubtleCrypto expects ciphertext || authTag concatenated
  const ciphertextWithTag = new Uint8Array(encrypted.length + authTag.length);
  ciphertextWithTag.set(encrypted);
  ciphertextWithTag.set(authTag, encrypted.length);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv, tagLength: TAG_BYTES * 8 },
    key,
    ciphertextWithTag,
  );

  return new TextDecoder().decode(decrypted);
}

/**
 * Returns true if ENCRYPTION_MASTER_KEY is present and valid.
 */
export async function isEncryptionConfigured(): Promise<boolean> {
  try {
    await getMasterKey();
    return true;
  } catch {
    return false;
  }
}
