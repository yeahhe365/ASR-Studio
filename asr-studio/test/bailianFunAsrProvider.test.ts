import assert from 'node:assert/strict';
import { afterEach, describe, test } from 'node:test';

import { BAILIAN_FUN_ASR_MODEL, BAILIAN_FUN_ASR_TASK_URL, BAILIAN_FUN_ASR_TRANSCRIPTION_URL } from '../constants.ts';
import { transcribeWithBailianFunAsr } from '../services/providers/bailianFunAsrProvider.ts';
import { createRemoteAudioFile } from '../services/remoteAudioFile.ts';
import { Language } from '../types.ts';

type FetchCall = {
  input: RequestInfo | URL;
  init?: RequestInit;
};

const originalFetch = globalThis.fetch;
const originalFileReader = globalThis.FileReader;
const originalWindow = globalThis.window;
const TRANSCRIPTION_RESULT_URL = 'https://dashscope.aliyuncs.com/api/v1/tasks/task-123/transcription';
const REMOTE_TRANSCRIPTION_RESULT_URL = 'https://dashscope.aliyuncs.com/api/v1/tasks/task-remote/transcription';

class MockFileReader {
  result: string | ArrayBuffer | null = null;
  onload: null | (() => void) = null;
  onerror: null | ((error: Error) => void) = null;

  readAsDataURL(file: File) {
    void file;
    this.result = 'data:audio/wav;base64,dGVzdC1hdWRpbw==';
    queueMicrotask(() => this.onload?.());
  }
}

afterEach(() => {
  globalThis.fetch = originalFetch;
  globalThis.FileReader = originalFileReader;
  if (originalWindow === undefined) {
    Reflect.deleteProperty(globalThis, 'window');
  } else {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: originalWindow,
    });
  }
});

describe('transcribeWithBailianFunAsr', () => {
  test('routes DashScope API calls through the same-origin proxy in browsers', async () => {
    const calls: FetchCall[] = [];
    globalThis.FileReader = MockFileReader as unknown as typeof FileReader;
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: {
        location: {
          origin: 'http://127.0.0.1:8081',
        },
      },
    });
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      calls.push({ input, init });

      const url = String(input);
      if (url === '/dashscope/api/v1/tasks/task-browser/transcription') {
        return new Response(JSON.stringify({ transcripts: [{ text: 'browser proxy result' }] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (url === '/dashscope/api/v1/tasks/task-browser') {
        return new Response(
          JSON.stringify({
            output: {
              task_status: 'SUCCEEDED',
              results: [
                { transcription_url: 'https://dashscope.aliyuncs.com/api/v1/tasks/task-browser/transcription' },
              ],
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }

      if (url === '/dashscope/api/v1/services/audio/asr/transcription') {
        return new Response(JSON.stringify({ output: { task_id: 'task-browser', task_status: 'PENDING' } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ message: `Unexpected URL: ${url}` }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }) as typeof fetch;

    const result = await transcribeWithBailianFunAsr(
      new File(['audio'], 'meeting.wav', { type: 'audio/wav' }),
      '',
      Language.CHINESE,
      false,
      { apiKey: 'bailian-key' },
      new AbortController().signal,
    );

    assert.equal(result.transcription, 'browser proxy result');
    assert.deepEqual(
      calls.map((call) => String(call.input)),
      [
        '/dashscope/api/v1/services/audio/asr/transcription',
        '/dashscope/api/v1/tasks/task-browser',
        '/dashscope/api/v1/tasks/task-browser/transcription',
      ],
    );
  });

  test('submits local audio as a base64 data URL and parses task result segments', async () => {
    const calls: FetchCall[] = [];
    globalThis.FileReader = MockFileReader as unknown as typeof FileReader;
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      calls.push({ input, init });

      const url = String(input);
      if (url === TRANSCRIPTION_RESULT_URL) {
        return new Response(
          JSON.stringify({
            transcripts: [
              {
                text: '欢迎使用 ASR Studio。',
                sentences: [
                  {
                    begin_time: 0,
                    end_time: 1200,
                    text: '欢迎使用 ASR Studio。',
                  },
                ],
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }

      if (url === `${BAILIAN_FUN_ASR_TASK_URL}/task-123`) {
        return new Response(
          JSON.stringify({
            output: {
              task_id: 'task-123',
              task_status: 'SUCCEEDED',
              results: [
                {
                  file_url: 'data:audio/wav;base64,dGVzdC1hdWRpbw==',
                  transcription_url: TRANSCRIPTION_RESULT_URL,
                },
              ],
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }

      return new Response(
        JSON.stringify({
          output: {
            task_id: 'task-123',
            task_status: 'PENDING',
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }) as typeof fetch;

    const result = await transcribeWithBailianFunAsr(
      new File(['audio'], 'meeting.wav', { type: 'audio/wav' }),
      '项目名是 ASR Studio',
      Language.CHINESE,
      true,
      { apiKey: ' bailian-key ' },
      new AbortController().signal,
    );

    assert.deepEqual(result, {
      transcription: '欢迎使用 ASR Studio。',
      detectedLanguage: 'zh',
      segments: [
        {
          id: 'sentence-1',
          text: '欢迎使用 ASR Studio。',
          startTime: 0,
          endTime: 1.2,
        },
      ],
    });
    assert.equal(calls.length, 3);
    assert.equal(String(calls[0].input), BAILIAN_FUN_ASR_TRANSCRIPTION_URL);
    assert.equal(calls[0].init?.method, 'POST');
    assert.deepEqual(calls[0].init?.headers, {
      Authorization: 'Bearer bailian-key',
      'Content-Type': 'application/json',
      'X-DashScope-Async': 'enable',
    });

    const body = JSON.parse(String(calls[0].init?.body));
    assert.equal(body.model, BAILIAN_FUN_ASR_MODEL);
    assert.deepEqual(body.input.file_urls, ['data:audio/wav;base64,dGVzdC1hdWRpbw==']);
    assert.deepEqual(body.parameters, {
      language_hints: ['zh'],
      disfluency_removal_enabled: false,
      inverse_text_normalization_enabled: true,
      diarization_enabled: false,
      timestamp_alignment_enabled: true,
      sentence_timestamp_enabled: true,
    });
    assert.match(body.input.context, /ASR Studio/);
    assert.equal(String(calls[1].input), `${BAILIAN_FUN_ASR_TASK_URL}/task-123`);
    assert.equal(calls[1].init?.method, 'GET');
  });

  test('submits remote audio URLs without converting them to base64', async () => {
    const calls: FetchCall[] = [];
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      calls.push({ input, init });
      if (String(input) === `${BAILIAN_FUN_ASR_TASK_URL}/task-remote`) {
        return new Response(
          JSON.stringify({
            output: {
              task_status: 'SUCCEEDED',
              results: [{ transcription_url: REMOTE_TRANSCRIPTION_RESULT_URL }],
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }

      if (String(input) === REMOTE_TRANSCRIPTION_RESULT_URL && init?.method === 'GET') {
        return new Response(JSON.stringify({ transcripts: [{ text: 'remote result' }] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ output: { task_id: 'task-remote', task_status: 'PENDING' } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }) as typeof fetch;

    const result = await transcribeWithBailianFunAsr(
      createRemoteAudioFile('https://example.com/audio.wav'),
      '',
      Language.AUTO,
      false,
      { apiKey: 'bailian-key' },
      new AbortController().signal,
    );

    assert.equal(result.transcription, 'remote result');
    const body = JSON.parse(String(calls[0].init?.body));
    assert.deepEqual(body.input.file_urls, ['https://example.com/audio.wav']);
  });

  test('surfaces failed task details', async () => {
    globalThis.FileReader = MockFileReader as unknown as typeof FileReader;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      if (String(input) === `${BAILIAN_FUN_ASR_TASK_URL}/task-failed`) {
        return new Response(
          JSON.stringify({
            output: {
              task_status: 'FAILED',
              message: 'Invalid file URL',
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }

      return new Response(JSON.stringify({ output: { task_id: 'task-failed', task_status: 'PENDING' } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }) as typeof fetch;

    await assert.rejects(
      () =>
        transcribeWithBailianFunAsr(
          new File(['audio'], 'meeting.wav', { type: 'audio/wav' }),
          '',
          Language.AUTO,
          false,
          { apiKey: 'bailian-key' },
          new AbortController().signal,
        ),
      /Invalid file URL/,
    );
  });
});
