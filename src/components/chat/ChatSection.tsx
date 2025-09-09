import { ConversationItem } from '@/mock/conversations';
import { ChatHeader } from './ChatHeader';
import { ComposerBar } from './ComposerBar';
import { EmptyChatPlaceholder } from './EmptyChatPlaceholder';
import { InlineChatToggle } from './InlineChatToggle';
import { MessagesPane } from './MessagesPane';

type ChatSectionProps = {
  selectedConversation: ConversationItem | null;
  onSendMessage: (text: string) => void;
  onSendAudio?: (audioBlob: Blob, duration: number) => void;
  onSendFile?: (file: File, caption?: string) => void;
  onBackClick?: () => void;
  onDetailsClick?: () => void;
  onHeaderClick?: () => void;
  onToggleAgentStatus?: () => void;
  showMobileNav?: boolean;
  showDetailsButton?: boolean;
  isLoadingMessages?: boolean;
  onLoadPreviousMessages?: () => Promise<void>;
  isLoadingPreviousMessages?: boolean;
  hasMoreMessages?: boolean;
  disabled?: boolean;
  onDownload?: (url: string, filename: string) => void;
};

export function ChatSection({ 
  selectedConversation, 
  onSendMessage,
  onSendAudio,
  onSendFile,
  onBackClick,
  onDetailsClick,
  onHeaderClick,
  onToggleAgentStatus,
  showMobileNav = false,
  showDetailsButton = false,
  isLoadingMessages = false,
  onLoadPreviousMessages,
  isLoadingPreviousMessages = false,
  hasMoreMessages = true,
  disabled = false,
  onDownload
}: ChatSectionProps) {
  // Verificar se o agente IA está ativo
  const isAIActive = selectedConversation?.isAgentActive;
  
  // Verificar se há janela de atendimento ativa (apenas para WhatsApp)
  const isWhatsApp = selectedConversation?.channel === 'whatsapp';
  const hasActiveServiceWindow = selectedConversation?.hasActiveWhatsappServiceWindow;
  const hasExpiredServiceWindow = selectedConversation?.whatsappServiceWindowExpiresAt 
    ? new Date(selectedConversation.whatsappServiceWindowExpiresAt) < new Date()
    : false;
  
  // Determinar o tipo de bloqueio e a mensagem
  let disabledReason: 'ai-active' | 'no-service-window' | null = null;
  
  if (isAIActive) {
    disabledReason = 'ai-active';
  } else if (isWhatsApp && (!hasActiveServiceWindow || hasExpiredServiceWindow)) {
    disabledReason = 'no-service-window';
  }
  
  const isComposerDisabled = disabledReason !== null || !selectedConversation;

  // Se não houver conversa selecionada, exibe o placeholder
  if (!selectedConversation) {
    return <EmptyChatPlaceholder />;
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Fixed header at the top */}
      <div className="flex-shrink-0 z-10">
        <ChatHeader 
          conversation={selectedConversation} 
          showBackButton={showMobileNav}
          showDetailsButton={showDetailsButton}
          onBackClick={onBackClick}
          onDetailsClick={onDetailsClick || onHeaderClick}
        />
      </div>
      
      {/* Scrollable message content */}
      <div className="flex-1 overflow-hidden">
        <MessagesPane 
          conversation={selectedConversation} 
          isLoadingMessages={isLoadingMessages}
          onLoadPreviousMessages={onLoadPreviousMessages}
          isLoadingPreviousMessages={isLoadingPreviousMessages}
          hasMoreMessages={hasMoreMessages}
          onDownload={onDownload}
        />
      </div>
      
      {/* Status bar com botão de alternar IA/Humano */}
      {onToggleAgentStatus && (
        <div className="flex-shrink-0">
          <InlineChatToggle 
            isAgentActive={selectedConversation.isAgentActive}
            onToggle={onToggleAgentStatus}
            isVisible={true}
          />
        </div>
      )}
      
      {/* Fixed composer at the bottom */}
      <div className="flex-shrink-0 z-10">
        <ComposerBar 
          onSendMessage={onSendMessage} 
          onSendAudio={onSendAudio}
          onSendFile={onSendFile}
          disabled={isComposerDisabled}
          disabledReason={disabledReason}
        />
      </div>
    </div>
  );
} 