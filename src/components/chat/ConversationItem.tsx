import { cn } from '@/lib/utils';
import { formatLastMessageDate } from '@/utils/date';
import { File, FileText, Image, Music, Play } from 'lucide-react';
import { ChannelIcon } from '../icons/ChannelIcon';
import { AvatarWithStatus, ConversationStatus } from './AvatarWithStatus';
import { LeadTemperatureBar } from './LeadTemperatureBar';

export type Channel = 'whatsapp' | 'instagram' | 'sms' | 'email';
export type LeadTemperatureLevel = 1 | 2 | 3 | 4 | 5;

export interface ConversationItemProps {
  id: string;
  avatarUrl?: string;
  contactName: string;
  clinicName: string;
  lastMessageDate: Date;
  messagePreview: string;
  unreadCount: number;
  channel: Channel;
  channelPhoneNumber?: string;
  leadTemperature: LeadTemperatureLevel;
  conversationStatus: ConversationStatus;
  selected?: boolean;
  mediaType?: string | null;
  onClick: (id: string) => void;
}

export function ConversationItem({
  id,
  avatarUrl,
  contactName = 'Unknown',
  clinicName = '',
  lastMessageDate = new Date(),
  messagePreview = '',
  unreadCount = 0,
  channel = 'sms',
  channelPhoneNumber,
  leadTemperature = 1,
  conversationStatus = 'inactive',
  selected = false,
  mediaType = null,
  onClick,
}: ConversationItemProps) {
  // Format the date according to the specified rules
  const formattedDate = formatLastMessageDate(lastMessageDate);

  // Get media icon based on media type
  const getMediaIcon = () => {
    if (!mediaType) return null;
    
    switch (mediaType) {
      case 'image':
        return <Image className="w-4 h-4 text-blue-500 flex-shrink-0" />;
      case 'audio':
        return <Music className="w-4 h-4 text-green-500 flex-shrink-0" />;
      case 'video':
        return <Play className="w-4 h-4 text-purple-500 flex-shrink-0" />;
      case 'document':
        return <FileText className="w-4 h-4 text-orange-500 flex-shrink-0" />;
      default:
        return <File className="w-4 h-4 text-gray-500 flex-shrink-0" />;
    }
  };

  return (
    <div
      className={cn(
        'relative flex flex-col p-3 cursor-pointer border-b hover:bg-gray-100 w-full overflow-hidden',
        selected && 'bg-gray-100 hover:bg-gray-200'
      )}
      onClick={() => onClick(id)}
    >
      <div className="flex space-x-3 w-full min-w-0">
        {/* Avatar with status indicator */}
        <AvatarWithStatus
          name={contactName}
          avatarUrl={avatarUrl}
          status={conversationStatus}
        />

        <div className="flex-1 min-w-0 overflow-hidden">
          {/* Header: Contact name and timestamp */}
          <div className="flex justify-between items-start mb-1 w-full">
            <div className="flex items-center gap-1 flex-1 min-w-0">
              <h4 className="font-semibold text-sm truncate">{contactName}</h4>
            </div>
            
            {/* Time and channel icon */}
            <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-2">
              <div className="flex items-center gap-2">
                {/* Timestamp */}
                <span className="text-xs text-gray-500 whitespace-nowrap">{formattedDate}</span>
                {/* Channel icon */}
                <ChannelIcon channel={channel} size={14} className="flex-shrink-0 text-gray-500" />
              </div>
              {/* Channel phone number */}
              {channelPhoneNumber && (
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {channelPhoneNumber}
                </span>
              )}
            </div>
          </div>

          {/* Message preview with media icon and unread badge */}
          <div className="flex justify-between items-center mb-2 w-full">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {/* Media icon */}
              {getMediaIcon()}
              {/* Message preview */}
              <p className="text-sm text-gray-600 truncate flex-1 min-w-0">{messagePreview}</p>
            </div>
            
            {/* Unread badge */}
            {unreadCount > 0 && (
              <span className="ml-2 min-w-[20px] h-5 px-1 rounded-full bg-red-600 text-white text-xs flex-shrink-0 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </div>

          {/* Lead temperature bar */}
          <LeadTemperatureBar level={leadTemperature} className="w-full max-w-full" />
        </div>
      </div>
    </div>
  );
} 