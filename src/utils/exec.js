/**
 * Command execution utilities
 */
import { exec, spawn } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Execute command and return output
 */
export async function execCommand(command, options = {}) {
  const { cwd, env, timeout = 30000 } = options;
  
  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd,
      env: { ...process.env, ...env },
      timeout,
      maxBuffer: 10 * 1024 * 1024 // 10MB
    });
    return {
      success: true,
      stdout: stdout.trim(),
      stderr: stderr.trim()
    };
  } catch (error) {
    return {
      success: false,
      stdout: error.stdout?.trim() || '',
      stderr: error.stderr?.trim() || error.message,
      error
    };
  }
}

/**
 * Check if command exists
 */
export async function commandExists(command) {
  const checkCmd = process.platform === 'win32' ? 'where' : 'which';
  const result = await execCommand(`${checkCmd} ${command}`);
  return result.success;
}

/**
 * Get command path
 */
export async function getCommandPath(command) {
  const checkCmd = process.platform === 'win32' ? 'where' : 'which';
  const result = await execCommand(`${checkCmd} ${command}`);
  if (result.success && result.stdout) {
    return result.stdout.split('\n')[0].trim();
  }
  return null;
}

/**
 * Execute interactive command (inherits stdio)
 */
export function execInteractive(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, code });
      } else {
        resolve({ success: false, code });
      }
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Get parent process info
 */
export async function getParentProcessInfo() {
  const ppid = process.ppid;
  
  if (process.platform === 'win32') {
    const result = await execCommand(`wmic process where processid=${ppid} get name,commandline /format:list`);
    if (result.success) {
      return {
        ppid,
        raw: result.stdout
      };
    }
  } else {
    const result = await execCommand(`ps -p ${ppid} -o comm=,args=`);
    if (result.success) {
      const [comm, ...args] = result.stdout.split(/\s+/);
      return {
        ppid,
        command: comm,
        args: args.join(' '),
        raw: result.stdout
      };
    }
  }
  
  return { ppid, raw: '' };
}

/**
 * Get process tree (ancestors)
 */
export async function getProcessTree() {
  const tree = [];
  let currentPid = process.ppid;
  
  for (let i = 0; i < 10; i++) { // Max 10 levels
    if (currentPid <= 1) break;
    
    let result;
    if (process.platform === 'win32') {
      result = await execCommand(`wmic process where processid=${currentPid} get parentprocessid,name /format:list`);
    } else {
      result = await execCommand(`ps -p ${currentPid} -o ppid=,comm=`);
    }
    
    if (!result.success) break;
    
    const parts = result.stdout.trim().split(/\s+/);
    if (parts.length >= 2) {
      const ppid = parseInt(parts[0], 10);
      const comm = parts[1];
      tree.push({ pid: currentPid, command: comm });
      currentPid = ppid;
    } else {
      break;
    }
  }
  
  return tree;
}

/**
 * Check if running inside a specific tool
 */
export async function isRunningIn(toolName) {
  const tree = await getProcessTree();
  const patterns = {
    opencode: /opencode/i,
    kiro: /kiro/i,
    gemini: /gemini/i,
    claude: /claude/i,
    cursor: /cursor/i,
    windsurf: /windsurf/i
  };
  
  const pattern = patterns[toolName.toLowerCase()];
  if (!pattern) return false;
  
  return tree.some(p => pattern.test(p.command));
}
