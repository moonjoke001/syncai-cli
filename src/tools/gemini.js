export default {
  name: 'gemini',
  displayName: 'Gemini CLI',
  binNames: ['gemini', 'gemini-cli'],
  defaultConfigDir: '~/.gemini',
  syncPaths: [
    'GEMINI.md',
    'settings.json'
  ],
  ignore: [
    'oauth_creds.json',
    'cache/',
    '*.log',
    '.git/',
    '**/.git/**',
    'antigravity/',
    'update_available.txt'
  ],
  detectMethods: ['which', 'npm-global'],
  envVars: ['GEMINI_HOME']
};
