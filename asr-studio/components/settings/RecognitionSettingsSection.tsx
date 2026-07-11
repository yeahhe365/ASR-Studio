import React from 'react';
import { compressionLevelDisplayNames, languageDisplayNames } from '../../displayNames';
import { CompressionLevel, Language, AsrProvider } from '../../types';
import { asrProviderSegmentOptions } from '../../services/providerRegistry';
import { LanguageIcon } from '../icons/LanguageIcon';
import { ServerIcon } from '../icons/ServerIcon';
import { SoundWaveIcon } from '../icons/SoundWaveIcon';
import {
  CollapsibleSection,
  inputClassName,
  SectionBlock,
  SegmentedControl,
  SettingRow,
  ToggleSwitch,
} from './SettingsControls';
import type { SettingsPanelProps } from './settingsTypes';

type RecognitionSettingsSectionProps = Pick<SettingsPanelProps, 'values' | 'setters' | 'audioDevices' | 'disabled'>;

export const RecognitionSettingsSection: React.FC<RecognitionSettingsSectionProps> = ({
  values,
  setters,
  audioDevices,
  disabled,
}) => {
  const {
    autoGainControl,
    battleModeEnabled,
    battleProviderA,
    battleProviderB,
    compressionLevel,
    context,
    echoCancellation,
    enableLongAudioChunking,
    enableItn,
    language,
    noiseSuppression,
    selectedDeviceId,
    trimSilence,
  } = values;
  const {
    setAutoGainControl,
    setBattleModeEnabled,
    setBattleProviderA,
    setBattleProviderB,
    setCompressionLevel,
    setContext,
    setEchoCancellation,
    setEnableLongAudioChunking,
    setEnableItn,
    setLanguage,
    setNoiseSuppression,
    setSelectedDeviceId,
    setTrimSilence,
  } = setters;

  return (
    <div className="space-y-5">
      <SectionBlock
        title="语言与文本"
        icon={<LanguageIcon className="h-4 w-4" />}
        description="影响识别语言与输出文本格式。主界面「会话参数」也可快捷调整部分选项。"
      >
        <SettingRow label="语言" description="指定识别语言，或保持自动识别。" htmlFor="language-setting">
          <select
            id="language-setting"
            value={language}
            onChange={(event) => setLanguage(event.target.value as Language)}
            disabled={disabled}
            className={`${inputClassName} sm:w-56`}
          >
            {Object.values(Language).map((langValue) => (
              <option key={langValue} value={langValue}>
                {languageDisplayNames[langValue]}
              </option>
            ))}
          </select>
        </SettingRow>
        <div className="px-2 py-3">
          <label htmlFor="context-setting" className="text-sm font-medium text-[var(--theme-text-primary)]">
            上下文（可选）
          </label>
          <p className="mt-0.5 text-xs leading-relaxed text-[var(--theme-text-tertiary)]">
            提供上下文以提高准确性，例如：人名、术语。
          </p>
          <textarea
            id="context-setting"
            rows={4}
            value={context}
            onChange={(event) => setContext(event.target.value)}
            disabled={disabled}
            placeholder="人名、术语等..."
            className={`mt-2 resize-y ${inputClassName}`}
          />
        </div>
        <SettingRow
          label="启用反向文本标准化 (ITN)"
          description="把数字、日期等内容转成更自然的文本格式。"
          htmlFor="itn-setting"
          onActivate={disabled ? undefined : () => setEnableItn(!enableItn)}
          disabled={disabled}
        >
          <ToggleSwitch id="itn-setting" enabled={enableItn} onChange={setEnableItn} disabled={disabled} />
        </SettingRow>
      </SectionBlock>

      <SectionBlock title="音频" icon={<SoundWaveIcon className="h-4 w-4" />} description="录音设备与上传相关的常用处理。">
        <SettingRow label="录音设备" description="选择浏览器录音时使用的输入设备。" htmlFor="audio-device-setting">
          <select
            id="audio-device-setting"
            value={selectedDeviceId}
            onChange={(event) => setSelectedDeviceId(event.target.value)}
            disabled={disabled || audioDevices.length === 0}
            className={`${inputClassName} sm:w-56`}
          >
            <option value="default">默认设备</option>
            {audioDevices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `设备 ${device.deviceId.substring(0, 8)}`}
              </option>
            ))}
          </select>
        </SettingRow>
        <SettingRow label="音频压缩" description="减小文件大小以加快上传速度。">
          <SegmentedControl
            ariaLabel="音频压缩"
            value={compressionLevel}
            onChange={setCompressionLevel}
            disabled={disabled}
            options={Object.values(CompressionLevel).map((level) => ({
              value: level,
              label: compressionLevelDisplayNames[level],
            }))}
          />
        </SettingRow>
        <SettingRow
          label="裁剪首尾静音"
          description="识别前自动移除本地音频开头和结尾的长静音。"
          htmlFor="trim-silence-setting"
          onActivate={disabled ? undefined : () => setTrimSilence(!trimSilence)}
          disabled={disabled}
        >
          <ToggleSwitch id="trim-silence-setting" enabled={trimSilence} onChange={setTrimSilence} disabled={disabled} />
        </SettingRow>
        <SettingRow
          label="长音频自动切片"
          description="本地音频超过 5 分钟时按段识别再合并结果。"
          htmlFor="long-audio-chunking-setting"
          onActivate={disabled ? undefined : () => setEnableLongAudioChunking(!enableLongAudioChunking)}
          disabled={disabled}
        >
          <ToggleSwitch
            id="long-audio-chunking-setting"
            enabled={enableLongAudioChunking}
            onChange={setEnableLongAudioChunking}
            disabled={disabled}
          />
        </SettingRow>
      </SectionBlock>

      <CollapsibleSection
        title="浏览器录音处理"
        icon={<SoundWaveIcon className="h-4 w-4" />}
        description="仅影响浏览器实时录音，对已上传的本地文件无效。"
      >
        <SettingRow
          label="回声消除"
          description="抑制扬声器回声。"
          htmlFor="echo-cancellation-setting"
          onActivate={disabled ? undefined : () => setEchoCancellation(!echoCancellation)}
          disabled={disabled}
        >
          <ToggleSwitch
            id="echo-cancellation-setting"
            enabled={echoCancellation}
            onChange={setEchoCancellation}
            disabled={disabled}
          />
        </SettingRow>
        <SettingRow
          label="噪声抑制"
          description="降低背景噪声。"
          htmlFor="noise-suppression-setting"
          onActivate={disabled ? undefined : () => setNoiseSuppression(!noiseSuppression)}
          disabled={disabled}
        >
          <ToggleSwitch
            id="noise-suppression-setting"
            enabled={noiseSuppression}
            onChange={setNoiseSuppression}
            disabled={disabled}
          />
        </SettingRow>
        <SettingRow
          label="自动增益"
          description="自动平衡输入音量。"
          htmlFor="auto-gain-setting"
          onActivate={disabled ? undefined : () => setAutoGainControl(!autoGainControl)}
          disabled={disabled}
        >
          <ToggleSwitch
            id="auto-gain-setting"
            enabled={autoGainControl}
            onChange={setAutoGainControl}
            disabled={disabled}
          />
        </SettingRow>
      </CollapsibleSection>

      <CollapsibleSection
        title="对战模式"
        icon={<ServerIcon className="h-4 w-4" />}
        description="用同一段音频并排比较两个模型的转写结果。"
        defaultOpen={battleModeEnabled}
      >
        <SettingRow
          label="启用对战模式"
          description="开启后主界面将显示模型对比工作区。"
          htmlFor="battle-mode-setting"
          onActivate={disabled ? undefined : () => setBattleModeEnabled(!battleModeEnabled)}
          disabled={disabled}
        >
          <ToggleSwitch
            id="battle-mode-setting"
            enabled={battleModeEnabled}
            onChange={setBattleModeEnabled}
            disabled={disabled}
          />
        </SettingRow>
        <SettingRow label="模型 A" description="对比左侧使用的识别服务。" htmlFor="battle-provider-a-setting">
          <select
            id="battle-provider-a-setting"
            value={battleProviderA}
            onChange={(event) => setBattleProviderA(event.target.value as AsrProvider)}
            disabled={disabled}
            className={`${inputClassName} sm:w-56`}
          >
            {asrProviderSegmentOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </SettingRow>
        <SettingRow label="模型 B" description="对比右侧使用的识别服务。" htmlFor="battle-provider-b-setting">
          <select
            id="battle-provider-b-setting"
            value={battleProviderB}
            onChange={(event) => setBattleProviderB(event.target.value as AsrProvider)}
            disabled={disabled}
            className={`${inputClassName} sm:w-56`}
          >
            {asrProviderSegmentOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </SettingRow>
      </CollapsibleSection>
    </div>
  );
};
