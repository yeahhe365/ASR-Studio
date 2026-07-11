import React from 'react';
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';

import { SettingsPanel } from '../components/SettingsPanel.tsx';
import { ApiSettingsSection } from '../components/settings/ApiSettingsSection.tsx';
import { RecognitionSettingsSection } from '../components/settings/RecognitionSettingsSection.tsx';
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

  test('puts credentials and diagnostics before collapsible capability docs on the API tab', () => {
    const html = renderToStaticMarkup(
      React.createElement(ApiSettingsSection, {
        values,
        setters,
        disabled: false,
      }),
    );

    const providerSelectIndex = html.indexOf('id="asr-provider-setting"');
    const credentialsInputIndex = html.indexOf('id="bailian-fun-asr-api-key-setting"');
    const diagnosticsIndex = html.indexOf('配置诊断');
    const capabilityDocsIndex = html.indexOf('能力说明与对比');

    assert.ok(providerSelectIndex >= 0, 'provider select should render');
    assert.ok(credentialsInputIndex >= 0, 'credentials input should render for the active provider');
    assert.ok(diagnosticsIndex >= 0, 'diagnostics should render');
    assert.ok(capabilityDocsIndex >= 0, 'capability docs should render');
    assert.match(html, /aria-expanded="false"/);
    assert.equal(html.includes('提供商能力矩阵'), false, 'capability matrix stays collapsed by default');
    assert.ok(providerSelectIndex < credentialsInputIndex, 'provider select should come before credentials');
    assert.ok(credentialsInputIndex < diagnosticsIndex, 'credentials should come before diagnostics');
    assert.ok(diagnosticsIndex < capabilityDocsIndex, 'diagnostics should come before capability docs');
    assert.doesNotMatch(html, /custom-scrollbar w-full overflow-x-auto[\s\S]*?min-w-max/);
  });

  test('prioritizes language and audio over battle mode on the recognition tab', () => {
    const html = renderToStaticMarkup(
      React.createElement(RecognitionSettingsSection, {
        values,
        setters,
        audioDevices: [],
        disabled: false,
      }),
    );

    const languageIndex = html.indexOf('语言与文本');
    const audioIndex = html.indexOf('>音频<');
    const browserAudioIndex = html.indexOf('浏览器录音处理');
    const battleIndex = html.indexOf('对战模式');

    assert.ok(languageIndex >= 0);
    assert.ok(audioIndex >= 0);
    assert.ok(browserAudioIndex >= 0);
    assert.ok(battleIndex >= 0);
    assert.ok(languageIndex < audioIndex);
    assert.ok(audioIndex < browserAudioIndex);
    assert.ok(browserAudioIndex < battleIndex);
    assert.equal(html.includes('回声消除'), false, 'browser audio controls stay collapsed by default');
    assert.equal(html.includes('启用对战模式'), false, 'battle controls stay collapsed when disabled');
  });
});
