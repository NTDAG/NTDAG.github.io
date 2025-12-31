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
    const windowSize = 100;
    const marginRight = 40;
    const x = screenWidth - windowSize - marginRight;
    const y = (screenHeight - windowSize) / 2;

    floatWindow = new BrowserWindow({
        width: windowSize,
        height: windowSize,
        minWidth: windowSize,
        maxWidth: windowSize,
        minHeight: windowSize,
        maxHeight: windowSize,
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
    floatWindow.setPosition(Math.round(x), Math.round(y));

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
 * 设置 IPC 监听器
 */
function setupIPCListeners() {
    ipcMain.on('open-main-window', () => {
        if (mainWindow) {
            mainWindow.show();
        } else {
            createMainWindow();
        }
    });

    ipcMain.on('update-float-position', (event, x, y) => {
        if (floatWindow) {
            floatWindow.setPosition(x, y);
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