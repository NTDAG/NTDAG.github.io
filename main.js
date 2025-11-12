const { app, BrowserWindow } = require('electron');
const path = require('path');

let win;

function createWindow() {
    // 创建一个窗口
    win = new BrowserWindow({
        width: 300, // 窗口宽度
        height: 300, // 窗口高度
        frame: false, // 去掉边框
        transparent: true, // 使窗口透明
        alwaysOnTop: true, // 保证窗口始终在最前面
        icon: path.join(__dirname, 'icon.ico'),
        webPreferences: {
            nodeIntegration: true, // 允许在渲染进程中使用 Node.js
        },
    });

    // 加载你的 HTML 文件
    win.loadFile('index.html');

    // 窗口关闭时
    win.on('closed', () => {
        win = null;
    });
}

app.whenReady().then(createWindow);

// 退出应用的处理
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

const { autoUpdater } = require('electron-updater');

autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'NTDAG',
    repo: 'NTDAG.github.io.',
});

autoUpdater.checkForUpdatesAndNotify();


const { app, BrowserWindow } = require('electron');
const { autoUpdater } = require('electron-updater');

app.on('ready', () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: { nodeIntegration: true }
    });
    win.loadFile('index.html');

    autoUpdater.checkForUpdatesAndNotify();
});

// 可选：监听更新事件
autoUpdater.on('update-available', () => {
    console.log('检测到新版本，正在下载...');
});
autoUpdater.on('update-downloaded', () => {
    console.log('新版本下载完成，准备安装...');
    autoUpdater.quitAndInstall();
});