import { KeyRound, LayoutPanelLeft } from 'lucide-react';
import { DatabaseIcon } from '../icons/DatabaseIcon';
import { InfoIcon } from '../icons/InfoIcon';
import { SlidersIcon } from '../icons/SlidersIcon';
import type { SettingTab, SettingTabDescriptor } from './settingsTypes';

export const tabs: SettingTabDescriptor[] = [
  { id: 'api', label: 'API', description: '选择识别服务、填写密钥，并检查配置是否可用。', Icon: KeyRound },
  { id: 'recognition', label: '识别', description: '语言、录音设备与音频处理；高级选项可折叠展开。', Icon: SlidersIcon },
  { id: 'interface', label: '界面', description: '主题与结果输出偏好。', Icon: LayoutPanelLeft },
  { id: 'data', label: '数据', description: '安装、导入、缓存清理与危险操作。', Icon: DatabaseIcon },
  { id: 'about', label: '关于', description: '查看版本和项目入口。', Icon: InfoIcon },
];

export const tabGroups: Array<{ id: string; tabIds: SettingTab[] }> = [
  { id: 'primary', tabIds: ['api', 'recognition', 'interface', 'data'] },
  { id: 'about', tabIds: ['about'] },
];
