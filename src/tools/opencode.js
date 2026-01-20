export default {
  name: 'opencode',
  displayName: 'OpenCode',
  binNames: ['opencode', 'oc'],
  defaultConfigDir: '~/.config/opencode',
  syncPaths: [
    'skills/',
    'config.json',
    'settings.json'
  ],
  ignore: [
    'cache/',
    'logs/',
    '*.log',
    '.git/',
    '**/.git/**'
  ],
  detectMethods: ['which', 'go-bin', 'npm-global'],
  envVars: ['OPENCODE_HOME', 'OPENCODE_SESSION']
};
