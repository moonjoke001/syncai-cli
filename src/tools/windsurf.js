export default {
  name: 'windsurf',
  displayName: 'Windsurf',
  binNames: ['windsurf'],
  defaultConfigDir: '~/.windsurf',
  syncPaths: [
    'settings.json',
    'keybindings.json',
    'rules/',
    'cascade.json'
  ],
  ignore: [
    'cache/',
    'logs/',
    '*.log',
    '.git/',
    '**/.git/**',
    'CachedData/',
    'CachedExtensions/',
    'Code Cache/',
    'GPUCache/',
    'User/workspaceStorage/',
    'User/globalStorage/',
    'User/History/',
    'Session Storage/',
    'Local Storage/'
  ],
  detectMethods: ['which', 'app-bundle'],
  envVars: ['WINDSURF_HOME']
};
