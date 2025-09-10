/* global process */
import path from 'path';
import { fileURLToPath } from 'url';
import { app, BrowserWindow } from 'electron';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// eslint-disable-next-line no-unused-vars
const win = new BrowserWindow({
  width: 1000,
  height: 700,
  icon: path.join(__dirname, 'assets', 'icon.ico'), // aqui tem que ser .ico no Windows
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    nodeIntegration: true,
    contextIsolation: false
  }
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    icon: path.join(__dirname, 'assets', 'icon.ico'), // ícone da janela
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    // dev
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    // prod
    const indexPath = path.join(__dirname, 'dist', 'index.html');
    win.loadFile(indexPath);
  }

  win.setMenuBarVisibility(false);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
