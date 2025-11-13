const { ipcRenderer } = require('electron');
const floatIcon = document.getElementById('float-icon');

let isDragging = false;
let startX, startY;

// 阻止图片默认拖拽行为
floatIcon.addEventListener('dragstart', (e) => e.preventDefault());

// 鼠标按下触发拖拽
floatIcon.addEventListener('mousedown', (e) => {
    if (e.button === 0) { // 只响应左键
        isDragging = true;
        // 记录鼠标相对于图标左上角的位置
        startX = e.clientX;
        startY = e.clientY;
        // 添加全局鼠标移动和抬起监听
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }
});

// 鼠标移动时更新窗口位置
function onMouseMove(e) {
    if (!isDragging) return;

    // 吸附逻辑配置
    const snapDistance = 20;
    const windowWidth = 100;
    const windowHeight = 100;
    const screenWidth = window.screen.availWidth;
    const screenHeight = window.screen.availHeight;

    // 计算基础目标位置
    let targetX = e.screenX - startX;
    let targetY = e.screenY - startY;

    // 左边缘吸附
    if (targetX < snapDistance) {
        targetX = 0;
    }
    // 右边缘吸附
    else if (targetX > screenWidth - windowWidth - snapDistance) {
        targetX = screenWidth - windowWidth;
    }

    // 上边缘吸附
    if (targetY < snapDistance) {
        targetY = 0;
    }
    // 下边缘吸附
    else if (targetY > screenHeight - windowHeight - snapDistance) {
        targetY = screenHeight - windowHeight;
    }

    // 发送位置更新到主进程
    ipcRenderer.send('update-float-position', Math.round(targetX), Math.round(targetY));
}

// 鼠标抬起结束拖拽
function onMouseUp() {
    isDragging = false;
    // 移除全局监听，避免内存泄漏
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
}

// 点击图标打开主窗口
floatIcon.addEventListener('click', () => {
    // 避免拖拽结束时误触发点击
    if (!isDragging) {
        ipcRenderer.send('open-main-window');
    }
});