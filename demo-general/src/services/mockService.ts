import { material, project } from '@alilc/lowcode-engine';
import { filterPackages } from '@alilc/lowcode-plugin-inject'
import { Message, Dialog } from '@alifd/next';
import { IPublicTypeProjectSchema, IPublicEnumTransformStage } from '@alilc/lowcode-types';
import DefaultPageSchema from './defaultPageSchema.json';
import DefaultI18nSchema from './defaultI18nSchema.json';
import { ipcRenderer } from 'electron';
const generateProjectSchema = (pageSchema: any, i18nSchema: any): IPublicTypeProjectSchema => {
  return {
    componentsTree: [pageSchema],
    componentsMap: material.componentsMap as any,
    version: '1.0.0',
    i18n: i18nSchema,
  };
}


export const saveSchema = async (scenarioName: string = 'unknown') => {
  setProjectSchemaToLocalStorage(scenarioName);
  await setPackagesToLocalStorage(scenarioName);


  Message.success('成功保存到本地');
};

export const resetSchema = async (scenarioName: string = 'unknown') => {
  // try {
  //   await new Promise<void>((resolve, reject) => {
  //     Dialog.confirm({
  //       content: '确定要重置吗？您所有的修改都将消失！',
  //       onOk: () => {
  //         resolve();
  //       },
  //       onCancel: () => {
  //         reject()
  //       },
  //     })
  //   })
  // } catch(err) {
  //   return;
  // }
  // const defaultSchema = generateProjectSchema(DefaultPageSchema, DefaultI18nSchema);

  // project.importSchema(defaultSchema as any);
  // project.simulatorHost?.rerender();

  // setProjectSchemaToLocalStorage(scenarioName);
  // await setPackagesToLocalStorage(scenarioName);
  // Message.success('成功重置页面');
  console.log('请求Schema')
  const projectSchema = await window.electronAPI.invoke('reset-schema', scenarioName);
  const files= await window.electronAPI.scanSchema('scan-schema');
  console.log('获取文件',files)

  console.log('成功获取Schema')
  console.log('开始导入Schema')
  project.importSchema(JSON.parse(projectSchema) as any);
  console.log('成功导入Schema')
  console.log('开始渲染Schema')
  project.simulatorHost?.rerender();
  console.log('完成渲染Schema')



  Message.success('成功重置页面');
}

const getLSName = (scenarioName: string, ns: string = 'projectSchema') => `${scenarioName}:${ns}`;

export const getProjectSchemaFromLocalStorage = (scenarioName: string) => {
  if (!scenarioName) {
    console.error('scenarioName is required!');
    return;
  }
  const localValue = window.localStorage.getItem(getLSName(scenarioName));
  if (localValue) {
    return JSON.parse(localValue);
  }
  return undefined;
}

const setProjectSchemaToLocalStorage = (scenarioName: string) => {
  if (!scenarioName) {
    console.error('scenarioName is required!');
    return;
  }

  // 将 schema 数据存储到 localStorage
  const schemaData = JSON.stringify(project.exportSchema(IPublicEnumTransformStage.Save));
  window.localStorage.setItem(getLSName(scenarioName), schemaData);
  window.electronAPI.sendSchemaToFile(scenarioName, schemaData);
}

const setPackagesToLocalStorage = async (scenarioName: string) => {
  if (!scenarioName) {
    console.error('scenarioName is required!');
    return;
  }
  const packages = await filterPackages(material.getAssets().packages);
  window.localStorage.setItem(
    getLSName(scenarioName, 'packages'),
    JSON.stringify(packages),
  );
}

export const getPackagesFromLocalStorage = (scenarioName: string) => {
  if (!scenarioName) {
    console.error('scenarioName is required!');
    return;
  }
  return JSON.parse(window.localStorage.getItem(getLSName(scenarioName, 'packages')) || '{}');
}

export const getProjectSchema = async (scenarioName: string = 'unknown') : Promise<IPublicTypeProjectSchema> => {
  const pageSchema = await getPageSchema(scenarioName);
  return generateProjectSchema(pageSchema, DefaultI18nSchema);
};

export const getPageSchema = async (scenarioName: string = 'unknown') => {
  const pageSchema = getProjectSchemaFromLocalStorage(scenarioName)?.componentsTree?.[0];
  if (pageSchema) {
    return pageSchema;
  }

  return DefaultPageSchema;
};

export const getPreviewLocale = (scenarioName: string) => {
  const key = getLSName(scenarioName, 'previewLocale');
  return window.localStorage.getItem(key) || 'zh-CN';
}

export const setPreviewLocale = (scenarioName: string, locale: string) => {
  const key = getLSName(scenarioName, 'previewLocale');
  window.localStorage.setItem(key, locale || 'zh-CN');
  window.location.reload();
}
