import {
  BAILIAN_FUN_ASR_MODEL,
  BAILIAN_FUN_ASR_TASK_URL,
  BAILIAN_FUN_ASR_TRANSCRIPTION_URL,
  DASHSCOPE_BROWSER_PROXY_PATH,
} from '../../constants';
import { Language, type TranscriptionResult, type TranscriptionSegment } from '../../types';
import { fileToBase64DataUrl } from '../fileUtils';
import { getAudioSourceUrl } from '../remoteAudioFile';

type BailianFunAsrConfig = {
  apiKey: string;
};

type BailianTaskResponse = {
  output?: {
    task_id?: string;
    task_status?: string;
    code?: string;
    message?: string;
    text?: string;
    results?: Array<{
      transcription_url?: string;
      file_url?: string;
      subtask_status?: string;
      code?: string;
      message?: string;
    }>;
  };
  request_id?: string;
  code?: string;
  message?: string;
  error?: {
    code?: string;
    message?: string;
  };
};

type BailianSentence = {
  text?: string;
  begin_time?: number | string;
  end_time?: number | string;
  start_time?: number | string;
  startTime?: number | string;
  endTime?: number | string;
  speaker?: number | string;
  speaker_id?: number | string;
  confidence?: number | string;
};

type BailianTranscript = {
  text?: string;
  language?: string;
  sentences?: BailianSentence[];
};

type BailianTranscriptionResult = {
  text?: string;
  language?: string;
  transcripts?: BailianTranscript[];
  sentences?: BailianSentence[];
  result?: {
    text?: string;
    language?: string;
    sentences?: BailianSentence[];
  };
};

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 120;
const SUCCEEDED_STATUSES = new Set(['SUCCEEDED', 'SUCCESS', 'COMPLETED']);
const FAILED_STATUSES = new Set(['FAILED', 'FAILURE', 'ERROR']);
const DASHSCOPE_API_ORIGIN = 'https://dashscope.aliyuncs.com';

const languageMap: Partial<Record<Language, string>> = {
  [Language.CHINESE]: 'zh',
  [Language.ENGLISH]: 'en',
  [Language.JAPANESE]: 'ja',
  [Language.KOREAN]: 'ko',
  [Language.SPANISH]: 'es',
  [Language.FRENCH]: 'fr',
  [Language.GERMAN]: 'de',
  [Language.ARABIC]: 'ar',
  [Language.ITALIAN]: 'it',
  [Language.RUSSIAN]: 'ru',
  [Language.PORTUGUESE]: 'pt',
};

const createAbortError = () => new DOMException('Aborted', 'AbortError');

const waitForPollInterval = (signal: AbortSignal) => {
  return new Promise<void>((resolve, reject) => {
    const handleAbort = () => {
      globalThis.clearTimeout(timeoutId);
      reject(createAbortError());
    };
    const timeoutId = globalThis.setTimeout(() => {
      signal.removeEventListener('abort', handleAbort);
      resolve();
    }, POLL_INTERVAL_MS);

    signal.addEventListener('abort', handleAbort, { once: true });
  });
};

const getApiLanguage = (language: Language) => {
  return language === Language.AUTO ? null : languageMap[language] || language;
};

const createAuthHeaders = (apiKey: string) => ({
  Authorization: `Bearer ${apiKey}`,
});

const isBrowserRuntime = () => typeof window !== 'undefined' && Boolean(window.location?.origin);

const getDashScopeRequestUrl = (url: string) => {
  if (!isBrowserRuntime()) {
    return url;
  }

  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.origin === DASHSCOPE_API_ORIGIN) {
      return `${DASHSCOPE_BROWSER_PROXY_PATH}${parsedUrl.pathname}${parsedUrl.search}`;
    }
  } catch {
    return url;
  }

  return url;
};

const parseResponseBody = async <T>(response: Response) => {
  const responseText = await response.text();
  if (!responseText.trim()) {
    return null;
  }

  try {
    return JSON.parse(responseText) as T;
  } catch {
    return responseText as T;
  }
};

const getErrorDetail = (body: unknown) => {
  if (!body) {
    return null;
  }

  if (typeof body === 'string') {
    return body.trim() || null;
  }

  if (typeof body !== 'object') {
    return null;
  }

  const record = body as {
    error?: { message?: string; code?: string } | string;
    code?: string;
    message?: string;
    output?: { code?: string; message?: string; results?: Array<{ code?: string; message?: string }> };
  };

  if (typeof record.error === 'string') {
    return record.error;
  }

  const message = record.error?.message || record.output?.message || record.message;
  const code = record.error?.code || record.output?.code || record.code;
  const resultMessages = record.output?.results
    ?.map((result) => [result.code, result.message].filter(Boolean).join(': '))
    .filter(Boolean)
    .join('; ');

  return resultMessages || [code, message].filter(Boolean).join(': ') || null;
};

const parseFiniteNumber = (value: number | string | undefined) => {
  if (value === undefined || value === '') {
    return undefined;
  }

  const parsedValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : undefined;
};

const parseMilliseconds = (value: number | string | undefined) => {
  const parsedValue = parseFiniteNumber(value);
  return parsedValue === undefined ? undefined : Math.max(0, parsedValue / 1000);
};

const getSentenceSpeaker = (sentence: BailianSentence) => {
  const speaker = sentence.speaker ?? sentence.speaker_id;
  return speaker === undefined || speaker === '' ? undefined : String(speaker);
};

const createSegmentsFromSentences = (sentences?: BailianSentence[]): TranscriptionSegment[] => {
  if (!sentences?.length) {
    return [];
  }

  return sentences
    .map((sentence, index): TranscriptionSegment | null => {
      const text = sentence.text?.trim();
      if (!text) {
        return null;
      }
      const speaker = getSentenceSpeaker(sentence);
      const confidence = parseFiniteNumber(sentence.confidence);

      return {
        id: `sentence-${index + 1}`,
        text,
        startTime: parseMilliseconds(sentence.begin_time ?? sentence.start_time ?? sentence.startTime),
        endTime: parseMilliseconds(sentence.end_time ?? sentence.endTime),
        ...(speaker !== undefined ? { speaker } : {}),
        ...(confidence !== undefined ? { confidence } : {}),
      };
    })
    .filter((segment): segment is TranscriptionSegment => Boolean(segment));
};

const getTranscripts = (result: BailianTranscriptionResult) => {
  return Array.isArray(result.transcripts) ? result.transcripts : [];
};

const getTranscriptText = (result: BailianTranscriptionResult) => {
  const directText = result.text?.trim() || result.result?.text?.trim();
  if (directText) {
    return directText;
  }

  const transcriptText = getTranscripts(result)
    .map((transcript) => transcript.text?.trim() || '')
    .filter(Boolean)
    .join('\n')
    .trim();
  if (transcriptText) {
    return transcriptText;
  }

  return createSegmentsFromSentences(result.sentences || result.result?.sentences)
    .map((segment) => segment.text)
    .join('\n')
    .trim();
};

const createSegmentsFromResult = (result: BailianTranscriptionResult) => {
  const transcriptSegments = getTranscripts(result).flatMap((transcript) =>
    createSegmentsFromSentences(transcript.sentences),
  );
  if (transcriptSegments.length) {
    return transcriptSegments.map((segment, index) => ({ ...segment, id: `sentence-${index + 1}` }));
  }

  return createSegmentsFromSentences(result.sentences || result.result?.sentences);
};

const getDetectedLanguage = (result: BailianTranscriptionResult, fallback: Language) => {
  return (
    result.language ||
    result.result?.language ||
    getTranscripts(result).find((transcript) => transcript.language)?.language ||
    getApiLanguage(fallback) ||
    '自动识别'
  );
};

const createParameters = (language: Language, enableItn: boolean) => {
  const apiLanguage = getApiLanguage(language);
  return {
    ...(apiLanguage ? { language_hints: [apiLanguage] } : {}),
    disfluency_removal_enabled: false,
    inverse_text_normalization_enabled: enableItn,
    diarization_enabled: false,
    timestamp_alignment_enabled: true,
    sentence_timestamp_enabled: true,
  };
};

const getAudioFileUrl = async (audioFile: File, signal: AbortSignal) => {
  const audioSourceUrl = getAudioSourceUrl(audioFile);
  if (audioSourceUrl) {
    return audioSourceUrl;
  }

  const dataUrl = await fileToBase64DataUrl(audioFile);
  if (signal.aborted) {
    throw createAbortError();
  }

  return dataUrl;
};

const submitBailianFunAsrTask = async (
  fileUrl: string,
  context: string,
  language: Language,
  enableItn: boolean,
  apiKey: string,
  signal: AbortSignal,
) => {
  const input: Record<string, unknown> = {
    file_urls: [fileUrl],
  };
  if (context.trim()) {
    input.context = context.trim();
  }

  const response = await fetch(getDashScopeRequestUrl(BAILIAN_FUN_ASR_TRANSCRIPTION_URL), {
    method: 'POST',
    headers: {
      ...createAuthHeaders(apiKey),
      'Content-Type': 'application/json',
      'X-DashScope-Async': 'enable',
    },
    body: JSON.stringify({
      model: BAILIAN_FUN_ASR_MODEL,
      input,
      parameters: createParameters(language, enableItn),
    }),
    signal,
  });
  const result = await parseResponseBody<BailianTaskResponse>(response);

  if (!response.ok || !result?.output?.task_id) {
    throw new Error(getErrorDetail(result) || `百炼 FunASR 提交失败，状态码: ${response.status}`);
  }

  return result.output.task_id;
};

const pollBailianFunAsrTask = async (taskId: string, apiKey: string, signal: AbortSignal) => {
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt += 1) {
    if (attempt > 0) {
      await waitForPollInterval(signal);
    }

    const response = await fetch(getDashScopeRequestUrl(`${BAILIAN_FUN_ASR_TASK_URL}/${taskId}`), {
      method: 'GET',
      headers: createAuthHeaders(apiKey),
      signal,
    });
    const result = await parseResponseBody<BailianTaskResponse>(response);

    if (!response.ok || !result?.output) {
      throw new Error(getErrorDetail(result) || `百炼 FunASR 查询失败，状态码: ${response.status}`);
    }

    const status = result.output.task_status?.toUpperCase() || '';
    if (SUCCEEDED_STATUSES.has(status)) {
      return result;
    }

    if (FAILED_STATUSES.has(status)) {
      throw new Error(getErrorDetail(result) || '百炼 FunASR 转写失败。');
    }
  }

  throw new Error('百炼 FunASR 查询超时，请稍后重试。');
};

const fetchBailianTranscriptionResult = async (transcriptionUrl: string, signal: AbortSignal) => {
  const response = await fetch(getDashScopeRequestUrl(transcriptionUrl), {
    method: 'GET',
    signal,
  });
  const result = await parseResponseBody<BailianTranscriptionResult>(response);

  if (!response.ok || !result) {
    throw new Error(getErrorDetail(result) || `百炼 FunASR 结果下载失败，状态码: ${response.status}`);
  }

  return result;
};

export const transcribeWithBailianFunAsr = async (
  audioFile: File,
  context: string,
  language: Language,
  enableItn: boolean,
  config: BailianFunAsrConfig,
  signal: AbortSignal,
): Promise<TranscriptionResult> => {
  const apiKey = config.apiKey.trim();
  if (!apiKey) {
    throw new Error('百炼 FunASR API Key 未设置。请在设置中配置。');
  }

  if (signal.aborted) {
    throw createAbortError();
  }

  const fileUrl = await getAudioFileUrl(audioFile, signal);
  const taskId = await submitBailianFunAsrTask(fileUrl, context, language, enableItn, apiKey, signal);
  const taskResult = await pollBailianFunAsrTask(taskId, apiKey, signal);
  const transcriptionUrl = taskResult.output?.results?.find((result) => result.transcription_url)?.transcription_url;

  if (!transcriptionUrl) {
    const directTranscription = taskResult.output?.text?.trim();
    if (directTranscription) {
      return {
        transcription: directTranscription,
        detectedLanguage: getApiLanguage(language) || '自动识别',
      };
    }

    throw new Error('百炼 FunASR 未返回 transcription_url。');
  }

  const result = await fetchBailianTranscriptionResult(transcriptionUrl, signal);
  const transcription = getTranscriptText(result);
  if (!transcription) {
    throw new Error('百炼 FunASR 返回了空识别结果。');
  }

  const segments = createSegmentsFromResult(result);
  return {
    transcription,
    detectedLanguage: getDetectedLanguage(result, language),
    ...(segments.length ? { segments } : {}),
  };
};
