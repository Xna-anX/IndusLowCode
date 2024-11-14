// 选择文件夹
document.getElementById('select-folder').addEventListener('click', async () => {
  console.log('确定创建地址...')
  const folderPath = await window.electronAPI.selectFolder();
  if (folderPath) {
    document.getElementById('project-location').value = folderPath;
  }
});

// 创建项目
document.getElementById('create-project').addEventListener('click', () => {
  const projectName = document.getElementById('project-name').value;
  const projectLocation = document.getElementById('project-location').value;
  const projectVersion = document.getElementById('project-version').value;

  if (projectName && projectLocation) {
    window.electronAPI.createProject({
      projectName,
      projectLocation,
      projectVersion,
    });
    window.close(); // 关闭对话框窗口
  } else {
    alert('请填写所有必填字段！');
  }
});
