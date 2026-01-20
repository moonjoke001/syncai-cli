import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = dirname(__dirname);

const { 
  readFile, writeFile, pathExists, listFiles, ensureDir, 
  expandHome, collapseHome, getConfigDir 
} = await import(join(projectRoot, 'src/utils/fs.js'));

const { hashString, hashFile, generateDeviceId, generateId } = await import(join(projectRoot, 'src/utils/hash.js'));

const { info, success, warn, error, startSpinner } = await import(join(projectRoot, 'src/utils/logger.js'));

describe('Utils: File System', () => {
  const testDir = join(projectRoot, 'test-tmp');
  
  before(async () => {
    await mkdir(testDir, { recursive: true });
  });
  
  after(async () => {
    if (existsSync(testDir)) {
      await rm(testDir, { recursive: true });
    }
  });
  
  it('should write and read files', async () => {
    const testFile = join(testDir, 'test.txt');
    const content = 'Hello, SyncAI!';
    
    await writeFile(testFile, content);
    assert.ok(existsSync(testFile), 'File should exist after writing');
    
    const read = await readFile(testFile);
    assert.strictEqual(read, content, 'Read content should match written content');
  });
  
  it('should check file existence with pathExists', async () => {
    const existingFile = join(testDir, 'exists.txt');
    const nonExisting = join(testDir, 'not-exists.txt');
    
    await writeFile(existingFile, 'test');
    
    assert.ok(pathExists(existingFile), 'Should return true for existing file');
    assert.ok(!pathExists(nonExisting), 'Should return false for non-existing file');
  });
  
  it('should list files in directory', async () => {
    const subDir = join(testDir, 'subdir');
    await mkdir(subDir, { recursive: true });
    await writeFile(join(subDir, 'a.txt'), 'a');
    await writeFile(join(subDir, 'b.txt'), 'b');
    
    const files = await listFiles(subDir);
    assert.strictEqual(files.length, 2, 'Should list 2 files');
    assert.ok(files.some(f => f.path === 'a.txt'), 'Should include a.txt');
    assert.ok(files.some(f => f.path === 'b.txt'), 'Should include b.txt');
  });
  
  it('should ensure directory exists', async () => {
    const newDir = join(testDir, 'new', 'nested', 'dir');
    await ensureDir(newDir);
    assert.ok(existsSync(newDir), 'Nested directory should be created');
  });
  
  it('should expand and collapse home directory', () => {
    const expanded = expandHome('~/.config');
    assert.ok(!expanded.startsWith('~'), 'Should expand ~ to home');
    
    const collapsed = collapseHome(expanded);
    assert.ok(collapsed.startsWith('~'), 'Should collapse home to ~');
  });
  
  it('should get config directory', () => {
    const configDir = getConfigDir();
    assert.ok(configDir.includes('syncai'), 'Config dir should include syncai');
  });
});

describe('Utils: Hash', () => {
  it('should hash string consistently', () => {
    const content = 'test content';
    const hash1 = hashString(content);
    const hash2 = hashString(content);
    
    assert.strictEqual(hash1, hash2, 'Same content should produce same hash');
    assert.ok(hash1.length === 32, 'MD5 hash should be 32 characters');
  });
  
  it('should produce different hashes for different content', () => {
    const hash1 = hashString('content a');
    const hash2 = hashString('content b');
    
    assert.notStrictEqual(hash1, hash2, 'Different content should produce different hash');
  });
  
  it('should generate device ID', async () => {
    const deviceId = await generateDeviceId();
    assert.ok(deviceId.length > 0, 'Device ID should not be empty');
    assert.ok(typeof deviceId === 'string', 'Device ID should be a string');
  });
  
  it('should generate short ID', () => {
    const id = generateId(8);
    assert.strictEqual(id.length, 8, 'ID should be 8 characters');
  });
});

describe('Utils: Logger', () => {
  it('should export log functions', () => {
    assert.ok(typeof info === 'function', 'Should have info function');
    assert.ok(typeof success === 'function', 'Should have success function');
    assert.ok(typeof warn === 'function', 'Should have warn function');
    assert.ok(typeof error === 'function', 'Should have error function');
    assert.ok(typeof startSpinner === 'function', 'Should have startSpinner function');
  });
});
