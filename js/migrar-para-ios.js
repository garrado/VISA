#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

/**
 * Migra arquivo HTML para o padrão iOS VISA Anápolis
 */
function migrateToIOSPattern(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 1. CORRIGIR ENCODING UTF-8
  const encodingFixes = {
    'â€"': '—',
    'â€"': '–',
    'Ã¡': 'á',
    'Ã ': 'à',
    'Ã£': 'ã',
    'Ã¢': 'â',
    'Ã©': 'é',
    'Ã¨': 'è',
    'Ãª': 'ê',
    'Ã­': 'í',
    'Ã¬': 'ì',
    'Ã®': 'î',
    'Ã³': 'ó',
    'Ã²': 'ò',
    'Ãµ': 'õ',
    'Ã´': 'ô',
    'Ãº': 'ú',
    'Ã¹': 'ù',
    'Ã»': 'û',
    'Ã§': 'ç',
    'Ã‡': 'Ç',
    'ÃƒO': 'ÃO',
    'ðŸ"„': '📄',
    'â¬…': '⬅',
  };
  
  for (const [wrong, right] of Object.entries(encodingFixes)) {
    content = content.split(wrong).join(right);
  }
  
  // 2. ADICIONAR IMPORTS DO SISTEMA DE DESIGN se não existir
  if (!content.includes('/VISA/css/base.css')) {
    const designSystemImports = `
  <!-- Sistema de Design - VISA Anápolis -->
  <link rel="stylesheet" href="/VISA/css/design-tokens.css">
  <link rel="stylesheet" href="/VISA/css/base.css">
  <link rel="stylesheet" href="/VISA/css/components.css">
  <link rel="stylesheet" href="/VISA/css/layouts.css">`;
    
    content = content.replace('</head>', `${designSystemImports}\n</head>`);
  }
  
  // 3. ADICIONAR PLATFORM DETECTOR se não existir
  if (!content.includes('/VISA/js/platform-detector.js')) {
    const platformDetector = `
  <!-- Platform Detector -->
  <script src="/VISA/js/platform-detector.js"></script>`;
    
    content = content.replace('</body>', `${platformDetector}\n</body>`);
  }
  
  // 4. AJUSTAR META VIEWPORT para iOS
  if (content.includes('<meta name="viewport"')) {
    content = content.replace(
      /<meta name="viewport"[^>]*>/,
      '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">'
    );
  }
  
  // 5. CONVERTER BOTÃO VOLTAR para padrão topbar se for um link simples
  // Procura por padrões antigos de botão voltar
  const oldBackButtonPatterns = [
    /<a[^>]*href="\/VISA\/index\.html"[^>]*class="back-button"[^>]*>.*?<\/a>/gs,
    /<a[^>]*class="back-button"[^>]*href="\/VISA\/index\.html"[^>]*>.*?<\/a>/gs,
  ];
  
  // Se não tiver topbar e tiver botão voltar antigo, sugerir migração manual
  if (!content.includes('class="topbar"')) {
    for (const pattern of oldBackButtonPatterns) {
      if (pattern.test(content)) {
        console.log('⚠️  ATENÇÃO: Botão "Voltar" antigo detectado.');
        console.log('    Considere migrar manualmente para o componente topbar.');
        break;
      }
    }
  }
  
  return content;
}

/**
 * Processa arquivo
 */
function processFile(inputPath, outputPath) {
  try {
    console.log(`📄 Processando: ${inputPath}`);
    
    const migrated = migrateToIOSPattern(inputPath);
    
    fs.writeFileSync(outputPath, migrated, 'utf8');
    
    console.log(`✅ Arquivo migrado: ${outputPath}`);
    
  } catch (error) {
    console.error(`❌ Erro ao processar ${inputPath}:`, error.message);
  }
}

// Main
const args = process.argv.slice(2);

if (args.length < 1) {
  console.log('Uso: node migrar-para-ios.js <arquivo-entrada> [arquivo-saida]');
  console.log('');
  console.log('Exemplos:');
  console.log('  node migrar-para-ios.js folga.html');
  console.log('  node migrar-para-ios.js folga.html folga-migrado.html');
  process.exit(1);
}

const inputFile = args[0];
const outputFile = args[1] || inputFile.replace('.html', '-migrado.html');

if (!fs.existsSync(inputFile)) {
  console.error(`❌ Arquivo não encontrado: ${inputFile}`);
  process.exit(1);
}

console.log('='.repeat(60));
console.log('Migração para Padrão iOS - VISA Anápolis');
console.log('='.repeat(60));
console.log('');

processFile(inputFile, outputFile);

console.log('');
console.log('='.repeat(60));
console.log('✅ Migração concluída!');
console.log('='.repeat(60));
