/**
 * File system utilities
 */
import { promises as fs } from 'fs';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';
import os from 'os';

/**
 * Expand ~ to home directory
 */
export function expandHome(filePath) {
  if (filePath.startsWith('~')) {
    return path.join(os.homedir(), filePath.slice(1));
  }
  return filePath;
}

/**
 * Collapse home directory to ~
 */
export function collapseHome(filePath) {
  const home = os.homedir();
  if (filePath.startsWith(home)) {
    return '~' + filePath.slice(home.length);
  }
  return filePath;
}

/**
 * Check if path exists
 */
export function pathExists(filePath) {
  return existsSync(expandHome(filePath));
}

/**
 * Ensure directory exists
 */
export async function ensureDir(dirPath) {
  const expanded = expandHome(dirPath);
  if (!existsSync(expanded)) {
    await fs.mkdir(expanded, { recursive: true });
  }
  return expanded;
}

/**
 * Ensure directory exists (sync)
 */
export function ensureDirSync(dirPath) {
  const expanded = expandHome(dirPath);
  if (!existsSync(expanded)) {
    mkdirSync(expanded, { recursive: true });
  }
  return expanded;
}

/**
 * Read JSON file
 */
export async function readJson(filePath) {
  const expanded = expandHome(filePath);
  const content = await fs.readFile(expanded, 'utf-8');
  return JSON.parse(content);
}

/**
 * Write JSON file
 */
export async function writeJson(filePath, data) {
  const expanded = expandHome(filePath);
  await ensureDir(path.dirname(expanded));
  await fs.writeFile(expanded, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

/**
 * Read file content
 */
export async function readFile(filePath) {
  const expanded = expandHome(filePath);
  return fs.readFile(expanded, 'utf-8');
}

/**
 * Write file content
 */
export async function writeFile(filePath, content) {
  const expanded = expandHome(filePath);
  await ensureDir(path.dirname(expanded));
  await fs.writeFile(expanded, content, 'utf-8');
}

/**
 * Copy file
 */
export async function copyFile(src, dest) {
  const srcExpanded = expandHome(src);
  const destExpanded = expandHome(dest);
  await ensureDir(path.dirname(destExpanded));
  await fs.copyFile(srcExpanded, destExpanded);
}

/**
 * Copy directory recursively
 */
export async function copyDir(src, dest) {
  const srcExpanded = expandHome(src);
  const destExpanded = expandHome(dest);
  await ensureDir(destExpanded);
  
  const entries = await fs.readdir(srcExpanded, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcExpanded, entry.name);
    const destPath = path.join(destExpanded, entry.name);
    
    let isDir = entry.isDirectory();
    
    if (entry.isSymbolicLink()) {
      try {
        const stats = await fs.stat(srcPath);
        isDir = stats.isDirectory();
      } catch {
        continue;
      }
    }
    
    if (isDir) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

/**
 * Delete file or directory
 */
export async function remove(filePath) {
  const expanded = expandHome(filePath);
  if (existsSync(expanded)) {
    await fs.rm(expanded, { recursive: true, force: true });
  }
}

/**
 * List files in directory
 */
export async function listFiles(dirPath, options = {}) {
  const expanded = expandHome(dirPath);
  const { recursive = false, filesOnly = false, followSymlinks = true } = options;
  
  if (!existsSync(expanded)) {
    return [];
  }
  
  const results = [];
  const entries = await fs.readdir(expanded, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(expanded, entry.name);
    const relativePath = entry.name;
    
    let isDir = entry.isDirectory();
    
    if (entry.isSymbolicLink() && followSymlinks) {
      try {
        const stats = await fs.stat(fullPath);
        isDir = stats.isDirectory();
      } catch {
        continue;
      }
    }
    
    if (isDir) {
      if (!filesOnly) {
        results.push({ path: relativePath, isDirectory: true });
      }
      if (recursive) {
        const subFiles = await listFiles(fullPath, options);
        results.push(...subFiles.map(f => ({
          ...f,
          path: path.join(relativePath, f.path)
        })));
      }
    } else {
      results.push({ path: relativePath, isDirectory: false });
    }
  }
  
  return results;
}

/**
 * Get file stats
 */
export async function getStats(filePath) {
  const expanded = expandHome(filePath);
  return fs.stat(expanded);
}

export async function isDirectory(filePath) {
  try {
    const stats = await getStats(filePath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

export async function isFile(filePath) {
  try {
    const stats = await getStats(filePath);
    return stats.isFile();
  } catch {
    return false;
  }
}

/**
 * Get syncai config directory
 */
export function getConfigDir() {
  return path.join(os.homedir(), '.config', 'syncai');
}

/**
 * Get syncai config file path
 */
export function getConfigPath() {
  return path.join(getConfigDir(), 'config.json');
}

/**
 * Get syncai mappings file path
 */
export function getMappingsPath() {
  return path.join(getConfigDir(), 'mappings.json');
}

/**
 * Get syncai ignore file path
 */
export function getIgnorePath() {
  return path.join(getConfigDir(), 'ignore.json');
}

/**
 * Get syncai backups directory
 */
export function getBackupsDir() {
  return path.join(getConfigDir(), 'backups');
}

/**
 * Get syncai plugins directory
 */
export function getPluginsDir() {
  return path.join(getConfigDir(), 'plugins');
}
