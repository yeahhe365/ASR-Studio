import React from 'react';
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';

import { ApiSettingsSection } from '../components/settings/ApiSettingsSection.tsx';
import type { AppSettingsSetters, AppSettingsValues } from '../hooks/useAppSettings.ts';
import { AsrProvider, CompressionLevel, Language, MainstreamAsrModel, NvidiaNimTask, type Theme } from '../types.ts';

const noopSetter = (() => undefined) as React.Dispatch<React.SetStateAction<never>>;

const values: AppSettingsValues = {
  context: '',
  language: Language.AUTO,
  enableItn: false,
  autoCopy: true,
  theme: 'light' as Theme,
  compressionLevel: CompressionLevel.ORIGINAL,
  trimSilence: false,
  enableLongAudioChunking: true,
  selectedDeviceId: 'default',
  echoCancellation: false,
  noiseSuppression: false,
  autoGainControl: false,
  asrProvider: AsrProvider.BAILIAN_FUN_ASR,
  battleModeEnabled: false,
  battleProviderA: AsrProvider.QWEN,
  battleProviderB: AsrProvider.BAILIAN_FUN_ASR,
  qwenApiKey: '',
  bailianFunAsrApiKey: '',
  doubaoApiKey: '',
  doubaoAccessKey: '',
  geminiApiKey: '',
  nvidiaNimBaseUrl: '',
  nvidiaNimApiKey: '',
  nvidiaNimTask: NvidiaNimTask.TRANSCRIBE,
  mainstreamAsrModel: MainstreamAsrModel.OPENAI_GPT_4O_TRANSCRIBE,
  mainstreamAsrApiKey: '',
  mainstreamAsrBaseUrl: '',
  mainstreamAsrCustomModelName: '',
};

const setters: AppSettingsSetters = {
  setContext: noopSetter,
  setLanguage: noopSetter,
  setEnableItn: noopSetter,
  setAutoCopy: noopSetter,
  setTheme: noopSetter,
  setCompressionLevel: noopSetter,
  setTrimSilence: noopSetter,
  setEnableLongAudioChunking: noopSetter,
  setSelectedDeviceId: noopSetter,
  setEchoCancellation: noopSetter,
  setNoiseSuppression: noopSetter,
  setAutoGainControl: noopSetter,
  setAsrProvider: noopSetter,
  setBattleModeEnabled: noopSetter,
  setBattleProviderA: noopSetter,
  setBattleProviderB: noopSetter,
  setQwenApiKey: noopSetter,
  setBailianFunAsrApiKey: noopSetter,
  setDoubaoApiKey: noopSetter,
  setDoubaoAccessKey: noopSetter,
  setGeminiApiKey: noopSetter,
  setNvidiaNimBaseUrl: noopSetter,
  setNvidiaNimApiKey: noopSetter,
  setNvidiaNimTask: noopSetter,
  setMainstreamAsrModel: noopSetter,
  setMainstreamAsrApiKey: noopSetter,
  setMainstreamAsrBaseUrl: noopSetter,
  setMainstreamAsrCustomModelName: noopSetter,
};

describe('settings controls', () => {
  test('stacks the API provider selector so long option sets do not squeeze the label', () => {
    const html = renderToStaticMarkup(
      React.createElement(ApiSettingsSection, {
        values,
        setters,
        disabled: false,
      }),
    );

    assert.match(html, /sm:flex-col sm:items-stretch sm:justify-start/);
    assert.match(html, /custom-scrollbar w-full overflow-x-auto/);
    assert.match(html, /min-w-max/);
  });
});
