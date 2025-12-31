// 导入所需模块
const { app, BrowserWindow, ipcMain, screen, Menu, MenuItem } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const log = require('electron-log');

// 配置日志
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

// 声明窗口变量
let mainWindow;
let floatWindow;
// 贴合阈值：当窗口距离屏幕边缘小于该值时，自动吸附（单位：像素）
const SNAP_THRESHOLD = 30;
// 悬浮窗口尺寸
const WINDOW_SIZE = 100;

// 应用就绪后创建窗口
app.whenReady().then(() => {
    createMainWindow();
    createFloatWindow();
    setupIPCListeners();
    setupAutoUpdater();
    setupFloatWindowContextMenu(); // 设置悬浮窗口右击菜单

    // 激活应用时的处理
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
            createFloatWindow();
            setupFloatWindowContextMenu(); // 重新设置菜单
        } else if (mainWindow) {
            mainWindow.show();
        }
    });
});

/**
 * 创建主窗口
 */
function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    });

    mainWindow.loadFile(path.join(__dirname, 'index.html'));

    mainWindow.on('close', (event) => {
        if (!app.quitting) {
            event.preventDefault();
            mainWindow.hide();
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

/**
 * 创建悬浮窗口
 */
function createFloatWindow() {
    const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
    const marginRight = 40;
    // 初始位置（仍默认右侧居中，不影响原有初始布局）
    const initX = screenWidth - WINDOW_SIZE - marginRight;
    const initY = (screenHeight - WINDOW_SIZE) / 2;

    floatWindow = new BrowserWindow({
        width: WINDOW_SIZE,
        height: WINDOW_SIZE,
        minWidth: WINDOW_SIZE,
        maxWidth: WINDOW_SIZE,
        minHeight: WINDOW_SIZE,
        maxHeight: WINDOW_SIZE,
        resizable: false,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        skipTaskbar: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    });

    floatWindow.loadFile(path.join(__dirname, 'float.html'));
    floatWindow.setPosition(Math.round(initX), Math.round(initY));

    floatWindow.on('closed', () => {
        floatWindow = null;
    });
}

/**
 * 设置悬浮窗口右击菜单
 */
function setupFloatWindowContextMenu() {
    if (!floatWindow) return;

    // 创建菜单
    const contextMenu = new Menu();

    // 添加退出应用菜单项
    contextMenu.append(new MenuItem({
        label: '退出应用',
        click: () => {
            app.quitting = true; // 标记为主动退出
            app.quit(); // 退出应用
        }
    }));

    // 监听悬浮窗口的右击事件
    floatWindow.webContents.on('context-menu', (event, params) => {
        event.preventDefault();
        contextMenu.popup({
            window: floatWindow,
            x: params.x,
            y: params.y
        });
    });
}

/**
 * 计算并返回贴合边缘后的窗口坐标（优化所有边缘紧凑贴合，和右侧效果一致）
 * @param {number} x - 窗口当前X坐标（左上角）
 * @param {number} y - 窗口当前Y坐标（左上角）
 * @returns {Object} 贴合后的{x, y}坐标
 */
function getSnappedPosition(x, y) {
    const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
    const windowHalfSize = WINDOW_SIZE / 2;

    // 1. 左侧紧凑贴合：窗口左侧对齐屏幕左边缘（x=0），和右侧逻辑对称
    if (Math.abs(x - 0) < SNAP_THRESHOLD) {
        x = 0;
    }
    // 2. 右侧紧凑贴合：窗口右侧对齐屏幕右边缘（x=screenWidth - WINDOW_SIZE）
    else if (Math.abs(x - (screenWidth - WINDOW_SIZE)) < SNAP_THRESHOLD) {
        x = screenWidth - WINDOW_SIZE;
    }

    // 3. 顶部紧凑贴合：窗口顶部对齐屏幕上边缘（y=0），和底部逻辑对称
    if (Math.abs(y - 0) < SNAP_THRESHOLD) {
        y = 0;
    }
    // 4. 底部紧凑贴合：窗口底部对齐屏幕下边缘（y=screenHeight - WINDOW_SIZE）
    else if (Math.abs(y - (screenHeight - WINDOW_SIZE)) < SNAP_THRESHOLD) {
        y = screenHeight - WINDOW_SIZE;
    }

    // 额外校验：防止窗口超出屏幕范围，确保贴合后绝对紧凑
    x = Math.max(0, Math.min(x, screenWidth - WINDOW_SIZE));
    y = Math.max(0, Math.min(y, screenHeight - WINDOW_SIZE));

    return { x: Math.round(x), y: Math.round(y) };
}

/**
 * 设置 IPC 监听器（优化拖拽坐标传递，确保贴合逻辑精准触发）
 */
function setupIPCListeners() {
    ipcMain.on('open-main-window', () => {
        if (mainWindow) {
            mainWindow.show();
        } else {
            createMainWindow();
        }
    });

    ipcMain.on('update-float-position', (event, rawX, rawY) => {
        if (floatWindow) {
            // 先获取窗口当前实际位置，兼容拖拽时的坐标偏差
            const [currentX, currentY] = floatWindow.getPosition();
            // 优先使用传递的坐标，若传递异常则使用当前实际坐标，确保贴合稳定
            const targetX = rawX || currentX;
            const targetY = rawY || currentY;

            // 获取紧凑贴合后的坐标
            const { x, y } = getSnappedPosition(targetX, targetY);
            // 设置窗口最终位置，实现所有边缘紧凑贴合（和右侧效果一致）
            floatWindow.setPosition(x, y, true); // 第三个参数：是否忽略窗口动画，确保贴合即时生效
        }
    });
}

/**
 * 设置自动更新
 */
function setupAutoUpdater() {
    autoUpdater.setFeedURL({
        provider: 'github',
        owner: 'NTDAG',
        repo: 'NTDAG.github.io',
    });

    autoUpdater.checkForUpdatesAndNotify();

    autoUpdater.on('update-available', () => {
        log.info('检测到新版本，正在下载...');
    });

    autoUpdater.on('update-downloaded', () => {
        log.info('新版本下载完成，准备安装...');
        autoUpdater.quitAndInstall();
    });

    autoUpdater.on('error', (err) => {
        log.error('自动更新出错:', err);
    });
}

// 所有窗口关闭时退出应用（除了 macOS）
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// 应用退出前的处理
app.on('before-quit', () => {
    app.quitting = true;
});