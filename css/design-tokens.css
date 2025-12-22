/**
 * PLATFORM DETECTOR - VISA ANÁPOLIS
 * Detecta plataforma e aplica otimizações específicas
 * Versão: 2.0
 */

class PlatformDetector {
  constructor() {
    this.platform = null;
    this.features = {};
    this.metrics = {};
    
    this.init();
  }
  
  /**
   * Inicializa o detector
   */
  init() {
    this.detectPlatform();
    this.detectFeatures();
    this.detectMetrics();
    this.applyPlatformClass();
    this.setupListeners();
    
    console.log('🔍 Platform Detector iniciado:', {
      platform: this.platform,
      features: this.features,
      metrics: this.metrics
    });
  }
  
  /**
   * Detecta a plataforma atual
   */
  detectPlatform() {
    const ua = navigator.userAgent;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                         window.navigator.standalone ||
                         document.referrer.includes('android-app://');
    
    // iOS
    if (/iPhone|iPad|iPod/.test(ua)) {
      this.platform = 'ios';
      this.platformVersion = this.getIOSVersion();
      return;
    }
    
    // Android
    if (/Android/.test(ua)) {
      this.platform = 'android';
      this.platformVersion = this.getAndroidVersion();
      return;
    }
    
    // Desktop (hover capability)
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      this.platform = 'desktop';
      return;
    }
    
    // Fallback: web mobile
    this.platform = 'mobile-web';
  }
  
  /**
   * Detecta recursos disponíveis
   */
  detectFeatures() {
    this.features = {
      // Suporte a blur
      backdropFilter: this.supportsBackdropFilter(),
      
      // Suporte a gestos
      touchEvents: 'ontouchstart' in window,
      pointerEvents: 'PointerEvent' in window,
      
      // Suporte a vibração
      vibration: 'vibrate' in navigator,
      
      // Suporte a notificações
      notifications: 'Notification' in window,
      pushNotifications: 'PushManager' in window,
      
      // Suporte a service worker
      serviceWorker: 'serviceWorker' in navigator,
      
      // Suporte a clipboard
      clipboard: 'clipboard' in navigator,
      
      // Suporte a share API
      share: 'share' in navigator,
      
      // Suporte a dark mode
      darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
      
      // Suporte a reduced motion
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      
      // PWA instalado
      installed: window.matchMedia('(display-mode: standalone)').matches,
      
      // Suporte a safe areas
      safeAreas: this.supportsSafeAreas(),
      
      // Capacidades de conexão
      connection: 'connection' in navigator ? {
        effectiveType: navigator.connection?.effectiveType,
        downlink: navigator.connection?.downlink,
        saveData: navigator.connection?.saveData
      } : null
    };
  }
  
  /**
   * Detecta métricas do dispositivo
   */
  detectMetrics() {
    this.metrics = {
      // Dimensões da tela
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio || 1,
      
      // Orientação
      orientation: this.getOrientation(),
      
      // Tipo de dispositivo
      deviceType: this.getDeviceType(),
      
      // Safe areas (iOS notch, Android gestures)
      safeAreaTop: this.getSafeArea('top'),
      safeAreaBottom: this.getSafeArea('bottom'),
      safeAreaLeft: this.getSafeArea('left'),
      safeAreaRight: this.getSafeArea('right'),
      
      // Performance
      memory: performance.memory?.jsHeapSizeLimit || null,
      cores: navigator.hardwareConcurrency || null
    };
  }
  
  /**
   * Aplica classe da plataforma no HTML
   */
  applyPlatformClass() {
    const html = document.documentElement;
    
    // Remove classes anteriores
    html.classList.remove('platform-ios', 'platform-android', 'platform-desktop', 'platform-mobile-web');
    
    // Adiciona classe da plataforma
    html.classList.add(`platform-${this.platform}`);
    
    // Adiciona classes de recursos
    if (this.features.backdropFilter) {
      html.classList.add('has-backdrop-filter');
    }
    
    if (this.features.touchEvents) {
      html.classList.add('has-touch');
    }
    
    if (this.features.vibration) {
      html.classList.add('has-vibration');
    }
    
    if (this.features.darkMode) {
      html.classList.add('dark-mode');
    }
    
    if (this.features.reducedMotion) {
      html.classList.add('reduce-motion');
    }
    
    if (this.features.installed) {
      html.classList.add('pwa-installed');
    }
    
    // Adiciona atributos data para CSS
    html.dataset.platform = this.platform;
    html.dataset.deviceType = this.metrics.deviceType;
    html.dataset.orientation = this.metrics.orientation;
  }
  
  /**
   * Configura listeners para mudanças
   */
  setupListeners() {
    // Dark mode
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      this.features.darkMode = e.matches;
      document.documentElement.classList.toggle('dark-mode', e.matches);
      this.dispatchEvent('darkModeChange', { darkMode: e.matches });
    });
    
    // Orientação
    window.addEventListener('orientationchange', () => {
      this.metrics.orientation = this.getOrientation();
      document.documentElement.dataset.orientation = this.metrics.orientation;
      this.dispatchEvent('orientationChange', { orientation: this.metrics.orientation });
    });
    
    // Resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.metrics.screenWidth = window.innerWidth;
        this.metrics.screenHeight = window.innerHeight;
        this.dispatchEvent('metricsChange', { metrics: this.metrics });
      }, 150);
    });
    
    // Reduced motion
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      this.features.reducedMotion = e.matches;
      document.documentElement.classList.toggle('reduce-motion', e.matches);
      this.dispatchEvent('reducedMotionChange', { reducedMotion: e.matches });
    });
    
    // Connection change
    if (this.features.connection) {
      navigator.connection.addEventListener('change', () => {
        this.features.connection = {
          effectiveType: navigator.connection.effectiveType,
          downlink: navigator.connection.downlink,
          saveData: navigator.connection.saveData
        };
        this.dispatchEvent('connectionChange', { connection: this.features.connection });
      });
    }
  }
  
  /**
   * Helpers de detecção
   */
  
  supportsBackdropFilter() {
    return CSS.supports('backdrop-filter', 'blur(1px)') ||
           CSS.supports('-webkit-backdrop-filter', 'blur(1px)');
  }
  
  supportsSafeAreas() {
    return CSS.supports('padding-top: env(safe-area-inset-top)');
  }
  
  getIOSVersion() {
    const match = navigator.userAgent.match(/OS (\d+)_(\d+)_?(\d+)?/);
    if (match) {
      return parseFloat(`${match[1]}.${match[2]}`);
    }
    return null;
  }
  
  getAndroidVersion() {
    const match = navigator.userAgent.match(/Android (\d+(\.\d+)?)/);
    if (match) {
      return parseFloat(match[1]);
    }
    return null;
  }
  
  getOrientation() {
    if (window.innerWidth > window.innerHeight) {
      return 'landscape';
    }
    return 'portrait';
  }
  
  getDeviceType() {
    const width = window.innerWidth;
    
    if (width < 640) return 'phone';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }
  
  getSafeArea(side) {
    const temp = document.createElement('div');
    temp.style.cssText = `
      position: fixed;
      ${side}: 0;
      ${side === 'top' || side === 'bottom' ? 'height' : 'width'}: env(safe-area-inset-${side}, 0px);
    `;
    document.body.appendChild(temp);
    const value = parseInt(getComputedStyle(temp)[side === 'top' || side === 'bottom' ? 'height' : 'width']);
    document.body.removeChild(temp);
    return value || 0;
  }
  
  /**
   * APIs públicas
   */
  
  isIOS() {
    return this.platform === 'ios';
  }
  
  isAndroid() {
    return this.platform === 'android';
  }
  
  isDesktop() {
    return this.platform === 'desktop';
  }
  
  isMobile() {
    return this.platform === 'ios' || this.platform === 'android' || this.platform === 'mobile-web';
  }
  
  isPWA() {
    return this.features.installed;
  }
  
  hasFeature(feature) {
    return this.features[feature] === true;
  }
  
  getMetric(metric) {
    return this.metrics[metric];
  }
  
  /**
   * Haptic feedback (iOS/Android)
   */
  vibrate(pattern = 10) {
    if (this.features.vibration) {
      navigator.vibrate(pattern);
    }
  }
  
  /**
   * Feedback tátil específico por plataforma
   */
  hapticFeedback(type = 'light') {
    const patterns = {
      light: 10,
      medium: 20,
      heavy: 30,
      success: [10, 50, 10],
      warning: [10, 100, 10],
      error: [30, 100, 30, 100, 30]
    };
    
    this.vibrate(patterns[type] || patterns.light);
  }
  
  /**
   * Sistema de eventos customizados
   */
  dispatchEvent(eventName, detail = {}) {
    const event = new CustomEvent(`platform:${eventName}`, {
      detail: {
        platform: this.platform,
        ...detail
      }
    });
    window.dispatchEvent(event);
  }
  
  /**
   * Otimizações por plataforma
   */
  applyOptimizations() {
    // iOS: previne zoom em double-tap
    if (this.isIOS()) {
      document.addEventListener('touchstart', (e) => {
        if (e.touches.length > 1) {
          e.preventDefault();
        }
      }, { passive: false });
      
      let lastTouchEnd = 0;
      document.addEventListener('touchend', (e) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
          e.preventDefault();
        }
        lastTouchEnd = now;
      }, false);
    }
    
    // Android: otimiza scroll
    if (this.isAndroid()) {
      document.body.style.overscrollBehavior = 'none';
    }
    
    // Todos: otimiza passive listeners
    const passiveSupported = this.testPassiveListener();
    if (passiveSupported) {
      ['touchstart', 'touchmove', 'wheel', 'mousewheel'].forEach(event => {
        document.addEventListener(event, () => {}, { passive: true });
      });
    }
  }
  
  testPassiveListener() {
    let passiveSupported = false;
    try {
      const options = {
        get passive() {
          passiveSupported = true;
          return false;
        }
      };
      window.addEventListener('test', null, options);
      window.removeEventListener('test', null, options);
    } catch (err) {
      passiveSupported = false;
    }
    return passiveSupported;
  }
  
  /**
   * Debug info
   */
  getDebugInfo() {
    return {
      platform: this.platform,
      platformVersion: this.platformVersion,
      features: this.features,
      metrics: this.metrics,
      userAgent: navigator.userAgent,
      vendor: navigator.vendor,
      language: navigator.language
    };
  }
}

// Inicialização automática
const platform = new PlatformDetector();

// Aplica otimizações
platform.applyOptimizations();

// Expõe globalmente
window.platform = platform;

// Export para módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PlatformDetector;
}
