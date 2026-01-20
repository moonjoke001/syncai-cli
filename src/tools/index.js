import opencode from './opencode.js';
import kiro from './kiro.js';
import gemini from './gemini.js';
import claude from './claude.js';
import cursor from './cursor.js';
import windsurf from './windsurf.js';
import continueAi from './continue.js';
import cody from './cody.js';

const BUILT_IN_TOOLS = {
  opencode,
  kiro,
  gemini,
  claude,
  cursor,
  windsurf,
  continue: continueAi,
  cody
};

let customTools = {};

export function getToolDefinitions() {
  return { ...BUILT_IN_TOOLS, ...customTools };
}

export function getToolDefinition(name) {
  return getToolDefinitions()[name] || null;
}

export function registerTool(toolDef) {
  if (!toolDef.name) {
    throw new Error('Tool definition must have a name');
  }
  customTools[toolDef.name] = toolDef;
}

export function unregisterTool(name) {
  delete customTools[name];
}

export function listToolNames() {
  return Object.keys(getToolDefinitions());
}

export function isBuiltInTool(name) {
  return name in BUILT_IN_TOOLS;
}
