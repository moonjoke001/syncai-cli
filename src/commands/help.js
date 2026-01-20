import chalk from 'chalk';

export async function run(args) {
  const [topic] = args;
  
  if (topic) {
    showTopicHelp(topic);
    return;
  }
  
  console.log('');
  console.log(chalk.bold.cyan('SyncAI - AI 工具配置同步'));
  console.log('');
  console.log('在 OpenCode、Kiro CLI、Gemini CLI、Claude Code 等工具间同步配置');
  console.log('');
  
  console.log(chalk.bold('快捷命令:'));
  console.log('');
  console.log(`  ${chalk.yellow('aiinit')}      初始化 SyncAI`);
  console.log(`  ${chalk.yellow('aidetect')}    检测当前运行环境`);
  console.log(`  ${chalk.yellow('aiscan')}      扫描已安装的 AI 工具`);
  console.log(`  ${chalk.yellow('aipull')}      从云端拉取配置`);
  console.log(`  ${chalk.yellow('aipush')}      推送配置到云端`);
  console.log(`  ${chalk.yellow('aistatus')}    查看同步状态`);
  console.log(`  ${chalk.yellow('aidiff')}      查看配置差异`);
  console.log(`  ${chalk.yellow('aiconfig')}    管理配置`);
  console.log(`  ${chalk.yellow('aiauth')}      管理 GitHub 授权`);
  console.log(`  ${chalk.yellow('aibackup')}    管理备份`);
  console.log(`  ${chalk.yellow('aihistory')}   查看提交历史`);
  console.log(`  ${chalk.yellow('airollback')}  回滚到历史版本`);
  console.log(`  ${chalk.yellow('aiplugin')}    管理工具插件`);
  console.log(`  ${chalk.yellow('aiwatch')}     监视配置变更并自动同步`);
  console.log(`  ${chalk.yellow('aimigrate')}   在工具间迁移配置`);
  console.log('');
  
  console.log(chalk.bold('常用选项:'));
  console.log('');
  console.log(`  ${chalk.gray('--all')}        对所有工具执行`);
  console.log(`  ${chalk.gray('--only=x,y')}   仅对指定工具执行`);
  console.log(`  ${chalk.gray('--dry-run')}    预览模式，不实际执行`);
  console.log(`  ${chalk.gray('-v, --verbose')} 详细输出`);
  console.log('');
  
  console.log(chalk.bold('示例:'));
  console.log('');
  console.log(`  ${chalk.gray('# 首次使用')}`);
  console.log(`  ${chalk.cyan('aiinit')}`);
  console.log('');
  console.log(`  ${chalk.gray('# 推送当前工具配置')}`);
  console.log(`  ${chalk.cyan('aipush')}`);
  console.log('');
  console.log(`  ${chalk.gray('# 拉取所有工具配置')}`);
  console.log(`  ${chalk.cyan('aipull --all')}`);
  console.log('');
  console.log(`  ${chalk.gray('# 查看 Kiro 配置差异')}`);
  console.log(`  ${chalk.cyan('aistatus --only=kiro')}`);
  console.log('');
  
  console.log(`更多帮助: ${chalk.cyan('aihelp <command>')}`);
  console.log('');
}

function showTopicHelp(topic) {
  const helps = {
    init: `
${chalk.bold('aiinit - 初始化 SyncAI')}

用法: aiinit

初始化步骤:
  1. 检查并安装 GitHub CLI
  2. 登录 GitHub 账号
  3. 创建或连接私有仓库
  4. 扫描已安装的 AI 工具
  5. 保存配置

初始化后可以使用 aipush/aipull 同步配置。
`,
    push: `
${chalk.bold('aipush - 推送配置到云端')}

用法: aipush [选项]

选项:
  --all         推送所有工具配置
  --only=x,y    仅推送指定工具
  --dry-run     预览模式
  --force       强制推送（包含敏感信息）
  -v            详细输出

示例:
  aipush                    # 推送当前环境
  aipush --all              # 推送所有工具
  aipush --only=kiro,claude # 仅推送 kiro 和 claude
  aipush --dry-run          # 预览将推送的文件
`,
    pull: `
${chalk.bold('aipull - 从云端拉取配置')}

用法: aipull [选项]

选项:
  --all         拉取所有工具配置
  --only=x,y    仅拉取指定工具
  --dry-run     预览模式
  -v            详细输出

示例:
  aipull                    # 拉取当前环境
  aipull --all              # 拉取所有工具
  aipull --only=opencode    # 仅拉取 opencode
`,
    backup: `
${chalk.bold('aibackup - 备份管理')}

用法: aibackup <command> [选项]

命令:
  list [tool]       列出备份
  create [tool]     创建备份
  restore <id>      恢复备份
  delete <id>       删除备份
  clean [--keep=n]  清理旧备份

示例:
  aibackup list              # 列出所有备份
  aibackup create kiro       # 创建 kiro 备份
  aibackup restore 20260119  # 恢复指定备份
`
  };
  
  const help = helps[topic];
  if (help) {
    console.log(help);
  } else {
    console.log('');
    console.log(`未知主题: ${topic}`);
    console.log(`可用主题: ${Object.keys(helps).join(', ')}`);
    console.log('');
  }
}
