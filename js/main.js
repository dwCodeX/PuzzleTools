// 主入口文件 - 初始化应用
document.addEventListener('DOMContentLoaded', () => {
  // 创建拼图优化器实例
  const gallery = new GalleryOptimizer();
  
  // 创建UI控制器实例
  const uiController = new UIController(gallery);
  
  // 将实例暴露到全局作用域（便于调试）
  window.gallery = gallery;
  window.uiController = uiController;

  console.log('拼图工具已初始化成功');
});

// 全局辅助函数
function getScale() {
  const radio = document.querySelector('input[name="renderQuality"]:checked');
  return radio ? parseInt(radio.value) : 2;
}

// 防抖函数
function debounce(func, delay) {
  let timeout;
  return function(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), delay);
  };
}

