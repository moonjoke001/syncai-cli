export default {
  name: 'cursor',
  displayName: 'Cursor',
  binNames: ['cursor'],
  defaultConfigDir: '~/.cursor',
  syncPaths: [
    'settings.json',
    'keybindings.json',
    'rules/',
    'mcp.json'
  ],
  ignore: [
    'cache/',
    'logs/',
    '*.log',
    '.git/',
    '**/.git/**',
    'CachedData/',
    'CachedExtensions/',
    'CachedExtensionVSIXs/',
    'Code Cache/',
    'GPUCache/',
    'User/workspaceStorage/',
    'User/globalStorage/',
    'User/History/',
    'blob_storage/',
    'databases/',
    'Session Storage/',
    'Local Storage/'
  ],
  detectMethods: ['which', 'app-bundle'],
  envVars: ['CURSOR_HOME']
};
