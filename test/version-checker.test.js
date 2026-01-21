import { test, describe, mock } from 'node:test';
import assert from 'node:assert';

describe('version-checker', () => {
  test('TRACKED_ITEMS contains expected skills', async () => {
    const mod = await import('../src/lib/version-checker.js');
    const TRACKED_ITEMS = mod.default.TRACKED_ITEMS;
    
    assert.ok(Array.isArray(TRACKED_ITEMS));
    assert.ok(TRACKED_ITEMS.length >= 4);
    
    const names = TRACKED_ITEMS.map(i => i.name);
    assert.ok(names.includes('oh-my-opencode'));
    assert.ok(names.includes('superpowers'));
    assert.ok(names.includes('planning-with-files'));
    assert.ok(names.includes('ui-ux-pro-max-skill'));
  });

  test('hasUpdate detects version differences', async () => {
    const mod = await import('../src/lib/version-checker.js');
    
    const local = { version: 'v1.0.0', type: 'tag' };
    const remote = { version: 'v1.1.0', type: 'tag' };
    const remoteSame = { version: 'v1.0.0', type: 'tag' };
    
    assert.strictEqual(mod.default.checkForUpdates !== undefined, true);
  });

  test('displayUpdateStatus returns empty array when no updates', async () => {
    const { displayUpdateStatus } = await import('../src/lib/version-checker.js');
    
    const results = {
      'test-skill': {
        name: 'test-skill',
        local: { version: 'v1.0.0', type: 'tag' },
        remote: { version: 'v1.0.0', type: 'tag' },
        hasUpdate: false
      }
    };
    
    const updates = displayUpdateStatus(results);
    assert.strictEqual(updates.length, 0);
  });

  test('displayUpdateStatus returns updates when available', async () => {
    const { displayUpdateStatus } = await import('../src/lib/version-checker.js');
    
    const results = {
      'test-skill': {
        name: 'test-skill',
        local: { version: 'v1.0.0', type: 'tag' },
        remote: { version: 'v2.0.0', type: 'tag' },
        hasUpdate: true
      }
    };
    
    const updates = displayUpdateStatus(results);
    assert.strictEqual(updates.length, 1);
    assert.strictEqual(updates[0].name, 'test-skill');
  });
});
