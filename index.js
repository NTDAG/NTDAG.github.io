const { app, BrowserWindow, ipcMain, screen } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');

let floatWindow;

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    });

    win.loadFile('index.html');

    win.on('close', (event) => {
        if (app.quitting) {
            win = null;
        } else {
            event.preventDefault();
            win.hide();
        }
    });
}

function createFloatWindow() {
    const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
    const windowSize = 100; // 固定窗口尺寸为 100px
    const marginRight = 40;

    const x = screenWidth - windowSize - marginRight;
    const y = (screenHeight - windowSize) / 2;

    floatWindow = new BrowserWindow({
        width: windowSize,
        height: windowSize,
        minWidth: windowSize, // 最小宽度
        maxWidth: windowSize, // 最大宽度
        minHeight: windowSize,// 最小高度
        maxHeight: windowSize,// 最大高度
        resizable: false,     // 禁止调整大小
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
}

function setupIPCListeners() {
    ipcMain.on('open-main-window', () => {
        const mainWindow = BrowserWindow.getAllWindows().find(w => w !== floatWindow);
        if (mainWindow) {
            mainWindow.show();
        } else {
            createWindow();
        }
    });

    ipcMain.on('update-float-position', (event, x, y) => {
        if (floatWindow) {
            floatWindow.setPosition(x, y);
        }
    });
}

function setupAutoUpdater() {
    autoUpdater.logger = require('electron-log');
    autoUpdater.logger.transports.file.level = 'info';
    autoUpdater.checkForUpdatesAndNotify();

    autoUpdater.on('update-downloaded', () => {
        autoUpdater.quitAndInstall();
    });
}

app.whenReady().then(() => {
    createWindow();
    createFloatWindow();
    setupIPCListeners();
    setupAutoUpdater();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', () => {
    app.quitting = true;
});