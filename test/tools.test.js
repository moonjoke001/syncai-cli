import { describe, it } from 'node:test';
import assert from 'node:assert';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = dirname(__dirname);

const { getToolDefinitions, getToolDefinition, listToolNames, isBuiltInTool } = await import(join(projectRoot, 'src/tools/index.js'));

describe('Tools: Definition', () => {
  it('should get all tool definitions', () => {
    const tools = getToolDefinitions();
    assert.ok(tools.opencode, 'Should have opencode');
    assert.ok(tools.kiro, 'Should have kiro');
    assert.ok(tools.gemini, 'Should have gemini');
    assert.ok(tools.claude, 'Should have claude');
  });
  
  it('should get single tool definition', () => {
    const opencode = getToolDefinition('opencode');
    assert.ok(opencode, 'Should return opencode definition');
    assert.strictEqual(opencode.name, 'opencode');
  });
  
  it('should return null for unknown tool', () => {
    const unknown = getToolDefinition('unknown-tool');
    assert.strictEqual(unknown, null, 'Should return null for unknown tool');
  });
  
  it('should list tool names', () => {
    const names = listToolNames();
    assert.ok(Array.isArray(names), 'Should return array');
    assert.ok(names.includes('opencode'), 'Should include opencode');
    assert.ok(names.includes('kiro'), 'Should include kiro');
    assert.ok(names.includes('gemini'), 'Should include gemini');
    assert.ok(names.includes('claude'), 'Should include claude');
    assert.ok(names.includes('cursor'), 'Should include cursor');
    assert.ok(names.includes('windsurf'), 'Should include windsurf');
    assert.ok(names.includes('continue'), 'Should include continue');
    assert.ok(names.includes('cody'), 'Should include cody');
    assert.strictEqual(names.length, 8, 'Should have 8 tools');
  });
  
  it('should identify built-in tools', () => {
    assert.ok(isBuiltInTool('opencode'), 'opencode is built-in');
    assert.ok(isBuiltInTool('kiro'), 'kiro is built-in');
    assert.ok(!isBuiltInTool('custom'), 'custom is not built-in');
  });
  
  it('should have required properties for each tool', () => {
    const tools = getToolDefinitions();
    for (const [name, tool] of Object.entries(tools)) {
      assert.ok(tool.name, `${name} should have name`);
      assert.ok(tool.defaultConfigDir, `${name} should have defaultConfigDir`);
      assert.ok(Array.isArray(tool.syncPaths), `${name} should have syncPaths array`);
      assert.ok(Array.isArray(tool.binNames), `${name} should have binNames array`);
    }
  });
});

describe('Tools: OpenCode', () => {
  it('should have correct configuration', () => {
    const opencode = getToolDefinition('opencode');
    assert.strictEqual(opencode.name, 'opencode');
    assert.ok(opencode.defaultConfigDir.includes('opencode'), 'defaultConfigDir should include opencode');
    assert.ok(opencode.syncPaths.includes('config.json'), 'Should sync config.json');
    assert.ok(opencode.syncPaths.includes('skills/'), 'Should sync skills/');
  });
});

describe('Tools: Kiro', () => {
  it('should have correct configuration', () => {
    const kiro = getToolDefinition('kiro');
    assert.strictEqual(kiro.name, 'kiro');
    assert.ok(kiro.defaultConfigDir.includes('kiro'), 'defaultConfigDir should include kiro');
  });
  
  it('should have ignore patterns', () => {
    const kiro = getToolDefinition('kiro');
    assert.ok(Array.isArray(kiro.ignore), 'Should have ignore array');
    assert.ok(kiro.ignore.length > 0, 'Should have at least one ignore pattern');
  });
});

describe('Tools: Gemini', () => {
  it('should have correct configuration', () => {
    const gemini = getToolDefinition('gemini');
    assert.strictEqual(gemini.name, 'gemini');
    assert.ok(gemini.defaultConfigDir.includes('gemini'), 'defaultConfigDir should include gemini');
  });
});

describe('Tools: Claude', () => {
  it('should have correct configuration', () => {
    const claude = getToolDefinition('claude');
    assert.strictEqual(claude.name, 'claude');
    assert.ok(claude.defaultConfigDir.includes('claude'), 'defaultConfigDir should include claude');
  });
});

describe('Tools: Cursor', () => {
  it('should have correct configuration', () => {
    const cursor = getToolDefinition('cursor');
    assert.strictEqual(cursor.name, 'cursor');
    assert.ok(cursor.defaultConfigDir.includes('cursor'), 'defaultConfigDir should include cursor');
    assert.ok(cursor.syncPaths.includes('settings.json'), 'Should sync settings.json');
  });
});

describe('Tools: Windsurf', () => {
  it('should have correct configuration', () => {
    const windsurf = getToolDefinition('windsurf');
    assert.strictEqual(windsurf.name, 'windsurf');
    assert.ok(windsurf.defaultConfigDir.includes('windsurf'), 'defaultConfigDir should include windsurf');
  });
});

describe('Tools: Continue', () => {
  it('should have correct configuration', () => {
    const continueAi = getToolDefinition('continue');
    assert.strictEqual(continueAi.name, 'continue');
    assert.ok(continueAi.defaultConfigDir.includes('continue'), 'defaultConfigDir should include continue');
    assert.ok(continueAi.syncPaths.includes('config.json'), 'Should sync config.json');
  });
});

describe('Tools: Cody', () => {
  it('should have correct configuration', () => {
    const cody = getToolDefinition('cody');
    assert.strictEqual(cody.name, 'cody');
    assert.ok(cody.defaultConfigDir.includes('sourcegraph'), 'defaultConfigDir should include sourcegraph');
  });
});
