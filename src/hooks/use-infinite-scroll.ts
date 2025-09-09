import { useEffect } from 'react';

interface UseInfiniteScrollOptions {
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  threshold?: number;
  scrollContainerRef: React.RefObject<HTMLElement>;
}

export const useInfiniteScroll = ({
  hasMore,
  loading,
  onLoadMore,
  threshold = 100,
  scrollContainerRef
}: UseInfiniteScrollOptions) => {
  // Handle infinite scroll - exactly like SidebarConversations
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - threshold;

      if (isNearBottom && hasMore && !loading) {
        console.log('📜 Chegou ao fim do scroll, carregando mais contatos...');
        onLoadMore();
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [hasMore, loading, threshold, onLoadMore, scrollContainerRef]);
}; 