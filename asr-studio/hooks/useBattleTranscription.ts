import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getCachedTranscription, getFileHash, setCachedTranscription } from '../services/cacheService';
import {
  compressAudio,
  getAudioProcessingFallbackReason,
  getEffectiveCompressionLevel,
} from '../services/audioService';
import {
  createBattleProviderConfig,
  createFailedBattleSide,
  createInitialBattleSides,
  createSucceededBattleSide,
  getBattleProviderError,
  type BattleSideId,
  type BattleSideState,
} from '../services/battleMode';
import { getProviderReadinessError } from '../services/providerRegistry';
import { getAudioSourceUrl } from '../services/remoteAudioFile';
import { createTranscriptionCacheKey, createTranscriptionCacheSource } from '../services/transcriptionCacheKey';
import { createAbortError, isAbortError, transcribePreparedAudio } from '../services/transcriptionProcessing';
import { normalizeSegments } from '../services/transcriptionSegments';
import { useElapsedTimer } from './useElapsedTimer';
import { AsrProvider, CompressionLevel } from '../types';
import type { AsrProviderConfig, Language, Notification, TranscriptionResult } from '../types';

type Notify = (message: string, type: Notification['type']) => void;

type UseBattleTranscriptionOptions = {
  providerA: AsrProvider;
  providerB: AsrProvider;
  baseConfig: AsrProviderConfig;
  context: string;
  language: Language;
  enableItn: boolean;
  compressionLevel: CompressionLevel;
  trimSilence: boolean;
  enableLongAudioChunking: boolean;
  notify: Notify;
  clearNotification: () => void;
};

const sideOrder: BattleSideId[] = ['a', 'b'];

const getProviderForSide = (sideId: BattleSideId, providerA: AsrProvider, providerB: AsrProvider) =>
  sideId === 'a' ? providerA : providerB;

export function useBattleTranscription({
  providerA,
  providerB,
  baseConfig,
  context,
  language,
  enableItn,
  compressionLevel,
  trimSilence,
  enableLongAudioChunking,
  notify,
  clearNotification,
}: UseBattleTranscriptionOptions) {
  const [sides, setSides] = useState<BattleSideState[]>(() => createInitialBattleSides(providerA, providerB));
  const [isRunning, setIsRunning] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isRunningRef = useRef(false);
  const realtimeElapsedTime = useElapsedTimer(isRunning);

  const providerError = useMemo(() => getBattleProviderError(providerA, providerB), [providerA, providerB]);

  const resetSides = useCallback(() => {
    setSides(createInitialBattleSides(providerA, providerB));
  }, [providerA, providerB]);

  useEffect(() => {
    if (!isRunningRef.current) {
      resetSides();
    }
  }, [resetSides]);

  const setRunningState = useCallback((nextIsRunning: boolean) => {
    isRunningRef.current = nextIsRunning;
    setIsRunning(nextIsRunning);
  }, []);

  const updateSide = useCallback((sideId: BattleSideId, nextSide: BattleSideState) => {
    setSides((currentSides) => currentSides.map((side) => (side.id === sideId ? nextSide : side)));
  }, []);

  const markSideProcessing = useCallback((sideId: BattleSideId, message = '正在准备识别...') => {
    setSides((currentSides) =>
      currentSides.map((side) =>
        side.id === sideId
          ? {
              ...side,
              status: 'processing',
              transcription: '',
              detectedLanguage: '',
              segments: [],
              elapsedTime: null,
              error: message,
            }
          : side,
      ),
    );
  }, []);

  const markCancelled = useCallback(() => {
    setSides((currentSides) =>
      currentSides.map((side) =>
        side.status === 'processing' || side.status === 'idle'
          ? {
              ...side,
              status: 'cancelled',
              error: '已取消',
            }
          : side,
      ),
    );
  }, []);

  const runSide = useCallback(
    async ({
      sideId,
      file,
      audioSourceUrl,
      fileHash,
      controller,
    }: {
      sideId: BattleSideId;
      file: File;
      audioSourceUrl?: string;
      fileHash: string;
      controller: AbortController;
    }) => {
      const provider = getProviderForSide(sideId, providerA, providerB);
      const config = createBattleProviderConfig(baseConfig, provider);
      const startedAt = Date.now();

      try {
        const setProgress = (message: string) => {
          setSides((currentSides) =>
            currentSides.map((side) =>
              side.id === sideId && side.status === 'processing' ? { ...side, error: message } : side,
            ),
          );
        };

        const readinessError = getProviderReadinessError(config, file);
        if (readinessError) {
          return createFailedBattleSide(sideId, provider, readinessError, (Date.now() - startedAt) / 1000);
        }

        let finalResult: TranscriptionResult;
        const cacheKey = createTranscriptionCacheKey({
          source: createTranscriptionCacheSource(fileHash, audioSourceUrl),
          config,
          language,
          enableItn,
          compressionLevel,
          trimSilence,
          enableLongAudioChunking,
          context,
        });
        const cachedResult = await getCachedTranscription(cacheKey);
        if (controller.signal.aborted) {
          throw createAbortError();
        }

        if (cachedResult) {
          finalResult = {
            transcription: cachedResult.transcription,
            detectedLanguage: cachedResult.detectedLanguage,
            segments: normalizeSegments(cachedResult.transcription, cachedResult.segments),
            provider: cachedResult.provider || provider,
            createdAt: cachedResult.createdAt,
          };
        } else {
          let fileToTranscribe = file;
          if (audioSourceUrl) {
            setProgress('正在提交远程音频 URL...');
          } else {
            const effectiveCompressionLevel = getEffectiveCompressionLevel(provider, file, compressionLevel);
            const isAutoConverted =
              compressionLevel === CompressionLevel.ORIGINAL && effectiveCompressionLevel !== CompressionLevel.ORIGINAL;
            setProgress(isAutoConverted ? '正在转换兼容音频...' : '正在压缩音频（如果需要）...');
            fileToTranscribe = await compressAudio(file, effectiveCompressionLevel);
            if (controller.signal.aborted) {
              throw createAbortError();
            }
            const compressionFallbackReason = getAudioProcessingFallbackReason(fileToTranscribe);
            if (compressionFallbackReason) {
              setProgress(compressionFallbackReason);
            }
          }

          finalResult = await transcribePreparedAudio({
            file: fileToTranscribe,
            audioSourceUrl,
            controller,
            context,
            language,
            enableItn,
            trimSilence,
            enableLongAudioChunking,
            asrConfig: config,
            setProgress,
          });
          if (controller.signal.aborted) {
            throw createAbortError();
          }

          finalResult = {
            ...finalResult,
            segments: normalizeSegments(finalResult.transcription, finalResult.segments),
            provider,
            createdAt: Date.now(),
          };

          if (finalResult.transcription) {
            await setCachedTranscription(cacheKey, finalResult).catch((error) => {
              console.error('Failed to cache battle transcription result:', error);
            });
          }
        }

        return createSucceededBattleSide(sideId, provider, finalResult, (Date.now() - startedAt) / 1000);
      } catch (error) {
        if (isAbortError(error)) {
          throw error;
        }
        return createFailedBattleSide(sideId, provider, error, (Date.now() - startedAt) / 1000);
      }
    },
    [
      baseConfig,
      compressionLevel,
      context,
      enableItn,
      enableLongAudioChunking,
      language,
      providerA,
      providerB,
      trimSilence,
    ],
  );

  const startBattle = useCallback(
    async (file: File | null): Promise<boolean> => {
      if (isRunningRef.current) {
        return false;
      }

      if (!file) {
        notify('请先上传或录制一段音频。', 'error');
        return false;
      }

      if (providerError) {
        notify(providerError, 'error');
        return false;
      }

      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;
      clearNotification();
      setRunningState(true);
      setSides(createInitialBattleSides(providerA, providerB));

      try {
        const audioSourceUrl = getAudioSourceUrl(file);
        const fileHash = audioSourceUrl ? '' : await getFileHash(file);
        if (controller.signal.aborted) {
          throw createAbortError();
        }

        for (const sideId of sideOrder) {
          if (controller.signal.aborted) {
            throw createAbortError();
          }

          markSideProcessing(sideId);
          const sideResult = await runSide({ sideId, file, audioSourceUrl, fileHash, controller });
          updateSide(sideId, sideResult);
        }

        notify('Battle 转写完成', 'success');
        return true;
      } catch (error) {
        if (isAbortError(error)) {
          markCancelled();
          notify('Battle 已取消', 'success');
        } else {
          console.error('Battle transcription error:', error);
          notify(error instanceof Error ? error.message : 'Battle 转写失败。', 'error');
        }
        return false;
      } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
          setRunningState(false);
        }
      }
    },
    [
      clearNotification,
      markCancelled,
      markSideProcessing,
      notify,
      providerA,
      providerB,
      providerError,
      runSide,
      setRunningState,
      updateSide,
    ],
  );

  const cancelBattle = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  return {
    sides,
    isRunning,
    providerError,
    realtimeElapsedTime,
    resetSides,
    startBattle,
    cancelBattle,
  };
}
