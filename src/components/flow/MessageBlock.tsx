import { useState } from 'react';
import { Handle, Position } from 'reactflow';
import type { MessageNodeData } from '../../pages/conversations/FlowEditorPage';
import { Button } from '../ui/button';

interface MessageBlockProps {
  data: MessageNodeData & {
    hasIncomingConnections?: boolean; // Informação sobre conexões de entrada
    onDelete?: () => void; // Função para deletar o bloco
  };
  selected?: boolean;
  isConnectable?: boolean;
}

export function MessageBlock({ data, selected, isConnectable }: MessageBlockProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Truncar texto para preview
  const truncateText = (text: string, maxLength: number = 80) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Determinar status do bloco
  const hasBasicContent = data.messagePurpose && data.examples && data.examples.length > 0;
  const hasCondition = data.hasCondition && data.conditionQuestion;
  const hasContentErrors = !hasBasicContent || (data.hasCondition && !hasCondition);
  
  // Verificar se é um bloco desconectado (não é início e não tem conexões de entrada)
  const isDisconnectedNode = !data.isStartNode && !data.hasIncomingConnections;
  
  // Determinar se há erros (conteúdo ou conexão)
  const hasErrors = hasContentErrors || isDisconnectedNode;
  const isComplete = hasBasicContent && (!data.hasCondition || hasCondition) && !isDisconnectedNode;

  // Função para renderizar o ícone correto
  const renderStatusIcon = () => {
    if (isComplete) {
      return (
        <img 
          src="/images/icons/check-icon.svg" 
          alt="Completo" 
          className="w-5 h-5 flex-shrink-0"
        />
      );
    } else if (hasErrors) {
      return (
        <img 
          src="/images/icons/warning-icon.svg" 
          alt="Aviso" 
          className="w-5 h-5 flex-shrink-0"
        />
      );
    } else {
      return (
        <img 
          src="/images/icons/tune-icon.svg" 
          alt="Configurar" 
          className="w-5 h-5 flex-shrink-0"
        />
      );
    }
  };

  return (
    <div 
      className={`
        w-80 bg-white rounded-lg shadow-lg border-2 transition-all duration-150 relative
        ${selected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'}
        ${isHovered ? 'shadow-xl' : ''}
        ${data.hasCondition ? 'min-h-[200px]' : 'min-h-[160px]'}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Handle de entrada (esquerda) - alinhado com o conteúdo - não mostrar no nó inicial */}
      {!data.isStartNode && (
        <Handle
          type="target"
          position={Position.Left}
          className="w-4 h-4 bg-gray-400 border-2 border-white rounded-full hover:scale-150 transition-transform duration-200"
          isConnectable={isConnectable}
          style={{ top: '65%', transform: 'translateY(-50%)' }}
        />
      )}

      {/* Cabeçalho do bloco */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 min-h-[60px]">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className="text-gray-800 font-medium truncate flex-1">
            {data.messagePurpose || 'Propósito da mensagem'}
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            {renderStatusIcon()}
            {/* Botão de configuração */}
            <Button
              size="sm"
              variant="outline"
              className="w-8 h-8 p-0 hover:bg-gray-100 flex-shrink-0"
            >
              <img 
                src="/images/icons/tune-icon.svg" 
                alt="Configurar" 
                className="w-4 h-4"
              />
            </Button>
            {/* Botão de deletar - não mostrar no nó inicial */}
            {!data.isStartNode && data.onDelete && (
              <Button
                size="sm"
                variant="outline"
                className="w-8 h-8 p-0 hover:bg-red-50 hover:border-red-300 flex-shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  data.onDelete();
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-4 h-4 text-red-600"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                  />
                </svg>
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Container do exemplo de mensagem */}
      <div className="p-4 space-y-3">
        <div className="bg-gray-50 rounded-lg p-3">
          <label className="text-xs text-gray-500 font-medium mb-2 block">
            Exemplo de mensagem
          </label>
          <p className="text-sm text-gray-700 leading-relaxed">
            {data.examples && data.examples.length > 0 
              ? truncateText(data.examples[0]) 
              : 'Nenhum exemplo definido...'}
          </p>
        </div>

        {/* Container da condição (se houver) */}
        {data.hasCondition && (
          <div className="bg-gray-50 rounded-lg p-3">
            <label className="text-xs text-gray-500 font-medium mb-2 block">
              Condição
            </label>
            <p className="text-sm text-gray-700 leading-relaxed">
              {data.conditionQuestion || 'Condição não definida...'}
            </p>
          </div>
        )}

        {/* Aviso para bloco desconectado */}
        {isDisconnectedNode && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <img 
                src="/images/icons/warning-icon.svg" 
                alt="Aviso" 
                className="w-4 h-4 flex-shrink-0"
              />
              <p className="text-xs text-yellow-700 font-medium">
                Bloco desconectado - conecte a um bloco anterior
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Handles de saída */}
      {data.hasCondition ? (
        /* Saídas condicionais (direita) */
        <>
          <Handle
            type="source"
            position={Position.Right}
            id="yes"
            className="w-4 h-4 bg-green-500 border-2 border-white rounded-full hover:scale-150 transition-transform duration-200"
            isConnectable={isConnectable}
            style={{ top: '50%', transform: 'translateY(-50%)' }}
          />
          <Handle
            type="source"
            position={Position.Right}
            id="no"
            className="w-4 h-4 bg-red-500 border-2 border-white rounded-full hover:scale-150 transition-transform duration-200"
            isConnectable={isConnectable}
            style={{ top: '70%', transform: 'translateY(-50%)' }}
          />
          {/* Labels das saídas condicionais - posicionados em cima das linhas */}
          <div className="absolute -right-14 top-[50%] text-xs text-green-600 font-medium bg-white px-1 rounded shadow-sm border border-green-200 transform -translate-y-1/2">
            SIM
          </div>
          <div className="absolute -right-14 top-[70%] text-xs text-red-600 font-medium bg-white px-1 rounded shadow-sm border border-red-200 transform -translate-y-1/2">
            NÃO
          </div>
        </>
      ) : (
        /* Saída simples (direita) - posicionada no meio da seção de conteúdo */
        <Handle
          type="source"
          position={Position.Right}
          className="w-4 h-4 bg-blue-500 border-2 border-white rounded-full hover:scale-150 transition-transform duration-200"
          isConnectable={isConnectable}
          style={{ top: '65%', transform: 'translateY(-50%)' }}
        />
      )}
    </div>
  );
} 