export default {
  name: 'opencode',
  displayName: 'OpenCode',
  binNames: ['opencode', 'oc'],
  defaultConfigDir: '~/.config/opencode',
  syncPaths: [
    'skills/',
    'config.json',
    'settings.json',
    'opencode.json',
    'command/',
    'plugin/',
    'superpowers/'
  ],
  ignore: [
    'cache/',
    'logs/',
    '*.log',
    '.git/',
    '**/.git/**',
    'node_modules/',
    '**/node_modules/**',
    'antigravity*.json',
    'bun.lock',
    'package-lock.json'
  ],
  detectMethods: ['which', 'go-bin', 'npm-global'],
  envVars: ['OPENCODE_HOME', 'OPENCODE_SESSION']
};
