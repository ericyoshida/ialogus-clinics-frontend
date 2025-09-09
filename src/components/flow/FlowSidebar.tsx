import { ChevronDownIcon, ChevronRightIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'
import type { Node } from 'reactflow'
import type { MessageNodeData } from '../../pages/conversations/FlowEditorPage'
import { Button } from '../ui/button'
import { IalogusInput } from '../ui/ialogus-input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Switch } from '../ui/switch'

interface FlowSidebarProps {
  isOpen: boolean;
  selectedNode: Node<MessageNodeData> | undefined;
  allNodes: Node<MessageNodeData>[];
  onClose: () => void;
  onUpdateNodeData: (nodeId: string, newData: Partial<MessageNodeData>) => void;
  onUpdateNodeTiming?: (nodeId: string, forceUpdate?: boolean) => void;
}

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function CollapsibleSection({ title, children, defaultOpen = true }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-200 rounded-lg mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
      >
        <h3 className="font-medium text-gray-900">{title}</h3>
        {isOpen ? (
          <ChevronDownIcon className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronRightIcon className="w-4 h-4 text-gray-500" />
        )}
      </button>
      {isOpen && (
        <div className="px-4 pb-4 space-y-4">
          {children}
        </div>
      )}
    </div>
  );
}

export function FlowSidebar({ isOpen, selectedNode, allNodes, onClose, onUpdateNodeData, onUpdateNodeTiming }: FlowSidebarProps) {
  const [newExample, setNewExample] = useState('');
  const [newDataField, setNewDataField] = useState('');
  const [showExampleInput, setShowExampleInput] = useState(false);
  const [showDataFieldInput, setShowDataFieldInput] = useState(false);

  if (!isOpen || !selectedNode) return null;

  const data = selectedNode.data;

  // Função para atualizar dados
  const updateData = (updates: Partial<MessageNodeData>) => {
    onUpdateNodeData(selectedNode.id, updates);
  };

  // Função para adicionar exemplo
  const addExample = () => {
    if (newExample.trim()) {
      const updatedExamples = [...data.examples, newExample.trim()];
      updateData({ examples: updatedExamples });
      setNewExample('');
      setShowExampleInput(false);
    }
  };

  // Função para remover exemplo
  const removeExample = (index: number) => {
    const updatedExamples = data.examples.filter((_, i) => i !== index);
    updateData({ examples: updatedExamples });
  };

  // Função para adicionar campo de coleta
  const addDataField = () => {
    if (newDataField.trim()) {
      const updatedDataCollection = [...data.dataCollection, newDataField.trim()];
      updateData({ dataCollection: updatedDataCollection });
      setNewDataField('');
      setShowDataFieldInput(false);
      
      // Atualizar timing baseado na nova coleta de dados
      if (onUpdateNodeTiming) {
        setTimeout(() => {
          onUpdateNodeTiming(selectedNode.id, true); // Forçar atualização quando adicionar variável
        }, 100);
      }
    }
  };

  // Função para remover campo de coleta
  const removeDataField = (index: number) => {
    const updatedDataCollection = data.dataCollection.filter((_, i) => i !== index);
    updateData({ dataCollection: updatedDataCollection });
    
    // Atualizar timing baseado na nova coleta de dados
    if (onUpdateNodeTiming) {
      setTimeout(() => {
        onUpdateNodeTiming(selectedNode.id, true); // Forçar atualização quando remover variável
      }, 100);
    }
  };

  // Obter lista de nós disponíveis para conectar (excluindo o nó atual)
  const availableNodes = allNodes.filter(node => node.id !== selectedNode.id);

  // Verificar se há erros de validação
  const hasConditionErrors = data.hasCondition && (
    !data.conditionQuestion || 
    !data.yesDestination || 
    !data.noDestination
  );

  return (
    <div className="w-full bg-white h-full overflow-y-auto">
      <style>{`
        .gradient-line.focused {
          background: linear-gradient(90deg, #F6921E 14%, #EE413D 45%, #E63F42 50%, #D33952 57%, #B2306D 66%, #852492 76%, #4B14C1 87%, #0501FA 99%, #0000FF 100%) !important;
          height: 4px !important;
        }
        .focused .gradient-line {
          background: linear-gradient(90deg, #F6921E 14%, #EE413D 45%, #E63F42 50%, #D33952 57%, #B2306D 66%, #852492 76%, #4B14C1 87%, #0501FA 99%, #0000FF 100%) !important;
          height: 4px !important;
        }
      `}</style>
      {/* Cabeçalho */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Configurações do Bloco</h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <XMarkIcon className="w-4 h-4" />
        </Button>
      </div>

      <div className="p-4 space-y-4">
        {/* Seção: Conteúdo */}
        <CollapsibleSection title="Conteúdo">
          {/* Propósito da mensagem */}
          <div>
            <IalogusInput
              label="Propósito da mensagem"
              value={data.messagePurpose}
              onChange={(e) => updateData({ messagePurpose: e.target.value })}
              placeholder="Digite o propósito da mensagem"
            />
          </div>

          {/* Exemplos de variação */}
          <div>
            <Label>Exemplos de variação</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {data.examples.map((example, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded group"
                >
                  <span>{example}</span>
                  <button
                    onClick={() => removeExample(index)}
                    className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 ml-1"
                  >
                    ×
                  </button>
                </div>
              ))}
              {showExampleInput ? (
                <div className="flex items-center gap-1 w-full">
                  <div className="flex-1 min-w-0">
                    <div className="relative rounded-md overflow-hidden">
                      <input
                        type="text"
                        value={newExample}
                        onChange={(e) => setNewExample(e.target.value)}
                        onFocus={(e) => e.target.parentElement?.classList.add('focused')}
                        onBlur={(e) => e.target.parentElement?.classList.remove('focused')}
                        onKeyPress={(e) => e.key === 'Enter' && addExample()}
                        className="w-full h-10 px-3 text-sm bg-gray-100 rounded-md border-0 focus:ring-0 focus:outline-none focus:bg-orange-50 transition-colors"
                        placeholder="Digite um exemplo"
                        autoFocus
                      />
                      <div className="absolute bottom-0 left-0 right-0 overflow-hidden">
                        <div 
                          className="gradient-line w-full transition-all duration-200 h-0.5"
                          style={{
                            background: 'linear-gradient(90deg, #e5e7eb 0%, #e5e7eb 30%, #8b8fff 70%, #0000cc 100%)'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={addExample}
                    className="text-green-600 hover:text-green-800 text-sm px-2 py-2 flex-shrink-0"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => {
                      setShowExampleInput(false);
                      setNewExample('');
                    }}
                    className="text-red-600 hover:text-red-800 text-sm px-2 py-2 flex-shrink-0"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowExampleInput(true)}
                  className="px-2 py-1 text-xs border border-dashed border-gray-300 text-gray-500 rounded hover:border-gray-400 hover:text-gray-600"
                >
                  + Adicionar exemplo
                </button>
              )}
            </div>
          </div>

          {/* Coleta de dados */}
          <div>
            <Label>Coleta de dados</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {data.dataCollection.map((field, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded group"
                >
                  <span>{field}</span>
                  <button
                    onClick={() => removeDataField(index)}
                    className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 ml-1"
                  >
                    ×
                  </button>
                </div>
              ))}
              {showDataFieldInput ? (
                <div className="flex items-center gap-1 w-full">
                  <div className="flex-1 min-w-0">
                    <div className="relative rounded-md overflow-hidden">
                      <input
                        type="text"
                        value={newDataField}
                        onChange={(e) => setNewDataField(e.target.value)}
                        onFocus={(e) => e.target.parentElement?.classList.add('focused')}
                        onBlur={(e) => e.target.parentElement?.classList.remove('focused')}
                        onKeyPress={(e) => e.key === 'Enter' && addDataField()}
                        className="w-full h-10 px-3 text-sm bg-gray-100 rounded-md border-0 focus:ring-0 focus:outline-none focus:bg-orange-50 transition-colors"
                        placeholder="Digite o campo"
                        autoFocus
                      />
                      <div className="absolute bottom-0 left-0 right-0 overflow-hidden">
                        <div 
                          className="gradient-line w-full transition-all duration-200 h-0.5"
                          style={{
                            background: 'linear-gradient(90deg, #e5e7eb 0%, #e5e7eb 30%, #8b8fff 70%, #0000cc 100%)'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={addDataField}
                    className="text-green-600 hover:text-green-800 text-sm px-2 py-2 flex-shrink-0"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => {
                      setShowDataFieldInput(false);
                      setNewDataField('');
                    }}
                    className="text-red-600 hover:text-red-800 text-sm px-2 py-2 flex-shrink-0"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowDataFieldInput(true)}
                  className="px-2 py-1 text-xs border border-dashed border-gray-300 text-gray-500 rounded hover:border-gray-400 hover:text-gray-600"
                >
                  + Adicionar campo
                </button>
              )}
            </div>
          </div>
        </CollapsibleSection>

        {/* Seção: Condição */}
        <CollapsibleSection title="Condição">
          {/* Switch para ativar pergunta */}
          <div className="flex items-center justify-between">
            <Label htmlFor="hasCondition">Ativar pergunta</Label>
            <Switch
              id="hasCondition"
              checked={data.hasCondition}
              onCheckedChange={(checked) => updateData({ hasCondition: checked })}
            />
          </div>

          {data.hasCondition && (
            <>
              {/* Pergunta de decisão */}
              <div>
                <IalogusInput
                  label="Pergunta de decisão"
                  value={data.conditionQuestion}
                  onChange={(e) => updateData({ conditionQuestion: e.target.value })}
                  placeholder="Ex: Deseja continuar?"
                  errorMessage={!data.conditionQuestion ? 'Pergunta é obrigatória' : undefined}
                />
              </div>

              {/* Destino se SIM */}
              <div>
                <Label htmlFor="yesDestination">Destino se SIM</Label>
                <Select
                  value={data.yesDestination || ''}
                  onValueChange={(value) => updateData({ yesDestination: value })}
                >
                  <SelectTrigger className={`mt-1 ${!data.yesDestination ? 'border-red-300' : ''}`}>
                    <SelectValue placeholder="Selecione um bloco" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableNodes.map((node) => (
                      <SelectItem key={node.id} value={node.id}>
                        {node.data.messagePurpose || node.data.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!data.yesDestination && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
                    ⚠️ Destino é obrigatório
                  </p>
                )}
              </div>

              {/* Destino se NÃO */}
              <div>
                <Label htmlFor="noDestination">Destino se NÃO</Label>
                <Select
                  value={data.noDestination || ''}
                  onValueChange={(value) => updateData({ noDestination: value })}
                >
                  <SelectTrigger className={`mt-1 ${!data.noDestination ? 'border-red-300' : ''}`}>
                    <SelectValue placeholder="Selecione um bloco" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableNodes.map((node) => (
                      <SelectItem key={node.id} value={node.id}>
                        {node.data.messagePurpose || node.data.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!data.noDestination && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
                    ⚠️ Destino é obrigatório
                  </p>
                )}
              </div>
            </>
          )}
        </CollapsibleSection>

        {/* Seção: Configuração Avançada */}
        <CollapsibleSection title="Configuração Avançada" defaultOpen={false}>
          {/* Intervalo entre mensagens */}
          <div>
            <IalogusInput
              label="Intervalo entre mensagens (segundos)"
              id="interval"
              type="number"
              min="0"
              max="3600"
              value={data.timing.interval.toString()}
              onChange={(e) => updateData({ 
                timing: { 
                  ...data.timing, 
                  interval: parseInt(e.target.value) || 0
                }
              })}
              placeholder="0"
            />
            <div className="mt-1 text-xs text-gray-500">
              Tempo que o bot aguarda antes de responder após receber uma mensagem do cliente. Isso permite que o cliente envie várias mensagens seguidas antes de receber uma resposta mais assertiva.
            </div>
          </div>

          {/* Tempo máximo de espera */}
          <div>
            <IalogusInput
              label="Tempo máximo de espera (segundos)"
              id="maxWait"
              type="number"
              min="0"
              value={data.timing.maxWait.toString()}
              onChange={(e) => updateData({ 
                timing: { 
                  ...data.timing, 
                  maxWait: parseInt(e.target.value) || 0
                }
              })}
              placeholder="0"
            />
            <div className="mt-1 text-xs text-gray-500">
              Tempo que o bot aguarda por uma resposta do cliente antes de encerrar a conversa. Use 0 para blocos finais ou quando não houver expectativa de resposta.
            </div>
          </div>
        </CollapsibleSection>
      </div>
    </div>
  );
} 