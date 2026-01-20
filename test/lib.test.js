import { describe, it } from 'node:test';
import assert from 'node:assert';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = dirname(__dirname);

const { checkSensitiveString, getSensitiveWarning } = await import(join(projectRoot, 'src/lib/security.js'));
const { loadConfig, saveConfig, isInitialized, clearCache } = await import(join(projectRoot, 'src/lib/config.js'));
const { scanInstalledTools, getInstalledTools } = await import(join(projectRoot, 'src/lib/scanner.js'));
const { detectCurrentEnvironment, getDetectionInfo } = await import(join(projectRoot, 'src/lib/detector.js'));
const { detectConflicts, getSyncStatus } = await import(join(projectRoot, 'src/lib/sync.js'));

describe('Lib: Security', () => {
  it('should detect API keys', () => {
    const content = 'api_key=sk-1234567890abcdefghijklmnop';
    const result = checkSensitiveString(content);
    
    assert.ok(result.hasSensitive, 'Should detect sensitive data');
    assert.ok(result.matches.length > 0, 'Should have matches');
  });
  
  it('should detect GitHub tokens', () => {
    const content = 'token: ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
    const result = checkSensitiveString(content);
    
    assert.ok(result.hasSensitive, 'Should detect GitHub token');
  });
  
  it('should not flag normal content', () => {
    const content = 'This is normal configuration content.';
    const result = checkSensitiveString(content);
    
    assert.ok(!result.hasSensitive, 'Should not flag normal content');
    assert.strictEqual(result.matches.length, 0, 'Should have no matches');
  });
  
  it('should detect passwords', () => {
    const content = 'password=mysecretpassword123';
    const result = checkSensitiveString(content);
    
    assert.ok(result.hasSensitive, 'Should detect password');
  });
  
  it('getSensitiveWarning should return warning for matches', () => {
    const matches = [{ type: 'api_key', preview: 'api_k...' }];
    const warning = getSensitiveWarning(matches);
    
    assert.ok(warning, 'Should return warning');
    assert.ok(warning.includes('api_key'), 'Warning should include type');
  });
  
  it('getSensitiveWarning should return null for empty matches', () => {
    const warning = getSensitiveWarning([]);
    assert.strictEqual(warning, null, 'Should return null for no matches');
  });
});

describe('Lib: Config', () => {
  it('should export config functions', () => {
    assert.ok(typeof loadConfig === 'function', 'Should export loadConfig');
    assert.ok(typeof saveConfig === 'function', 'Should export saveConfig');
    assert.ok(typeof isInitialized === 'function', 'Should export isInitialized');
    assert.ok(typeof clearCache === 'function', 'Should export clearCache');
  });
  
  it('should load config', async () => {
    const config = await loadConfig();
    assert.ok(typeof config === 'object', 'Config should be an object');
  });
});

describe('Lib: Scanner', () => {
  it('should export scanner functions', () => {
    assert.ok(typeof scanInstalledTools === 'function', 'Should export scanInstalledTools');
    assert.ok(typeof getInstalledTools === 'function', 'Should export getInstalledTools');
  });
  
  it('should scan for installed tools', async () => {
    const tools = await scanInstalledTools();
    assert.ok(typeof tools === 'object', 'Should return object');
    assert.ok('opencode' in tools || 'kiro' in tools, 'Should have tool entries');
  });
});

describe('Lib: Detector', () => {
  it('should detect current environment', async () => {
    const result = await detectCurrentEnvironment();
    assert.ok(typeof result === 'object', 'Should return object');
    assert.ok('tool' in result, 'Result should have tool property');
    assert.ok('detected' in result, 'Result should have detected property');
  });
  
  it('should get detection info', async () => {
    const info = await getDetectionInfo();
    assert.ok(typeof info === 'object', 'Should return object');
    assert.ok('current' in info, 'Info should have current');
    assert.ok('all' in info, 'Info should have all tools list');
  });
});

describe('Lib: Sync', () => {
  it('should export detectConflicts function', () => {
    assert.ok(typeof detectConflicts === 'function', 'Should export detectConflicts');
  });
  
  it('should export getSyncStatus function', () => {
    assert.ok(typeof getSyncStatus === 'function', 'Should export getSyncStatus');
  });
  
  it('should detect conflicts for unknown tool', async () => {
    const conflicts = await detectConflicts('unknown-tool');
    assert.ok(Array.isArray(conflicts), 'Should return array');
    assert.strictEqual(conflicts.length, 0, 'Should return empty for unknown tool');
  });
});
