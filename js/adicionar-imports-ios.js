#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

/**
 * Sistema de Design - Importações necessárias
 */
const DESIGN_SYSTEM_CSS = `
  <!-- Sistema de Design - VISA Anápolis -->
  <link rel="stylesheet" href="/VISA/css/base.css">
  <link rel="stylesheet" href="/VISA/css/components.css">
  <link rel="stylesheet" href="/VISA/css/layouts.css">`;

const PLATFORM_DETECTOR_JS = `

  <!-- Platform Detector -->
  <script src="/VISA/js/platform-detector.js"></script>`;

/**
 * Verifica se o arquivo já tem as importações do sistema de design
 */
function hasDesignSystem(content) {
  return content.includes('/VISA/css/base.css') &&
         content.includes('/VISA/css/components.css') &&
         content.includes('/VISA/css/layouts.css');
}

/**
 * Verifica se o arquivo já tem o platform-detector
 */
function hasPlatformDetector(content) {
  return content.includes('/VISA/js/platform-detector.js');
}

/**
 * Adiciona as importações do sistema de design antes do </head>
 */
function addDesignSystem(content) {
  // Procura por </head> e adiciona antes dele
  return content.replace('</head>', `${DESIGN_SYSTEM_CSS}\n</head>`);
}

/**
 * Adiciona o platform-detector antes do </body>
 */
function addPlatformDetector(content) {
  // Procura por </body> e adiciona antes dele
  return content.replace('</body>', `${PLATFORM_DETECTOR_JS}\n</body>`);
}

/**
 * Processa um arquivo HTML
 */
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    const changes = [];
    
    // Verifica e adiciona Sistema de Design
    if (!hasDesignSystem(content)) {
      content = addDesignSystem(content);
      modified = true;
      changes.push('Sistema de Design CSS');
    }
    
    // Verifica e adiciona Platform Detector
    if (!hasPlatformDetector(content)) {
      content = addPlatformDetector(content);
      modified = true;
      changes.push('Platform Detector JS');
    }
    
    // Salva se houve modificações
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✓ ATUALIZADO: ${filePath}`);
      console.log(`  Adicionado: ${changes.join(', ')}`);
      return { status: 'updated', file: filePath, changes };
    } else {
      console.log(`✓ OK (já tem tudo): ${filePath}`);
      return { status: 'ok', file: filePath };
    }
    
  } catch (error) {
    console.error(`✗ ERRO em ${filePath}: ${error.message}`);
    return { status: 'error', file: filePath, error: error.message };
  }
}

/**
 * Processa recursivamente todos os arquivos HTML em um diretório
 */
function processDirectory(dirPath, results = { ok: [], updated: [], error: [] }) {
  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Processa subdiretórios recursivamente
      processDirectory(fullPath, results);
    } else if (stat.isFile() && item.endsWith('.html')) {
      // Processa arquivo HTML
      const result = processFile(fullPath);
      results[result.status].push(result);
    }
  }
  
  return results;
}

/**
 * Função principal
 */
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Uso: node adicionar-imports-ios.js <arquivo.html ou diretório>');
    console.log('');
    console.log('Este script adiciona as importações do Sistema de Design iOS:');
    console.log('  • base.css, components.css, layouts.css');
    console.log('  • platform-detector.js');
    console.log('');
    console.log('Exemplos:');
    console.log('  node adicionar-imports-ios.js arquivo.html');
    console.log('  node adicionar-imports-ios.js ./minha-pasta');
    console.log('  node adicionar-imports-ios.js .');
    process.exit(1);
  }
  
  const target = args[0];
  const targetPath = path.resolve(target);
  
  if (!fs.existsSync(targetPath)) {
    console.error(`✗ Caminho não encontrado: ${targetPath}`);
    process.exit(1);
  }
  
  console.log('='.repeat(70));
  console.log('Adicionando importações do Sistema de Design iOS');
  console.log('='.repeat(70));
  console.log('');
  
  const stat = fs.statSync(targetPath);
  let results;
  
  if (stat.isFile()) {
    // Processa arquivo único
    const result = processFile(targetPath);
    results = { ok: [], updated: [], error: [] };
    results[result.status].push(result);
  } else {
    // Processa diretório recursivamente
    results = processDirectory(targetPath);
  }
  
  // Relatório final
  console.log('');
  console.log('='.repeat(70));
  console.log('RELATÓRIO FINAL');
  console.log('='.repeat(70));
  console.log(`✓ Arquivos OK (já tinham tudo): ${results.ok.length}`);
  console.log(`✓ Arquivos atualizados: ${results.updated.length}`);
  console.log(`✗ Arquivos com erro: ${results.error.length}`);
  console.log('='.repeat(70));
  
  if (results.updated.length > 0) {
    console.log('');
    console.log('Arquivos atualizados:');
    results.updated.forEach(r => {
      console.log(`  - ${r.file}`);
      console.log(`    Adicionado: ${r.changes.join(', ')}`);
    });
  }
  
  if (results.error.length > 0) {
    console.log('');
    console.log('Arquivos com erro:');
    results.error.forEach(r => console.log(`  - ${r.file}: ${r.error}`));
  }
}

// Executa
main();
