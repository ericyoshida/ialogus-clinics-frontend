import { useEffect, useState } from 'react';
import { useVoiceRecording } from '../../hooks/useVoiceRecording';

interface VoiceRecorderProps {
  isOpen: boolean;
  onClose: () => void;
  onSendAudio: (audioBlob: Blob, duration: number) => void;
}

export function VoiceRecorder({ isOpen, onClose, onSendAudio }: VoiceRecorderProps) {
  console.log('🎤 VoiceRecorder rendered with isOpen:', isOpen);
  
  // Flag to control if we should auto-start recording
  const [shouldAutoStart, setShouldAutoStart] = useState(false);
  
  const [currentAudioBlob, setCurrentAudioBlob] = useState<Blob | null>(null);
  const [currentDuration, setCurrentDuration] = useState<number>(0);
  
  const {
    isRecording,
    isPaused,
    duration,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    cancelRecording,
    cleanup,
    hasPermission,
    audioURL,
  } = useVoiceRecording({
    onRecordingComplete: (audioBlob, duration) => {
      console.log('🎵 VoiceRecorder - onRecordingComplete called:', {
        blobSize: audioBlob.size,
        duration,
        blobType: audioBlob.type
      });
      
      // Armazenar o áudio gravado
      setCurrentAudioBlob(audioBlob);
      setCurrentDuration(duration);
      
      // Não enviar automaticamente aqui
      // O usuário precisa clicar em "Enviar"
    },
    onError: (error) => {
      console.error('🎤 VoiceRecorder - Erro na gravação:', error);
    }
  });

  // Set auto-start flag when modal opens for the first time
  useEffect(() => {
    if (isOpen) {
      setShouldAutoStart(true);
    } else {
      setShouldAutoStart(false);
    }
  }, [isOpen]);

  // Auto-start recording when modal opens (only if we should auto-start)
  useEffect(() => {
    if (isOpen && shouldAutoStart && !isRecording && hasPermission !== false) {
      console.log('🎤 Auto-starting recording');
      startRecording();
      setShouldAutoStart(false); // Prevent multiple auto-starts
    }
  }, [isOpen, shouldAutoStart, isRecording, hasPermission, startRecording]);

  // Cleanup recording state when modal closes
  useEffect(() => {
    if (!isOpen) {
      console.log('🎤 Modal closed, cleaning up recording state');
      
      // Use the cleanup function from the hook
      cleanup();
      
      // Reset local state
      setShouldAutoStart(false);
      setCurrentAudioBlob(null);
      setCurrentDuration(0);
    }
  }, [isOpen, cleanup]);

  // Handle ESC key to cancel recording
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        handleCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Limpar estados de áudio quando modal fechar
  useEffect(() => {
    if (!isOpen) {
      setCurrentAudioBlob(null);
      setCurrentDuration(0);
    }
  }, [isOpen]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCancel = () => {
    console.log('🎤 VoiceRecorder handleCancel called');
    
    // Use cleanup function instead of just cancelRecording
    cleanup();
    
    setShouldAutoStart(false);
    setCurrentAudioBlob(null);
    setCurrentDuration(0);
    
    onClose();
  };

  const handleStop = async () => {
    console.log('🛑 VoiceRecorder - Parando gravação...');
    if (isRecording) {
      await stopRecording();
    }
  };

  const handleSendAudio = () => {
    console.log('📤 VoiceRecorder - Enviando áudio:', {
      hasAudio: !!currentAudioBlob,
      blobSize: currentAudioBlob?.size,
      duration: currentDuration
    });
    
    if (onSendAudio && currentAudioBlob) {
      onSendAudio(currentAudioBlob, currentDuration);
      
      // Cleanup após envio
      cleanup();
      setCurrentAudioBlob(null);
      setCurrentDuration(0);
      setShouldAutoStart(false);
      
      // Fechar o modal
      onClose();
    } else {
      console.log('❌ VoiceRecorder - Nenhum áudio para enviar');
    }
  };

  const handlePauseResume = () => {
    if (isPaused) {
      resumeRecording();
    } else {
      pauseRecording();
    }
  };

  if (!isOpen) return null;

  // Se há áudio gravado e não está gravando, mostrar preview
  const showPreview = currentAudioBlob && !isRecording;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40" 
        onClick={handleCancel}
      />
      
      {/* Voice Recorder Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {showPreview ? 'Revisar Gravação' : 'Gravação de Voz'}
            </h3>
            <div className="text-2xl font-mono text-blue-600 mb-2">
              {formatTime(showPreview ? currentDuration : duration)}
            </div>
            <div className="text-sm text-gray-500">
              {showPreview 
                ? 'Ouça sua gravação e decida se quer enviar'
                : isPaused ? 'Pausado' : isRecording ? 'Gravando...' : 'Preparando...'}
            </div>
          </div>

          {/* Preview Player */}
          {showPreview && audioURL && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">🎵</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Sua gravação</p>
                  <p className="text-xs text-gray-500">
                    {formatTime(currentDuration)} • {Math.round(currentAudioBlob!.size / 1024)}KB
                  </p>
                </div>
              </div>
              <audio 
                controls 
                className="w-full"
                src={audioURL}
                preload="metadata"
              >
                Seu navegador não suporta o elemento de áudio.
              </audio>
            </div>
          )}

          {/* Recording Animation */}
          {!showPreview && (
            <div className="flex justify-center mb-6">
              <div className={`relative ${isRecording && !isPaused ? 'animate-pulse' : ''}`}>
                <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center">
                  <svg 
                    className="w-10 h-10 text-white" 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                </div>
                
                {/* Recording waves animation */}
                {isRecording && !isPaused && (
                  <>
                    <div className="absolute inset-0 rounded-full border-4 border-red-300 animate-ping"></div>
                    <div className="absolute inset-0 rounded-full border-2 border-red-200 animate-pulse"></div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex justify-center space-x-4">
            {showPreview ? (
              // Controles do preview
              <>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Descartar
                </button>
                <button
                  onClick={() => {
                    // Voltar para gravação
                    setCurrentAudioBlob(null);
                    setCurrentDuration(0);
                    startRecording();
                  }}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                >
                  Gravar Novamente
                </button>
                <button
                  onClick={handleSendAudio}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Enviar
                </button>
              </>
            ) : (
              // Controles da gravação
              <>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>

                {/* Pause/Resume Button */}
                {isRecording && (
                  <button
                    onClick={handlePauseResume}
                    className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                  >
                    {isPaused ? 'Continuar' : 'Pausar'}
                  </button>
                )}

                {/* Stop Button */}
                {isRecording && (
                  <button
                    onClick={handleStop}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Parar
                  </button>
                )}
              </>
            )}
          </div>

          {/* Help Text */}
          <div className="mt-4 text-center text-xs text-gray-500">
            {showPreview ? (
              <p>Ouça sua gravação e clique em "Enviar" para confirmar</p>
            ) : (
              <>
                <p>Clique em "Parar" para finalizar ou "Cancelar" para descartar</p>
                <p>Máximo: 5 minutos • ESC para cancelar</p>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
} 