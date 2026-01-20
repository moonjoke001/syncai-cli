import { getProcessTree, isRunningIn } from '../utils/exec.js';
import { loadMappings } from './config.js';

const TOOL_PATTERNS = {
  opencode: {
    processPatterns: [/opencode/i, /\boc\b/i],
    envVars: ['OPENCODE_HOME', 'OPENCODE_SESSION']
  },
  kiro: {
    processPatterns: [/kiro/i, /kiro-cli/i],
    envVars: ['KIRO_HOME', 'KIRO_SESSION']
  },
  gemini: {
    processPatterns: [/gemini/i, /gemini-cli/i],
    envVars: ['GEMINI_HOME', 'GEMINI_API_KEY']
  },
  claude: {
    processPatterns: [/claude/i, /claude-code/i],
    envVars: ['CLAUDE_HOME', 'ANTHROPIC_API_KEY']
  },
  cursor: {
    processPatterns: [/cursor/i],
    envVars: ['CURSOR_HOME']
  },
  windsurf: {
    processPatterns: [/windsurf/i],
    envVars: ['WINDSURF_HOME']
  },
  continue: {
    processPatterns: [/continue/i],
    envVars: ['CONTINUE_HOME']
  },
  cody: {
    processPatterns: [/cody/i, /sourcegraph/i],
    envVars: ['SRC_ACCESS_TOKEN', 'SRC_ENDPOINT']
  }
};

export async function detectCurrentEnvironment() {
  const processTree = await getProcessTree();
  
  for (const [toolName, patterns] of Object.entries(TOOL_PATTERNS)) {
    for (const proc of processTree) {
      for (const pattern of patterns.processPatterns) {
        if (pattern.test(proc.command)) {
          return {
            tool: toolName,
            detected: true,
            method: 'process',
            process: proc.command
          };
        }
      }
    }
  }
  
  for (const [toolName, patterns] of Object.entries(TOOL_PATTERNS)) {
    for (const envVar of patterns.envVars) {
      if (process.env[envVar]) {
        return {
          tool: toolName,
          detected: true,
          method: 'env',
          envVar
        };
      }
    }
  }
  
  return {
    tool: null,
    detected: false,
    method: null
  };
}

export async function detectAllEnvironments() {
  const results = {};
  
  for (const toolName of Object.keys(TOOL_PATTERNS)) {
    const inTool = await isRunningIn(toolName);
    results[toolName] = inTool;
  }
  
  return results;
}

export async function getDetectionInfo() {
  const current = await detectCurrentEnvironment();
  const mappings = await loadMappings();
  const installed = Object.keys(mappings).filter(t => mappings[t]?.installed);
  
  return {
    current,
    installed,
    all: Object.keys(TOOL_PATTERNS)
  };
}
