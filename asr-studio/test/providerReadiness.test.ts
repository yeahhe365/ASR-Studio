import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { getProviderReadinessError } from '../services/providerReadiness.ts';
import { createRemoteAudioFile } from '../services/remoteAudioFile.ts';
import { AsrProvider, MainstreamAsrModel, NvidiaNimTask, type AsrProviderConfig } from '../types.ts';

const createConfig = (patch: Partial<AsrProviderConfig> = {}): AsrProviderConfig => ({
  provider: AsrProvider.QWEN,
  qwenApiKey: 'qwen-key',
  bailianFunAsrApiKey: 'bailian-key',
  doubaoApiKey: 'doubao-key',
  geminiApiKey: 'gemini-key',
  nvidiaNimBaseUrl: 'http://localhost:9000',
  nvidiaNimApiKey: '',
  nvidiaNimTask: NvidiaNimTask.TRANSCRIBE,
  mainstreamAsrModel: MainstreamAsrModel.OPENAI_GPT_4O_TRANSCRIBE,
  mainstreamAsrApiKey: '',
  mainstreamAsrBaseUrl: '',
  ...patch,
});

const localAudio = new File(['audio'], 'sample.wav', { type: 'audio/wav' });
const remoteAudio = createRemoteAudioFile('https://example.com/sample.wav');

describe('getProviderReadinessError', () => {
  test('requires provider credentials before transcription', () => {
    assert.match(
      getProviderReadinessError(createConfig({ provider: AsrProvider.QWEN, qwenApiKey: '' }), localAudio) || '',
      /Qwen API Key/,
    );
    assert.match(
      getProviderReadinessError(
        createConfig({ provider: AsrProvider.BAILIAN_FUN_ASR, bailianFunAsrApiKey: '' }),
        localAudio,
      ) || '',
      /百炼 FunASR API Key/,
    );
    assert.match(
      getProviderReadinessError(createConfig({ provider: AsrProvider.GEMINI, geminiApiKey: '' }), localAudio) || '',
      /Gemini API Key/,
    );
    assert.match(
      getProviderReadinessError(createConfig({ provider: AsrProvider.DOUBAO, doubaoApiKey: '' }), remoteAudio) || '',
      /豆包 API Key/,
    );
  });

  test('limits remote audio URLs to providers that accept URLs', () => {
    assert.match(
      getProviderReadinessError(createConfig({ provider: AsrProvider.QWEN }), remoteAudio) || '',
      /不支持远程音频 URL/,
    );
    assert.equal(getProviderReadinessError(createConfig({ provider: AsrProvider.BAILIAN_FUN_ASR }), remoteAudio), null);
    assert.equal(getProviderReadinessError(createConfig({ provider: AsrProvider.DOUBAO }), remoteAudio), null);
    assert.equal(
      getProviderReadinessError(
        createConfig({
          provider: AsrProvider.MAINSTREAM,
          mainstreamAsrApiKey: 'assemblyai-key',
          mainstreamAsrModel: MainstreamAsrModel.ASSEMBLYAI_UNIVERSAL_3_PRO,
        }),
        remoteAudio,
      ),
      null,
    );
  });

  test('allows local audio for Doubao standard 2.0 base64 submission', () => {
    assert.equal(getProviderReadinessError(createConfig({ provider: AsrProvider.DOUBAO }), localAudio), null);

    const localAudioToConvert = new File(['audio'], 'sample.webm', { type: 'audio/webm' });
    assert.equal(getProviderReadinessError(createConfig({ provider: AsrProvider.DOUBAO }), localAudioToConvert), null);
  });

  test('allows local audio for Bailian FunASR base64 submission', () => {
    assert.equal(getProviderReadinessError(createConfig({ provider: AsrProvider.BAILIAN_FUN_ASR }), localAudio), null);
  });

  test('rejects local or private Doubao remote audio URLs before submit', () => {
    const privateRemoteAudio = createRemoteAudioFile('http://127.0.0.1/sample.wav');

    assert.match(
      getProviderReadinessError(createConfig({ provider: AsrProvider.DOUBAO }), privateRemoteAudio) || '',
      /localhost、内网或回环地址/,
    );
  });

  test('rejects unsupported Doubao remote audio formats before submit', () => {
    const unsupportedRemoteAudio = createRemoteAudioFile('https://example.com/sample.m4a');

    assert.match(
      getProviderReadinessError(createConfig({ provider: AsrProvider.DOUBAO }), unsupportedRemoteAudio) || '',
      /raw\/wav\/mp3\/ogg/,
    );
  });

  test('validates NVIDIA NIM HTTP base URLs', () => {
    assert.match(
      getProviderReadinessError(
        createConfig({ provider: AsrProvider.NVIDIA_NIM, nvidiaNimBaseUrl: 'localhost:9000' }),
        localAudio,
      ) || '',
      /http:\/\/ 或 https:\/\//,
    );
    assert.equal(getProviderReadinessError(createConfig({ provider: AsrProvider.NVIDIA_NIM }), localAudio), null);
  });

  test('requires a custom OpenAI-compatible model name and base URL', () => {
    assert.match(
      getProviderReadinessError(
        createConfig({
          provider: AsrProvider.MAINSTREAM,
          mainstreamAsrModel: 'custom:openai-compatible' as MainstreamAsrModel,
          mainstreamAsrApiKey: 'gateway-key',
          mainstreamAsrBaseUrl: 'https://gateway.example.com/v1/audio/transcriptions',
          mainstreamAsrCustomModelName: '',
        } as Partial<AsrProviderConfig>),
        localAudio,
      ) || '',
      /自定义模型名称/,
    );

    assert.match(
      getProviderReadinessError(
        createConfig({
          provider: AsrProvider.MAINSTREAM,
          mainstreamAsrModel: 'custom:openai-compatible' as MainstreamAsrModel,
          mainstreamAsrApiKey: 'gateway-key',
          mainstreamAsrBaseUrl: '',
          mainstreamAsrCustomModelName: 'qwen3-asr-flash',
        } as Partial<AsrProviderConfig>),
        localAudio,
      ) || '',
      /自定义 Base URL/,
    );

    assert.equal(
      getProviderReadinessError(
        createConfig({
          provider: AsrProvider.MAINSTREAM,
          mainstreamAsrModel: 'custom:openai-compatible' as MainstreamAsrModel,
          mainstreamAsrApiKey: 'gateway-key',
          mainstreamAsrBaseUrl: 'https://gateway.example.com/v1/audio/transcriptions',
          mainstreamAsrCustomModelName: 'qwen3-asr-flash',
        } as Partial<AsrProviderConfig>),
        localAudio,
      ),
      null,
    );
  });
});
