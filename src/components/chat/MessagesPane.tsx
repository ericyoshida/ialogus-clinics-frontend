import { useMessageDateGroups } from '@/hooks/use-message-date-groups';
import { useScrollDateIndicator } from '@/hooks/use-scroll-date-indicator';
import { ConversationItem } from '@/mock/conversations';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { DateSeparator } from './DateSeparator';
import { FloatingDateIndicator } from './FloatingDateIndicator';
import { MessageBubble } from './MessageBubble';

type MessagesPaneProps = {
  conversation: ConversationItem | null;
  isLoadingMessages?: boolean;
  onLoadPreviousMessages?: () => Promise<void>;
  isLoadingPreviousMessages?: boolean;
  hasMoreMessages?: boolean;
  onDownload?: (url: string, filename: string) => void;
};

export function MessagesPane({ 
  conversation, 
  isLoadingMessages = false,
  onLoadPreviousMessages,
  isLoadingPreviousMessages = false,
  hasMoreMessages = true,
  onDownload
}: MessagesPaneProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);
  const [previousScrollHeight, setPreviousScrollHeight] = useState(0);

  // Group messages by date for showing separators
  const messagesWithSeparators = useMessageDateGroups(conversation?.messages || []);
  
  // Track current date during scroll for floating indicator
  const { currentDate, showIndicator, updateDateIndicator } = useScrollDateIndicator(
    conversation?.messages || [],
    messagesContainerRef
  );

  // Scroll to bottom of messages when conversation changes or new messages arrive
  useEffect(() => {
    if (shouldScrollToBottom && messagesContainerRef.current) {
      // Force scroll to absolute bottom using scrollTop
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
    if (messagesEndRef.current && shouldScrollToBottom) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [conversation, shouldScrollToBottom]);

  useLayoutEffect(() => {
    if (shouldScrollToBottom && messagesContainerRef.current) {
      // Force scroll to absolute bottom using scrollTop
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
    if (messagesEndRef.current && shouldScrollToBottom) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [conversation?.messages, shouldScrollToBottom]);

  // Additional scroll handling for media messages - ensures scroll works after media loads
  useEffect(() => {
    if (messagesContainerRef.current && shouldScrollToBottom && conversation?.messages) {
      const scrollToBottom = () => {
        // Only scroll if user is still near the bottom (hasn't scrolled up manually)
        if (messagesContainerRef.current && shouldScrollToBottom) {
          const container = messagesContainerRef.current;
          const { scrollTop, scrollHeight, clientHeight } = container;
          const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
          
          // Only auto-scroll if user is near bottom
          if (isNearBottom) {
            container.scrollTop = container.scrollHeight;
            messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
          }
        }
      };
      
      // Find all images and videos in the messages container
      const container = messagesContainerRef.current;
      const images = Array.from(container.querySelectorAll('img'));
      const videos = Array.from(container.querySelectorAll('video'));
      const totalMedia = images.length + videos.length;
      
      // Check if there are media elements to wait for
      if (totalMedia > 0) {
        let loadedCount = 0;
        
        const checkAllLoaded = () => {
          loadedCount++;
          if (loadedCount >= totalMedia) {
            // All media loaded, scroll to bottom only if user hasn't scrolled up
            setTimeout(scrollToBottom, 50);
          }
        };
        
        // Handle images
        images.forEach((img) => {
          if (img.complete) {
            // Already loaded
            checkAllLoaded();
          } else {
            // Wait for load
            img.addEventListener('load', checkAllLoaded, { once: true });
            img.addEventListener('error', checkAllLoaded, { once: true });
            
            // Fallback in case load event doesn't fire
            setTimeout(checkAllLoaded, 3000);
          }
        });
        
        // Handle videos  
        videos.forEach((video) => {
          if (video.readyState >= 2) {
            // Already loaded enough data
            checkAllLoaded();
          } else {
            // Wait for load
            video.addEventListener('loadeddata', checkAllLoaded, { once: true });
            video.addEventListener('error', checkAllLoaded, { once: true });
            
            // Fallback in case load event doesn't fire
            setTimeout(checkAllLoaded, 3000);
          }
        });
        
        // Cleanup function for event listeners
        const cleanup = () => {
          images.forEach((img) => {
            img.removeEventListener('load', checkAllLoaded);
            img.removeEventListener('error', checkAllLoaded);
          });
          videos.forEach((video) => {
            video.removeEventListener('loadeddata', checkAllLoaded);
            video.removeEventListener('error', checkAllLoaded);
          });
        };
        
        // Store cleanup function for later use
        setTimeout(() => cleanup(), 5000); // Clean up after 5 seconds
      } else {
        // No media elements, scroll immediately only if near bottom
        scrollToBottom();
      }
      
      // Reduced fallback timeouts - only for critical cases
      const timeouts = [
        setTimeout(scrollToBottom, 100),  // Quick follow-up
        setTimeout(scrollToBottom, 500)   // One more attempt
      ];
      
      return () => {
        timeouts.forEach(timeout => clearTimeout(timeout));
      };
    }
  }, [conversation?.messages, shouldScrollToBottom]);

  // Force scroll to bottom when conversation changes (especially important for media conversations)
  useEffect(() => {
    if (conversation?.id) {
      setShouldScrollToBottom(true);
      setPreviousScrollHeight(0); // Reset previous scroll height when conversation changes
      
      const forceScrollToBottom = () => {
        if (messagesContainerRef.current) {
          // Force scroll to absolute bottom using scrollTop
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
        // Also use scrollIntoView as backup
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      };
      
      // Immediate scroll when conversation changes
      forceScrollToBottom();
      
      // Wait a bit and then check for media elements - but only once
      const mediaCheckTimeout = setTimeout(() => {
        if (messagesContainerRef.current) {
          const container = messagesContainerRef.current;
          const images = Array.from(container.querySelectorAll('img'));
          const videos = Array.from(container.querySelectorAll('video'));
          const totalMedia = images.length + videos.length;
          
          if (totalMedia > 0) {
            let loadedCount = 0;
            
            const checkAllLoaded = () => {
              loadedCount++;
              if (loadedCount >= totalMedia) {
                // Final scroll after media loads - only for conversation changes
                setTimeout(forceScrollToBottom, 50);
              }
            };
            
            // Handle images
            images.forEach((img) => {
              if (img.complete) {
                checkAllLoaded();
              } else {
                img.addEventListener('load', checkAllLoaded, { once: true });
                img.addEventListener('error', checkAllLoaded, { once: true });
                setTimeout(checkAllLoaded, 1500); // Shorter timeout
              }
            });
            
            // Handle videos
            videos.forEach((video) => {
              if (video.readyState >= 2) {
                checkAllLoaded();
              } else {
                video.addEventListener('loadeddata', checkAllLoaded, { once: true });
                video.addEventListener('error', checkAllLoaded, { once: true });
                setTimeout(checkAllLoaded, 1500); // Shorter timeout
              }
            });
          }
        }
      }, 100);
      
      // Just one additional fallback for conversation changes
      const fallbackTimeout = setTimeout(forceScrollToBottom, 300);
      
      return () => {
        clearTimeout(mediaCheckTimeout);
        clearTimeout(fallbackTimeout);
      };
    }
  }, [conversation?.id]);

  // Preserve scroll position when loading previous messages
  useLayoutEffect(() => {
    if (messagesContainerRef.current && !isLoadingPreviousMessages && previousScrollHeight > 0) {
      const container = messagesContainerRef.current;
      const newScrollHeight = container.scrollHeight;
      const scrollDifference = newScrollHeight - previousScrollHeight;
      container.scrollTop = container.scrollTop + scrollDifference;
      setPreviousScrollHeight(0);
    }
  }, [isLoadingPreviousMessages, previousScrollHeight]);

  // Handle scroll events
  const handleScroll = useCallback(() => {
    // Always update date indicator during any scroll
    updateDateIndicator();
    
    if (!messagesContainerRef.current || !onLoadPreviousMessages || isLoadingPreviousMessages || !hasMoreMessages) {
      // Still update scroll position tracking even if we can't load more messages
      if (messagesContainerRef.current) {
        const container = messagesContainerRef.current;
        const { scrollTop, scrollHeight, clientHeight } = container;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 200;
        setShouldScrollToBottom(isNearBottom);
      }
      return;
    }

    const container = messagesContainerRef.current;
    const { scrollTop, scrollHeight, clientHeight } = container;

    // Check if user is near the bottom - increased threshold for better UX
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 200;
    setShouldScrollToBottom(isNearBottom);

    // Check if user scrolled to the very top
    if (scrollTop === 0 && conversation?.messages && conversation.messages.length > 0) {
      setPreviousScrollHeight(scrollHeight);
      onLoadPreviousMessages();
    }
  }, [onLoadPreviousMessages, isLoadingPreviousMessages, conversation?.messages, hasMoreMessages, updateDateIndicator]);

  // Check if container has scroll (content height > container height)
  const [hasScroll, setHasScroll] = useState(false);
  
  useEffect(() => {
    const checkScroll = () => {
      if (messagesContainerRef.current) {
        const container = messagesContainerRef.current;
        setHasScroll(container.scrollHeight > container.clientHeight);
      }
    };
    
    // Check scroll after messages load
    checkScroll();
    
    // Also check on window resize
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [conversation?.messages]);

  // Handle manual load more click
  const handleLoadMoreClick = useCallback(async () => {
    if (!onLoadPreviousMessages || isLoadingPreviousMessages || !hasMoreMessages) return;
    
    setPreviousScrollHeight(messagesContainerRef.current?.scrollHeight || 0);
    await onLoadPreviousMessages();
  }, [onLoadPreviousMessages, isLoadingPreviousMessages, hasMoreMessages]);

  if (!conversation) {
    return (
      <div className="w-full h-full flex items-center justify-center p-4 bg-[#ECECEC]">
        <div className="text-center p-6 bg-white rounded-lg shadow-sm">
          <p className="text-gray-500">Selecione uma conversa para visualizar as mensagens</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Floating date indicator - positioned outside container with fixed position */}
      {currentDate && (
        <FloatingDateIndicator 
          date={currentDate} 
          show={showIndicator} 
          containerRef={messagesContainerRef}
        />
      )}
      
      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="w-full h-full overflow-y-auto p-4 relative"
        data-messages-container
      >
        {/* Load more link when there's no scroll and more messages available */}
        {!hasScroll && hasMoreMessages && conversation.messages && conversation.messages.length > 0 && !isLoadingPreviousMessages && (
          <div className="flex justify-center items-center py-4">
            <button
              onClick={handleLoadMoreClick}
              disabled={isLoadingPreviousMessages}
              className="text-sm text-gray-600 hover:text-gray-800 underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Carregar mensagens anteriores
            </button>
          </div>
        )}

        {/* No more messages indicator */}
        {!hasMoreMessages && (
          <div className="flex justify-center items-center py-4">
            <div className="text-center">
              <p className="text-xs text-gray-500">Não há mais mensagens para carregar</p>
            </div>
          </div>
        )}

        <div className="flex flex-col space-y-3 min-h-full">
          {/* Loading indicator for previous messages */}
          {isLoadingPreviousMessages && (
            <div className="flex justify-center items-center py-4">
              <div className="text-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-2 text-xs text-gray-500">Carregando mensagens anteriores...</p>
              </div>
            </div>
          )}

          {isLoadingMessages ? (
            <div className="flex justify-center items-center h-32">
              <div className="text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Carregando mensagens...</p>
              </div>
            </div>
          ) : conversation.messages && conversation.messages.length > 0 ? (
            messagesWithSeparators.map((item) => (
              <div key={item.message.id} data-message-id={item.message.id}>
                {item.showDateSeparator && item.separatorDate && (
                  <DateSeparator date={item.separatorDate} />
                )}
                <MessageBubble message={item.message} onDownload={onDownload} />
              </div>
            ))
          ) : (
            <div className="flex justify-center items-center h-32">
              <div className="text-center p-6 bg-white rounded-lg shadow-sm">
                <p className="text-gray-500">Nenhuma mensagem encontrada</p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-1" />
        </div>
      </div>
    </>
  );
} 