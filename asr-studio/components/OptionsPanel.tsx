import React from 'react';
import { Language } from '../types';

interface OptionsPanelProps {
  context: string;
  setContext: (context: string) => void;
  language: Language;
  setLanguage: (language: Language) => void;
  enableItn: boolean;
  setEnableItn: (enable: boolean) => void;
  disabled?: boolean;
}

const languageDisplayNames: Record<Language, string> = {
  [Language.AUTO]: "🌐 自动识别 / Auto Detect",
  [Language.CHINESE]: "🇨🇳 中文 / Chinese",
  [Language.ENGLISH]: "🇺🇸 英文 / English",
  [Language.JAPANESE]: "🇯🇵 日文 / Japanese",
  [Language.KOREAN]: "🇰🇷 韩文 / Korean",
  [Language.SPANISH]: "🇪🇸 西班牙文 / Spanish",
  [Language.FRENCH]: "🇫🇷 法文 / French",
  [Language.GERMAN]: "🇩🇪 德文 / German",
  [Language.ARABIC]: "🇸🇦 阿拉伯文 / Arabic",
  [Language.ITALIAN]: "🇮🇹 意大利文 / Italian",
  [Language.RUSSIAN]: "🇷🇺 俄文 / Russian",
  [Language.PORTUGUESE]: "🇵🇹 葡萄牙文 / Portuguese",
};

export const OptionsPanel: React.FC<OptionsPanelProps> = ({
  context,
  setContext,
  language,
  setLanguage,
  enableItn,
  setEnableItn,
  disabled,
}) => {
  return (
    <div className="p-4 space-y-4 rounded-lg bg-base-200 border border-base-300">
      <h3 className="text-lg font-semibold text-content-100">选项</h3>
      <div>
        <label htmlFor="context" className="block mb-1 text-sm font-medium text-content-200">
          上下文 (可选)
        </label>
        <textarea
          id="context"
          rows={3}
          value={context}
          onChange={(e) => setContext(e.target.value)}
          disabled={disabled}
          placeholder="提供上下文以提高准确性，例如：人名、术语。"
          className="w-full px-3 py-2 text-sm rounded-md shadow-sm bg-base-100 border border-base-300 text-content-100 placeholder-content-200 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary disabled:opacity-60"
        />
      </div>
      <div>
        <label htmlFor="language" className="block mb-1 text-sm font-medium text-content-200">
          语言
        </label>
        <select
          id="language"
          value={language}
          onChange={(e) => setLanguage(e.target.value as Language)}
          disabled={disabled}
          className="w-full px-3 py-2 text-sm rounded-md shadow-sm bg-base-100 border border-base-300 text-content-100 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary disabled:opacity-60"
        >
          {Object.values(Language).map((langValue) => (
            <option key={langValue} value={langValue}>
              {languageDisplayNames[langValue]}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center justify-between">
        <label htmlFor="itn" className="text-sm font-medium text-content-100">
          启用反向文本标准化 (ITN)
        </label>
        <button
          type="button"
          id="itn"
          onClick={() => setEnableItn(!enableItn)}
          disabled={disabled}
          className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-base-200 focus:ring-brand-primary ${
            enableItn ? 'bg-brand-primary' : 'bg-base-300'
          } disabled:opacity-60`}
        >
          <span
            className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out ${
              enableItn ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  );
};