import { readFile } from '../utils/fs.js';

const SENSITIVE_PATTERNS = [
  { pattern: /api[_-]?key\s*[=:]\s*["']?[a-zA-Z0-9_-]{20,}/gi, type: 'api_key' },
  { pattern: /secret[_-]?key\s*[=:]\s*["']?[a-zA-Z0-9_-]{20,}/gi, type: 'secret_key' },
  { pattern: /password\s*[=:]\s*["']?[^\s"']{8,}/gi, type: 'password' },
  { pattern: /token\s*[=:]\s*["']?[a-zA-Z0-9_-]{20,}/gi, type: 'token' },
  { pattern: /bearer\s+[a-zA-Z0-9_-]{20,}/gi, type: 'bearer_token' },
  { pattern: /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/g, type: 'private_key' },
  { pattern: /-----BEGIN\s+CERTIFICATE-----/g, type: 'certificate' },
  { pattern: /sk-[a-zA-Z0-9]{48}/g, type: 'openai_key' },
  { pattern: /ghp_[a-zA-Z0-9]{36}/g, type: 'github_token' },
  { pattern: /gho_[a-zA-Z0-9]{36}/g, type: 'github_oauth' },
  { pattern: /xox[baprs]-[a-zA-Z0-9-]{10,}/g, type: 'slack_token' }
];

const SAFE_PATTERNS = [
  /^#.*$/gm,
  /"description":/,
  /"name":/,
  /"version":/
];

export async function checkSensitiveContent(filePath) {
  try {
    const content = await readFile(filePath);
    return checkSensitiveString(content);
  } catch {
    return { hasSensitive: false, matches: [] };
  }
}

export function checkSensitiveString(content) {
  const matches = [];
  
  for (const { pattern, type } of SENSITIVE_PATTERNS) {
    const patternMatches = content.match(pattern);
    if (patternMatches) {
      for (const match of patternMatches) {
        const isSafe = SAFE_PATTERNS.some(safe => safe.test(match));
        if (!isSafe) {
          matches.push({
            type,
            preview: maskSensitive(match)
          });
        }
      }
    }
  }
  
  return {
    hasSensitive: matches.length > 0,
    matches
  };
}

function maskSensitive(str) {
  if (str.length <= 10) return '***';
  return str.slice(0, 5) + '...' + str.slice(-3);
}

export function getSensitiveWarning(matches) {
  if (matches.length === 0) return null;
  
  const types = [...new Set(matches.map(m => m.type))];
  return `检测到可能的敏感信息: ${types.join(', ')}`;
}
