export default {
  name: 'kiro',
  displayName: 'Kiro CLI',
  binNames: ['kiro', 'kiro-cli'],
  defaultConfigDir: '~/.kiro',
  syncPaths: [
    'settings/',
    'steering/',
    'agents/',
    'powers/installed/',
    'powers/registry.json'
  ],
  ignore: [
    'kiro-auth-token.json',
    'cache/',
    'logs/',
    '*.log',
    '.git/',
    '**/.git/**',
    '**/repos/**',
    '**/native-binary/**',
    '**/*.node',
    '**/node_modules/**'
  ],
  detectMethods: ['which', 'npm-global'],
  envVars: ['KIRO_HOME', 'KIRO_SESSION']
};
