export default {
  name: 'continue',
  displayName: 'Continue',
  binNames: ['continue'],
  defaultConfigDir: '~/.continue',
  syncPaths: [
    'config.json',
    'config.yaml',
    'prompts/',
    '.continuerules'
  ],
  ignore: [
    'cache/',
    'logs/',
    '*.log',
    '.git/',
    '**/.git/**',
    'sessions/',
    'index/',
    'dev_data/',
    'types/'
  ],
  detectMethods: ['config-exists'],
  envVars: ['CONTINUE_HOME']
};
