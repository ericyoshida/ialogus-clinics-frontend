import { Message } from '@/mock/conversations';
import { useCallback, useEffect, useRef, useState } from 'react';

export function useScrollDateIndicator(
  messages: Message[],
  containerRef: React.RefObject<HTMLElement>
) {
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [showIndicator, setShowIndicator] = useState(false);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updateDateIndicator = useCallback(() => {
    if (!containerRef.current || !messages.length) {
      return;
    }

    const container = containerRef.current;

    // Find the first visible message element
    const messageElements = container.querySelectorAll('[data-message-id]');
    
    let visibleMessageId: string | null = null;
    let bestCandidate: { element: Element; distance: number; messageId: string } | null = null;

    for (const element of messageElements) {
      const rect = element.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      
      // Calculate distance from top of container
      const distanceFromTop = rect.top - containerRect.top;
      const messageId = element.getAttribute('data-message-id') || '';
      
      // More flexible detection - look for messages that are partially or fully visible
      // Include messages that are up to 100px above the viewport and within the viewport height + 100px
      if (distanceFromTop >= -100 && distanceFromTop <= containerRect.height + 100) {
        // Prefer messages that are closer to the top of the viewport
        const score = Math.abs(distanceFromTop);
        
        if (!bestCandidate || score < bestCandidate.distance) {
          bestCandidate = {
            element,
            distance: score,
            messageId
          };
        }
      }
    }

    if (bestCandidate) {
      visibleMessageId = bestCandidate.messageId;
    }

    if (visibleMessageId) {
      const visibleMessage = messages.find(msg => msg.id === visibleMessageId);
      if (visibleMessage) {
        const messageDate = new Date(visibleMessage.timestamp);
        
        // Update date and show indicator
        setCurrentDate(messageDate);
        setShowIndicator(true);

        // Clear existing timeout and set new one
        if (hideTimeoutRef.current) {
          clearTimeout(hideTimeoutRef.current);
        }
        
        // Hide indicator after 2 seconds of no scrolling
        hideTimeoutRef.current = setTimeout(() => {
          setShowIndicator(false);
        }, 2000);
      }
    }
  }, [messages, containerRef]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  // Don't use addEventListener since MessagesPane already handles onScroll
  // Instead, export the function to be called from MessagesPane
  return {
    currentDate,
    showIndicator,
    updateDateIndicator,
    hideIndicator: () => {
      setShowIndicator(false);
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
    }
  };
} 