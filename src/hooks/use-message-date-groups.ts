import { Message } from '@/mock/conversations';
import { isSameDay } from 'date-fns';
import { useMemo } from 'react';

export interface MessageWithSeparator {
  message: Message;
  showDateSeparator: boolean;
  separatorDate?: Date;
}

export function useMessageDateGroups(messages: Message[]): MessageWithSeparator[] {
  return useMemo(() => {
    if (!messages || messages.length === 0) {
      return [];
    }

    // Sort messages by timestamp (oldest first)
    const sortedMessages = [...messages].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    const messagesWithSeparators: MessageWithSeparator[] = [];
    let lastDate: Date | null = null;

    sortedMessages.forEach((message, index) => {
      const messageDate = new Date(message.timestamp);
      
      // Check if we need to show a date separator
      let showDateSeparator = false;
      
      if (lastDate === null || !isSameDay(messageDate, lastDate)) {
        // First message or different day from previous message
        showDateSeparator = true;
        lastDate = messageDate;
      }

      messagesWithSeparators.push({
        message,
        showDateSeparator,
        separatorDate: showDateSeparator ? messageDate : undefined,
      });
    });

    return messagesWithSeparators;
  }, [messages]);
} 