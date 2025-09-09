import { WhatsappChannel } from '@/services/channels';
import { ChatLogItem } from '@/services/chats';
import { cn } from '@/lib/utils';
import { WhatsAppIcon } from '../icons/WhatsAppIcon';
import React from 'react';

interface ChannelTabsProps {
  channels: WhatsappChannel[];
  conversations: ChatLogItem[];
  selectedChannelId: string;
  onSelectChannel: (channelId: string) => void;
  unreadCounts: Map<string, number>;
}

export function ChannelTabs({ 
  channels, 
  conversations,
  selectedChannelId, 
  onSelectChannel,
  unreadCounts 
}: ChannelTabsProps) {
  // Ensure a channel is selected if none is selected
  React.useEffect(() => {
    if (!selectedChannelId && channels.length > 0) {
      onSelectChannel(channels[0].id);
    }
  }, [selectedChannelId, channels, onSelectChannel]);
  // Calculate unread count per channel
  const getUnreadCountForChannel = (channelId: string): number => {
    return conversations
      .filter(conv => conv.channelId === channelId)
      .reduce((total, conv) => {
        const unreadCount = unreadCounts.get(conv.chatLogId) || 0;
        return total + unreadCount;
      }, 0);
  };


  const getConversationCountForChannel = (channelId: string): number => {
    return conversations.filter(conv => conv.channelId === channelId).length;
  };


  // Format phone number for display
  const formatPhoneNumber = (phoneNumber: string): string => {
    // Remove any non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Brazilian format: +55 11 99999-9999
    if (cleaned.startsWith('55') && cleaned.length === 13) {
      return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
    }
    
    // Default format with country code
    if (cleaned.length > 10) {
      return `+${cleaned}`;
    }
    
    return phoneNumber;
  };

  return (
    <div className="flex items-center gap-1 px-4 py-2 border-b overflow-x-auto">

      {/* Individual Channel Tabs */}
      {channels.map((channel) => {
        const conversationCount = getConversationCountForChannel(channel.id);
        const unreadCount = getUnreadCountForChannel(channel.id);

        return (
          <button
            key={channel.id}
            onClick={() => onSelectChannel(channel.id)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
              selectedChannelId === channel.id
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
            )}
          >
            <WhatsAppIcon className="h-4 w-4" />
            <span>{formatPhoneNumber(channel.phoneNumber)}</span>
            <span className="text-xs">
              ({conversationCount})
            </span>
            {unreadCount > 0 && (
              <span className={cn(
                "ml-1 px-1.5 py-0.5 text-xs rounded-full",
                selectedChannelId === channel.id
                  ? "bg-blue-600 text-white"
                  : "bg-red-500 text-white"
              )}>
                {unreadCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}