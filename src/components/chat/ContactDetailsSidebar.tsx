import { ConversationItem } from "@/mock/conversations"
import { ChatLogMetrics } from "@/services/chats"
import { AgentStatusButton } from './AgentStatusButton'
import { LeadTemperatureBar } from "./LeadTemperatureBar"
import { NextAppointment } from './NextAppointment'
import { TagsList } from './TagsList'

type LeadTemperatureLevel = 1 | 2 | 3 | 4 | 5;

interface ExtendedConversationItem extends ConversationItem {
  chatLogMetrics?: ChatLogMetrics;
  currentLeadEngagement?: number;
}

interface ContactDetailsSidebarProps {
  conversation: ExtendedConversationItem | null;
  onToggleAgentStatus: () => void;
  isInModal?: boolean;
  isTogglingAI?: boolean;
}

// Function to convert milliseconds to human readable format
const formatDuration = (milliseconds: number): string => {
  // Handle zero or negative values
  if (!milliseconds || milliseconds <= 0) {
    return '0min';
  }
  
  const totalSeconds = Math.floor(milliseconds / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = Math.floor(totalHours / 24);

  if (totalDays > 0) {
    const remainingHours = totalHours % 24;
    const remainingMinutes = totalMinutes % 60;
    return `${totalDays}d ${remainingHours}h ${remainingMinutes}min`;
  } else if (totalHours > 0) {
    const remainingMinutes = totalMinutes % 60;
    return `${totalHours}h ${remainingMinutes}min`;
  } else if (totalMinutes > 0) {
    return `${totalMinutes}min`;
  } else {
    // For very short interactions (less than 1 minute)
    return `${totalSeconds}s`;
  }
};

export function ContactDetailsSidebar({ 
  conversation, 
  onToggleAgentStatus,
  isInModal = false,
  isTogglingAI = false
}: ContactDetailsSidebarProps) {
  if (!conversation) {
    return (
      <div className="w-full h-full bg-white flex flex-col items-center justify-center overflow-hidden">
        <div className="p-6 text-center text-gray-500">
          Selecione uma conversa para ver os detalhes do contato
        </div>
      </div>
    );
  }

  // Calculate lead temperature - use the same logic as the sidebar
  const leadTemperature: LeadTemperatureLevel = (() => {
    // First try to get from currentLeadEngagement (this is the correct source)
    if (conversation.currentLeadEngagement) {
      const engagement = conversation.currentLeadEngagement;
      if (engagement >= 1 && engagement <= 5) {
        return engagement as LeadTemperatureLevel;
      }
    }
    
    // If no currentLeadEngagement, try to extract from statusColors mapping
    // This is a reverse mapping from the colors back to engagement level
    if (conversation.statusColors && conversation.statusColors.length > 0) {
      const colors = conversation.statusColors;
      
      // Level 5: All green
      if (colors.filter(c => c === '#00B212').length === 3) return 5;
      
      // Level 4: 2 green, 1 orange
      if (colors.filter(c => c === '#00B212').length === 2 && 
          colors.filter(c => c === '#FFAA00').length === 1) return 4;
      
      // Level 3: 2 orange, 1 gray
      if (colors.filter(c => c === '#FFAA00').length === 2 && 
          colors.filter(c => c === '#C4C4C4').length === 1) return 3;
      
      // Level 2: 1 orange, 2 gray
      if (colors.filter(c => c === '#FFAA00').length === 1 && 
          colors.filter(c => c === '#C4C4C4').length === 2) return 2;
    }
    
    // Default to level 1
    return 1;
  })();

  // Get metrics from lastChatLogMetrics or fallback to current conversation data
  const metrics = conversation.chatLogMetrics;
  const interactionDuration = metrics?.interactionDuration ? formatDuration(metrics.interactionDuration) : 'N/A';
  const messagesFromSeller = metrics?.totalMessagesFromSeller || conversation.messages?.filter(m => m.isOutgoing).length || 0;
  const messagesFromCustomer = metrics?.totalMessagesFromCustomer || conversation.messages?.filter(m => !m.isOutgoing).length || 0;

  return (
    <div className={`w-full h-full bg-white flex flex-col overflow-hidden ${isInModal ? 'border-0' : ''}`}>
      {/* Contact Profile - Fixed at the top */}
      {!isInModal && (
        <div className="h-14 px-4 py-2 flex items-center justify-between flex-shrink-0 border-b">
          <h2 className="text-sm font-medium">Detalhes do Contato</h2>
        </div>
      )}

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Contact Info */}
        <div className="mb-4">
          <h2 className="text-lg font-bold truncate">{conversation.contactName}</h2>
          <p className="text-sm text-gray-600 truncate">{conversation.phoneNumber}</p>
          {conversation.companyName && (
            <p className="text-sm text-gray-600 truncate mt-1">{conversation.companyName}</p>
          )}
        </div>

        {/* Lead Temperature */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">Temperatura do Lead</h3>
          </div>
          <LeadTemperatureBar level={leadTemperature} className="w-full mb-4" />
        </div>

        {/* Tags */}
        {conversation.tags && <div className="mb-4"><TagsList tags={conversation.tags} /></div>}

        {/* Next Appointment */}
        {conversation.nextAppointment && (
          <div className="mb-4">
            <NextAppointment appointment={conversation.nextAppointment} />
          </div>
        )}
        
        {/* Estatísticas de interação */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Dados da última interação</h3>
          <div className="bg-gray-50 p-3 rounded-md">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-600 flex-shrink-0">Tempo total:</span>
              <span className="text-xs font-medium whitespace-nowrap ml-2">{interactionDuration}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-600 flex-shrink-0">Mensagens enviadas:</span>
              <span className="text-xs font-medium whitespace-nowrap ml-2">{messagesFromSeller}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600 flex-shrink-0">Mensagens recebidas:</span>
              <span className="text-xs font-medium whitespace-nowrap ml-2">{messagesFromCustomer}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Agent Status Button - Fixed at the bottom */}
      <div className="p-4 flex-shrink-0 border-t">
        <p className="text-xs text-gray-500 mb-2 text-center">Clique no botão abaixo para alternar entre atendimento IA e humano</p>
        <AgentStatusButton 
          isActive={conversation.isAgentActive} 
          onClick={onToggleAgentStatus} 
          isLoading={isTogglingAI}
        />
      </div>
    </div>
  );
} 