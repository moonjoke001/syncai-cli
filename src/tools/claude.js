export default {
  name: 'claude',
  displayName: 'Claude Code',
  binNames: ['claude'],
  defaultConfigDir: '~/.claude',
  syncPaths: [
    'CLAUDE.md',
    'settings.json'
  ],
  ignore: [
    'projects/',
    'cache/',
    '*.log',
    'credentials.json',
    '.git/',
    '**/.git/**',
    'commands/',
    'todos/',
    'debug/',
    'statsig/',
    'telemetry/'
  ],
  detectMethods: ['which', 'npm-global'],
  envVars: ['CLAUDE_HOME', 'ANTHROPIC_API_KEY']
};
