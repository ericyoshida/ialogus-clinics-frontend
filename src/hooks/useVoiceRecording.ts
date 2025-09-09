import { useCallback, useRef, useState } from 'react';

interface UseVoiceRecordingOptions {
  onRecordingComplete?: (audioBlob: Blob, duration: number) => void;
  onError?: (error: string) => void;
  maxDuration?: number; // em segundos
}

interface UseVoiceRecordingReturn {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  cancelRecording: () => void;
  cleanup: () => void;
  audioURL: string | null;
  hasPermission: boolean | null;
}

export function useVoiceRecording({
  onRecordingComplete,
  onError,
  maxDuration = 300 // 5 minutos por padrão
}: UseVoiceRecordingOptions = {}): UseVoiceRecordingReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0); // Track total paused time
  const isCancelledRef = useRef<boolean>(false); // Track if recording was cancelled

  const startTimer = useCallback(() => {
    const currentTime = Date.now();
    if (!startTimeRef.current) {
      startTimeRef.current = currentTime;
    }
    
    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current - pausedTimeRef.current) / 1000;
      setDuration(elapsed);
      
      // Auto-stop if max duration reached
      if (elapsed >= maxDuration) {
        stopRecording();
      }
    }, 100);
  }, [maxDuration]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const resetTimer = useCallback(() => {
    stopTimer();
    setDuration(0);
    startTimeRef.current = 0;
    pausedTimeRef.current = 0;
  }, [stopTimer]);

  const startRecording = useCallback(async () => {
    try {
      // Reset cancelled flag when starting a NEW recording
      isCancelledRef.current = false;
      console.log('Starting new recording, reset isCancelledRef to false');
      
      // 🔍 Detectar navegador para configurações otimizadas
      const userAgent = navigator.userAgent;
      const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
      const isChrome = /chrome/i.test(userAgent) && !/edge/i.test(userAgent);
      const isFirefox = /firefox/i.test(userAgent);
      
      console.log('🌐 Navegador detectado:', {
        userAgent: userAgent,
        isSafari,
        isChrome,
        isFirefox
      });
      
      // 🎤 Configurações de áudio otimizadas por navegador
      let audioConstraints: MediaTrackConstraints;
      
      if (isChrome) {
        // Chrome: configurações otimizadas para WebM/OGG
        audioConstraints = {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,          // 48kHz para melhor qualidade no Chrome
          channelCount: 1,            // Mono para compatibilidade
        };
        console.log('🎤 Chrome: Usando configurações otimizadas');
      } else if (isSafari) {
        // Safari: configurações otimizadas para MP4
        audioConstraints = {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,          // 44.1kHz padrão funciona bem no Safari
          channelCount: 1,            // Mono para compatibilidade
        };
        console.log('🎤 Safari: Usando configurações otimizadas');
      } else {
        // Outros navegadores: configuração padrão
        audioConstraints = {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        };
        console.log('🎤 Outros navegadores: Usando configurações padrão');
      }
      
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: audioConstraints
      });
      
      streamRef.current = stream;
      setHasPermission(true);

      // 🎤 CORREÇÃO: Detectar formato de áudio suportado pelo WhatsApp
      let mimeType = 'audio/webm;codecs=opus'; // Fallback padrão
      let outputMimeType = 'audio/webm;codecs=opus';
      
      // Lista de formatos aceitos pelo WhatsApp com prioridades por navegador
      let whatsappSupportedFormats: string[];
      
      if (isSafari) {
        // Safari funciona melhor com MP4/AAC
        whatsappSupportedFormats = [
          'audio/mp4',                // M4A/AAC - PRIORIDADE 1 para Safari
          'audio/aac',                // AAC puro - PRIORIDADE 2 para Safari
          'audio/wav',                // WAV - PRIORIDADE 3
          'audio/mpeg',               // MP3 - PRIORIDADE 4
          'audio/ogg;codecs=opus',    // OGG com Opus - PRIORIDADE 5
        ];
      } else if (isChrome) {
        // Chrome funciona melhor com OGG/WebM
        whatsappSupportedFormats = [
          'audio/ogg;codecs=opus',    // OGG com Opus - PRIORIDADE 1 para Chrome
          'audio/webm;codecs=opus',   // WebM com Opus - PRIORIDADE 2 para Chrome
          'audio/mpeg',               // MP3 - PRIORIDADE 3
          'audio/wav',                // WAV - PRIORIDADE 4
          'audio/mp4',                // M4A/AAC - PRIORIDADE 5 (problemático no Chrome)
        ];
      } else {
        // Firefox e outros navegadores
        whatsappSupportedFormats = [
          'audio/ogg;codecs=opus',    // OGG com Opus - PRIORIDADE 1
          'audio/mpeg',               // MP3 - PRIORIDADE 2
          'audio/webm;codecs=opus',   // WebM com Opus - PRIORIDADE 3
          'audio/wav',                // WAV - PRIORIDADE 4
          'audio/mp4',                // M4A/AAC - PRIORIDADE 5
        ];
      }
      
      console.log('🔍 Testando formatos suportados pelo navegador:');
      console.log(`Prioridades para ${isSafari ? 'Safari' : isChrome ? 'Chrome' : 'outros'}:`);
      whatsappSupportedFormats.forEach((format, index) => {
        const supported = MediaRecorder.isTypeSupported(format);
        console.log(`${index + 1}. ${supported ? '✅' : '❌'} ${format}`);
      });
      
      // Tentar encontrar um formato suportado pelo navegador E pelo WhatsApp
      for (const format of whatsappSupportedFormats) {
        if (MediaRecorder.isTypeSupported(format)) {
          mimeType = format;
          outputMimeType = format;
          console.log('✅ Formato escolhido:', format);
          break;
        }
      }
      
      // Se nenhum formato do WhatsApp é suportado, usar WebM mas converteremos no backend
      if (!whatsappSupportedFormats.some(format => MediaRecorder.isTypeSupported(format))) {
        console.log('⚠️ Nenhum formato do WhatsApp suportado pelo navegador, usando WebM (será convertido no backend)');
        mimeType = 'audio/webm;codecs=opus';
        outputMimeType = 'audio/ogg'; // Indicar que deve ser convertido para OGG
      }
      
      console.log('🎙️ Configuração final de gravação:', {
        inputFormat: mimeType,
        outputFormat: outputMimeType,
        willNeedConversion: mimeType !== outputMimeType,
        navegador: isSafari ? 'Safari' : isChrome ? 'Chrome' : 'Outros',
        navegadorCompleto: navigator.userAgent
      });

      // Create MediaRecorder with browser-specific optimizations
      let mediaRecorderOptions: MediaRecorderOptions = {
        mimeType: mimeType
      };
      
      // 🎛️ Configurações específicas por navegador para melhor qualidade
      if (isChrome && (mimeType.includes('ogg') || mimeType.includes('webm'))) {
        // Chrome com OGG/WebM: configurar bitrate para melhor qualidade
        mediaRecorderOptions = {
          mimeType: mimeType,
          audioBitsPerSecond: 128000, // 128kbps para qualidade decente
        };
        console.log('🎛️ Chrome: Usando configuração otimizada para OGG/WebM');
      } else if (isSafari && mimeType.includes('mp4')) {
        // Safari com MP4: configuração padrão funciona bem
        console.log('🎛️ Safari: Usando configuração padrão para MP4');
      }
      
      console.log('🎙️ Opções do MediaRecorder:', mediaRecorderOptions);

      const mediaRecorder = new MediaRecorder(stream, mediaRecorderOptions);
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        console.log('MediaRecorder onstop triggered, isCancelled:', isCancelledRef.current);
        
        // Only call onRecordingComplete if not cancelled
        if (!isCancelledRef.current) {
          console.log('🔍 DIAGNÓSTICO - Chunks coletados:', {
            totalChunks: audioChunksRef.current.length,
            chunkSizes: audioChunksRef.current.map(chunk => chunk.size),
            totalSize: audioChunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0)
          });
          
          const audioBlob = new Blob(audioChunksRef.current, { 
            type: outputMimeType
          });
          
          const url = URL.createObjectURL(audioBlob);
          setAudioURL(url);
          
          // Calculate final duration at the time of stopping
          const finalDuration = startTimeRef.current 
            ? (Date.now() - startTimeRef.current - pausedTimeRef.current) / 1000 
            : 0;
          
          console.log('🎵 Áudio gravado - DIAGNÓSTICO COMPLETO:', {
            size: audioBlob.size,
            type: audioBlob.type,
            duration: finalDuration,
            chunks: audioChunksRef.current.length,
            originalMimeType: mimeType,
            outputMimeType: outputMimeType,
            sizeAnalysis: {
              tooSmall: audioBlob.size < 1000,
              expectedMinSize: Math.round(finalDuration * 8000), // ~8KB por segundo para áudio comprimido
              compressionRatio: audioBlob.size / (finalDuration * 44100 * 2) // ratio vs PCM não comprimido
            }
          });
          
          // 🚨 ALERTA: Detectar áudio potencialmente corrompido
          if (audioBlob.size < finalDuration * 1000) { // Menos de ~1KB por segundo
            console.warn('🚨 ÁUDIO MUITO PEQUENO - Possível corrupção:', {
              size: audioBlob.size,
              duration: finalDuration,
              bytesPerSecond: audioBlob.size / finalDuration,
              expectedMinimum: finalDuration * 1000
            });
          }
          
          if (onRecordingComplete) {
            onRecordingComplete(audioBlob, finalDuration);
          }
        } else {
          console.log('Recording was cancelled, not calling onRecordingComplete');
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        const error = 'Erro durante a gravação';
        if (onError) onError(error);
      };

      // Start recording
      mediaRecorder.start(250); // Collect data every 250ms
      setIsRecording(true);
      setIsPaused(false);
      startTimer();

    } catch (error) {
      console.error('Error starting recording:', error);
      setHasPermission(false);
      let errorMessage = 'Erro ao acessar o microfone';
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Permissão para usar o microfone foi negada';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'Nenhum microfone encontrado';
        } else if (error.name === 'NotSupportedError') {
          errorMessage = 'Navegador não suporta gravação de áudio';
        }
      }
      
      if (onError) onError(errorMessage);
    }
  }, [maxDuration, onRecordingComplete, onError, startTimer]);

  const stopRecording = useCallback(() => {
    console.log('stopRecording called, isRecording:', isRecording);
    
    if (mediaRecorderRef.current && isRecording) {
      console.log('Stopping MediaRecorder (normal stop)');
      // Mark as NOT cancelled (normal stop)
      isCancelledRef.current = false;
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      stopTimer();
    }

    // Stop all tracks
    if (streamRef.current) {
      console.log('Stopping audio tracks');
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    console.log('stopRecording finished');
  }, [isRecording, stopTimer]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      stopTimer();
    }
  }, [isRecording, isPaused, stopTimer]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      // Add the paused time to the total paused time
      const pauseEndTime = Date.now();
      const lastPauseStart = startTimeRef.current + (duration * 1000) + pausedTimeRef.current;
      pausedTimeRef.current += pauseEndTime - lastPauseStart;
      
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      startTimer();
    }
  }, [isRecording, isPaused, duration, startTimer]);

  const cancelRecording = useCallback(() => {
    console.log('cancelRecording called');
    
    // Mark as cancelled BEFORE stopping
    isCancelledRef.current = true;
    console.log('Set isCancelledRef to true');
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      console.log('Stopping MediaRecorder (cancel)');
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      console.log('Stopping audio tracks');
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setIsRecording(false);
    setIsPaused(false);
    
    // Reset timer manually without affecting the cancelled flag
    stopTimer();
    setDuration(0);
    startTimeRef.current = 0;
    pausedTimeRef.current = 0;
    
    setAudioURL(null);
    audioChunksRef.current = [];
    
    // Clear MediaRecorder reference
    mediaRecorderRef.current = null;
  }, [stopTimer]);

  // Cleanup function to be called when component unmounts or resets
  const cleanup = useCallback(() => {
    console.log('useVoiceRecording cleanup called');
    
    // Stop recording if active
    if (isRecording) {
      cancelRecording();
    }
    
    // Clean up any remaining streams
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Clear timers
    stopTimer();
    
    // Reset all state
    setIsRecording(false);
    setIsPaused(false);
    setDuration(0);
    setAudioURL(null);
    setHasPermission(null);
    
    // Clear refs
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
    startTimeRef.current = 0;
    pausedTimeRef.current = 0;
    isCancelledRef.current = false;
  }, [isRecording, cancelRecording, stopTimer]);

  return {
    isRecording,
    isPaused,
    duration,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    cancelRecording,
    cleanup,
    audioURL,
    hasPermission,
  };
} 