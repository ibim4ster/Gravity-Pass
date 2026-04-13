// Zero-Knowledge Cryptography Module
// Uses Web Crypto API for PBKDF2 key derivation and AES-256-GCM encryption.

const ITERATIONS = 600000; // High iteration count for PBKDF2 to resist brute-force
const KEY_LENGTH = 256;
const HASH_ALGO = 'SHA-256';

/**
 * Generates a random salt.
 */
export function generateSalt(length = 16): string {
  const array = new Uint8Array(length);
  window.crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

/**
 * Derives an AES-GCM CryptoKey from a master password and a salt using PBKDF2.
 */
export async function deriveKey(password: string, saltBase64: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const saltBuffer = Uint8Array.from(atob(saltBase64), c => c.charCodeAt(0));

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: ITERATIONS,
      hash: HASH_ALGO,
    },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false, // Key is not extractable
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Returns the base64 encoded ciphertext and the base64 encoded IV.
 */
export async function encryptData(key: CryptoKey, plaintext: string): Promise<{ ciphertext: string; iv: string }> {
  const enc = new TextEncoder();
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM
  
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    enc.encode(plaintext)
  );

  const ciphertextBase64 = btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)));
  const ivBase64 = btoa(String.fromCharCode(...iv));

  return { ciphertext: ciphertextBase64, iv: ivBase64 };
}

/**
 * Decrypts an AES-256-GCM encrypted string.
 */
export async function decryptData(key: CryptoKey, ciphertextBase64: string, ivBase64: string): Promise<string> {
  const dec = new TextDecoder();
  const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
  const ciphertextBuffer = Uint8Array.from(atob(ciphertextBase64), c => c.charCodeAt(0));

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    ciphertextBuffer
  );

  return dec.decode(decryptedBuffer);
}
