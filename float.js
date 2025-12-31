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

// 鼠标移动时更新窗口位置（扩展为四周边缘吸附，保留原有逻辑结构）
function onMouseMove(e) {
    if (!isDragging) return;

    const snapDistance = 20;
    const windowWidth = 100;
    const windowHeight = 100;
    let targetX = e.screenX - startX;
    let targetY = e.screenY - startY;
    const screenWidth = window.screen.availWidth;
    const screenHeight = window.screen.availHeight;

    // --- 核心吸附判断：从仅右侧扩展为左、右、上、下四侧 ---
    // 先重置所有吸附类名（避免多边缘类名残留）
    body.classList.remove('snapped', 'snapped-right', 'snapped-left', 'snapped-top', 'snapped-bottom');

    let isSnapped = false; // 标记是否触发任意边缘吸附

    // 右侧吸附（保留原有逻辑）
    if (targetX > screenWidth - windowWidth - snapDistance) {
        targetX = screenWidth - windowWidth;
        body.classList.add('snapped', 'snapped-right');
        isSnapped = true;
    }
    // 左侧吸附（新增，与右侧逻辑对称）
    else if (targetX < snapDistance) {
        targetX = 0;
        body.classList.add('snapped', 'snapped-left');
        isSnapped = true;
    }

    // 顶部吸附（新增）
    if (targetY < snapDistance) {
        targetY = 0;
        body.classList.add('snapped', 'snapped-top');
        isSnapped = true;
    }
    // 底部吸附（新增，与顶部逻辑对称）
    else if (targetY > screenHeight - windowHeight - snapDistance) {
        targetY = screenHeight - windowHeight;
        body.classList.add('snapped', 'snapped-bottom');
        isSnapped = true;
    }

    // 若未触发任何吸附，确保移除所有吸附类名（兜底）
    if (!isSnapped) {
        body.classList.remove('snapped', 'snapped-right', 'snapped-left', 'snapped-top', 'snapped-bottom');
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