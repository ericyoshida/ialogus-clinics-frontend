import { ConversationItem } from '@/mock/conversations';
import { ArrowLeft, Info } from 'lucide-react';
import { ChannelIcon } from '../icons/ChannelIcon';

type ChatHeaderProps = {
  conversation: ConversationItem | null;
  onBackClick?: () => void;
  onDetailsClick?: () => void;
  showBackButton?: boolean;
  showDetailsButton?: boolean;
};

export function ChatHeader({ 
  conversation, 
  onBackClick, 
  onDetailsClick,
  showBackButton = false,
  showDetailsButton = false
}: ChatHeaderProps) {
  if (!conversation) {
    return (
      <div className="h-14 bg-[#A7D9A8] flex items-center px-4 py-2 border-b">
        <p className="text-gray-600">Selecione uma conversa para iniciar</p>
      </div>
    );
  }

  // Determine o identificador secundário com base no canal
  const getSecondaryIdentifier = () => {
    if (conversation.channel === 'whatsapp' || conversation.channel === 'sms') {
      return conversation.phoneNumber || '';
    } else if (conversation.channel === 'instagram') {
      return `@${conversation.contactName.toLowerCase().replace(/\s+/g, '')}`;
    } else {
      // Para outros canais (email, etc)
      return conversation.clinicName || '';
    }
  };

  // Gera as iniciais do nome do contato
  const initials = conversation.contactName
    .split(' ')
    .map((n) => n[0] || '')
    .join('')
    .toUpperCase();

  // Gera uma cor determinística baseada no nome
  const getAvatarColor = () => {
    if (!conversation.contactName) return "bg-ialogus-purple";
    
    // Hash do nome para obter um número consistente
    let hash = 0;
    for (let i = 0; i < conversation.contactName.length; i++) {
      hash = conversation.contactName.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Lista de cores vibrantes
    const colors = [
      "bg-rose-500",
      "bg-pink-500",
      "bg-fuchsia-500",
      "bg-purple-500",
      "bg-violet-500",
      "bg-indigo-500",
      "bg-blue-500",
      "bg-sky-500",
      "bg-cyan-500",
      "bg-teal-500",
      "bg-emerald-500",
      "bg-green-500",
      "bg-lime-500",
      "bg-yellow-500",
      "bg-amber-500",
      "bg-orange-500",
      "bg-red-500",
    ];
    
    // Usa o hash para escolher uma cor
    const colorIndex = Math.abs(hash) % colors.length;
    return colors[colorIndex];
  };

  // Função que lida com o clique nos detalhes
  const handleDetailsClick = () => {
    if (onDetailsClick) {
      onDetailsClick();
    }
  };

  return (
    <div className="h-14 bg-[#A7D9A8] flex items-center justify-between px-4 py-2 border-b">
      <div className="flex items-center gap-3 flex-grow">
        {showBackButton && (
          <button 
            onClick={onBackClick} 
            className="p-1 -ml-1 rounded-full hover:bg-white/20"
          >
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </button>
        )}

        {/* Área clicável para abrir detalhes do contato que se estende do avatar até o ícone de info */}
        <div 
          className={`flex items-center justify-between gap-3 flex-grow group ${onDetailsClick && showDetailsButton ? 'cursor-pointer' : ''}`}
          onClick={showDetailsButton ? handleDetailsClick : undefined}
        >
          <div className="flex items-center gap-3">
            {/* Círculo colorido com iniciais */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${getAvatarColor()}`}>
              <span className="text-xs font-medium">{initials}</span>
            </div>
            
            <div className="flex flex-col">
              <h3 className="font-bold text-gray-800">{conversation.contactName}</h3>
              <p className="text-xs text-gray-600">{getSecondaryIdentifier()}</p>
            </div>
          </div>
          
          {/* Ícone de informações só aparece quando showDetailsButton é true */}
          {showDetailsButton && (
            <div 
              className="flex items-center justify-center w-8 h-8 rounded-full bg-white/0 group-hover:bg-white/30 transition-colors duration-200 ml-auto"
              title="Ver detalhes do contato"
            >
              <Info className="h-5 w-5 text-gray-700 group-hover:text-gray-900" />
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center ml-2">
        <ChannelIcon channel={conversation.channel} size={20} />
      </div>
    </div>
  );
}