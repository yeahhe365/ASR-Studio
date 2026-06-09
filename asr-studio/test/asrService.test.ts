import assert from 'node:assert/strict';
import { afterEach, describe, test } from 'node:test';

import { QWEN_ASR_API_URL } from '../constants.ts';
import { transcribeAudio } from '../services/asrService.ts';
import { AsrProvider, Language, MainstreamAsrModel, NvidiaNimTask, type AsrProviderConfig } from '../types.ts';

const originalFetch = globalThis.fetch;
const originalFileReader = globalThis.FileReader;
const originalConsoleWarn = console.warn;

class MockFileReader {
  result: string | ArrayBuffer | null = null;
  onload: null | (() => void) = null;
  onerror: null | ((error: Error) => void) = null;

  readAsDataURL(file: File) {
    void file;
    this.result = 'data:audio/webm;base64,dGVzdC1hdWRpbw==';
    queueMicrotask(() => this.onload?.());
  }
}

const qwenConfig: AsrProviderConfig = {
  provider: AsrProvider.QWEN,
  qwenApiKey: 'qwen-key',
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
};

afterEach(() => {
  globalThis.fetch = originalFetch;
  globalThis.FileReader = originalFileReader;
  console.warn = originalConsoleWarn;
});

describe('transcribeAudio', () => {
  test('does not retry deterministic no-speech provider failures', async () => {
    const progressMessages: string[] = [];
    let fetchCalls = 0;

    console.warn = () => {};
    globalThis.FileReader = MockFileReader as unknown as typeof FileReader;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      assert.equal(String(input), QWEN_ASR_API_URL);
      fetchCalls += 1;
      return new Response(
        JSON.stringify({ error: { message: 'ASR_RESPONSE_HAVE_NO_WORDS: ASR_RESPONSE_HAVE_NO_WORDS' } }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }) as typeof fetch;

    await assert.rejects(
      () =>
        transcribeAudio(
          new File(['audio'], 'meeting.webm', { type: 'audio/webm' }),
          '',
          Language.AUTO,
          false,
          qwenConfig,
          (message) => progressMessages.push(message),
          new AbortController().signal,
        ),
      /没有检测到可识别语音/,
    );

    assert.equal(fetchCalls, 1);
    assert(progressMessages.includes('音频中没有检测到可识别语音，请检查麦克风、音量或重新录制。'));
    assert(!progressMessages.some((message) => message.includes('秒后重试')));
  });

  test('aborts immediately during retry backoff', async () => {
    const controller = new AbortController();
    const progressMessages: string[] = [];
    let fetchCalls = 0;

    console.warn = () => {};
    globalThis.FileReader = MockFileReader as unknown as typeof FileReader;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      assert.equal(String(input), QWEN_ASR_API_URL);
      fetchCalls += 1;
      return new Response(JSON.stringify({ error: { message: 'temporary failure' } }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }) as typeof fetch;

    const request = transcribeAudio(
      new File(['audio'], 'meeting.webm', { type: 'audio/webm' }),
      '',
      Language.AUTO,
      false,
      qwenConfig,
      (message) => {
        progressMessages.push(message);
        if (message.includes('秒后重试')) {
          controller.abort();
        }
      },
      controller.signal,
    );

    await assert.rejects(request, (error) => error instanceof Error && error.name === 'AbortError');
    assert.equal(fetchCalls, 1);
    assert(progressMessages.includes('识别出错，将在 2 秒后重试...'));
  });
});
