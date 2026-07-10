import React from 'react';
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';

import { SettingsPanel } from '../components/SettingsPanel.tsx';
import { ApiSettingsSection } from '../components/settings/ApiSettingsSection.tsx';
import { tabs } from '../components/settings/settingsConfig.ts';
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
  test('uses AMC matching icons for API and interface settings tabs', () => {
    const tabsById = new Map(tabs.map((tab) => [tab.id, tab]));

    assert.equal(tabsById.get('api')?.Icon.displayName, 'KeyRound');
    assert.equal(tabsById.get('interface')?.Icon.displayName, 'LayoutPanelLeft');
  });

  test('renders settings tab icons with AMC active and inactive stroke weights', () => {
    const html = renderToStaticMarkup(
      React.createElement(SettingsPanel, {
        isOpen: true,
        onClose: () => undefined,
        values,
        setters,
        audioDevices: [],
        onClearHistory: async () => true,
        onClearTranscriptionCache: async () => true,
        onClearRecordingCache: async () => true,
        onImportHistory: async () => 0,
        onRestoreDefaults: () => undefined,
        storageEstimate: null,
        disabled: false,
        canInstall: false,
        onInstallApp: () => undefined,
      }),
    );

    assert.match(html, /aria-selected="true"[\s\S]*?stroke-width="2"[\s\S]*?<span>API<\/span>/);
    assert.match(html, /aria-selected="false"[\s\S]*?stroke-width="1.5"[\s\S]*?<span>界面<\/span>/);
  });

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
