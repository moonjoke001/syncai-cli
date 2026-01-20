/**
 * Hash utilities
 */
import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import { expandHome } from './fs.js';

/**
 * Calculate MD5 hash of string
 */
export function hashString(content) {
  return createHash('md5').update(content).digest('hex');
}

/**
 * Calculate MD5 hash of file
 */
export async function hashFile(filePath) {
  const expanded = expandHome(filePath);
  const content = await fs.readFile(expanded);
  return createHash('md5').update(content).digest('hex');
}

/**
 * Calculate hash of object (JSON stringified)
 */
export function hashObject(obj) {
  const content = JSON.stringify(obj, null, 0);
  return hashString(content);
}

/**
 * Generate short ID
 */
export function generateId(length = 8) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate device ID
 */
export async function generateDeviceId() {
  const os = await import('os');
  const hostname = os.hostname();
  const platform = os.platform();
  const timestamp = Date.now().toString(36);
  return `${hostname}-${platform}-${timestamp}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
}

/**
 * Generate timestamp string for backups
 */
export function generateTimestamp() {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, '').slice(0, 15);
}
