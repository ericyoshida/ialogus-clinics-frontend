import { Message } from '@/mock/conversations';
import api from '@/services/api';
import { Download, File, FileText, Image, Music, Pause, Play } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

interface MediaMessageProps {
  message: Message;
  onDownload?: (url: string, filename: string, messageId?: string) => void;
}

// Global Audio Manager - para controlar múltiplos players
class GlobalAudioManager {
  private static instance: GlobalAudioManager;
  private activePlayer: string | null = null;
  private players: Map<string, () => void> = new Map();

  static getInstance(): GlobalAudioManager {
    if (!GlobalAudioManager.instance) {
      GlobalAudioManager.instance = new GlobalAudioManager();
    }
    return GlobalAudioManager.instance;
  }

  registerPlayer(id: string, stopFunction: () => void) {
    this.players.set(id, stopFunction);
    console.log('🎵 Player registrado:', id, 'Total players:', this.players.size);
  }

  unregisterPlayer(id: string) {
    this.players.delete(id);
    if (this.activePlayer === id) {
      this.activePlayer = null;
    }
    console.log('🎵 Player removido:', id, 'Total players:', this.players.size);
  }

  setActivePlayer(id: string) {
    console.log('🎵 Definindo player ativo:', id, 'Anterior:', this.activePlayer);
    
    // Parar o player anterior se houver
    if (this.activePlayer && this.activePlayer !== id) {
      const stopFunction = this.players.get(this.activePlayer);
      if (stopFunction) {
        console.log('⏹️ Parando player anterior:', this.activePlayer);
        stopFunction();
      }
    }
    
    this.activePlayer = id;
  }

  stopActivePlayer() {
    if (this.activePlayer) {
      console.log('⏹️ Parando player ativo:', this.activePlayer);
      const stopFunction = this.players.get(this.activePlayer);
      if (stopFunction) {
        stopFunction();
      }
      this.activePlayer = null;
    }
  }

  isActivePlayer(id: string): boolean {
    return this.activePlayer === id;
  }
}

// Player de Áudio Independente usando Web Audio API
const IndependentAudioPlayer: React.FC<{
  src: string;
  onDurationChange?: (duration: string) => void;
  className?: string;
  mimeType?: string;
  playerId: string; // Novo prop para identificar o player
}> = ({ src, onDurationChange, className = '', mimeType, playerId }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  
  // Web Audio API refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const startTimeRef = useRef<number>(0);
  const pauseTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);
  
  // Global manager
  const audioManager = useRef(GlobalAudioManager.getInstance());

  // Formatar tempo em MM:SS
  const formatTime = (timeInSeconds: number) => {
    if (!isFinite(timeInSeconds) || isNaN(timeInSeconds)) return '0:00';
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Função para parar este player (será registrada no manager)
  const stopThisPlayer = () => {
    console.log('⏹️ Parando player', playerId);
    
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch (e) {
        console.log('⚠️ Source já estava parado');
      }
      sourceNodeRef.current = null;
    }
    
    setIsPlaying(false);
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = 0;
    }
    
    console.log('✅ Player', playerId, 'parado');
  };

  // Registrar/desregistrar player no manager
  useEffect(() => {
    audioManager.current.registerPlayer(playerId, stopThisPlayer);
    
    return () => {
      audioManager.current.unregisterPlayer(playerId);
    };
  }, [playerId]);

  // Carregar áudio como ArrayBuffer
  const loadAudio = async () => {
    if (!src) return;
    
    setIsLoading(true);
    setLoadProgress(0);
    
    try {
      console.log('📡 Carregando áudio via fetch:', src);
      
      // Fetch com progress tracking
      const response = await fetch(src);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;
      let loaded = 0;

      const reader = response.body?.getReader();
      const chunks: Uint8Array[] = [];

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          chunks.push(value);
          loaded += value.length;
          
          if (total > 0) {
            setLoadProgress((loaded / total) * 100);
          }
        }
      }

      // Combinar chunks em ArrayBuffer
      const arrayBuffer = new ArrayBuffer(loaded);
      const uint8Array = new Uint8Array(arrayBuffer);
      let offset = 0;
      
      for (const chunk of chunks) {
        uint8Array.set(chunk, offset);
        offset += chunk.length;
      }

      console.log('✅ Áudio carregado como ArrayBuffer:', arrayBuffer.byteLength, 'bytes');
      
      // NÃO inicializar AudioContext aqui - apenas armazenar o ArrayBuffer
      // O AudioContext será criado apenas no primeiro clique do usuário
      
      // Tentar decodificar para obter duração, mas não depender do AudioContext ainda
      try {
        // Criar AudioContext temporário apenas para obter duração
        const tempContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const audioBuffer = await tempContext.decodeAudioData(arrayBuffer.slice(0)); // Clonar ArrayBuffer
        
        // Armazenar para uso posterior
        audioBufferRef.current = audioBuffer;
        setDuration(audioBuffer.duration);
        setIsLoading(false);
        
        console.log('✅ Áudio decodificado - Duração:', audioBuffer.duration, 'segundos');
        
        if (onDurationChange) {
          onDurationChange(formatTime(audioBuffer.duration));
        }
        
        // Fechar contexto temporário
        await tempContext.close();
        
      } catch (decodeError) {
        console.error('❌ Erro ao decodificar para duração:', decodeError);  
        // Fallback para elemento audio tradicional
        console.log('🔄 Tentando fallback com elemento audio...');
        tryAudioElementFallback();
      }
      
    } catch (error) {
      console.error('❌ Erro ao carregar áudio:', error);
      setIsLoading(false);
      
      // Fallback: tentar com elemento audio tradicional
      console.log('🔄 Tentando fallback com elemento audio...');
      tryAudioElementFallback();
    }
  };

  // Fallback usando elemento audio tradicional
  const tryAudioElementFallback = () => {
    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.preload = 'metadata';
    
    audio.addEventListener('loadedmetadata', () => {
      console.log('✅ Fallback: metadata carregada, duração:', audio.duration);
      setDuration(audio.duration);
      setIsLoading(false);
      if (onDurationChange) {
        onDurationChange(formatTime(audio.duration));
      }
    });
    
    audio.addEventListener('error', (e) => {
      console.error('❌ Fallback também falhou:', e);
      setIsLoading(false);
    });
    
    audio.src = src;
  };

  // Atualizar tempo atual durante reprodução
  const updateCurrentTime = () => {
    if (isPlaying && audioContextRef.current && audioBufferRef.current) {
      const contextCurrentTime = audioContextRef.current.currentTime;
      // Corrigir: garantir que startTime tem valor válido (pode ser 0 no primeiro play)
      const startTime = startTimeRef.current || 0;
      const elapsed = contextCurrentTime - startTime + pauseTimeRef.current;
      const newCurrentTime = Math.min(Math.max(elapsed, 0), duration);
      
      // Log apenas a cada 0.5 segundos para não spammar
      if (Math.floor(newCurrentTime * 2) !== Math.floor(currentTime * 2)) {
        console.log('⏰ Progresso Player', playerId, ':', (newCurrentTime / duration * 100).toFixed(1) + '%');
      }
      
      // Atualizar sempre para progresso suave
      setCurrentTime(newCurrentTime);
      
      // Verificar se terminou
      if (elapsed >= duration) {
        console.log('🏁 Áudio', playerId, 'terminou');
        // Parar reprodução e resetar
        if (sourceNodeRef.current) {
          try {
            sourceNodeRef.current.stop();
          } catch (e) {
            console.log('⚠️ Source já estava parado');
          }
          sourceNodeRef.current = null;
        }
        setIsPlaying(false);
        setCurrentTime(0);
        pauseTimeRef.current = 0;
        startTimeRef.current = 0;
        
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = 0;
        }
        
        // Limpar do manager
        if (audioManager.current.isActivePlayer(playerId)) {
          audioManager.current.stopActivePlayer();
        }
        return;
      }
      
      // Continuar animação
      animationFrameRef.current = requestAnimationFrame(updateCurrentTime);
    } else {
      // Parou - limpar animação
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = 0;
      }
    }
  };

  // Play/Pause
  const togglePlayPause = async () => {
    console.log('🎵 togglePlayPause chamado para player', playerId, '- Estado atual:', {
      isPlaying,
      hasBuffer: !!audioBufferRef.current,
      hasContext: !!audioContextRef.current,
      contextState: audioContextRef.current?.state,
      isActivePlayer: audioManager.current.isActivePlayer(playerId)
    });

    // Definir este player como ativo (vai parar outros automaticamente)
    audioManager.current.setActivePlayer(playerId);

    // Inicializar AudioContext apenas no primeiro clique (user interaction)
    if (!audioContextRef.current) {
      console.log('🔧 Criando AudioContext na primeira interação do usuário para player', playerId);
      try {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioContextRef.current = new AudioContextClass();
        console.log('✅ AudioContext criado para player', playerId, ':', audioContextRef.current.state);
        
        // Se não temos buffer ainda, tentar recarregar
        if (!audioBufferRef.current && src) {
          console.log('🔄 Redecodificando áudio com novo AudioContext...');
          // Recarregar e decodificar com o contexto ativo
          const response = await fetch(src);
          const arrayBuffer = await response.arrayBuffer();
          audioBufferRef.current = await audioContextRef.current.decodeAudioData(arrayBuffer);
          setDuration(audioBufferRef.current.duration);
          if (onDurationChange) {
            onDurationChange(formatTime(audioBufferRef.current.duration));
          }
          console.log('✅ Áudio redecodificado:', audioBufferRef.current.duration);
        }
      } catch (error) {
        console.error('❌ Erro ao criar AudioContext:', error);
        return;
      }
    }

    if (!audioBufferRef.current) {
      console.log('⚠️ Buffer não disponível para player', playerId);
      return;
    }

    try {
      // Resume AudioContext se necessário (Safari/Chrome policy)
      if (audioContextRef.current.state === 'suspended') {
        console.log('🔄 AudioContext suspenso, tentando resumir...');
        await audioContextRef.current.resume();
        console.log('✅ AudioContext resumido, novo estado:', audioContextRef.current.state);
        
        // Aguardar um pouco para garantir que está ativo
        await new Promise(resolve => setTimeout(resolve, 100));
        console.log('🔄 Estado após aguardar:', audioContextRef.current.state);
      }

      if (isPlaying) {
        console.log('⏸️ Pausando áudio', playerId);
        // Pausar
        if (sourceNodeRef.current) {
          sourceNodeRef.current.stop();
          sourceNodeRef.current = null;
          console.log('✅ Source node parado e limpo');
        }
        
        pauseTimeRef.current = currentTime;
        setIsPlaying(false);
        
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = 0;
          console.log('✅ Animation frame cancelado');
        }
        
        console.log('⏸️ Áudio pausado em:', pauseTimeRef.current);
        
      } else {
        console.log('▶️ Iniciando reprodução do áudio', playerId);
        
        // Se chegou ao final, resetar para o início
        if (currentTime >= duration) {
          console.log('🔄 Resetando para início porque chegou ao fim');
          pauseTimeRef.current = 0;
          setCurrentTime(0);
        }
        
        // Verificar se AudioContext está pronto
        if (audioContextRef.current.state !== 'running') {
          console.log('⚠️ AudioContext não está running:', audioContextRef.current.state);
          await audioContextRef.current.resume();
          await new Promise(resolve => setTimeout(resolve, 100));
          console.log('🔄 Após resume e delay:', audioContextRef.current.state);
        }
        
        // Play
        console.log('🔧 Criando novo AudioBufferSourceNode...');
        const source = audioContextRef.current.createBufferSource();
        console.log('✅ Source node criado');
        
        source.buffer = audioBufferRef.current;
        console.log('✅ Buffer anexado ao source node');
        
        source.connect(audioContextRef.current.destination);
        console.log('✅ Source conectado ao destination');
        
        // Evento de fim - MELHORADO
        source.onended = () => {
          console.log('🏁 Áudio', playerId, 'terminou via onended event');
          
          // Resetar tudo quando terminar
          setIsPlaying(false);
          setCurrentTime(0);
          pauseTimeRef.current = 0;
          startTimeRef.current = 0;
          sourceNodeRef.current = null;
          
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = 0;
          }
          
          // Limpar do manager
          if (audioManager.current.isActivePlayer(playerId)) {
            audioManager.current.stopActivePlayer();
          }
          
          console.log('✅ Botão e progresso resetados após fim do áudio', playerId);
        };
        
        sourceNodeRef.current = source;
        startTimeRef.current = audioContextRef.current.currentTime - pauseTimeRef.current;
        
        console.log('▶️ Tentando iniciar reprodução de:', pauseTimeRef.current, 'segundos');
        console.log('🕐 Tempo atual do AudioContext:', audioContextRef.current.currentTime);
        console.log('🕐 Start time calculado:', startTimeRef.current);
        
        source.start(0, pauseTimeRef.current);
        console.log('✅ source.start() chamado com sucesso');
        
        setIsPlaying(true);
        console.log('✅ Estado isPlaying atualizado para true');
        
        // Garantir que startTime está definido corretamente
        if (startTimeRef.current === 0 || !startTimeRef.current) {
          startTimeRef.current = audioContextRef.current.currentTime;
          console.log('🔧 StartTime corrigido para:', startTimeRef.current);
        }
        
        // Iniciar atualização de tempo IMEDIATAMENTE
        console.log('🔄 Iniciando atualização de tempo para player', playerId);
        // Usar setTimeout pequeno para garantir que o estado foi atualizado
        setTimeout(() => {
          if (audioManager.current.isActivePlayer(playerId)) {
            console.log('🚀 Iniciando primeira chamada do updateCurrentTime');
            updateCurrentTime();
          }
        }, 50); // Aumentado para 50ms para garantir que tudo está pronto
      }
      
    } catch (error) {
      console.error('❌ Erro no play/pause:', error);
      console.error('📋 Detalhes do erro:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      setIsPlaying(false);
    }
  };

  // Seek para posição específica
  const seekTo = (newTime: number) => {
    if (!audioBufferRef.current || !audioContextRef.current) return;

    const wasPlaying = isPlaying;
    
    // Parar reprodução atual
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current = null;
    }
    
    pauseTimeRef.current = Math.min(Math.max(newTime, 0), duration);
    setCurrentTime(pauseTimeRef.current);
    
    // Se estava tocando, continuar tocando na nova posição
    if (wasPlaying) {
      setTimeout(() => {
        setIsPlaying(false); // Reset state
        togglePlayPause(); // Restart from new position
      }, 50);
    }
  };

  // Controle da barra de progresso
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = clickX / width;
    const newTime = percentage * duration;

    seekTo(newTime);
  };

  // Backup: atualização de progresso via interval (caso requestAnimationFrame falhe)
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isPlaying && audioContextRef.current && audioBufferRef.current && duration > 0) {
      console.log('🔄 Iniciando backup interval para Player', playerId);
      interval = setInterval(() => {
        if (audioContextRef.current) {
          const contextCurrentTime = audioContextRef.current.currentTime;
          // Corrigir: garantir que startTimeRef tem valor válido
          const startTime = startTimeRef.current || 0;
          const elapsed = contextCurrentTime - startTime + pauseTimeRef.current;
          const newCurrentTime = Math.min(Math.max(elapsed, 0), duration);
          
          setCurrentTime(newCurrentTime);
          
          if (elapsed >= duration) {
            console.log('🏁 BACKUP: Áudio terminou');
            setIsPlaying(false);
            setCurrentTime(0);
            pauseTimeRef.current = 0;
            startTimeRef.current = 0;
          }
        }
      }, 100); // A cada 100ms
    }
    
    return () => {
      if (interval) {
        console.log('🛑 Limpando backup interval para Player', playerId);
        clearInterval(interval);
      }
    };
  }, [isPlaying, duration, playerId]);

  // Carregar áudio quando src mudar
  useEffect(() => {
    if (src) {
      loadAudio();
    }
    
    return () => {
      // Cleanup
      if (sourceNodeRef.current) {
        sourceNodeRef.current.stop();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [src]);

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`independent-audio-player ${className}`}>
      {/* Controles customizados */}
      <div className="flex items-center gap-3 w-full">
        {/* Botão Play/Pause */}
        <button
          onClick={togglePlayPause}
          disabled={isLoading}
          className={`
            flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
            transition-all duration-200 transform hover:scale-105
            ${isLoading 
              ? 'bg-gray-300 cursor-not-allowed' 
              : 'bg-blue-500 hover:bg-blue-600 active:scale-95 shadow-md hover:shadow-lg'
            }
          `}
        >
          {isLoading ? (
            <Music className="w-5 h-5 text-gray-500 animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-5 h-5 text-white ml-0.5" />
          ) : (
            <Play className="w-5 h-5 text-white ml-0.5" />
          )}
        </button>

        {/* Área de progresso e tempo */}
        <div className="flex-1 flex flex-col gap-1">
          {/* Loading progress bar durante carregamento */}
          {isLoading && (
            <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden mb-1">
              <div
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${loadProgress}%` }}
              />
            </div>
          )}

          {/* Barra de progresso */}
          <div
            className="w-full h-2 bg-gray-200 rounded-full cursor-pointer relative overflow-hidden"
            onClick={handleProgressClick}
          >
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-100 relative"
              style={{ width: `${progressPercentage}%` }}
            >
              {/* Indicador da posição atual */}
              <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-blue-600 rounded-full shadow-sm"></div>
            </div>
          </div>

          {/* Tempo atual / duração total */}
          <div className="flex justify-between text-xs text-gray-500">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const MediaMessage: React.FC<MediaMessageProps> = ({ message, onDownload }) => {
  const { mediaType, mediaUrl, mediaFilename, mediaOriginalFilename, mediaMimeType, text } = message;
  const [audioDuration, setAudioDuration] = useState<string>('');
  const [audioSrc, setAudioSrc] = useState<string>('');
  const [isLoadingAudio, setIsLoadingAudio] = useState<boolean>(false);
  const [imageError, setImageError] = useState<boolean>(false);
  const [imageLoading, setImageLoading] = useState<boolean>(true);

  // Reset states when message changes
  useEffect(() => {
    if (mediaType === 'audio') {
      setAudioSrc('');
      setAudioDuration('');
      setIsLoadingAudio(false);
    }
    if (mediaType === 'image') {
      setImageError(false);
      setImageLoading(true);
    }
  }, [message.id]);

  const getMediaIcon = () => {
    switch (mediaType) {
      case 'image':
        return <Image className="w-4 h-4" />;
      case 'audio':
        return <Music className="w-4 h-4" />;
      case 'video':
        return <Play className="w-4 h-4" />;
      case 'document':
        if (mediaMimeType?.includes('pdf')) {
          return <FileText className="w-4 h-4" />;
        }
        return <File className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getDisplayName = () => {
    return mediaOriginalFilename || mediaFilename || 'arquivo';
  };

  useEffect(() => {
    const prepareAudioUrl = async () => {
      if (mediaType === 'audio') {
        setIsLoadingAudio(true);
        console.log('🎵 Preparando áudio independente:', {
          messageId: message.id,
          mediaUrl,
          mediaType,
          mimeType: mediaMimeType
        });

        // Sempre tentar buscar do banco primeiro usando message ID
        if (message.id) {
          try {
            console.log('📡 Buscando áudio do banco via ID:', message.id);
            const response = await api.get(`/messages/${message.id}/download`, {
              responseType: 'blob',
            });
            console.log('✅ Áudio carregado do banco:', response.data.size, 'bytes', 'tipo:', response.data.type);
            const audioUrl = URL.createObjectURL(response.data);
            setAudioSrc(audioUrl);
            setIsLoadingAudio(false);
            return;
          } catch (error) {
            console.error('❌ Erro ao buscar áudio do banco:', error);
          }
        }

        // Fallback: tentar usar URL direta se disponível
        if (mediaUrl && (mediaUrl.startsWith('http://') || mediaUrl.startsWith('https://'))) {
          console.log('🔄 Usando URL direta como fallback:', mediaUrl);
          setAudioSrc(mediaUrl);
        } else {
          console.error('❌ Nem ID nem URL direta disponível:', { messageId: message.id, mediaUrl });
        }
        
        setIsLoadingAudio(false);
      }
    };

    prepareAudioUrl();
  }, [message.id, mediaUrl, mediaType, mediaMimeType]);

  // Cleanup blob URLs quando componente é desmontado
  useEffect(() => {
    return () => {
      if (audioSrc && audioSrc.startsWith('blob:')) {
        URL.revokeObjectURL(audioSrc);
      }
    };
  }, [audioSrc]);

  // For text messages without media, just return the text
  if (mediaType === 'text' || !mediaType) {
    return <span>{text}</span>;
  }

  // For image messages, show thumbnail if available
  if (mediaType === 'image') {
    // If we have a direct URL, use it
    if (mediaUrl) {
      return (
        <div className="max-w-xs relative group">
          {/* Hidden image to trigger load events */}
          <img 
            src={mediaUrl} 
            alt={getDisplayName()}
            className={imageLoading ? "hidden" : "rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"}
            style={{ maxHeight: '200px' }}
            onLoad={() => {
              console.log('Image loaded successfully');
              setImageLoading(false);
            }}
            onError={() => {
              console.log('Image failed to load');
              setImageError(true);
              setImageLoading(false);
            }}
            onClick={() => {
              if (!imageLoading && !imageError) {
                window.open(mediaUrl, '_blank');
              }
            }}
          />
          
          {imageLoading && (
            <div className="flex items-center justify-center bg-gray-100 rounded-lg p-6 min-h-[150px] min-w-[180px]">
              <div className="flex flex-col items-center gap-3">
                <Image className="w-7 h-7 text-gray-400 animate-pulse" />
                <span className="text-sm text-gray-600 text-center font-medium">Carregando...</span>
              </div>
            </div>
          )}
          
          {imageError && (
            <div className="flex items-center justify-center bg-gray-100 rounded-lg p-6 min-h-[150px] min-w-[180px]">
              <div className="flex flex-col items-center gap-3 text-gray-500">
                <Image className="w-7 h-7" />
                <span className="text-sm text-center font-medium">Erro ao carregar</span>
              </div>
            </div>
          )}

          {!imageLoading && !imageError && onDownload && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDownload(mediaUrl, mediaOriginalFilename || mediaFilename || '', message.id);
              }}
              className="absolute top-2 right-2 p-1 bg-black bg-opacity-50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-opacity-70"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
          
          {!imageLoading && !imageError && text && text !== getDisplayName() && (
            <p className="mt-2 text-sm">{text}</p>
          )}
        </div>
      );
    }

    // If no direct URL but we have message ID, try to load from API
    if (message.id) {
      return (
        <div className="max-w-xs relative group">
          <ImageWithFallback 
            messageId={message.id}
            filename={getDisplayName()}
            text={text}
            onDownload={onDownload}
          />
        </div>
      );
    }

    // Fallback: show file info without preview
    return (
      <div className="flex items-start gap-3 bg-gray-50 rounded-lg p-3 max-w-sm">
        <div className="text-gray-600 mt-1">
          <Image className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {getDisplayName()}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Imagem
          </p>
          {text && text !== getDisplayName() && (
            <p className="text-sm text-gray-700 mt-2">{text}</p>
          )}
        </div>
      </div>
    );
  }

  // For video messages
  if (mediaType === 'video' && mediaUrl) {
    return (
      <div className="max-w-xs relative group">
        <video 
          src={mediaUrl} 
          controls 
          className="rounded-lg max-w-full h-auto"
          style={{ maxHeight: '300px' }}
        >
          Seu navegador não suporta reprodução de vídeo.
        </video>
        {text && text !== getDisplayName() && (
          <p className="mt-2 text-sm">{text}</p>
        )}
        {onDownload && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDownload(mediaUrl, mediaOriginalFilename || mediaFilename || '', message.id);
            }}
            className="absolute top-2 right-2 p-1 bg-black bg-opacity-50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-opacity-70"
            title="Download"
          >
            <Download className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  // For audio messages - PLAYER INDEPENDENTE
  if (mediaType === 'audio') {
    return (
      <div className="flex flex-col gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 max-w-sm border border-blue-100 shadow-sm">        
        {/* Header com informações do áudio */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-md">
              <Music className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">
                Mensagem de Áudio
              </p>
              <p className="text-xs text-gray-500">
                {audioDuration || 'Carregando...'}
              </p>
            </div>
        </div>
          
          {/* Botão de download */}
          {onDownload && mediaUrl && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDownload(mediaUrl, mediaOriginalFilename || mediaFilename || '', message.id);
            }}
              className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-700 hover:bg-white/50 rounded-full transition-all duration-200"
            title="Download"
          >
            <Download className="w-4 h-4" />
          </button>
          )}
        </div>
        
        {/* Player de áudio independente */}
        {audioSrc ? (
          <IndependentAudioPlayer
            src={audioSrc}
            mimeType={mediaMimeType}
            onDurationChange={setAudioDuration}
            className="w-full"
            playerId={message.id}
          />
        ) : isLoadingAudio ? (
          <div className="w-full flex items-center justify-center py-4 bg-white/30 rounded-lg text-gray-600 text-sm">
            <Music className="w-4 h-4 mr-2 animate-spin" />
            Carregando áudio...
          </div>
        ) : (
          <div className="w-full flex items-center justify-center py-4 bg-white/30 rounded-lg text-gray-500 text-sm">
            <Music className="w-4 h-4 mr-2" />
            Áudio não disponível
          </div>
        )}
        
        {/* Caption adicional se houver */}
        {text && !text.includes('🎵') && !text.includes('Enviando') && !text.includes('Mensagem de Áudio') && (
          <p className="text-sm text-gray-700 border-t border-blue-200 pt-3 mt-1">
            {text}
          </p>
        )}
      </div>
    );
  }

  // For document and other file types
  return (
    <div className="flex items-start gap-3 bg-gray-50 rounded-lg p-3 max-w-sm hover:bg-gray-100 transition-colors cursor-pointer">
      <div className="text-gray-600 mt-1">
        {getMediaIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {getDisplayName()}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {mediaMimeType || 'Documento'}
        </p>
        {text && text !== getDisplayName() && (
          <p className="text-sm text-gray-700 mt-2">{text}</p>
        )}
      </div>
      {onDownload && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDownload(mediaUrl, mediaOriginalFilename || mediaFilename || '', message.id);
          }}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-colors ml-2"
          title="Download"
        >
          <Download className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

// Componente para carregar imagem via API com fallback
const ImageWithFallback: React.FC<{
  messageId: string;
  filename: string;
  text?: string;
  onDownload?: (url: string, filename: string, messageId?: string) => void;
}> = ({ messageId, filename, text, onDownload }) => {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    const loadImage = async () => {
      try {
        setIsLoading(true);
        setHasError(false);
        
        console.log('📡 Carregando imagem via API para messageId:', messageId);
        
        const response = await api.get(`/messages/${messageId}/download`, {
          responseType: 'blob',
        });
        
        console.log('✅ Imagem carregada:', response.data.size, 'bytes', 'tipo:', response.data.type);
        
        const imageUrl = URL.createObjectURL(response.data);
        setImageSrc(imageUrl);
        setIsLoading(false);
      } catch (error) {
        console.error('❌ Erro ao carregar imagem:', error);
        setHasError(true);
        setIsLoading(false);
      }
    };

    if (messageId) {
      loadImage();
    }

    // Cleanup blob URL quando componente é desmontado
    return () => {
      if (imageSrc && imageSrc.startsWith('blob:')) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [messageId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center bg-gray-100 rounded-lg p-6 min-h-[150px] min-w-[180px] max-w-xs">
        <div className="flex flex-col items-center gap-3">
          <Image className="w-7 h-7 text-gray-400 animate-pulse" />
          <span className="text-sm text-gray-600 text-center font-medium">Carregando...</span>
        </div>
      </div>
    );
  }

  if (hasError || !imageSrc) {
    return (
      <div className="flex items-start gap-3 bg-gray-50 rounded-lg p-3 max-w-sm">
        <div className="text-gray-600 mt-1">
          <Image className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {filename}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Imagem não disponível
          </p>
          {text && text !== filename && (
            <p className="text-sm text-gray-700 mt-2">{text}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <img 
        src={imageSrc} 
        alt={filename}
        className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
        style={{ maxHeight: '200px' }}
        onClick={() => {
          // Open image in new tab
          window.open(imageSrc, '_blank');
        }}
      />
      {text && text !== filename && (
        <p className="mt-2 text-sm">{text}</p>
      )}
      {onDownload && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDownload(imageSrc, filename, messageId);
          }}
          className="absolute top-2 right-2 p-1 bg-black bg-opacity-50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-opacity-70"
          title="Download"
        >
          <Download className="w-4 h-4" />
        </button>
      )}
    </>
  );
};

export default MediaMessage; 