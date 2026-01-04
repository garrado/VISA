// ============================================
// CONFIGURAÇÃO GLOBAL - VISA Anápolis
// ============================================

const CSV_CONFIG = {
  delimiter: ";",
  header: true,
  skipEmptyLines: true,
  encoding: 'UTF-8',
  transformHeader: function(header) {
    return header.replace(/^\uFEFF/, ''); // Remove BOM do UTF-8
  }
};

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

// Converter data brasileira (DD.MM.YYYY) para objeto Date
function parseDateBR(dateStr) {
  if (!dateStr) return null;
  const partes = dateStr.split('.');
  if (partes.length !== 3) return null;
  const [dia, mes, ano] = partes;
  return new Date(ano, mes - 1, dia);
}

// Formatar Date para string brasileira (DD.MM.YYYY)
function formatDateBR(date) {
  if (!date || !(date instanceof Date)) return '';
  const dia = String(date.getDate()).padStart(2, '0');
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const ano = date.getFullYear();
  return `${dia}.${mes}.${ano}`;
}

// Normalizar código CNAE para comparação
function normalizaCNAE(cnae) {
  return (cnae || '').trim();
}

// ============================================
// CARREGAR TODOS OS CSVs
// ============================================
async function carregarCSVs() {
  try {
    console.log('Carregando CSVs...');
    
    const [inspRes, regRes, cnaeRes, loginRes] = await Promise.all([
      fetch('data/inspecoes.csv'),
      fetch('data/regulados.csv'),
      fetch('data/cnae.csv'),
      fetch('data/login.csv')
    ]);
    
    if (!inspRes.ok || !regRes.ok || !cnaeRes.ok || !loginRes.ok) {
      throw new Error('Erro ao buscar arquivos CSV');
    }
    
    const [inspText, regText, cnaeText, loginText] = await Promise.all([
      inspRes.text(),
      regRes.text(),
      cnaeRes.text(),
      loginRes.text()
    ]);
    
    const inspecoes = Papa.parse(inspText, CSV_CONFIG).data;
    const regulados = Papa.parse(regText, CSV_CONFIG).data;
    const cnaes = Papa.parse(cnaeText, CSV_CONFIG).data;
    const usuarios = Papa.parse(loginText, CSV_CONFIG).data;
    
    console.log('CSVs carregados:');
    console.log('- Inspeções:', inspecoes.length);
    console.log('- Regulados:', regulados.length);
    console.log('- CNAEs:', cnaes.length);
    console.log('- Usuários:', usuarios.length);
    
    return { inspecoes, regulados, cnaes, usuarios };
    
  } catch (error) {
    console.error('Erro ao carregar CSVs:', error);
    alert('Erro ao carregar dados. Verifique o console.');
    throw error;
  }
}

// ============================================
// JOIN: INSPEÇÕES + REGULADOS + CNAE
// ============================================
function criarTabelaCompleta(inspecoes, regulados, cnaes) {
  return inspecoes.map(insp => {
    // Buscar regulado pelo código
    const regulado = regulados.find(r => r.CODIGO === insp.CODIGO);
    
    // Buscar CNAE pela atividade
    const cnae = cnaes.find(c => 
      normalizaCNAE(c.Subclasse) === normalizaCNAE(insp.Atividade)
    );
    
    return {
      // Dados da inspeção
      CONTROLE: insp.CONTROLE,
      NDOC: insp.NDOC,
      DATA: insp.DT_VISITA,
      TIPO: insp.TIPO,
      ACAO: insp.ACAO,
      
      // Dados do regulado
      CODIGO: insp.CODIGO,
      FANTASIA: regulado?.FANTASIA || 'Não encontrado',
      LOGRADOURO: regulado?.LOGRADOURO || '',
      BAIRRO: regulado?.BAIRRO || '',
      CEP: regulado?.CEP || '',
      FONE: regulado?.FONE || '',
      
      // Dados do CNAE
      CNAE: insp.Atividade,
      CNAE_DESC: cnae?.Atividade || 'Não classificado',
      COMPLEXIDADE: cnae?.Complexidade || '',
      
      // Fiscal
      FISCAL1: insp.Fiscal1,
      FISCAL2: insp.Fiscal2,
      FISCAL3: insp.Fiscal3
    };
  });
}
