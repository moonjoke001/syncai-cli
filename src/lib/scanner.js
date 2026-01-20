import { commandExists, getCommandPath, execCommand } from '../utils/exec.js';
import { pathExists, expandHome } from '../utils/fs.js';
import { loadMappings, saveMappings } from './config.js';
import { getToolDefinitions } from '../tools/index.js';

export async function scanInstalledTools() {
  const tools = getToolDefinitions();
  const results = {};
  
  for (const [toolName, toolDef] of Object.entries(tools)) {
    const scanResult = await scanTool(toolName, toolDef);
    results[toolName] = scanResult;
  }
  
  return results;
}

async function scanTool(toolName, toolDef) {
  const result = {
    installed: false,
    installMethod: null,
    binPath: null,
    configDir: null,
    configDirExists: false,
    syncPaths: toolDef.syncPaths || []
  };
  
  for (const binName of toolDef.binNames) {
    if (await commandExists(binName)) {
      result.installed = true;
      result.binPath = await getCommandPath(binName);
      result.installMethod = await detectInstallMethod(result.binPath);
      break;
    }
  }
  
  const configDir = expandHome(toolDef.defaultConfigDir);
  result.configDir = toolDef.defaultConfigDir;
  result.configDirExists = await pathExists(configDir);
  
  return result;
}

async function detectInstallMethod(binPath) {
  if (!binPath) return 'unknown';
  
  if (binPath.includes('node_modules') || binPath.includes('npm') || binPath.includes('.npm')) {
    return 'npm';
  }
  if (binPath.includes('go/bin') || binPath.includes('gopath')) {
    return 'go';
  }
  if (binPath.includes('homebrew') || binPath.includes('Cellar')) {
    return 'brew';
  }
  if (binPath.includes('.cargo')) {
    return 'cargo';
  }
  if (binPath.includes('pip') || binPath.includes('python')) {
    return 'pip';
  }
  
  return 'binary';
}

export async function updateToolMapping(toolName, data) {
  const mappings = await loadMappings();
  mappings[toolName] = {
    ...mappings[toolName],
    ...data,
    lastScanned: new Date().toISOString()
  };
  await saveMappings(mappings);
  return mappings[toolName];
}

export async function scanAndSaveMappings() {
  const results = await scanInstalledTools();
  const mappings = await loadMappings();
  
  for (const [toolName, result] of Object.entries(results)) {
    mappings[toolName] = {
      ...mappings[toolName],
      ...result,
      lastScanned: new Date().toISOString()
    };
  }
  
  await saveMappings(mappings);
  return mappings;
}

export async function getInstalledTools() {
  const mappings = await loadMappings();
  return Object.entries(mappings)
    .filter(([_, data]) => data.installed)
    .map(([name, data]) => ({ name, ...data }));
}
