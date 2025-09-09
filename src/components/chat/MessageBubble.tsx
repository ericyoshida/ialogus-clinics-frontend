import { cn } from '@/lib/utils';
import { Message } from '@/mock/conversations';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import MediaMessage from './MediaMessage';

type MessageBubbleProps = {
  message: Message;
  onDownload?: (url: string, filename: string, messageId?: string) => void;
};

export function MessageBubble({ message, onDownload }: MessageBubbleProps) {
  if (!message) return null;
  
  const { text, timestamp, isOutgoing, mediaType } = message;
  
  // Format time as "HH:MM" with error handling
  let formattedTime = '';
  try {
    if (timestamp instanceof Date) {
      formattedTime = format(timestamp, 'HH:mm', { locale: ptBR });
    } else {
      // If timestamp is not a Date object, create a new Date
      formattedTime = format(new Date(timestamp || Date.now()), 'HH:mm', { locale: ptBR });
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    formattedTime = 'Agora';
  }

  // Check if this is a media message
  const isMediaMessage = mediaType && mediaType !== 'text';

  return (
    <div
      className={cn(
        'flex flex-col max-w-[70%]',
        isOutgoing ? 'ml-auto items-end' : 'mr-auto items-start'
      )}
    >
      <div
        className={cn(
          'rounded-xl relative',
          isMediaMessage ? 'p-2' : 'p-3',
          isOutgoing
            ? 'bg-[#CECFF1] rounded-br-none'
            : 'bg-white rounded-bl-none'
        )}
      >
        {isMediaMessage ? (
          <MediaMessage message={message} onDownload={onDownload} />
        ) : (
          <p className="text-sm">{text || ''}</p>
        )}
      </div>
      <span className="text-xs text-gray-500 mt-1">{formattedTime}</span>
    </div>
  );
} 