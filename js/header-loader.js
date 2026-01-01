/**
 * HEADER LOADER - VISA ANÁPOLIS
 * Carrega header automaticamente com título da página
 * Versão: 1.0 - Manual Navigation
 */

class HeaderLoader {
  constructor() {
    this.container = null;
    this.backUrl = null;
    this.pageTitle = null;
    
    this.init();
  }
  
  init() {
    // Aguarda DOM carregar
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.load());
    } else {
      this.load();
    }
  }
  
  load() {
    // Encontra container do header
    this.container = document.getElementById('app-header');
    
    if (!this.container) {
      console.warn('⚠️ Header Loader: Container #app-header não encontrado');
      return;
    }
    
    // Pega configurações
    this.backUrl = this.container.dataset.backUrl || null;
    this.pageTitle = this.getPageTitle();
    
    // Detecta tipo de página
    const isHomePage = this.isHomePage();
    
    // Cria header
    const header = this.createHeader(isHomePage);
    
    // Insere no container
    this.container.innerHTML = '';
    this.container.appendChild(header);
    
    console.log('✅ Header carregado:', {
      pageTitle: this.pageTitle,
      backUrl: this.backUrl,
      isHomePage: isHomePage
    });
  }
  
  /**
   * Detecta se é página principal
   */
  isHomePage() {
    const path = window.location.pathname;
    return path.endsWith('index.html') || 
           path.endsWith('/') || 
           path === '/' ||
           !this.backUrl;  // Se não tem backUrl, é home
  }
  
  /**
   * Pega título da página
   */
  getPageTitle() {
    // 1. Tenta pegar do data-page-title
    if (this.container && this.container.dataset.pageTitle) {
      return this.container.dataset.pageTitle;
    }
    
    // 2. Tenta pegar do <title>
    const titleTag = document.querySelector('title');
    if (titleTag) {
      // Remove sufixos comuns
      let title = titleTag.textContent;
      title = title.replace(/\s*[-–—]\s*VISA.*$/i, '');
      title = title.replace(/\s*[-–—]\s*Vigilância.*$/i, '');
      title = title.replace(/\s*[-–—]\s*Anápolis.*$/i, '');
      return title.trim();
    }
    
    // 3. Fallback
    return 'Página';
  }
  
  /**
   * Cria header HTML
   */
  createHeader(isHomePage) {
    const header = document.createElement('header');
    header.className = 'app-header';
    
    if (isHomePage) {
      // PÁGINA PRINCIPAL - Header completo
      header.innerHTML = `
        <h1 class="app-header__title">Vigilância Sanitária</h1>
        <h2 class="app-header__subtitle">Diretoria de Vigilância em Saúde — Anápolis</h2>
      `;
    } else {
      // PÁGINA SECUNDÁRIA - Header com título da página
      const backButton = this.backUrl ? `
        <a href="${this.backUrl}" class="btn-back-ios">Voltar</a>
      ` : '';
      
      const doneButton = `
        <button class="btn-done-ios" onclick="window.history.back()">OK</button>
      `;
      
      header.innerHTML = `
        ${backButton}
        ${doneButton}
        <h1 class="app-header__title">Vigilância Sanitária</h1>
        <h2 class="app-header__subtitle">${this.getPageIcon()} ${this.pageTitle}</h2>
      `;
    }
    
    return header;
  }
  
  /**
   * Retorna ícone baseado no título da página
   */
  getPageIcon() {
    const title = this.pageTitle.toLowerCase();
    
    if (title.includes('legisla')) return '📜';
    if (title.includes('check')) return '✓';
    if (title.includes('drogaria')) return '💊';
    if (title.includes('escola')) return '🏫';
    if (title.includes('açougue')) return '🥩';
    if (title.includes('alimento')) return '🍽️';
    if (title.includes('saúde')) return '🏥';
    if (title.includes('cosm')) return '💄';
    if (title.includes('academia')) return '💪';
    if (title.includes('férias')) return '🏖️';
    if (title.includes('veículo')) return '🚗';
    if (title.includes('plantão')) return '📅';
    if (title.includes('ocorrência')) return '📈';
    if (title.includes('cnae')) return '👥';
    if (title.includes('regulado')) return '🌐';
    if (title.includes('webcvs')) return '🌐';
    
    return '📄';
  }
}

// Inicializa automaticamente
new HeaderLoader();
