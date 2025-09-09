import { ConversationItem } from '@/mock/conversations';
import { ChatLogMetrics } from '@/services/chats';
import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { ContactDetailsSidebar } from './ContactDetailsSidebar';

interface ExtendedConversationItem extends ConversationItem {
  chatLogMetrics?: ChatLogMetrics;
  currentLeadEngagement?: number;
}

interface ContactDetailsModalProps {
  conversation: ExtendedConversationItem | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleAgentStatus: () => void;
  isTogglingAI?: boolean;
}

export function ContactDetailsModal({ 
  conversation, 
  isOpen, 
  onClose,
  onToggleAgentStatus,
  isTogglingAI = false
}: ContactDetailsModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Fechar o modal quando clicar fora dele
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Impedir rolagem do body quando o modal estiver aberto
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in">
      <div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-lg w-[90%] max-w-md h-[90%] max-h-[600px] flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Detalhes do Contato</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <ContactDetailsSidebar 
            conversation={conversation}
            onToggleAgentStatus={onToggleAgentStatus}
            isInModal={true}
            isTogglingAI={isTogglingAI}
          />
        </div>
      </div>
    </div>
  );
} 