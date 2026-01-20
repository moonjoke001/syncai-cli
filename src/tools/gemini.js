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
    'google_accounts.json',
    'installation_id',
    'cache/',
    '*.log',
    '.git/',
    '**/.git/**',
    'antigravity/',
    'antigravity-browser-profile/',
    'tmp/',
    'update_available.txt'
  ],
  detectMethods: ['which', 'npm-global'],
  envVars: ['GEMINI_HOME']
};
