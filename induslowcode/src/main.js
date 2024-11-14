const { app, BrowserWindow, Menu, ipcMain, BrowserView } = require('electron');
const fs = require('fs');
const path = require('path');
let mainWindow;

const { dialog } = require('electron');
let rootDirectory = ''; // 全局保存根目录路径

const getProjectName = (scenarioName, id, ns = 'projectSchema') => `${scenarioName}-${id}-${ns}`;

const getListName = (scenarioName, ns = 'resourceList') => `${scenarioName}-${ns}`;


const menuTemplate = [
  {
    label: 'File',
    submenu: [
      {
        label: 'Open Folder',
        accelerator: 'CmdOrCtrl+O',
        click: openFolder
      },
      {
        label: 'New Project', // 新添加的按钮
        accelerator: 'CmdOrCtrl+N', // 快捷键
        click: createNewProject
      },
      {
        label: 'Exit',
        accelerator: 'CmdOrCtrl+Q',
        click() {
          app.quit();
        },
      }
    ],
  },
  // 可以继续添加更多菜单项
];

Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));


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
  mainWindow.webContents.loadURL('http://localhost:5556/');
  mainWindow.webContents.openDevTools();



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



// 异步递归读取文件夹内容，只返回符合条件的list json文件
async function readFolderContents(folderPath) {
  const folderContents = [];

  const files = await fs.promises.readdir(folderPath, { withFileTypes: true });
  for (const file of files) {
    const fullPath = path.join(folderPath, file.name);

    if (file.isDirectory()) {
      // 如果是目录，则递归读取子目录内容
      const childrenContents = await readFolderContents(fullPath);
      folderContents.push(...childrenContents); // 将符合条件的内容添加到结果中
    } else if (file.name.endsWith('-resourceList.json')) {
      // 如果文件符合条件，则读取内容并存储
      const content = await fs.promises.readFile(fullPath, 'utf-8');
      folderContents.push(content); // 只返回文件内容
    }
  }
  return folderContents;
}

// 打开文件夹，保存根目录
function openFolder() {
  dialog.showOpenDialog(mainWindow, { properties: ['openDirectory'] }).then(async (result) => {
    if (!result.canceled) {
      rootDirectory = result.filePaths[0]; // 保存根目录路径
      console.log('Selected Folder:', rootDirectory);

      try {
        const folderContents = await readFolderContents(rootDirectory);
        console.log(folderContents);
        mainWindow.webContents.send('folderContents', folderContents,path.basename(rootDirectory));
      } catch (err) {
        console.error('Failed to read directory:', err);
      }
    }
  }).catch(err => {
    console.error('Failed to open folder:', err);
  });
}


// 在目录下查找文件
function findFileInDir(directory, fileName) {
  let result = null;
  const files = fs.readdirSync(directory, { withFileTypes: true });

  for (const file of files) {
    const fullPath = path.join(directory, file.name);
    if (file.isDirectory()) {
      // 如果是目录，递归查找
      result = findFileInDir(fullPath, fileName);
    } else if (file.name === fileName) {
      // 找到文件，返回路径
      result = fullPath;
    }
    if (result) break; // 找到文件后退出循环
  }
  return result;
}

// 保存文件
ipcMain.on('save-schema-to-file', (event, { scenarioName, schemaData }) => {
  //这里的scenarioName为文件名
  if (!rootDirectory) {
    console.error('Root directory is not set!');
    return;
  }
  // 在根目录及子文件夹中查找目标文件
  const savePath = findFileInDir(rootDirectory, `${scenarioName}.json`);
  console.log(savePath);
  console.log(schemaData);
  if (savePath) {
    fs.writeFile(savePath, schemaData, (err) => {
      if (err) {
        console.error('Failed to save schema to file:', err);
      } else {
        console.log(`Schema saved successfully to ${savePath}`);
      }
    });
  } else {
    console.error(`File ${scenarioName}.json not found in any subfolder.`);
  }

  //用于生成新页面时，根据defaultschema生成新的 schema文件

  // 判断 scenarioName 是否为 “XX-resourceList”的格式
  const resourceListPattern = /^(.+?)-resourceList$/;
  const match = scenarioName.match(resourceListPattern);
  // 如果匹配，生成以“XX-id-projectSchema.json”格式的文件
  if (match) {
    const resourcePrefix = match[1];
    try {
      // 解析 schemaData 为数组，并根据 id 创建各个 schema 文件
      const resourceList = JSON.parse(schemaData);
      resourceList.forEach(({ id }) => {
        const schemaFileName = `${resourcePrefix}-${id}-projectSchema.json`;
        let schemaFilePath = findFileInDir(rootDirectory, schemaFileName);

        // 若文件不存在，从 ./public/defaultschema.json 复制内容生成文件
        if (!schemaFilePath) {
          schemaFilePath = path.join(rootDirectory, schemaFileName); // 将新文件放置在根目录下
          const defaultSchemaPath = path.join(__dirname, '../public', 'defaultschema.json');
          try {
            const defaultSchema = fs.readFileSync(defaultSchemaPath, 'utf-8');
            fs.writeFileSync(schemaFilePath, defaultSchema);
            console.log(`Created default schema file for ${schemaFileName}`);
          } catch (err) {
            console.error('Failed to create default schema file:', err);
            return;
          }
        }
      });
    } catch (err) {
      console.error('Failed to parse resource list data:', err);
    }
  }
});

// 重置 schema，读取文件内容
ipcMain.handle('reset-schema', async (event, scenarioName) => {
  if (!rootDirectory) {
    throw new Error('Root directory is not set!');
  }
  console.log(scenarioName)
  // 在根目录及子文件夹中查找目标文件
  const filePath = findFileInDir(rootDirectory, `${scenarioName}.json`);
  console.log(filePath)
  if (filePath) {
    return fs.readFileSync(filePath, 'utf-8'); // 返回文件内容
  } else {
    throw new Error('Schema file not found');
  }
});

// 创建新项目的窗口
function createNewProject() {
  inputWindow = new BrowserWindow({
    parent: mainWindow,
    modal: true,
    width: 500,
    height: 400,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // 指定预加载脚本
      nodeIntegration: true,

    },
  });

  inputWindow.loadFile(path.join(__dirname,'components','newProject','newProject.html'));

  inputWindow.on('closed', () => {
    inputWindow = null;
  });
}

// 处理选择项目位置的请求
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(inputWindow, {
    properties: ['openDirectory'],
  });
  if (!result.canceled) {
    return result.filePaths[0];
  }
});

// 处理项目创建的请求
ipcMain.on('create-project', (event, projectData) => {
  console.log(projectData)
  const { projectName, projectLocation, projectVersion } = projectData;
  if (projectName && projectLocation) {
    const newProjectPath = path.join(projectLocation, projectName);
    if (!fs.existsSync(newProjectPath)) {
      fs.mkdirSync(newProjectPath);

      // 创建页面文件地址
      const schemaFileName=getProjectName(projectName,'index')+'.json'
      schemaFilePath = path.join(newProjectPath,schemaFileName); // 将新文件放置在根目录下

      // 获取默认页面
      const defaultSchemaPath = path.join(__dirname, '../public', 'defaultschema.json');
      const defaultSchema = fs.readFileSync(defaultSchemaPath, 'utf-8');

      // 创建新文件
      fs.writeFileSync(schemaFilePath, defaultSchema);

      // 创建页面文件地址
      const listFileName=getListName(projectName)+'.json'
      listFilePath = path.join(newProjectPath,listFileName); // 将新文件放置在根目录下
      console.log(listFilePath)
      // 获取默认页面
      const defaultListPath = path.join(__dirname, '../public', 'defaultresourceList.json');
      const defaultList = fs.readFileSync(defaultListPath, 'utf-8');
      // 创建新文件
      fs.writeFileSync(listFilePath, defaultList);


    } else {
      console.error('Project folder already exists.');
    }
  } else {
    console.error('Invalid project data.');
  }
});
