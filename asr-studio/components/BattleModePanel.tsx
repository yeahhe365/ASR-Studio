import React from 'react';
import { asrProviderSegmentOptions } from '../services/providerRegistry';
import type { BattleSideState, BattleSideStatus } from '../services/battleMode';
import { AsrProvider } from '../types';
import { LoaderIcon } from './icons/LoaderIcon';
import { ServerIcon } from './icons/ServerIcon';

interface BattleModePanelProps {
  sides: BattleSideState[];
  providerA: AsrProvider;
  providerB: AsrProvider;
  providerError: string;
  isRunning: boolean;
  disabled?: boolean;
  sourceFileName?: string;
  onProviderAChange: (provider: AsrProvider) => void;
  onProviderBChange: (provider: AsrProvider) => void;
}

const statusLabels: Record<BattleSideStatus, string> = {
  idle: '等待',
  processing: '处理中',
  done: '完成',
  error: '失败',
  cancelled: '取消',
};

const statusClassNames: Record<BattleSideStatus, string> = {
  idle: '',
  processing: 'text-brand-primary',
  done: 'text-brand-primary',
  error: 'text-red-600 dark:text-red-300',
  cancelled: 'text-content-200',
};

const BattleProviderSelect: React.FC<{
  label: string;
  value: AsrProvider;
  disabled?: boolean;
  onChange: (provider: AsrProvider) => void;
}> = ({ label, value, disabled, onChange }) => (
  <label className="min-w-0 flex-1">
    <span className="eyebrow">{label}</span>
    <select
      value={value}
      onChange={(event) => onChange(event.target.value as AsrProvider)}
      disabled={disabled}
      className="field-control mt-2"
    >
      {asrProviderSegmentOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </label>
);

const BattleSideCard: React.FC<{ side: BattleSideState }> = ({ side }) => {
  const hasText = Boolean(side.transcription.trim());

  return (
    <article className="surface-inset flex min-h-[340px] min-w-0 flex-col overflow-hidden">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 border-b border-base-300 px-4 py-3">
        <div className="min-w-0">
          <p className="eyebrow">Model {side.id.toUpperCase()}</p>
          <h3 className="mt-1 truncate text-sm font-semibold text-content-100">{side.providerLabel}</h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`status-pill ${statusClassNames[side.status]}`}>
            {side.status === 'processing' && <LoaderIcon className="h-3.5 w-8" />}
            {statusLabels[side.status]}
          </span>
          {side.elapsedTime != null && <span className="status-pill font-mono">{side.elapsedTime.toFixed(2)}s</span>}
          {side.detectedLanguage && <span className="status-pill">{side.detectedLanguage}</span>}
          {side.segments.length > 0 && <span className="status-pill font-mono">{side.segments.length} 段</span>}
        </div>
      </div>
      {side.status === 'error' || side.status === 'cancelled' ? (
        <div className="flex min-h-0 flex-1 items-center justify-center p-5 text-center">
          <p className="max-w-md text-sm leading-relaxed text-red-600 dark:text-red-300">{side.error}</p>
        </div>
      ) : hasText ? (
        <textarea
          value={side.transcription}
          readOnly
          className="custom-scrollbar min-h-0 flex-1 resize-none border-0 bg-base-100 p-4 text-[15px] leading-7 text-content-100 outline-none sm:p-5 sm:text-base sm:leading-8"
          spellCheck={false}
        />
      ) : (
        <div className="flex min-h-0 flex-1 items-center justify-center p-5 text-center">
          <p className="text-sm text-content-200">{side.error || '等待 Battle 结果'}</p>
        </div>
      )}
    </article>
  );
};

export const BattleModePanel: React.FC<BattleModePanelProps> = ({
  sides,
  providerA,
  providerB,
  providerError,
  isRunning,
  disabled,
  sourceFileName,
  onProviderAChange,
  onProviderBChange,
}) => (
  <section className="surface-panel overflow-hidden">
    <div className="panel-header flex-col items-stretch sm:flex-row sm:items-center">
      <div className="min-w-0">
        <p className="eyebrow">Battle</p>
        <h2 className="panel-title mt-1">模型对比</h2>
        {sourceFileName && <p className="panel-subtitle">{sourceFileName}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`status-pill ${isRunning ? 'text-brand-primary' : providerError ? 'text-red-600' : ''}`}>
          {isRunning ? '运行中' : providerError ? '需调整' : '就绪'}
        </span>
      </div>
    </div>
    <div className="space-y-3 p-4">
      <div className="grid min-w-0 gap-3 sm:grid-cols-2">
        <BattleProviderSelect
          label="Model A"
          value={providerA}
          disabled={disabled || isRunning}
          onChange={onProviderAChange}
        />
        <BattleProviderSelect
          label="Model B"
          value={providerB}
          disabled={disabled || isRunning}
          onChange={onProviderBChange}
        />
      </div>
      {providerError && (
        <div className="flex items-center gap-2 rounded-md border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
          <ServerIcon className="h-4 w-4 flex-shrink-0" />
          <span>{providerError}</span>
        </div>
      )}
      <div className="grid min-w-0 gap-3 xl:grid-cols-2">
        {sides.map((side) => (
          <BattleSideCard key={side.id} side={side} />
        ))}
      </div>
    </div>
  </section>
);
