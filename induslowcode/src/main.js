const { app, BrowserWindow, Menu, ipcMain, BrowserView } = require('electron');
const fs = require('fs');
const path = require('path');
let mainWindow;
const getLSName = (scenarioName, ns = 'projectSchema') => `${scenarioName}:${ns}`;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200, // 增加宽度以适应更多内容
    height: 900, // 增加高度以适应更多内容
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // 指定预加载脚本
      nodeIntegration: true,
      webviewTag: true
    },
  });


  // 创建低代码区域的 BrowserView
  const rightBoxView = new BrowserView({
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // 指定预加载脚本
      nodeIntegration: false,//决定了渲染进程是否可以直接使用 Node.js 的内置模块
      contextIsolation: true,//启用上下文隔离，渲染进程的 JavaScript 代码与 preload.js 中的代码运行在不同的作用域（上下文）中
    },
  });
  mainWindow.addBrowserView(rightBoxView);
  // rightBoxView.setBounds({ x: 150, y: 0, width: 600, height: 900 }); // 设置位置和大小
  rightBoxView.setAutoResize({ width: true, height: true });
  rightBoxView.webContents.loadURL('http://localhost:5556/'); // 通过 loadURL 加载内容
  // 打开开发者工具
  rightBoxView.webContents.openDevTools();

  // 创建导航区域的 BrowserView
  const leftBoxView = new BrowserView({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });
  mainWindow.addBrowserView(leftBoxView);
  // leftBoxView.setBounds({ x: 0, y: 0, width: 150, height: 900 }); // 设置位置和大小
  leftBoxView.setAutoResize({ width: true, height: true });
  leftBoxView.webContents.loadFile('./public/index.html'); // 加载本地 HTML 文件显示内容

  // 调整布局的函数
  const adjustLayout = () => {
    const { width, height } = mainWindow.getContentBounds();
    leftBoxView.setBounds({ x: 0, y: 0, width: 250, height });
    rightBoxView.setBounds({ x: 250, y: 0, width: width - 250, height });
  };
  // mainWindow.loadURL('http://localhost:5556/');
  // mainWindow.loadFile('./public/index.html');

  // 打开开发者工具
  // mainWindow.webContents.openDevTools();
  // 调整窗口大小时调整布局
  mainWindow.on('resize', adjustLayout);

  // 窗口创建完成后立即调整布局
  adjustLayout();
  rightBoxView.webContents.on('did-finish-load', () => {
    // 设置滚动条样式
    rightBoxView.webContents.insertCSS('body { overflow-x: scroll; }');

    // 调整布局
  });


  mainWindow.on('closed', () => {
    mainWindow = null;
  });

}


app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

ipcMain.on('save-schema-to-file', (event, { scenarioName, schemaData }) => {
  // 获取当前目录下的 data 文件夹路径  // 获取根目录的 data 文件夹路径
  const dataDir = path.join(__dirname, '../data'); // 使用 '../data' 回到根目录
  const savePath = path.join(dataDir, `${scenarioName}.json`);
  fs.writeFile(savePath, schemaData, (err) => {
    if (err) {
      console.error('Failed to save schema to file:', err);
    } else {
      console.log(`Schema saved successfully to ${savePath}`);
    }
  });
});

ipcMain.handle('reset-schema', async (event, scenarioName) => {
  const dataDir = path.join(__dirname, '../data'); // 使用 '../data' 回到根目录
  const filePath = path.join(dataDir, `${scenarioName}.json`);

  // 检查文件是否存在
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath, 'utf-8');
    return data; // 返回读取的数据
  } else {
    throw new Error('Schema file not found');
  }
});


//未定代码
//main.js

// 读取项目文件夹
function loadProjects(projectsDir) {
  return new Promise((resolve, reject) => {
    console.log('loadProjects');
    console.log('projectsDir:', projectsDir);

    // 检查文件夹是否存在
    if (!fs.existsSync(projectsDir)) {
      console.error('projects not exist', projectsDir);
      return reject('projects not exist');
    }

    // 异步读取文件夹内容
    fs.readdir(projectsDir, (err, files) => {
      if (err) {
        console.error('cannot read projects folder', err);
        return reject(err);
      }

      // 过滤出 .json 文件
      const projectFiles = files.filter(file => file.endsWith('.json'));
      resolve(projectFiles); // 使用 resolve 返回文件列表
    });
  });
}

ipcMain.handle('scan-schema', async (event) => {
  console.log('loadProjects');
  const dataDir = path.join(__dirname, '../data'); // 使用 '../data' 回到根目录

  // 检查文件是否存在
  if (fs.existsSync(dataDir)) {
    try {
      const data = await loadProjects(dataDir); // 等待 Promise 解析
      console.log(data);
      return data; // 返回读取的数据
    } catch (error) {
      throw new Error('Error loading projects: ' + error);
    }
  } else {
    throw new Error('Schema file not found');
  }
});






