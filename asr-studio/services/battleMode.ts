import { AsrProvider, type AsrProviderConfig, type TranscriptionResult, type TranscriptionSegment } from '../types';
import { getAsrProviderLabel } from './providerRegistry';

export type BattleSideId = 'a' | 'b';

export type BattleSideStatus = 'idle' | 'processing' | 'done' | 'error' | 'cancelled';

export interface BattleSideState {
  id: BattleSideId;
  provider: AsrProvider;
  providerLabel: string;
  status: BattleSideStatus;
  transcription: string;
  detectedLanguage: string;
  segments: TranscriptionSegment[];
  elapsedTime: number | null;
  error: string;
}

export const createBattleProviderConfig = (
  baseConfig: AsrProviderConfig,
  provider: AsrProvider,
): AsrProviderConfig => ({
  ...baseConfig,
  provider,
});

export const getBattleProviderError = (providerA: AsrProvider, providerB: AsrProvider) => {
  if (providerA === providerB) {
    return '请选择两个不同的模型进行 Battle。';
  }

  return '';
};

export const createBattleSide = (
  id: BattleSideId,
  provider: AsrProvider,
  overrides: Partial<Omit<BattleSideState, 'id' | 'provider' | 'providerLabel'>> = {},
): BattleSideState => ({
  id,
  provider,
  providerLabel: getAsrProviderLabel(provider),
  status: 'idle',
  transcription: '',
  detectedLanguage: '',
  segments: [],
  elapsedTime: null,
  error: '',
  ...overrides,
});

export const createInitialBattleSides = (providerA: AsrProvider, providerB: AsrProvider): BattleSideState[] => [
  createBattleSide('a', providerA),
  createBattleSide('b', providerB),
];

export const createSucceededBattleSide = (
  id: BattleSideId,
  provider: AsrProvider,
  result: TranscriptionResult,
  elapsedTime: number,
): BattleSideState =>
  createBattleSide(id, provider, {
    status: 'done',
    transcription: result.transcription,
    detectedLanguage: result.detectedLanguage,
    segments: result.segments || [],
    elapsedTime,
  });

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return '转录过程中发生未知错误。';
};

export const createFailedBattleSide = (
  id: BattleSideId,
  provider: AsrProvider,
  error: unknown,
  elapsedTime: number,
): BattleSideState =>
  createBattleSide(id, provider, {
    status: 'error',
    elapsedTime,
    error: getErrorMessage(error),
  });
