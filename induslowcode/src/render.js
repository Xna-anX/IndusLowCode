function showSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.style.display = sidebar.style.display === 'none' ? 'block' : 'none';
}

function showEditor() {
    const editor = document.getElementById('editor');
    editor.style.display = editor.style.display === 'none' ? 'block' : 'none';
}

function showToolbox() {
    const toolbox = document.getElementById('toolbox');
    toolbox.style.display = toolbox.style.display === 'none' ? 'block' : 'none';
}

function addModule() {
    alert('新增模块');
}

function addEntity() {
    alert('新增实体');
}

function addPage() {
    alert('新增页面');
}

function addMicroflow() {
    alert('新增微流');
}

function addComponent() {
    alert('添加组件');
}

function editComponent() {
    alert('编辑组件');
}
