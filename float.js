const { ipcRenderer } = require('electron');
const floatIcon = document.getElementById('float-icon');
// 获取带 ID 的 body 元素
const body = document.getElementById('float-body');

let isDragging = false;
let startX, startY;

// 阻止图片默认拖拽行为
floatIcon.addEventListener('dragstart', (e) => e.preventDefault());

// 鼠标按下触发拖拽
floatIcon.addEventListener('mousedown', (e) => {
    if (e.button === 0) {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }
});

// 鼠标移动时更新窗口位置
function onMouseMove(e) {
    if (!isDragging) return;

    const snapDistance = 20;
    const windowWidth = 100;
    const windowHeight = 100;
    let targetX = e.screenX - startX;
    let targetY = e.screenY - startY;
    const screenWidth = window.screen.availWidth;
    const screenHeight = window.screen.availHeight;

    // --- 核心吸附判断 ---
    const isSnappedToRight = targetX > screenWidth - windowWidth - snapDistance;

    if (isSnappedToRight) {
        targetX = screenWidth - windowWidth;
        // 确保两个类都被添加
        body.classList.add('snapped', 'snapped-right');
    } else {
        // 确保两个类都被移除
        body.classList.remove('snapped', 'snapped-right');
    }

    // 发送位置更新到主进程
    ipcRenderer.send('update-float-position', Math.round(targetX), Math.round(targetY));
}

// 鼠标抬起结束拖拽
function onMouseUp() {
    isDragging = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
}

// 点击图标打开主窗口
floatIcon.addEventListener('click', () => {
    if (!isDragging) {
        ipcRenderer.send('open-main-window');
    }
});