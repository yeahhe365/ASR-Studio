import { QWEN_ASR_API_URL, QWEN_ASR_MODEL } from '../constants';
import { Language } from '../types';

const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 2000;

type QwenAsrConfig = {
  apiKey: string;
};

type QwenChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
      annotations?: Array<{
        type?: string;
        language?: string;
      }>;
    };
  }>;
  error?: {
    message?: string;
    code?: string;
  };
};

const fileToBase64DataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

const createSystemPrompt = (context: string, enableItn: boolean) => {
  const instructions = [
    '你是专业的语音识别助手。请只返回音频转写文本，不要添加解释、标题或 Markdown。',
    enableItn
      ? '启用 ITN：将数字、日期、时间、金额等内容尽量转换为常用书写形式。'
      : '不启用 ITN：尽量保留语音内容的原始表达。',
  ];

  if (context.trim()) {
    instructions.push(`可参考的上下文、专有名词或人名：${context.trim()}`);
  }

  return instructions.join('\n');
};

const parseDetectedLanguage = (result: QwenChatCompletionResponse, fallback: Language) => {
  const annotations = result.choices?.[0]?.message?.annotations;
  const languageAnnotation = annotations?.find(annotation => annotation.language);

  return languageAnnotation?.language || (fallback === Language.AUTO ? '自动识别' : fallback);
};

const createAsrOptions = (language: Language, enableItn: boolean) => {
  return {
    ...(language === Language.AUTO ? {} : { language }),
    enable_itn: enableItn,
  };
};

const parseQwenAsrResponse = (result: QwenChatCompletionResponse, fallbackLanguage: Language) => {
  if (result.error?.message) {
    throw new Error(result.error.message);
  }

  const transcription = result.choices?.[0]?.message?.content?.trim();
  if (!transcription) {
    throw new Error('Qwen 官方 API 返回了空识别结果。');
  }

  return {
    transcription,
    detectedLanguage: parseDetectedLanguage(result, fallbackLanguage),
  };
};

export const transcribeAudio = async (
  audioFile: File,
  context: string,
  language: Language,
  enableItn: boolean,
  config: QwenAsrConfig,
  onProgress: (message: string) => void,
  signal: AbortSignal
): Promise<{ transcription: string; detectedLanguage: string }> => {
  const apiKey = config.apiKey.trim();
  if (!apiKey) {
    throw new Error('Qwen 官方 API Key 未设置。请在设置中配置。');
  }

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const attempt = i + 1;
      onProgress(attempt > 1 ? `正在进行第 ${attempt} 次尝试...` : '正在识别，请稍候...');

      onProgress('正在准备音频数据...');
      const audioDataUrl = await fileToBase64DataUrl(audioFile);

      onProgress('正在发送到 Qwen 官方 API...');
      const response = await fetch(QWEN_ASR_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: QWEN_ASR_MODEL,
          messages: [
            {
              role: 'system',
              content: createSystemPrompt(context, enableItn),
            },
            {
              role: 'user',
              content: [
                {
                  type: 'input_audio',
                  input_audio: {
                    data: audioDataUrl,
                  },
                },
              ],
            },
          ],
          asr_options: createAsrOptions(language, enableItn),
        }),
        signal,
      });

      const result = await response.json().catch(() => null) as QwenChatCompletionResponse | null;

      if (!response.ok) {
        const detail = result?.error?.message || `Qwen 官方 API 请求失败，状态码: ${response.status}`;
        throw new Error(detail);
      }

      if (!result) {
        throw new Error('Qwen 官方 API 返回了无效响应。');
      }

      const parsedResult = parseQwenAsrResponse(result, language);
      onProgress('识别成功！');

      return parsedResult;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        onProgress('识别已取消。');
        throw error;
      }

      if (i === MAX_RETRIES - 1) {
        console.error(`Transcription failed after ${MAX_RETRIES} attempts.`, error);
        onProgress('识别失败。');
        throw error;
      }

      const delay = INITIAL_BACKOFF_MS * Math.pow(2, i);
      console.warn(`Transcription attempt ${i + 1} failed. Retrying in ${delay / 1000}s...`, error);
      onProgress(`识别出错，将在 ${delay / 1000} 秒后重试...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error('Transcription failed after all retries.');
};
