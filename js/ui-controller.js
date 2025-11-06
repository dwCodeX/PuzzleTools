// UI 控制器 - 处理主题切换和菜单交互
class UIController {
  constructor(gallery) {
    this.gallery = gallery;
    this.setupMenuHandlers();
    this.setupFooter();
  }

  setupMenuHandlers() {
    const actionMenuBtn = document.getElementById('actionMenuBtn');
    const actionDropdown = document.getElementById('actionDropdown');
    const themeSwitchBtn = document.getElementById('themeSwitchBtn');
    const darkModeBtn = document.getElementById('darkModeBtn');
    const regenerateBtn = document.getElementById('regenerateBtn');
    const clearBtn = document.getElementById('clearBtn');

    if (actionMenuBtn && actionDropdown) {
      actionMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        actionDropdown.classList.toggle('hidden');
      });

      actionDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
      });

      document.addEventListener('click', () => {
        if (!actionDropdown.classList.contains('hidden')) {
          actionDropdown.classList.add('hidden');
        }
      });
    }

    if (themeSwitchBtn) {
      themeSwitchBtn.addEventListener('click', () => {
        this.gallery.switchTheme();
        if (actionDropdown) actionDropdown.classList.add('hidden');
      });
    }

    if (darkModeBtn) {
      darkModeBtn.addEventListener('click', () => {
        this.gallery.toggleDarkMode();
        this.updateDarkModeIcon();
        if (actionDropdown) actionDropdown.classList.add('hidden');
      });
    }

    if (regenerateBtn) {
      regenerateBtn.addEventListener('click', () => {
        this.gallery.calculateAndRenderRectangle();
        if (actionDropdown) actionDropdown.classList.add('hidden');
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (confirm('确定要清空所有图片吗？')) {
          this.gallery.state.imageItems = [];
          this.gallery.dom.rectContainer.innerHTML = '';
          this.gallery.dom.rectContainer.appendChild(this.gallery.dom.domWatermark);
          this.gallery.dom.routeNumberInput.value = '';
          this.gallery.updateUIState();
          this.gallery.updateWatermarkVisibility();
        }
        if (actionDropdown) actionDropdown.classList.add('hidden');
      });
    }
  }

  updateDarkModeIcon() {
    const darkModeBtn = document.getElementById('darkModeBtn');
    if (darkModeBtn) {
      darkModeBtn.innerHTML = this.gallery.isDarkMode 
        ? '<i class="fa fa-sun mr-2"></i>'
        : '<i class="fa fa-moon mr-2"></i>';
    }
  }

  setupFooter() {
    const CURRENT_YEAR = 2024;
    const currentYear = new Date().getFullYear();
    const yearString = currentYear > CURRENT_YEAR ? `${CURRENT_YEAR}-${currentYear : CURRENT_YEAR;
    const copyrightFooter = document.getElementById('copyrightFooter');
    if (copyrightFooter) {
      copyrightFooter.textContent = `© ${yearString} Pin Tu Gong Ju`;
    }

    this.setupQuoteRotator();
  }

  setupQuoteRotator() {
    const quoteElement = document.getElementById('currentQuote');
    if (!quoteElement) return;

    const regularQuotes = [
      '💡 拖拽图片快速上传',
      '🎨 自动智能布局',
      '📥 一键下载合成图',
      '🌈 多款主题可选',
      '🌙 支持暗黑模式',
      '✨ 轻松添加水印'
    ];

    const finalQuotes = [...regularQuotes];
    if (finalQuotes.length === 0) {
      finalQuotes.push('欢迎使用拼图工具！');
    }

    let currentIndex = 0;
    quoteElement.textContent = finalQuotes[currentIndex];

    setInterval(() => {
      currentIndex = (currentIndex + 1) % finalQuotes.length;
      quoteElement.classList.add('opacity-0');

      setTimeout(() => {
        quoteElement.textContent = finalQuotes[currentIndex];
        quoteElement.classList.remove('opacity-0');
      }, 500);
    }, 5000);
  }
}


