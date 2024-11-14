// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  sendSchemaToFile: (scenarioName, schemaData) =>
    ipcRenderer.send('save-schema-to-file', { scenarioName, schemaData }),
  resetSchema: (channel, data) => {
    console.log('获取中...')
    const validChannels = ['reset-schema'];
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, data);
    }
  },
  onFolderContents: (callback) =>
    ipcRenderer.on('folderContents', callback),
  // 选择文件夹
  selectFolder: () => ipcRenderer.invoke('select-folder'),

  // 创建项目
  createProject: (projectData) => ipcRenderer.send('create-project', projectData)
});

