// * ===================================================
        // * 🎨 主题切换逻辑 (保持不变)
        // * ===================================================
        const THEMES = [
            { name: 'Blue (苹果)', primary: '10, 132, 255', dark: '0, 105, 250' },
            { name: 'Red (经典)', primary: '220, 38, 38', dark: '185, 28, 28' },
            { name: 'Green (自然)', primary: '22, 163, 74', dark: '21, 128, 61' },
            { name: 'Purple (创新)', primary: '124, 58, 237', dark: '109, 40, 217' }
        ];
        let currentThemeIndex = 0;
        const root = document.documentElement;

        function applyTheme(theme) {
            root.style.setProperty('--color-primary', theme.primary);
            root.style.setProperty('--color-primary-dark', theme.dark);
        }

        function switchTheme() {
            currentThemeIndex = (currentThemeIndex + 1) % THEMES.length;
            const nextTheme = THEMES[currentThemeIndex];
            applyTheme(nextTheme);
            localStorage.setItem('themeIndex', currentThemeIndex);
        }

        function loadTheme() {
            const savedIndex = localStorage.getItem('themeIndex');
            if (savedIndex !== null && !isNaN(parseInt(savedIndex)) && parseInt(savedIndex) >= 0 && parseInt(savedIndex) < THEMES.length) {
                currentThemeIndex = parseInt(savedIndex);
            }
            applyTheme(THEMES[currentThemeIndex]);
        }
        
        // 🚀 核心函数：获取当前的缩放比例 (1, 2, 或 3)
        function getScale() {
            const radio = document.querySelector('input[name="renderQuality"]:checked');
            // 默认值：2x
            return radio ? parseInt(radio.value) : 2; 
        }


        document.addEventListener('DOMContentLoaded', function() {
            loadTheme();
            
            function debounce(func, delay) {
                let timeout;
                return function(...args) {
                    const context = this;
                    clearTimeout(timeout);
                    timeout = setTimeout(() => func.apply(context, args), delay);
                };
            }

            class GalleryOptimizer {
                
                CONFIG = {
                    GAP: 1,
                    IDEAL_ROW_HEIGHT: 250, 
                    BINARY_SEARCH_ITERATIONS: 15, 
                    JPEG_QUALITY: 1.0, 
                };

                constructor() {
                    this.dom = this._getDomReferences();
                    this.state = this._getInitialState();
                    
                    this._initEventListeners();
                    this._setupDragAndDrop();
                    // 确保在初始化时更新按钮状态
                    this.updateRatioButtonState(this.state.aspectRatio, 'aspectRatio');
                    this.updateRatioButtonState(this.state.renderQuality.toString(), 'renderQuality');
                    this.updateUIState();
                }

                _getDomReferences() {
                    const ids = [
                        'rectContainer', 'fileInput', 'fileInputTop', 'fileInputTopLabel', 
                        'emptyState', 'loadingState', 'loadingText', 'loadingBar', 'downloadBtn',
                        'clearBtn', 'imageModal', 'modalImage', 'closeModal', 'prevImageBtn',
                        'nextImageBtn', 'currentImageIndex', 'totalImageCount', 'emptyStateUploadLabel',
                        'statsBar', 'rectDimensions', 'regenerateBtn', 'imageName',
                        'downloadSingleBtn', 'deleteSingleBtn', 'modalImgSize',
                        'modalImgRatio', 'routeNumberInput', 'downloadOverlay', 
                        'downloadProgressBar', 'downloadProgressText', 'imageCount',
                        'themeSwitchBtn', 'rightControls', 'imageContainerParent', 'currentQuote',
                        'domWatermark' 
                    ];
                    const dom = {};
                    ids.forEach(id => dom[id] = document.getElementById(id));
                    dom.aspectRatioRadios = document.querySelectorAll('input[name="aspectRatio"]');
                    dom.renderQualityRadios = document.querySelectorAll('input[name="renderQuality"]');
                    dom.ratioButtons = document.querySelectorAll('.ratio-quality-btn'); 
                    return dom;
                }

                _getInitialState() {
                    let defaultRatio = '4:3';
                    const checkedRatio = document.querySelector('input[name="aspectRatio"]:checked');
                    if(checkedRatio) defaultRatio = checkedRatio.value;
                    
                    // 默认值：2x
                    let defaultQuality = 2;
                    const checkedQuality = document.querySelector('input[name="renderQuality"]:checked');
                    if(checkedQuality) defaultQuality = parseInt(checkedQuality.value);

                    return {
                        imageItems: [],
                        currentPreviewIndex: 0,
                        isDownloading: false,
                        rectWidth: 0,
                        layoutPositions: [],
                        totalHeight: 0,
                        aspectRatio: defaultRatio,
                        renderQuality: defaultQuality,
                    };
                }

                _initEventListeners() {
                    this.dom.fileInput.addEventListener('change', (e) => this.handleFileUpload(e.target.files));
                    this.dom.fileInputTop.addEventListener('change', (e) => this.handleFileUpload(e.target.files));
                    
                    this.dom.downloadBtn.addEventListener('click', this.downloadRectangle.bind(this));
                    this.dom.clearBtn.addEventListener('click', this.clearAllImages.bind(this));
                    this.dom.regenerateBtn.addEventListener('click', this.regenerateLayout.bind(this));
                    this.dom.closeModal.addEventListener('click', this.closeModal.bind(this));
                    this.dom.prevImageBtn.addEventListener('click', () => this.switchPreviewImage(-1));
                    this.dom.nextImageBtn.addEventListener('click', () => this.switchPreviewImage(1));
                    this.dom.imageModal.addEventListener('click', (e) => { if (e.target === this.dom.imageModal) this.closeModal(); });
                    this.dom.downloadSingleBtn.addEventListener('click', () => this.downloadSingleImage());
                    this.dom.deleteSingleBtn.addEventListener('click', () => this.deleteCurrentImage());
                    this.dom.themeSwitchBtn.addEventListener('click', switchTheme); 

                    document.addEventListener('keydown', (e) => {
                        if (this.dom.imageModal.classList.contains('hidden')) return;
                        if (e.key === 'Escape') this.closeModal();
                        if (e.key === 'ArrowLeft') this.switchPreviewImage(-1);
                        if (e.key === 'ArrowRight') this.switchPreviewImage(1);
                    });
                    
                    this.dom.routeNumberInput.addEventListener('input', () => this.handleRouteInputChange());
                    
                    this.dom.aspectRatioRadios.forEach(radio => {
                        radio.addEventListener('change', (e) => {
                            this.state.aspectRatio = e.target.value;
                            this.updateRatioButtonState(e.target.value, 'aspectRatio'); 
                            this.calculateAndRenderRectangle();
                        });
                    });
                    
                    this.dom.renderQualityRadios.forEach(radio => {
                        radio.addEventListener('change', (e) => {
                            this.state.renderQuality = parseInt(e.target.value);
                            this.updateRatioButtonState(e.target.value, 'renderQuality'); 
                        });
                    });

                    window.addEventListener('resize', debounce(this.calculateAndRenderRectangle.bind(this), 150));
                    
                    if (this.state.imageItems.length === 0) {
                        this.dom.imageContainerParent.classList.remove('hidden');
                        this.dom.emptyState.classList.remove('hidden');
                    }
                }
                
                handleRouteInputChange() {
                    this.updateUIState();
                    this._updateWatermarkVisibility();
                }

_updateWatermarkVisibility() {
    const watermarkText = this.dom.routeNumberInput.value.trim();
    let rectWidth = this.state.rectWidth;
    const domWatermark = this.dom.domWatermark;

    // 若rectWidth无效，从DOM获取或用保底值
    if (!rectWidth || rectWidth < 100) {
        rectWidth = this.dom.rectContainer.getBoundingClientRect().width || 200;
    }
const maxWatermarkWidth = rectWidth * 0.9; // 4/5的预览区域宽度
    if (watermarkText !== '' && rectWidth > 0) {
        domWatermark.textContent = watermarkText;
        domWatermark.style.whiteSpace = 'pre-line';
        domWatermark.style.lineHeight = '1.2';
        domWatermark.style.wordBreak = 'break-word'; // 关键：避免字母/数字被强制拆分
        domWatermark.style.wordSpacing = '0'; // 消除额外字间距影响
domWatermark.style.maxWidth = `${maxWatermarkWidth}px`; // 强制水印不超过4/5宽度
        domWatermark.style.margin = '0 auto'; // 居中显示（可选，更美观）

        const textLength = watermarkText.length;
        let fontSize = 0;

        // 优化短文本逻辑：5个及以下字符强制单行显示
        const maxLines = textLength <= 5 ? 1 : 3;
        const minCharsPerLine = textLength <= 5 ? textLength : 5; // 短文本每行字符数等于总长度
        const SAFETY_FACTOR = textLength <= 5 ? 1.1 : 1.2; // 短文本减少安全系数，让字体更大
        const PADDING_FACTOR = 0.95; // 增加可用宽度占比

        /*
        // 按单行最大字符数计算（总长度/最大行数）
        const charsPerLine = Math.ceil(textLength / maxLines);
        fontSize = Math.floor((rectWidth * PADDING_FACTOR) / (charsPerLine * SAFETY_FACTOR));
        */
        
        // 计算每行字符数，确保不小于最小值
        const charsPerLine = Math.max(
            Math.ceil(textLength / maxLines), 
            minCharsPerLine
        );
        
        // 关键：基于4/5的宽度计算字体大小（而非完整宽度）
        fontSize = Math.floor((maxWatermarkWidth * PADDING_FACTOR) / (charsPerLine * SAFETY_FACTOR));      

        // 调整字体大小限制（基于4/5宽度）
        const MAXIMUM_FONT_LIMIT = Math.floor(maxWatermarkWidth / 5); // 最大字体不超过4/5宽度的1/5
        fontSize = Math.min(fontSize, MAXIMUM_FONT_LIMIT);
        fontSize = Math.max(fontSize, 14);

        domWatermark.style.fontSize = `${fontSize}px`;
        
        const strokeWidth = Math.max(fontSize / 25, 1.2);
        domWatermark.style.textStroke = `${strokeWidth}px rgba(255, 255, 255, 0.9)`;
        domWatermark.style.webkitTextStroke = `${strokeWidth}px rgba(255, 255, 255, 0.9)`;

        domWatermark.style.display = 'block';
    } else {
        domWatermark.style.display = 'none';
    }
}


                updateRatioButtonState(activeValue, groupName) {
                    this.dom.ratioButtons.forEach(btn => {
                        if (btn.getAttribute('data-group') === groupName) {
                            if (btn.getAttribute('data-value') === String(activeValue)) {
                                btn.classList.add('active');
                            } else {
                                btn.classList.remove('active');
                            }
                        }
                    });
                }

                _setupDragAndDrop() {
                    const dropArea = document.body; 
                    const preventDefaults = (e) => { e.preventDefault(); e.stopPropagation(); };
                    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => dropArea.addEventListener(eventName, preventDefaults, false));
                    dropArea.addEventListener('drop', (e) => { this.handleFileUpload(e.dataTransfer.files); }, false);
                }

                async _readFileAsDataURL(file) {
                    return new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = (e) => resolve(e.target.result);
                        reader.onerror = (e) => reject(new Error('Failed to read file as DataURL.'));
                        reader.readAsDataURL(file);
                    });
                }

                async _loadImageData(file) {
                    try {
                        const dataURL = await this._readFileAsDataURL(file); 
                        
                        const image = await new Promise((resolve, reject) => {
                            const img = new Image();
                            img.crossOrigin = 'anonymous'; 
                            img.onload = () => resolve(img);
                            img.onerror = () => reject(new Error('Image load failed from DataURL.'));
                            img.src = dataURL;
                        });
                        
                        const { width, height } = image;
                        
                        if (width <= 0 || height <= 0 || !isFinite(width) || !isFinite(height)) {
                            console.error('Image has invalid dimensions:', file.name, width, 'x', height);
                            throw new Error('Invalid dimensions (0 or NaN)');
                        }
                        
                        return { 
                            id: `${Date.now()}-${Math.random()}`, 
                            src: dataURL, 
                            width, 
                            height, 
                            ratio: width / height, 
                            name: file.name,
                            file: file 
                        };
                    } catch (error) {
                        console.error('Failed to load image metadata:', file.name, error);
                        return null;
                    }
                }

                async handleFileUpload(files) {
                    if (!files || files.length === 0) return;
                    
                    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
                    if (imageFiles.length === 0) { alert('No valid image files detected.'); return; }
                    
                    this.dom.imageContainerParent.classList.remove('hidden');
                    this.dom.emptyState.classList.add('hidden');
                    this.dom.loadingState.classList.remove('hidden');
                    
                    const totalFiles = imageFiles.length;
                    const updateProgress = (loaded, text) => { 
                        this.dom.loadingText.textContent = text; 
                        this.dom.loadingBar.style.width = `${(loaded / totalFiles) * 100}%`; 
                    };

                    updateProgress(0, `正在加载并转换 ${totalFiles} 张图片...`);
                    
                    const newImages = [];
                    for (let i = 0; i < totalFiles; i++) {
                        const result = await this._loadImageData(imageFiles[i]);
                        if (result) {
                            newImages.push(result);
                        }
                        updateProgress(i + 1, `已转换 ${i + 1}/${totalFiles} 张图片...`);
                    }
                    
                    this.state.imageItems = this.state.imageItems.concat(newImages); 
                    
                    if (this.state.imageItems.length > 0) {
                        this.dom.loadingState.classList.add('hidden'); 
                                this.state.layoutPositions = [];
        this.state.totalHeight = 0;
                        this.calculateAndRenderRectangle();            
                        this.updateUIState();
                        this._updateWatermarkVisibility();
                    } else {
                        this.dom.loadingState.classList.add('hidden');
                        this.updateUIState();
                        if (files.length > 0) alert('所有选定的图片文件加载失败。请检查文件格式。');
                    }
                    this.dom.fileInput.value = '';
                    this.dom.fileInputTop.value = '';
                }

                regenerateLayout() { 
                    if (this.state.imageItems.length === 0) return; 
                    this.state.imageItems.sort(() => 0.5 - Math.random()); 
                    this.calculateAndRenderRectangle(); 
                }

                calculateAndRenderRectangle() {
                    this.state.imageItems = this.state.imageItems.filter(item => 
                        item.ratio > 0 && isFinite(item.ratio)
                    );
                    
                    if (this.state.imageItems.length === 0) { 
                        this.state.layoutPositions = []; this.state.totalHeight = 0; this.updateUIState(); return; 
                    }
                    this.dom.rectContainer.innerHTML = ''; // 清空原有内容

                    // 重新添加 DOM 水印层
                    this.dom.rectContainer.appendChild(this.dom.domWatermark);
                    
                    const imageContainer = this.dom.imageContainerParent; 
                    const mainContentWidth = imageContainer.getBoundingClientRect().width;
                    const rectContainerPadding = 32; 
                    this.state.rectWidth = Math.round(mainContentWidth - rectContainerPadding);
                    
                    if (this.state.rectWidth < 200) this.state.rectWidth = 200;
                    
                    const [w, h] = this.state.aspectRatio.split(':').map(Number);
            
					// **** 核心修正：使用固定的行数权重来计算理想行高 ****
            
					// 1. 根据目标比例计算行高权重：
					const targetRatio = w / h; 
                    
                    
                    const isMobile = window.innerWidth <= 640;
                    const WEIGHTED_ROW_COUNT = isMobile ? 1.5 : 2.0;
                    let idealRowHeight = this.state.rectWidth / (targetRatio * WEIGHTED_ROW_COUNT);
    
                    // 移动端强制行高不超过屏幕高度的1/3，避免纵向长条
                    if (isMobile) {
                        const maxRowHeight = window.innerHeight / 3; // 最大行高为屏幕高度的1/3
                        idealRowHeight = Math.min(idealRowHeight, maxRowHeight);
                    }
            
					// 3. 计算理想行高：
					//    idealRowHeight = rectWidth / (目标比例 * 行数权重)
					//    这个公式确保 idealRowHeight 只由容器宽度和目标比例决定。
           
					const result = this._findLayoutForTargetHeight(this.state.rectWidth, idealRowHeight);
                    
                    if (!result || !result.positions || typeof result.totalHeight !== 'number' || result.totalHeight === 0) {
                        console.warn("Layout calculation returned invalid results. Aborting render.");
                        this.state.layoutPositions = [];
                        this.state.totalHeight = 0;
                        this.updateUIState();
                        return;
                    }

                    this.state.layoutPositions = result.positions;
                    this.state.totalHeight = result.totalHeight;

                    this.dom.rectContainer.style.width = `${this.state.rectWidth}px`;
                    this.dom.rectContainer.style.height = `${this.state.totalHeight}px`;
                    this.dom.rectDimensions.textContent = `${this.state.rectWidth}×${Math.round(this.state.totalHeight)}`;
                    
                    this._placeImagesInRectangle(this.state.layoutPositions);
                    this.updateUIState();
                    this._updateWatermarkVisibility(); // 重新计算水印大小
                }
                
                _findLayoutForTargetHeight(containerWidth, idealRowHeight) {
                    // 强制重置：根据当前选中的布局比例，重新计算理想行高（不受图片数量影响）
    const [wRatio, hRatio] = this.state.aspectRatio.split(':').map(Number);
    // 核心公式：理想行高 = 容器宽度 / (目标宽高比 * 固定列数权重)
    // 固定列数权重设为 4（可根据需求调整，确保1-多张图都适配）
    const fixedColWeight = 4; 
    idealRowHeight = containerWidth / ((wRatio / hRatio) * fixedColWeight);
                    let low = 20; 
                    let high = containerWidth; 

                    let bestLayout = this._calculateJustifiedLayout(containerWidth, idealRowHeight);
                    
                    if (!bestLayout || bestLayout.totalHeight <= 0 || !isFinite(bestLayout.totalHeight)) {
                         bestLayout = this._calculateJustifiedLayout(containerWidth, this.CONFIG.IDEAL_ROW_HEIGHT);
                         if (!bestLayout || bestLayout.totalHeight <= 0 || !isFinite(bestLayout.totalHeight)) {
                            return { positions: [], totalHeight: 0 };
                         }
                    }
                    
                    let minLayoutDiff = Infinity;
                    if(bestLayout.positions.length > 0) {
                        const rowHeights = bestLayout.positions.reduce((acc, pos) => {
                            if (pos.x === 0) acc.push(pos.height);
                            return acc;
                        }, []);
                        const averageRowHeight = rowHeights.length > 0 ? rowHeights.reduce((sum, h) => sum + h, 0) / rowHeights.length : 0;
                        const diff = Math.abs(averageRowHeight - idealRowHeight);
                        minLayoutDiff = diff;
                    } else {
                        return { positions: [], totalHeight: 0 };
                    }


                    for (let i = 0; i < this.CONFIG.BINARY_SEARCH_ITERATIONS; i++) {
                        const midRowHeight = (low + high) / 2;
                        
                        if (high - low < 0.1) break; 
                        
                        const layout = this._calculateJustifiedLayout(containerWidth, midRowHeight);
                        
                        if (!isFinite(layout.totalHeight) || layout.totalHeight <= 0) {
                            high = midRowHeight; 
                            continue;
                        }

                        const rowHeights = layout.positions.reduce((acc, pos) => {
                            if (pos.x === 0) acc.push(pos.height);
                            return acc;
                        }, []);
                        
                        const averageRowHeight = rowHeights.length > 0 ? rowHeights.reduce((sum, h) => sum + h, 0) / rowHeights.length : 0;
                        const diff = Math.abs(averageRowHeight - idealRowHeight);

                        if (diff < minLayoutDiff) { 
                            minLayoutDiff = diff; 
                            bestLayout = layout; 
                        }
                        
                        if (averageRowHeight < idealRowHeight) { 
                            low = midRowHeight; 
                        } else { 
                            high = midRowHeight; 
                        }
                    }
                    
                    if (!bestLayout || bestLayout.totalHeight <= 0 || !isFinite(bestLayout.totalHeight)) {
                        return { positions: [], totalHeight: 0 };
                    }
                    
                    return bestLayout;
                }
                
_calculateJustifiedLayout(containerWidth, idealHeight) {
    const items = this.state.imageItems;
    if (!items || items.length === 0) return { positions: [], totalHeight: 0 };
    const { GAP } = this.CONFIG;
    const costs = [0], partitions = [0];

    // 1. 计算每行的最佳分割点（不变）
    for (let i = 1; i <= items.length; i++) {
        let minCost = Infinity, bestPartition = 0;
        for (let j = 1; j <= i; j++) {
            if (costs[j - 1] === Infinity) continue;

            const rowItems = items.slice(j - 1, i);
            const sumOfRatios = rowItems.reduce((sum, item) => sum + item.ratio, 0);
            const gapSpace = (rowItems.length - 1) * GAP;

            // 容错：避免除以0或无效值
            if (containerWidth <= gapSpace || sumOfRatios <= 0 || !isFinite(sumOfRatios)) continue;

            const rowHeight = (containerWidth - gapSpace) / sumOfRatios;
            if (!isFinite(rowHeight) || rowHeight <= 0) continue;

            // 计算成本（不变）
            const currentCost = Math.pow(Math.abs(rowHeight - idealHeight), 2);
            const totalCost = costs[j - 1] + currentCost;

            if (totalCost < minCost) {
                minCost = totalCost;
                bestPartition = j; // 记录最佳分割点
            }
        }
        costs[i] = minCost;
        partitions[i] = bestPartition;
    }

    // 2. 生成rows时，强制每行最多3张图（已包含修复逻辑）
    const rows = [];
    let currentIndex = items.length;
    const MAX_PER_ROW = 3; // 每行最多3张图，超过则拆分

    while (currentIndex > 0) {
        // 计算当前行的起始索引（优先用partitions的最佳分割点）
        let startIndex = partitions[currentIndex];
        // 容错1：如果分割点无效，强制从当前位置往前推MAX_PER_ROW张
        if (startIndex <= 0 || startIndex > currentIndex) {
            startIndex = Math.max(1, currentIndex - MAX_PER_ROW);
        }
        // 容错2：确保当前行不超过MAX_PER_ROW张
        if (currentIndex - startIndex + 1 > MAX_PER_ROW) {
            startIndex = currentIndex - MAX_PER_ROW + 1;
        }
        // 添加当前行
        rows.unshift(items.slice(startIndex - 1, currentIndex));
        currentIndex = startIndex - 1;
    }

    // 3. 生成图片位置（不变）
    const positions = [];
    let currentY = 0;
    for (const rowItems of rows) {
        const sumOfRatios = rowItems.reduce((sum, item) => sum + item.ratio, 0);
        const gapSpace = (rowItems.length - 1) * GAP;
        if (sumOfRatios <= 0) continue;

        const rowHeight = (containerWidth - gapSpace) / sumOfRatios;
        if (!isFinite(rowHeight)) continue;

        let currentX = 0;
        for (const item of rowItems) {
            const itemWidth = rowHeight * item.ratio;
            positions.push({ x: currentX, y: currentY, width: itemWidth, height: rowHeight });
            currentX += itemWidth + GAP;
        }
        currentY += rowHeight + GAP;
    }
    const totalHeight = currentY > 0 ? currentY - GAP : 0;
    return { positions, totalHeight };
}
                
                _placeImagesInRectangle(positions) { 
                    positions.forEach((pos, i) => this._placeSingleImage(i, pos));
                }

_placeSingleImage(index, position) {
    const imageItem = this.state.imageItems[index];
    if (!imageItem || !position) return;

    const item = document.createElement('div');
    item.className = 'rect-item rounded-sm fade-in';
    item.style.cssText = `left: ${position.x}px; top: ${position.y}px; width: ${position.width}px; height: ${position.height}px;`;

    const img = new Image();
    img.src = imageItem.src;
    img.alt = imageItem.name;
    item.appendChild(img);

    // 4. 新增：创建浮动删除按钮
    const deleteBtn = document.createElement('div');
    deleteBtn.className = 'delete-btn';
    item.appendChild(deleteBtn);

    // 5. 绑定删除事件，复用 deleteCurrentImage(id)
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // 阻止事件冒泡到 itemDiv 的点击事件 (避免打开模态框)
            this.deleteCurrentImage(imageItem.id);
    });

    // 6. 绑定打开模态框事件
    item.addEventListener('click', () => this.openModal(index));

    this.dom.rectContainer.appendChild(item);
}

                
                openModal(index) { this.state.currentPreviewIndex = index; this.dom.imageModal.classList.remove('hidden'); document.body.style.overflow = 'hidden'; this.updateModalContent(); }
                closeModal() { this.dom.imageModal.classList.add('hidden'); document.body.style.overflow = ''; }
                switchPreviewImage(direction) { const newIndex = this.state.currentPreviewIndex + direction; if (newIndex >= 0 && newIndex < this.state.imageItems.length) { this.state.currentPreviewIndex = newIndex; this.updateModalContent(); } }
                
                updateModalContent() {
                    const item = this.state.imageItems[this.state.currentPreviewIndex]; if (!item) return;
                    this.dom.modalImage.src = item.src; 
                    this.dom.imageName.textContent = item.name;
                    this.dom.modalImgSize.textContent = `${item.width} × ${item.height}`; 
                    this.dom.modalImgRatio.textContent = item.ratio.toFixed(2);
                    this.dom.currentImageIndex.textContent = this.state.currentPreviewIndex + 1;
                    this.dom.totalImageCount.textContent = this.state.imageItems.length;
                    this.dom.prevImageBtn.disabled = this.state.currentPreviewIndex === 0;
                    this.dom.nextImageBtn.disabled = this.state.imageItems.length === 0 || this.state.currentPreviewIndex === this.state.imageItems.length - 1;
                }
                
                clearAllImages() { 
                    if (confirm('您确定要清空所有图片吗？')) { 
                        this.state.imageItems = []; 
                        this.dom.rectContainer.innerHTML = ''; 
                        this.dom.rectContainer.appendChild(this.dom.domWatermark); // 重新添加水印层
                        this.dom.routeNumberInput.value = '';
                        this.updateUIState();
                        this._updateWatermarkVisibility();
                    } 
                }
                deleteCurrentImage() { 
                    if (confirm('您确定要删除这张图片吗？')) { 
                        this.state.imageItems.splice(this.state.currentPreviewIndex, 1); 
                        this.closeModal(); 
                        if (this.state.imageItems.length > 0) { 
                            this.state.currentPreviewIndex = Math.min(this.state.currentPreviewIndex, this.state.imageItems.length - 1); 
                            this.calculateAndRenderRectangle(); 
                        } else { 
                            this.updateUIState(); 
                        } 
                    } 
                }
                downloadSingleImage() { const item = this.state.imageItems[this.state.currentPreviewIndex]; if (!item) return; const a = document.createElement('a'); a.href = item.src; a.download = item.name; document.body.appendChild(a); a.click(); document.body.removeChild(a); }


                _resetDownloadState() {
                    this.state.isDownloading = false;
                    this.dom.downloadBtn.innerHTML = '<i class="fa fa-download"></i> <span>下载拼图</span>';
                    this.dom.downloadOverlay.classList.add('hidden');
                    this.dom.downloadOverlay.classList.remove('flex');
                    this.dom.downloadProgressBar.style.width = '0%';
                    this.dom.downloadProgressText.textContent = '正在等待浏览器渲染...';
                    this.updateUIState();
                }

                // 核心：使用 html-to-image 截图 DOM 元素
                async downloadRectangle() {
                    if (this.state.isDownloading || this.state.imageItems.length === 0) return;
                    const watermarkText = this.dom.routeNumberInput.value.trim();
                    if (watermarkText === '') { this.updateUIState(); return; }

                    this.state.isDownloading = true;
                    this.dom.downloadOverlay.classList.remove('hidden'); this.dom.downloadOverlay.classList.add('flex');
                    this.dom.downloadBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> <span>正在生成...</span>';
                    
                    const currentScale = getScale();
                    this.dom.downloadOverlay.querySelector('p:first-child').textContent = `正在生成 ${currentScale}倍 大图...`;
                    
                    this.updateUIState();
                    
                    const targetElement = this.dom.rectContainer;
                    
                    // --- 暂存原始样式 ---
                    const originalRectShadow = targetElement.style.boxShadow;
                    const originalRectBorder = targetElement.style.border;

                    try {
                        // --- 关键修复 1: 隐藏下载遮罩 ---
                        const overlayWasVisible = !this.dom.downloadOverlay.classList.contains('hidden');
                        if(overlayWasVisible) {
                            this.dom.downloadOverlay.style.visibility = 'hidden'; 
                        }

                        // --- 关键修复 2：暂时移除干扰样式 (保留此步骤以防万一) ---
                        targetElement.style.boxShadow = 'none';
                        targetElement.style.border = 'none';
                        
                        await new Promise(resolve => setTimeout(resolve, 50)); 
                        
                        // 3. 使用 htmlToImage 截图
                        const dataUrl = await htmlToImage.toJpeg(targetElement, {
                            quality: this.CONFIG.JPEG_QUALITY, 
                            pixelRatio: currentScale, 
                            backgroundColor: '#ffffff', // 再次硬编码背景色
                            skipFonts: true, 
                        });


                        // 4. 恢复 DOM 样式
                        targetElement.style.boxShadow = originalRectShadow;
                        targetElement.style.border = originalRectBorder;

                        // 5. 恢复下载遮罩的可见性
                        if(overlayWasVisible) {
                            this.dom.downloadOverlay.style.visibility = 'visible';
                        }
                        
                        // 6. 导出 dataUrl (html-to-image 直接返回 DataURL)
                        const a = document.createElement('a');
                        a.href = dataUrl;
                        a.download = `${watermarkText}-S${currentScale}x-${Date.now()}.jpeg`; 
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        
                    } catch (error) {
                        console.error('Download Failed:', error);
                        // 恢复样式
                        targetElement.style.boxShadow = originalRectShadow;
                        targetElement.style.border = originalRectBorder;

                        alert(`下载失败: ${error.message}\n\n原因：可能是浏览器环境兼容性问题或内存不足。\n请尝试在**清晰度**选项中切换到 **1x (普通)** 模式。`);
                    } finally {
                        this._resetDownloadState();
                    }
                }
                
                updateUIState() {
                    const hasImages = this.state.imageItems.length > 0;
                    const routeNumberEntered = this.dom.routeNumberInput.value.trim() !== '';
                    const inputElement = this.dom.routeNumberInput;
                    
                    this.dom.imageContainerParent.classList.remove('hidden'); 
                    this.dom.emptyState.classList.toggle('hidden', hasImages);
                    this.dom.rectContainer.classList.toggle('hidden', !hasImages);
                    this.dom.statsBar.classList.toggle('hidden', !hasImages);
                    
                    this.dom.regenerateBtn.disabled = !hasImages || this.state.isDownloading;
                    this.dom.downloadBtn.disabled = !hasImages || this.state.isDownloading || !routeNumberEntered;
                    this.dom.clearBtn.disabled = !hasImages || this.state.isDownloading;
                    this.dom.fileInputTopLabel.style.opacity = this.state.isDownloading ? 0.6 : 1;

                    this.dom.rightControls.classList.toggle('hidden', !hasImages && this.dom.statsBar.classList.contains('hidden'));
                    
                    if (hasImages && !routeNumberEntered && !this.state.isDownloading) {
                        inputElement.classList.add('animate-pulse-primary', 'border-error'); 
                    } else {
                        inputElement.classList.remove('animate-pulse-primary', 'border-error');
                    }
                    if(hasImages) { this.dom.imageCount.textContent = this.state.imageItems.length; }
                }
            }

            // --- Initialization ---
            new GalleryOptimizer();
            
            // --- Footer Copyright and Quote Rotator (保持不变) ---
            const START_YEAR = 2024;
            const currentYear = new Date().getFullYear();
            const yearString = currentYear > START_YEAR ? `${START_YEAR}-${currentYear}` : `${START_YEAR}`;
            document.getElementById('copyrightFooter').textContent = `${yearString} | 深高创新•学生义工拼图工具 | it王工@2024级创新线长`;
            
function setupQuoteRotator() {
    // 先检查元素是否存在，避免报错
    const quoteElement = document.getElementById('currentQuote');
    if (!quoteElement) {
        console.warn('语录元素未找到');
        return;
    }
    // 简化语录数组，确保有内容
    const regularQuotes = [
        "天行健，君子以自强不息","IT王工思路妙，难题一来全解掉！","世上无难事，只怕有心人", "王工出品，必属精品"
    ];
    const itPool = ["IT王工技术好，排班效率节节高！"];
    const finalQuotes = [...regularQuotes, ...itPool];
    // 确保数组不为空
    if (finalQuotes.length === 0) {
        finalQuotes.push("奋斗的青春最美丽");
    }
    // 初始显示+定时切换
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

            setupQuoteRotator();
        });
