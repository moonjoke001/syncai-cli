import { readJson, writeJson, pathExists, getConfigPath, getMappingsPath, getIgnorePath, getConfigDir, ensureDir } from '../utils/fs.js';
import os from 'os';

const DEFAULT_CONFIG = {
  github: {
    username: null,
    repo: 'syai',
    branch: 'main',
    authMethod: 'gh-cli',
    lastAuthCheck: null
  },
  device: {
    id: null,
    name: os.hostname(),
    createdAt: null
  },
  autoDetect: true,
  initialized: false,
  initDate: null
};

const DEFAULT_MAPPINGS = {};

const DEFAULT_IGNORE = {
  global: [
    '**/*.token',
    '**/*secret*',
    '**/*credential*',
    '**/oauth_creds.json',
    '**/.env',
    '**/*.key',
    '**/*.pem'
  ],
  kiro: [
    'kiro-auth-token.json'
  ],
  opencode: [],
  gemini: [
    'oauth_creds.json'
  ],
  claude: []
};

let configCache = null;
let mappingsCache = null;
let ignoreCache = null;

export async function loadConfig() {
  if (configCache) return configCache;
  
  const configPath = getConfigPath();
  if (await pathExists(configPath)) {
    configCache = await readJson(configPath);
  } else {
    configCache = { ...DEFAULT_CONFIG };
  }
  return configCache;
}

export async function saveConfig(config) {
  configCache = config;
  await ensureDir(getConfigDir());
  await writeJson(getConfigPath(), config);
}

export async function updateConfig(updates) {
  const config = await loadConfig();
  const newConfig = deepMerge(config, updates);
  await saveConfig(newConfig);
  return newConfig;
}

export async function loadMappings() {
  if (mappingsCache) return mappingsCache;
  
  const mappingsPath = getMappingsPath();
  if (await pathExists(mappingsPath)) {
    mappingsCache = await readJson(mappingsPath);
  } else {
    mappingsCache = { ...DEFAULT_MAPPINGS };
  }
  return mappingsCache;
}

export async function saveMappings(mappings) {
  mappingsCache = mappings;
  await ensureDir(getConfigDir());
  await writeJson(getMappingsPath(), mappings);
}

export async function updateMappings(toolName, data) {
  const mappings = await loadMappings();
  mappings[toolName] = { ...mappings[toolName], ...data };
  await saveMappings(mappings);
  return mappings;
}

export async function loadIgnore() {
  if (ignoreCache) return ignoreCache;
  
  const ignorePath = getIgnorePath();
  if (await pathExists(ignorePath)) {
    ignoreCache = await readJson(ignorePath);
  } else {
    ignoreCache = { ...DEFAULT_IGNORE };
  }
  return ignoreCache;
}

export async function saveIgnore(ignore) {
  ignoreCache = ignore;
  await ensureDir(getConfigDir());
  await writeJson(getIgnorePath(), ignore);
}

export async function isInitialized() {
  const config = await loadConfig();
  return config.initialized === true;
}

export async function getEffectiveConfigDir(toolName) {
  const mappings = await loadMappings();
  const tool = mappings[toolName];
  if (!tool) return null;
  return tool.customConfigDir || tool.configDir;
}

export function clearCache() {
  configCache = null;
  mappingsCache = null;
  ignoreCache = null;
}

function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}
