import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  createBattleProviderConfig,
  createInitialBattleSides,
  createFailedBattleSide,
  createSucceededBattleSide,
  getBattleProviderError,
} from '../services/battleMode.ts';
import {
  AsrProvider,
  MainstreamAsrModel,
  NvidiaNimTask,
  type AsrProviderConfig,
  type TranscriptionResult,
} from '../types.ts';

const baseConfig: AsrProviderConfig = {
  provider: AsrProvider.QWEN,
  qwenApiKey: 'qwen-key',
  bailianFunAsrApiKey: 'fun-asr-key',
  doubaoApiKey: 'doubao-key',
  doubaoAccessKey: 'doubao-access',
  geminiApiKey: 'gemini-key',
  nvidiaNimBaseUrl: 'https://nim.example.com/v1',
  nvidiaNimApiKey: 'nim-key',
  nvidiaNimTask: NvidiaNimTask.TRANSCRIBE,
  mainstreamAsrModel: MainstreamAsrModel.OPENAI_GPT_4O_TRANSCRIBE,
  mainstreamAsrApiKey: 'mainstream-key',
  mainstreamAsrBaseUrl: '',
  mainstreamAsrCustomModelName: '',
};

describe('battle mode helpers', () => {
  test('creates provider-specific configs without mutating the current config', () => {
    const battleConfig = createBattleProviderConfig(baseConfig, AsrProvider.BAILIAN_FUN_ASR);

    assert.equal(battleConfig.provider, AsrProvider.BAILIAN_FUN_ASR);
    assert.equal(battleConfig.qwenApiKey, 'qwen-key');
    assert.equal(battleConfig.bailianFunAsrApiKey, 'fun-asr-key');
    assert.equal(baseConfig.provider, AsrProvider.QWEN);
  });

  test('requires two distinct battle providers', () => {
    assert.equal(getBattleProviderError(AsrProvider.QWEN, AsrProvider.QWEN), '请选择两个不同的模型进行 Battle。');
    assert.equal(getBattleProviderError(AsrProvider.QWEN, AsrProvider.DOUBAO), '');
  });

  test('creates stable initial side state with provider labels', () => {
    assert.deepEqual(createInitialBattleSides(AsrProvider.QWEN, AsrProvider.DOUBAO), [
      {
        id: 'a',
        provider: AsrProvider.QWEN,
        providerLabel: 'Qwen',
        status: 'idle',
        transcription: '',
        detectedLanguage: '',
        segments: [],
        elapsedTime: null,
        error: '',
      },
      {
        id: 'b',
        provider: AsrProvider.DOUBAO,
        providerLabel: '豆包',
        status: 'idle',
        transcription: '',
        detectedLanguage: '',
        segments: [],
        elapsedTime: null,
        error: '',
      },
    ]);
  });

  test('maps provider results into succeeded side state', () => {
    const result: TranscriptionResult = {
      transcription: '欢迎使用 ASR Studio。',
      detectedLanguage: '中文',
      segments: [{ id: '1', text: '欢迎使用 ASR Studio。', startTime: 0, endTime: 2 }],
    };

    assert.deepEqual(createSucceededBattleSide('a', AsrProvider.BAILIAN_FUN_ASR, result, 3.25), {
      id: 'a',
      provider: AsrProvider.BAILIAN_FUN_ASR,
      providerLabel: '阿里百炼 FunASR',
      status: 'done',
      transcription: '欢迎使用 ASR Studio。',
      detectedLanguage: '中文',
      segments: [{ id: '1', text: '欢迎使用 ASR Studio。', startTime: 0, endTime: 2 }],
      elapsedTime: 3.25,
      error: '',
    });
  });

  test('maps thrown values into failed side state', () => {
    assert.deepEqual(createFailedBattleSide('b', AsrProvider.GEMINI, new Error('quota exceeded'), 1.5), {
      id: 'b',
      provider: AsrProvider.GEMINI,
      providerLabel: 'Gemini',
      status: 'error',
      transcription: '',
      detectedLanguage: '',
      segments: [],
      elapsedTime: 1.5,
      error: 'quota exceeded',
    });

    assert.equal(createFailedBattleSide('b', AsrProvider.GEMINI, 'bad response', 1.5).error, 'bad response');
  });
});
