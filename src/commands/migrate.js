import chalk from 'chalk';
import * as logger from '../utils/logger.js';
import { isInitialized, loadMappings } from '../lib/config.js';
import { expandHome, readFile, writeFile, pathExists, ensureDir } from '../utils/fs.js';
import { getToolDefinition, getToolDefinitions } from '../tools/index.js';
import { select, confirm } from '../utils/prompt.js';
import path from 'path';

const MIGRATION_MAPPINGS = {
  'instructions': {
    opencode: 'AGENTS.md',
    claude: 'CLAUDE.md',
    gemini: 'GEMINI.md',
    kiro: 'steering/default.md',
    cursor: 'rules/default.mdc',
    windsurf: 'rules/default.md',
    continue: '.continuerules'
  },
  'settings': {
    opencode: 'config.json',
    claude: 'settings.json',
    gemini: 'settings.json',
    kiro: 'settings/settings.json',
    cursor: 'settings.json',
    windsurf: 'settings.json',
    continue: 'config.json',
    cody: 'settings.json'
  }
};

export async function run(args) {
  const dryRun = args.includes('--dry-run');
  const verbose = args.includes('-v') || args.includes('--verbose');
  
  const initialized = await isInitialized();
  if (!initialized) {
    logger.warn('请先运行 aiinit 初始化');
    return;
  }
  
  console.log('');
  logger.info('配置迁移工具');
  console.log('');
  console.log(chalk.gray('此工具帮助您在不同 AI 工具之间迁移配置文件'));
  console.log('');
  
  const mappings = await loadMappings();
  const installedTools = Object.keys(mappings).filter(t => mappings[t]?.installed);
  
  if (installedTools.length < 2) {
    logger.warn('需要至少安装 2 个工具才能进行迁移');
    return;
  }
  
  const sourceToolChoices = installedTools.map(t => ({
    value: t,
    name: `${t} (${getToolDefinition(t)?.displayName || t})`
  }));
  
  const sourceTool = await select('选择源工具:', sourceToolChoices);
  
  const targetToolChoices = installedTools
    .filter(t => t !== sourceTool)
    .map(t => ({
      value: t,
      name: `${t} (${getToolDefinition(t)?.displayName || t})`
    }));
  
  const targetTool = await select('选择目标工具:', targetToolChoices);
  
  console.log('');
  logger.info(`迁移: ${sourceTool} → ${targetTool}`);
  console.log('');
  
  const migrationType = await select('选择迁移类型:', [
    { value: 'instructions', name: '系统指令/规则文件 (AGENTS.md, CLAUDE.md, etc.)' },
    { value: 'settings', name: '设置文件 (settings.json, config.json)' },
    { value: 'all', name: '全部' }
  ]);
  
  const typesToMigrate = migrationType === 'all' 
    ? ['instructions', 'settings'] 
    : [migrationType];
  
  const sourceDef = getToolDefinition(sourceTool);
  const targetDef = getToolDefinition(targetTool);
  
  if (!sourceDef || !targetDef) {
    logger.error('工具定义未找到');
    return;
  }
  
  const sourceDir = expandHome(sourceDef.defaultConfigDir);
  const targetDir = expandHome(targetDef.defaultConfigDir);
  
  let migratedCount = 0;
  
  for (const type of typesToMigrate) {
    const sourceFile = MIGRATION_MAPPINGS[type]?.[sourceTool];
    const targetFile = MIGRATION_MAPPINGS[type]?.[targetTool];
    
    if (!sourceFile || !targetFile) {
      if (verbose) {
        console.log(chalk.gray(`  跳过 ${type}: 不支持的迁移路径`));
      }
      continue;
    }
    
    const sourcePath = path.join(sourceDir, sourceFile);
    const targetPath = path.join(targetDir, targetFile);
    
    if (!await pathExists(sourcePath)) {
      console.log(chalk.gray(`  跳过 ${type}: 源文件不存在 (${sourceFile})`));
      continue;
    }
    
    console.log('');
    console.log(chalk.cyan(`[${type}]`));
    console.log(`  源: ${sourcePath}`);
    console.log(`  目标: ${targetPath}`);
    
    if (await pathExists(targetPath)) {
      const overwrite = await confirm('目标文件已存在，是否覆盖?', false);
      if (!overwrite) {
        console.log(chalk.yellow('  已跳过'));
        continue;
      }
    }
    
    if (!dryRun) {
      try {
        const content = await readFile(sourcePath);
        const convertedContent = convertContent(content, sourceTool, targetTool, type);
        
        await ensureDir(path.dirname(targetPath));
        await writeFile(targetPath, convertedContent);
        
        logger.success(`已迁移 ${type}`);
        migratedCount++;
      } catch (err) {
        logger.error(`迁移失败: ${err.message}`);
      }
    } else {
      console.log(chalk.yellow('  [Dry Run] 将被迁移'));
      migratedCount++;
    }
  }
  
  console.log('');
  if (migratedCount > 0) {
    logger.success(`${dryRun ? '将' : '已'}迁移 ${migratedCount} 个配置`);
  } else {
    logger.info('没有配置被迁移');
  }
}

function convertContent(content, sourceTool, targetTool, type) {
  if (type === 'instructions') {
    let converted = content;
    
    const toolMentions = {
      opencode: ['OpenCode', 'opencode', 'AGENTS.md'],
      claude: ['Claude', 'claude', 'CLAUDE.md'],
      gemini: ['Gemini', 'gemini', 'GEMINI.md'],
      kiro: ['Kiro', 'kiro'],
      cursor: ['Cursor', 'cursor'],
      windsurf: ['Windsurf', 'windsurf'],
      continue: ['Continue', 'continue']
    };
    
    const sourceNames = toolMentions[sourceTool] || [];
    const targetDef = getToolDefinition(targetTool);
    const targetName = targetDef?.displayName || targetTool;
    
    for (const name of sourceNames) {
      if (name.includes('.md')) continue;
      converted = converted.replace(new RegExp(name, 'g'), targetName);
    }
    
    return converted;
  }
  
  if (type === 'settings') {
    try {
      const sourceSettings = JSON.parse(content);
      return JSON.stringify(sourceSettings, null, 2);
    } catch {
      return content;
    }
  }
  
  return content;
}
