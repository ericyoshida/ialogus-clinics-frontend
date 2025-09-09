import { useRef, useState } from 'react';
import { EmojiIcon } from '../icons/EmojiIcon';
import { MicrophoneIcon } from '../icons/MicrophoneIcon';
import { PaperclipIcon } from '../icons/PaperclipIcon';
import { SendIcon } from '../icons/SendIcon';
import { Input } from '../ui/input';
import { EmojiPicker } from './EmojiPicker';
import { VoiceRecorder } from './VoiceRecorder';

type ComposerBarProps = {
  onSendMessage: (text: string) => void;
  onSendAudio?: (audioBlob: Blob, duration: number) => void;
  onSendFile?: (file: File, caption?: string) => void;
  disabled?: boolean;
  disabledReason?: 'ai-active' | 'no-service-window' | null;
};

export function ComposerBar({ onSendMessage, onSendAudio, onSendFile, disabled = false, disabledReason = null }: ComposerBarProps) {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    const input = inputRef.current;
    if (input) {
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const newMessage = message.slice(0, start) + emoji + message.slice(end);
      setMessage(newMessage);
      
      // Focus back to input and set cursor position after emoji
      setTimeout(() => {
        input.focus();
        const newCursorPosition = start + emoji.length;
        input.setSelectionRange(newCursorPosition, newCursorPosition);
      }, 0);
    } else {
      // Fallback: append emoji to the end
      setMessage(prev => prev + emoji);
    }
    setShowEmojiPicker(false);
  };

  const handleEmojiButtonClick = () => {
    if (!disabled) {
      setShowEmojiPicker(prev => !prev);
    }
  };

  const handleVoiceButtonClick = () => {
    if (!disabled) {
      setShowVoiceRecorder(true);
    }
  };

  const handleFileButtonClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onSendFile && !disabled) {
      // Validar arquivo antes de enviar
      const validationError = validateFile(file);
      if (validationError) {
        alert(validationError);
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      // Use current message as caption if available
      const caption = message.trim() || undefined;
      onSendFile(file, caption);
      
      // Clear message after sending file
      setMessage('');
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendAudio = (audioBlob: Blob, duration: number) => {
    console.log('🎤 ComposerBar handleSendAudio called:', { size: audioBlob.size, duration });
    
    if (onSendAudio && !disabled) {
      onSendAudio(audioBlob, duration);
    } else {
      // Fallback: convert to text message indicating audio was sent
      console.log('Audio recorded:', { size: audioBlob.size, duration });
      onSendMessage(`[Áudio gravado - ${Math.round(duration)}s]`);
    }
    
    // Ensure the voice recorder modal is closed
    console.log('🎤 ComposerBar closing voice recorder modal');
    setShowVoiceRecorder(false);
  };

  // Helper function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Helper function to validate file
  const validateFile = (file: File): string | null => {
    // Definir limites específicos por tipo de mídia (conforme guia de requisitos)
    const limits = {
      image: 5 * 1024 * 1024,     // 5MB para imagens
      audio: 16 * 1024 * 1024,    // 16MB para áudio
      video: 16 * 1024 * 1024,    // 16MB para vídeo
      document: 100 * 1024 * 1024 // 100MB para documentos
    };

    // Tipos aceitos conforme especificações dos testes funcionais
    const allowedTypes = {
      // Imagens (até 5MB)
      image: [
        'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'
      ],
      // Áudio (até 16MB) - em ordem de prioridade conforme guia
      audio: [
        'audio/ogg',      // OGG/OPUS - Formato recomendado pelo WhatsApp
        'audio/mpeg',     // MP3 - Será convertido automaticamente
        'audio/mp3',      // MP3 alternativo
        'audio/wav',      // WAV - Será convertido automaticamente
        'audio/mp4',      // M4A/AAC - Será convertido automaticamente
        'audio/aac',      // AAC
        'audio/webm'      // WebM
      ],
      // Vídeo (até 16MB)
      video: [
        'video/mp4', 'video/mov', 'video/avi', 'video/webm', 'video/3gpp'
      ],
      // Documentos (até 100MB)
      document: [
        'application/pdf', 
        'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel', 
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint', 
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain', 
        'text/csv'
      ]
    };

    // Determinar categoria do arquivo
    let category: 'image' | 'audio' | 'video' | 'document' | null = null;
    let maxSize = 0;

    if (allowedTypes.image.includes(file.type)) {
      category = 'image';
      maxSize = limits.image;
    } else if (allowedTypes.audio.includes(file.type)) {
      category = 'audio';
      maxSize = limits.audio;
    } else if (allowedTypes.video.includes(file.type)) {
      category = 'video';
      maxSize = limits.video;
    } else if (allowedTypes.document.includes(file.type)) {
      category = 'document';
      maxSize = limits.document;
    }

    // Verificar se tipo é suportado
    if (!category) {
      return 'Tipo de arquivo não suportado. Envie imagens (PNG, JPG, GIF, WebP), áudio (MP3, OGG, WAV, M4A, AAC), vídeo (MP4, MOV, AVI, WebM, 3GP) ou documentos (PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV).';
    }

    // Verificar tamanho mínimo (conforme especificações)
    const minSize = category === 'audio' ? 1024 : 100; // 1KB para áudio, 100 bytes para outros
    if (file.size < minSize) {
      return `Arquivo muito pequeno. Mínimo para ${category}: ${formatFileSize(minSize)}`;
    }

    // Verificar tamanho máximo
    if (file.size > maxSize) {
      return `Arquivo de ${category} muito grande. Máximo permitido: ${formatFileSize(maxSize)}`;
    }

    return null;
  };

  return (
    <div className="relative h-14">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />
      
      {/* Composer bar (com opacidade reduzida quando desabilitado) */}
      <div className={`h-full bg-white border-t flex items-center px-4 ${disabled ? 'opacity-40' : ''}`}>
        <form className="flex w-full items-center" onSubmit={handleSubmit}>
          <button 
            type="button" 
            onClick={handleFileButtonClick}
            className="flex-shrink-0 h-9 w-9 flex items-center justify-center rounded-full hover:bg-gray-200 mr-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={disabled}
            title="Enviar arquivo"
          >
            <PaperclipIcon className="h-5 w-5" />
          </button>
          
          <div className="relative flex-1">
            <Input
              ref={inputRef}
              type="text"
              placeholder="Mensagem..."
              className="pr-24 disabled:bg-gray-100 disabled:text-gray-700 disabled:font-medium"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={disabled}
            />
            
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center">
              <button 
                type="button" 
                onClick={handleEmojiButtonClick}
                className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={disabled}
              >
                <EmojiIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          <div className="flex ml-2">
            <button 
              type="button" 
              onClick={handleVoiceButtonClick}
              className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-gray-200 mr-1 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={disabled}
              title="Gravar áudio"
            >
              <MicrophoneIcon className="h-5 w-5" />
            </button>
            
            <button 
              type="submit" 
              className="h-9 w-9 flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:bg-blue-300 disabled:cursor-not-allowed"
              disabled={!message.trim() || disabled}
            >
              <SendIcon className="h-5 w-5 text-white" />
            </button>
          </div>
        </form>
      </div>
      
      {/* Emoji Picker */}
      <EmojiPicker
        isOpen={showEmojiPicker}
        onEmojiSelect={handleEmojiSelect}
        onClose={() => setShowEmojiPicker(false)}
      />

      {/* Voice Recorder */}
      <VoiceRecorder
        isOpen={showVoiceRecorder}
        onClose={() => setShowVoiceRecorder(false)}
        onSendAudio={handleSendAudio}
      />
      
      {/* Mensagem de sobreposição (sempre opaca) */}
      {disabled && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-md border border-gray-200">
            {disabledReason === 'ai-active' ? (
              <>
                <img 
                  src="/images/icons/agent.svg" 
                  alt="Agente IA" 
                  className="w-4 h-4 text-ialogus-purple animate-pulse"
                  style={{ filter: 'invert(36%) sepia(74%) saturate(1217%) hue-rotate(223deg) brightness(87%) contrast(96%)' }} 
                />
                <span className="text-sm font-medium text-gray-800">Agente IA está atendendo</span>
                <span className="text-xs text-gray-500">•</span>
                <span className="text-xs text-gray-500">Ative o atendimento humano para responder</span>
              </>
            ) : disabledReason === 'no-service-window' ? (
              <>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  strokeWidth={1.5} 
                  stroke="currentColor" 
                  className="w-4 h-4 text-amber-500 animate-pulse"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75A11.961 11.961 0 0112 2.764z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15h.007v.008H12V15z" />
                </svg>
                <span className="text-sm font-medium text-gray-800">Janela de atendimento fechada</span>
                <span className="text-xs text-gray-500">•</span>
                <span className="text-xs text-gray-500">Cliente precisa iniciar uma conversa</span>
              </>
            ) : (
              <>
                <img 
                  src="/images/icons/agent.svg" 
                  alt="Agente IA" 
                  className="w-4 h-4 text-ialogus-purple animate-pulse"
                  style={{ filter: 'invert(36%) sepia(74%) saturate(1217%) hue-rotate(223deg) brightness(87%) contrast(96%)' }} 
                />
                <span className="text-sm font-medium text-gray-800">Conversa não disponível</span>
                <span className="text-xs text-gray-500">•</span>
                <span className="text-xs text-gray-500">Selecione uma conversa para responder</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 