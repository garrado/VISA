/**
 * SCRIPT DE MIGRAÇÃO CSS - VISA ANÁPOLIS
 * Adiciona automaticamente os novos arquivos CSS e JS em todos HTML
 * 
 * USO:
 * node migrate-css.js
 * 
 * O QUE FAZ:
 * - Verifica se as linhas já existem (evita duplicação)
 * - Adiciona CSS na ordem correta no <head>
 * - Adiciona platform-detector.js antes do </body>
 * - Cria backup dos arquivos originais
 * - Gera relatório detalhado
 */

const fs = require('fs');
const path = require('path');

// ========================================
// CONFIGURAÇÃO
// ========================================

const CONFIG = {
  // Arquivos HTML para processar
  htmlFiles: [
    'index.html',
    'Regulados.html',
    'README.html',
    'legislacao.html',
    'check.html',
    'redesim.html',
    'escala_dezembro_2025_padrao_regulados.html',
    'Escala_Veiculos_Dezembro_2025_VERSAO_FINAL.html',
    'cadastro_economico_por_equipe_colorido.html',
    'relatorio_plantao_fiscal.html',
    'mts.html'
  ],
  
  // Linhas a adicionar no <head>
  cssLines: [
    '  <link rel="stylesheet" href="/VISA/css/design-tokens.css">',
    '  <link rel="stylesheet" href="/VISA/css/base.css">',
    '  <link rel="stylesheet" href="/VISA/css/components.css">',
    '  <link rel="stylesheet" href="/VISA/css/layouts.css">'
  ],
  
  // Linha a adicionar antes do </body>
  jsLine: '  <script src="/VISA/js/platform-detector.js"></script>',
  
  // Criar backup?
  createBackup: true,
  
  // Diretório de backup
  backupDir: 'backup-html',
  
  // Modo dry-run (não altera arquivos)
  dryRun: false
};

// ========================================
// CORES PARA CONSOLE
// ========================================

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

// ========================================
// FUNÇÕES AUXILIARES
// ========================================

/**
 * Verifica se uma linha já existe no conteúdo
 */
function lineExists(content, line) {
  // Remove espaços extras e compara
  const cleanLine = line.trim().replace(/\s+/g, ' ');
  const cleanContent = content.replace(/\s+/g, ' ');
  return cleanContent.includes(cleanLine);
}

/**
 * Encontra a posição ideal para inserir CSS no <head>
 */
function findCSSInsertPosition(content) {
  // Tenta encontrar </head>
  const headCloseMatch = content.match(/<\/head>/i);
  if (headCloseMatch) {
    return headCloseMatch.index;
  }
  
  // Se não encontrar </head>, procura <body>
  const bodyOpenMatch = content.match(/<body/i);
  if (bodyOpenMatch) {
    return bodyOpenMatch.index;
  }
  
  return -1;
}

/**
 * Encontra a posição ideal para inserir JS antes do </body>
 */
function findJSInsertPosition(content) {
  // Tenta encontrar </body>
  const bodyCloseMatch = content.match(/<\/body>/i);
  if (bodyCloseMatch) {
    return bodyCloseMatch.index;
  }
  
  // Se não encontrar, insere no final
  return content.length;
}

/**
 * Adiciona CSS no <head>
 */
function addCSSLines(content, cssLines) {
  let modified = content;
  let added = [];
  
  // Verifica quais linhas já existem
  const missingLines = cssLines.filter(line => {
    const exists = lineExists(content, line);
    if (exists) {
      log(`    ⏭️  Já existe: ${line.trim()}`, 'yellow');
    }
    return !exists;
  });
  
  if (missingLines.length === 0) {
    return { content: modified, added: [] };
  }
  
  // Encontra posição para inserir
  const insertPos = findCSSInsertPosition(modified);
  if (insertPos === -1) {
    log('    ⚠️  Não encontrou <head> ou <body>', 'red');
    return { content: modified, added: [] };
  }
  
  // Monta o bloco de CSS com comentário
  const cssBlock = [
    '',
    '  <!-- Sistema de Design - VISA Anápolis -->',
    ...missingLines,
    ''
  ].join('\n');
  
  // Insere antes do </head>
  modified = modified.slice(0, insertPos) + cssBlock + modified.slice(insertPos);
  added = missingLines;
  
  return { content: modified, added };
}

/**
 * Adiciona JS antes do </body>
 */
function addJSLine(content, jsLine) {
  // Verifica se já existe
  if (lineExists(content, jsLine)) {
    log(`    ⏭️  Já existe: ${jsLine.trim()}`, 'yellow');
    return { content, added: false };
  }
  
  // Encontra posição para inserir
  const insertPos = findJSInsertPosition(content);
  if (insertPos === -1) {
    log('    ⚠️  Não encontrou </body>', 'red');
    return { content, added: false };
  }
  
  // Monta o bloco de JS com comentário
  const jsBlock = [
    '',
    '  <!-- Platform Detector -->',
    jsLine,
    ''
  ].join('\n');
  
  // Insere antes do </body>
  const modified = content.slice(0, insertPos) + jsBlock + content.slice(insertPos);
  
  return { content: modified, added: true };
}

/**
 * Cria backup de um arquivo
 */
function createBackup(filePath, backupDir) {
  const fileName = path.basename(filePath);
  const backupPath = path.join(backupDir, fileName);
  
  // Cria diretório de backup se não existir
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  // Copia arquivo
  fs.copyFileSync(filePath, backupPath);
  
  return backupPath;
}

/**
 * Processa um arquivo HTML
 */
function processFile(filePath, config) {
  const fileName = path.basename(filePath);
  
  log(`\n📄 Processando: ${fileName}`, 'cyan');
  
  // Verifica se arquivo existe
  if (!fs.existsSync(filePath)) {
    log(`  ❌ Arquivo não encontrado: ${filePath}`, 'red');
    return {
      file: fileName,
      success: false,
      error: 'Arquivo não encontrado',
      cssAdded: 0,
      jsAdded: false,
      backup: null
    };
  }
  
  // Lê arquivo
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  // Backup
  let backupPath = null;
  if (config.createBackup && !config.dryRun) {
    backupPath = createBackup(filePath, config.backupDir);
    log(`  💾 Backup criado: ${backupPath}`, 'blue');
  }
  
  // Adiciona CSS
  const cssResult = addCSSLines(content, config.cssLines);
  content = cssResult.content;
  const cssAdded = cssResult.added.length;
  
  if (cssAdded > 0) {
    log(`  ✅ Adicionados ${cssAdded} CSS`, 'green');
  } else {
    log(`  ℹ️  Nenhum CSS adicionado (todos já existem)`, 'blue');
  }
  
  // Adiciona JS
  const jsResult = addJSLine(content, config.jsLine);
  content = jsResult.content;
  const jsAdded = jsResult.added;
  
  if (jsAdded) {
    log(`  ✅ JavaScript adicionado`, 'green');
  } else {
    log(`  ℹ️  JavaScript já existe`, 'blue');
  }
  
  // Salva arquivo (se não for dry-run)
  if (!config.dryRun && content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    log(`  💾 Arquivo atualizado`, 'green');
  } else if (config.dryRun && content !== originalContent) {
    log(`  🔍 [DRY-RUN] Arquivo seria atualizado`, 'yellow');
  }
  
  return {
    file: fileName,
    success: true,
    cssAdded,
    jsAdded,
    backup: backupPath,
    modified: content !== originalContent
  };
}

// ========================================
// FUNÇÃO PRINCIPAL
// ========================================

function main() {
  log('\n╔════════════════════════════════════════════════════╗', 'bright');
  log('║   MIGRAÇÃO AUTOMÁTICA - VISA ANÁPOLIS             ║', 'bright');
  log('║   Sistema de Design CSS/JS                         ║', 'bright');
  log('╚════════════════════════════════════════════════════╝\n', 'bright');
  
  if (CONFIG.dryRun) {
    log('🔍 MODO DRY-RUN ATIVADO (não altera arquivos)\n', 'yellow');
  }
  
  const results = [];
  
  // Processa cada arquivo
  for (const fileName of CONFIG.htmlFiles) {
    const filePath = path.join(process.cwd(), fileName);
    const result = processFile(filePath, CONFIG);
    results.push(result);
  }
  
  // ========================================
  // RELATÓRIO FINAL
  // ========================================
  
  log('\n╔════════════════════════════════════════════════════╗', 'bright');
  log('║   RELATÓRIO FINAL                                  ║', 'bright');
  log('╚════════════════════════════════════════════════════╝\n', 'bright');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  const modified = results.filter(r => r.modified);
  const totalCSS = results.reduce((sum, r) => sum + (r.cssAdded || 0), 0);
  const totalJS = results.filter(r => r.jsAdded).length;
  
  log(`📊 Estatísticas:`, 'cyan');
  log(`   • Total de arquivos: ${results.length}`);
  log(`   • ✅ Processados com sucesso: ${successful.length}`, 'green');
  log(`   • ❌ Falhas: ${failed.length}`, failed.length > 0 ? 'red' : 'reset');
  log(`   • 📝 Arquivos modificados: ${modified.length}`, 'yellow');
  log(`   • 🎨 Total CSS adicionados: ${totalCSS}`);
  log(`   • ⚡ Total JS adicionados: ${totalJS}`);
  
  if (CONFIG.createBackup && !CONFIG.dryRun) {
    log(`\n💾 Backups salvos em: ${CONFIG.backupDir}/`, 'blue');
  }
  
  if (failed.length > 0) {
    log('\n❌ Arquivos com erro:', 'red');
    failed.forEach(r => {
      log(`   • ${r.file}: ${r.error}`, 'red');
    });
  }
  
  if (modified.length > 0) {
    log('\n✅ Arquivos modificados:', 'green');
    modified.forEach(r => {
      const changes = [];
      if (r.cssAdded > 0) changes.push(`${r.cssAdded} CSS`);
      if (r.jsAdded) changes.push('1 JS');
      log(`   • ${r.file} → ${changes.join(', ')}`, 'green');
    });
  }
  
  if (CONFIG.dryRun) {
    log('\n⚠️  MODO DRY-RUN - Nenhum arquivo foi alterado', 'yellow');
    log('   Execute sem --dry-run para aplicar as mudanças', 'yellow');
  } else {
    log('\n🎉 Migração concluída com sucesso!', 'green');
  }
  
  log('');
}

// ========================================
// EXECUÇÃO
// ========================================

// Verifica argumentos de linha de comando
if (process.argv.includes('--dry-run')) {
  CONFIG.dryRun = true;
}

if (process.argv.includes('--no-backup')) {
  CONFIG.createBackup = false;
}

if (process.argv.includes('--help')) {
  console.log(`
USO: node migrate-css.js [opções]

OPÇÕES:
  --dry-run      Simula as mudanças sem alterar arquivos
  --no-backup    Não cria backup dos arquivos
  --help         Mostra esta ajuda

EXEMPLOS:
  node migrate-css.js                    # Migra todos os arquivos
  node migrate-css.js --dry-run          # Testa sem alterar
  node migrate-css.js --no-backup        # Migra sem backup
  `);
  process.exit(0);
}

// Executa
try {
  main();
} catch (error) {
  log(`\n❌ ERRO FATAL: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
}
