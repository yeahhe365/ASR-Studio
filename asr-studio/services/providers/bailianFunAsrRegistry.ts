import { BAILIAN_FUN_ASR_MODEL, BAILIAN_FUN_ASR_TASK_URL, BAILIAN_FUN_ASR_TRANSCRIPTION_URL } from '../../constants';
import { AsrProvider } from '../../types';
import type { ProviderRegistryEntry } from '../providerRegistryTypes';
import { transcribeWithBailianFunAsr } from './bailianFunAsrProvider';

export const bailianFunAsrProviderEntry: ProviderRegistryEntry = {
  provider: AsrProvider.BAILIAN_FUN_ASR,
  supportsRemoteAudio: true,
  metadata: {
    label: '阿里百炼 FunASR',
    model: BAILIAN_FUN_ASR_MODEL,
    menuDescription: '录音文件识别',
    summaryTitle: '阿里百炼 FunASR',
    summaryDetails: `${BAILIAN_FUN_ASR_MODEL} · ${BAILIAN_FUN_ASR_TRANSCRIPTION_URL} · ${BAILIAN_FUN_ASR_TASK_URL}`,
    summaryNote: '本地文件会转为 Base64 Data URL 提交；远程 URL 会原样提交。',
    capabilities: [
      { label: '输入', value: '本地文件 Base64 / 远程 URL' },
      { label: '任务', value: '异步提交与轮询' },
      { label: '模型', value: BAILIAN_FUN_ASR_MODEL },
      { label: '时间戳', value: '解析 sentence 时间戳' },
    ],
  },
  diagnose: (config) => [
    {
      label: 'API Key',
      status: config.bailianFunAsrApiKey.trim() ? 'ok' : 'error',
      detail: config.bailianFunAsrApiKey.trim()
        ? '已填写百炼 FunASR API Key。'
        : '需要在设置中填写百炼 FunASR API Key。',
    },
    {
      label: '输入方式',
      status: 'ok',
      detail: '本地文件会转为 Base64 Data URL；远程 URL 会作为 file_urls 直接提交。',
    },
  ],
  getReadinessError: (config) =>
    !config.bailianFunAsrApiKey.trim() ? '百炼 FunASR API Key 未设置。请在设置中配置。' : null,
  transcribe: (audioFile, context, language, enableItn, config, signal) =>
    transcribeWithBailianFunAsr(
      audioFile,
      context,
      language,
      enableItn,
      { apiKey: config.bailianFunAsrApiKey },
      signal,
    ),
};
