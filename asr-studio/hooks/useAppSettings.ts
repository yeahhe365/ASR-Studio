import { useCallback, useMemo } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { AsrProvider, CompressionLevel, Language, MainstreamAsrModel, NvidiaNimTask } from '../types';
import type { AsrProviderConfig, Theme } from '../types';
import {
  createEnumParser,
  parsePersistedBooleanDefaultFalse,
  parsePersistedBooleanDefaultTrue,
  parseTheme,
} from './appSettingsParsers';
import { usePersistentState } from './usePersistentState';

export type AppSettingsValues = {
  context: string;
  language: Language;
  enableItn: boolean;
  autoCopy: boolean;
  theme: Theme;
  compressionLevel: CompressionLevel;
  trimSilence: boolean;
  enableLongAudioChunking: boolean;
  selectedDeviceId: string;
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
  asrProvider: AsrProvider;
  battleModeEnabled: boolean;
  battleProviderA: AsrProvider;
  battleProviderB: AsrProvider;
  qwenApiKey: string;
  bailianFunAsrApiKey: string;
  doubaoApiKey: string;
  geminiApiKey: string;
  nvidiaNimBaseUrl: string;
  nvidiaNimApiKey: string;
  nvidiaNimTask: NvidiaNimTask;
  mainstreamAsrModel: MainstreamAsrModel;
  mainstreamAsrApiKey: string;
  mainstreamAsrBaseUrl: string;
  mainstreamAsrCustomModelName: string;
};

export type AppSettingsSetters = {
  setContext: Dispatch<SetStateAction<string>>;
  setLanguage: Dispatch<SetStateAction<Language>>;
  setEnableItn: Dispatch<SetStateAction<boolean>>;
  setAutoCopy: Dispatch<SetStateAction<boolean>>;
  setTheme: Dispatch<SetStateAction<Theme>>;
  setCompressionLevel: Dispatch<SetStateAction<CompressionLevel>>;
  setTrimSilence: Dispatch<SetStateAction<boolean>>;
  setEnableLongAudioChunking: Dispatch<SetStateAction<boolean>>;
  setSelectedDeviceId: Dispatch<SetStateAction<string>>;
  setEchoCancellation: Dispatch<SetStateAction<boolean>>;
  setNoiseSuppression: Dispatch<SetStateAction<boolean>>;
  setAutoGainControl: Dispatch<SetStateAction<boolean>>;
  setAsrProvider: Dispatch<SetStateAction<AsrProvider>>;
  setBattleModeEnabled: Dispatch<SetStateAction<boolean>>;
  setBattleProviderA: Dispatch<SetStateAction<AsrProvider>>;
  setBattleProviderB: Dispatch<SetStateAction<AsrProvider>>;
  setQwenApiKey: Dispatch<SetStateAction<string>>;
  setBailianFunAsrApiKey: Dispatch<SetStateAction<string>>;
  setDoubaoApiKey: Dispatch<SetStateAction<string>>;
  setGeminiApiKey: Dispatch<SetStateAction<string>>;
  setNvidiaNimBaseUrl: Dispatch<SetStateAction<string>>;
  setNvidiaNimApiKey: Dispatch<SetStateAction<string>>;
  setNvidiaNimTask: Dispatch<SetStateAction<NvidiaNimTask>>;
  setMainstreamAsrModel: Dispatch<SetStateAction<MainstreamAsrModel>>;
  setMainstreamAsrApiKey: Dispatch<SetStateAction<string>>;
  setMainstreamAsrBaseUrl: Dispatch<SetStateAction<string>>;
  setMainstreamAsrCustomModelName: Dispatch<SetStateAction<string>>;
};

const DEFAULT_SETTINGS: AppSettingsValues = {
  context: '',
  language: Language.AUTO,
  enableItn: false,
  autoCopy: true,
  theme: 'light',
  compressionLevel: CompressionLevel.ORIGINAL,
  trimSilence: false,
  enableLongAudioChunking: true,
  selectedDeviceId: 'default',
  echoCancellation: false,
  noiseSuppression: false,
  autoGainControl: false,
  asrProvider: AsrProvider.QWEN,
  battleModeEnabled: false,
  battleProviderA: AsrProvider.QWEN,
  battleProviderB: AsrProvider.BAILIAN_FUN_ASR,
  qwenApiKey: '',
  bailianFunAsrApiKey: '',
  doubaoApiKey: '',
  geminiApiKey: '',
  nvidiaNimBaseUrl: '',
  nvidiaNimApiKey: '',
  nvidiaNimTask: NvidiaNimTask.TRANSCRIBE,
  mainstreamAsrModel: MainstreamAsrModel.OPENAI_GPT_4O_TRANSCRIBE,
  mainstreamAsrApiKey: '',
  mainstreamAsrBaseUrl: '',
  mainstreamAsrCustomModelName: '',
};

const parseLanguage = createEnumParser(Language, DEFAULT_SETTINGS.language);
const parseCompressionLevel = createEnumParser(CompressionLevel, DEFAULT_SETTINGS.compressionLevel);
const parseAsrProvider = createEnumParser(AsrProvider, DEFAULT_SETTINGS.asrProvider);
const parseNvidiaNimTask = createEnumParser(NvidiaNimTask, DEFAULT_SETTINGS.nvidiaNimTask);
const parseMainstreamAsrModel = createEnumParser(MainstreamAsrModel, DEFAULT_SETTINGS.mainstreamAsrModel);

export function useAppSettings() {
  const [context, setContext] = usePersistentState('context', DEFAULT_SETTINGS.context);
  const [language, setLanguage] = usePersistentState('language', DEFAULT_SETTINGS.language, {
    parse: parseLanguage,
  });
  const [enableItn, setEnableItn] = usePersistentState('enableItn', DEFAULT_SETTINGS.enableItn, {
    parse: parsePersistedBooleanDefaultFalse,
    serialize: String,
  });
  const [autoCopy, setAutoCopy] = usePersistentState('autoCopy', DEFAULT_SETTINGS.autoCopy, {
    parse: parsePersistedBooleanDefaultTrue,
    serialize: String,
  });
  const [theme, setTheme] = usePersistentState<Theme>('theme', DEFAULT_SETTINGS.theme, { parse: parseTheme });
  const [compressionLevel, setCompressionLevel] = usePersistentState(
    'compressionLevel',
    DEFAULT_SETTINGS.compressionLevel,
    {
      parse: parseCompressionLevel,
    },
  );
  const [trimSilence, setTrimSilence] = usePersistentState('trimSilence', DEFAULT_SETTINGS.trimSilence, {
    parse: parsePersistedBooleanDefaultFalse,
    serialize: String,
  });
  const [enableLongAudioChunking, setEnableLongAudioChunking] = usePersistentState(
    'enableLongAudioChunking',
    DEFAULT_SETTINGS.enableLongAudioChunking,
    {
      parse: parsePersistedBooleanDefaultTrue,
      serialize: String,
    },
  );
  const [selectedDeviceId, setSelectedDeviceId] = usePersistentState(
    'selectedDeviceId',
    DEFAULT_SETTINGS.selectedDeviceId,
  );
  const [echoCancellation, setEchoCancellation] = usePersistentState(
    'echoCancellation',
    DEFAULT_SETTINGS.echoCancellation,
    {
      parse: parsePersistedBooleanDefaultFalse,
      serialize: String,
    },
  );
  const [noiseSuppression, setNoiseSuppression] = usePersistentState(
    'noiseSuppression',
    DEFAULT_SETTINGS.noiseSuppression,
    {
      parse: parsePersistedBooleanDefaultFalse,
      serialize: String,
    },
  );
  const [autoGainControl, setAutoGainControl] = usePersistentState(
    'autoGainControl',
    DEFAULT_SETTINGS.autoGainControl,
    {
      parse: parsePersistedBooleanDefaultFalse,
      serialize: String,
    },
  );
  const [asrProvider, setAsrProvider] = usePersistentState('asrProvider', DEFAULT_SETTINGS.asrProvider, {
    parse: parseAsrProvider,
  });
  const [battleModeEnabled, setBattleModeEnabled] = usePersistentState(
    'battleModeEnabled',
    DEFAULT_SETTINGS.battleModeEnabled,
    {
      parse: parsePersistedBooleanDefaultFalse,
      serialize: String,
    },
  );
  const [battleProviderA, setBattleProviderA] = usePersistentState(
    'battleProviderA',
    DEFAULT_SETTINGS.battleProviderA,
    {
      parse: parseAsrProvider,
    },
  );
  const [battleProviderB, setBattleProviderB] = usePersistentState(
    'battleProviderB',
    DEFAULT_SETTINGS.battleProviderB,
    {
      parse: parseAsrProvider,
    },
  );
  const [qwenApiKey, setQwenApiKey] = usePersistentState('qwenApiKey', DEFAULT_SETTINGS.qwenApiKey);
  const [bailianFunAsrApiKey, setBailianFunAsrApiKey] = usePersistentState(
    'bailianFunAsrApiKey',
    DEFAULT_SETTINGS.bailianFunAsrApiKey,
  );
  const [doubaoApiKey, setDoubaoApiKey] = usePersistentState('doubaoApiKey', DEFAULT_SETTINGS.doubaoApiKey);
  const [geminiApiKey, setGeminiApiKey] = usePersistentState('geminiApiKey', DEFAULT_SETTINGS.geminiApiKey);
  const [nvidiaNimBaseUrl, setNvidiaNimBaseUrl] = usePersistentState(
    'nvidiaNimBaseUrl',
    DEFAULT_SETTINGS.nvidiaNimBaseUrl,
  );
  const [nvidiaNimApiKey, setNvidiaNimApiKey] = usePersistentState('nvidiaNimApiKey', DEFAULT_SETTINGS.nvidiaNimApiKey);
  const [nvidiaNimTask, setNvidiaNimTask] = usePersistentState('nvidiaNimTask', DEFAULT_SETTINGS.nvidiaNimTask, {
    parse: parseNvidiaNimTask,
  });
  const [mainstreamAsrModel, setMainstreamAsrModel] = usePersistentState(
    'mainstreamAsrModel',
    DEFAULT_SETTINGS.mainstreamAsrModel,
    {
      parse: parseMainstreamAsrModel,
    },
  );
  const [mainstreamAsrApiKey, setMainstreamAsrApiKey] = usePersistentState(
    'mainstreamAsrApiKey',
    DEFAULT_SETTINGS.mainstreamAsrApiKey,
  );
  const [mainstreamAsrBaseUrl, setMainstreamAsrBaseUrl] = usePersistentState(
    'mainstreamAsrBaseUrl',
    DEFAULT_SETTINGS.mainstreamAsrBaseUrl,
  );
  const [mainstreamAsrCustomModelName, setMainstreamAsrCustomModelName] = usePersistentState(
    'mainstreamAsrCustomModelName',
    DEFAULT_SETTINGS.mainstreamAsrCustomModelName,
  );

  const asrConfig: AsrProviderConfig = useMemo(
    () => ({
      provider: asrProvider,
      qwenApiKey,
      bailianFunAsrApiKey,
      doubaoApiKey,
      geminiApiKey,
      nvidiaNimBaseUrl,
      nvidiaNimApiKey,
      nvidiaNimTask,
      mainstreamAsrModel,
      mainstreamAsrApiKey,
      mainstreamAsrBaseUrl,
      mainstreamAsrCustomModelName,
    }),
    [
      asrProvider,
      bailianFunAsrApiKey,
      doubaoApiKey,
      geminiApiKey,
      mainstreamAsrApiKey,
      mainstreamAsrBaseUrl,
      mainstreamAsrCustomModelName,
      mainstreamAsrModel,
      nvidiaNimApiKey,
      nvidiaNimBaseUrl,
      nvidiaNimTask,
      qwenApiKey,
    ],
  );

  const resetSettings = useCallback(() => {
    setContext(DEFAULT_SETTINGS.context);
    setLanguage(DEFAULT_SETTINGS.language);
    setEnableItn(DEFAULT_SETTINGS.enableItn);
    setAutoCopy(DEFAULT_SETTINGS.autoCopy);
    setTheme(DEFAULT_SETTINGS.theme);
    setCompressionLevel(DEFAULT_SETTINGS.compressionLevel);
    setTrimSilence(DEFAULT_SETTINGS.trimSilence);
    setEnableLongAudioChunking(DEFAULT_SETTINGS.enableLongAudioChunking);
    setSelectedDeviceId(DEFAULT_SETTINGS.selectedDeviceId);
    setEchoCancellation(DEFAULT_SETTINGS.echoCancellation);
    setNoiseSuppression(DEFAULT_SETTINGS.noiseSuppression);
    setAutoGainControl(DEFAULT_SETTINGS.autoGainControl);
    setAsrProvider(DEFAULT_SETTINGS.asrProvider);
    setBattleModeEnabled(DEFAULT_SETTINGS.battleModeEnabled);
    setBattleProviderA(DEFAULT_SETTINGS.battleProviderA);
    setBattleProviderB(DEFAULT_SETTINGS.battleProviderB);
    setQwenApiKey(DEFAULT_SETTINGS.qwenApiKey);
    setBailianFunAsrApiKey(DEFAULT_SETTINGS.bailianFunAsrApiKey);
    setDoubaoApiKey(DEFAULT_SETTINGS.doubaoApiKey);
    setGeminiApiKey(DEFAULT_SETTINGS.geminiApiKey);
    setNvidiaNimBaseUrl(DEFAULT_SETTINGS.nvidiaNimBaseUrl);
    setNvidiaNimApiKey(DEFAULT_SETTINGS.nvidiaNimApiKey);
    setNvidiaNimTask(DEFAULT_SETTINGS.nvidiaNimTask);
    setMainstreamAsrModel(DEFAULT_SETTINGS.mainstreamAsrModel);
    setMainstreamAsrApiKey(DEFAULT_SETTINGS.mainstreamAsrApiKey);
    setMainstreamAsrBaseUrl(DEFAULT_SETTINGS.mainstreamAsrBaseUrl);
    setMainstreamAsrCustomModelName(DEFAULT_SETTINGS.mainstreamAsrCustomModelName);
  }, [
    setAsrProvider,
    setAutoCopy,
    setBailianFunAsrApiKey,
    setBattleModeEnabled,
    setBattleProviderA,
    setBattleProviderB,
    setCompressionLevel,
    setContext,
    setDoubaoApiKey,
    setAutoGainControl,
    setEchoCancellation,
    setEnableLongAudioChunking,
    setEnableItn,
    setGeminiApiKey,
    setLanguage,
    setMainstreamAsrApiKey,
    setMainstreamAsrBaseUrl,
    setMainstreamAsrCustomModelName,
    setMainstreamAsrModel,
    setNoiseSuppression,
    setNvidiaNimApiKey,
    setNvidiaNimBaseUrl,
    setNvidiaNimTask,
    setQwenApiKey,
    setSelectedDeviceId,
    setTheme,
    setTrimSilence,
  ]);

  const values: AppSettingsValues = useMemo(
    () => ({
      asrProvider,
      autoCopy,
      autoGainControl,
      battleModeEnabled,
      battleProviderA,
      battleProviderB,
      bailianFunAsrApiKey,
      compressionLevel,
      context,
      doubaoApiKey,
      enableItn,
      echoCancellation,
      enableLongAudioChunking,
      geminiApiKey,
      language,
      mainstreamAsrApiKey,
      mainstreamAsrBaseUrl,
      mainstreamAsrCustomModelName,
      mainstreamAsrModel,
      noiseSuppression,
      nvidiaNimApiKey,
      nvidiaNimBaseUrl,
      nvidiaNimTask,
      qwenApiKey,
      selectedDeviceId,
      theme,
      trimSilence,
    }),
    [
      asrProvider,
      autoCopy,
      autoGainControl,
      battleModeEnabled,
      battleProviderA,
      battleProviderB,
      bailianFunAsrApiKey,
      compressionLevel,
      context,
      doubaoApiKey,
      enableItn,
      echoCancellation,
      enableLongAudioChunking,
      geminiApiKey,
      language,
      mainstreamAsrApiKey,
      mainstreamAsrBaseUrl,
      mainstreamAsrCustomModelName,
      mainstreamAsrModel,
      noiseSuppression,
      nvidiaNimApiKey,
      nvidiaNimBaseUrl,
      nvidiaNimTask,
      qwenApiKey,
      selectedDeviceId,
      theme,
      trimSilence,
    ],
  );

  const setters: AppSettingsSetters = useMemo(
    () => ({
      setAsrProvider,
      setAutoCopy,
      setAutoGainControl,
      setBattleModeEnabled,
      setBattleProviderA,
      setBattleProviderB,
      setBailianFunAsrApiKey,
      setCompressionLevel,
      setContext,
      setDoubaoApiKey,
      setEchoCancellation,
      setEnableLongAudioChunking,
      setEnableItn,
      setGeminiApiKey,
      setLanguage,
      setMainstreamAsrApiKey,
      setMainstreamAsrBaseUrl,
      setMainstreamAsrCustomModelName,
      setMainstreamAsrModel,
      setNoiseSuppression,
      setNvidiaNimApiKey,
      setNvidiaNimBaseUrl,
      setNvidiaNimTask,
      setQwenApiKey,
      setSelectedDeviceId,
      setTheme,
      setTrimSilence,
    }),
    [
      setAsrProvider,
      setAutoCopy,
      setAutoGainControl,
      setBattleModeEnabled,
      setBattleProviderA,
      setBattleProviderB,
      setBailianFunAsrApiKey,
      setCompressionLevel,
      setContext,
      setDoubaoApiKey,
      setEchoCancellation,
      setEnableLongAudioChunking,
      setEnableItn,
      setGeminiApiKey,
      setLanguage,
      setMainstreamAsrApiKey,
      setMainstreamAsrBaseUrl,
      setMainstreamAsrCustomModelName,
      setMainstreamAsrModel,
      setNoiseSuppression,
      setNvidiaNimApiKey,
      setNvidiaNimBaseUrl,
      setNvidiaNimTask,
      setQwenApiKey,
      setSelectedDeviceId,
      setTheme,
      setTrimSilence,
    ],
  );

  return {
    asrConfig,
    resetSettings,
    setters,
    values,
  };
}
