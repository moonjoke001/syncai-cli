export default {
  name: 'cody',
  displayName: 'Sourcegraph Cody',
  binNames: ['cody'],
  defaultConfigDir: '~/.sourcegraph',
  syncPaths: [
    'settings.json',
    'cody.json'
  ],
  ignore: [
    'cache/',
    'logs/',
    '*.log',
    '.git/',
    '**/.git/**',
    'embeddings/',
    'tokens.json',
    'auth.json'
  ],
  detectMethods: ['config-exists', 'vscode-extension'],
  envVars: ['SRC_ACCESS_TOKEN', 'SRC_ENDPOINT']
};
