import { useToast } from '@/hooks/use-toast'
import { useCompanies } from '@/hooks/use-companies'
import { ApiService } from '@/services/api'
import {
  ArrowLeftIcon,
  Bars3Icon,
  PlusIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline'
import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useSearchParams, useParams } from 'react-router-dom'
import ReactFlow, {
  addEdge,
  Background,
  BackgroundVariant,
  Connection,
  Controls,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
  useEdgesState,
  useNodesState
} from 'reactflow'
import 'reactflow/dist/style.css'
import { FlowSidebar } from '../../components/flow/FlowSidebar'
import { MessageBlock } from '../../components/flow/MessageBlock'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'

// Tipos customizados para os nós
export interface MessageNodeData {
  id: string;
  title: string;
  messagePurpose: string;
  message: string;
  variables: string[];
  examples: string[];
  dataCollection: string[];
  hasCondition: boolean;
  conditionQuestion: string;
  yesDestination: string | null;
  noDestination: string | null;
  timing: {
    interval: number;
    maxWait: number;
  };
  isStartNode?: boolean;
  manualTimingEdit?: boolean; // Flag para controlar edições manuais
}

export interface FlowState {
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  isSidebarOpen: boolean;
  flowName: string;
  nodeCount: number;
  errorCount: number;
}

// Tipos de nós customizados
const nodeTypes = {
  messageBlock: MessageBlock,
};

// Configuração inicial dos nós
const initialNodes: Node<MessageNodeData>[] = [
  {
    id: '1',
    type: 'messageBlock',
    position: { x: 100, y: 100 },
    data: {
      id: '1',
      title: 'Mensagem de Boas-vindas',
      messagePurpose: 'Saudar o usuário e iniciar a conversa',
      message: 'Olá! Como posso ajudá-lo hoje?',
      variables: ['nome'],
      examples: ['Olá! Como posso ajudá-lo hoje?', 'Bem-vindo! Em que posso auxiliá-lo?'],
      dataCollection: [],
      hasCondition: false,
      conditionQuestion: '',
      yesDestination: null,
      noDestination: null,
      timing: {
        interval: 10, // 10 segundos
        maxWait: 0, // 0 segundos (sem conexões)
      },
      isStartNode: true,
    },
  },
];

const initialEdges: Edge[] = [];

export const FlowEditorPage: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [flowState, setFlowState] = useState<FlowState>({
    selectedNodeId: null,
    selectedEdgeId: null,
    isSidebarOpen: false,
    flowName: 'Novo Fluxo',
    nodeCount: 1,
    errorCount: 0,
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditingFlowName, setIsEditingFlowName] = useState(false);
  const [tempFlowName, setTempFlowName] = useState('');
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [tooltipDirection, setTooltipDirection] = useState<'up' | 'down'>('down');
  const [arrowPosition, setArrowPosition] = useState(50); // Posição da seta em porcentagem
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const helpButtonRef = useRef<HTMLButtonElement>(null);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { toast } = useToast();
  const { companyId } = useParams<{ companyId: string }>();
  const { companies } = useCompanies();
  const companyName = companies.find(c => c.id === companyId)?.name || 'Carregando...';
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const flowchartId = searchParams.get('flowchartId');
  const [isEditMode, setIsEditMode] = useState(false);

  // Cleanup do timeout quando o componente for desmontado
  React.useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
    };
  }, []);

  // Carregar fluxo existente se estiver em modo de edição
  useEffect(() => {
    async function loadExistingFlowchart() {
      if (!flowchartId) return;
      
      setIsLoading(true);
      setIsEditMode(true);
      
      try {
        const response = await ApiService.getMessagesFlowchart(flowchartId);
        const flowchart = response.messagesFlowchart;
        
        // Atualizar nome do fluxo
        setFlowState(prev => ({ ...prev, flowName: flowchart.name }));
        
        // Converter message blocks para nodes e edges
        const newNodes: Node<MessageNodeData>[] = [];
        const newEdges: Edge[] = [];
        const blockIdToNodeId = new Map<string, string>();
        
        // Primeiro, criar todos os nós
        flowchart.messageBlockSequence.forEach((block, index) => {
          const nodeId = `node-${index + 1}`;
          blockIdToNodeId.set(block.id, nodeId);
          
          const nodeData: MessageNodeData = {
            id: nodeId,
            title: `Mensagem ${index + 1}`,
            messagePurpose: block.messagePurpose,
            message: block.messageExamples.join('\n'),
            variables: [],
            examples: block.messageExamples,
            dataCollection: block.dataCollectionFields || [],
            hasCondition: block.haveParticularCondition,
            conditionQuestion: block.condition || '',
            yesDestination: null,
            noDestination: null,
            timing: {
              interval: block.timeIntervalBetweenMessages,
              maxWait: block.maximumWaitTime,
            },
            isStartNode: block.isFirstMessage,
          };
          
          newNodes.push({
            id: nodeId,
            type: 'messageBlock',
            position: { x: 250 + (index % 3) * 350, y: 100 + Math.floor(index / 3) * 250 },
            data: nodeData,
          });
        });
        
        // Depois, criar as edges baseadas nas relações
        flowchart.messageBlockSequence.forEach((block) => {
          const sourceNodeId = blockIdToNodeId.get(block.id);
          
          if (block.positiveBlockId) {
            const targetNodeId = blockIdToNodeId.get(block.positiveBlockId);
            if (sourceNodeId && targetNodeId) {
              newEdges.push({
                id: `${sourceNodeId}-${targetNodeId}-yes`,
                source: sourceNodeId,
                target: targetNodeId,
                sourceHandle: 'yes',
                targetHandle: 'target',
                animated: true,
                style: { stroke: '#10B981' },
              });
              
              // Atualizar o nó com a destinação
              const node = newNodes.find(n => n.id === sourceNodeId);
              if (node) {
                node.data.yesDestination = targetNodeId;
              }
            }
          }
          
          if (block.negativeBlockId) {
            const targetNodeId = blockIdToNodeId.get(block.negativeBlockId);
            if (sourceNodeId && targetNodeId) {
              newEdges.push({
                id: `${sourceNodeId}-${targetNodeId}-no`,
                source: sourceNodeId,
                target: targetNodeId,
                sourceHandle: 'no',
                targetHandle: 'target',
                animated: true,
                style: { stroke: '#EF4444' },
              });
              
              // Atualizar o nó com a destinação
              const node = newNodes.find(n => n.id === sourceNodeId);
              if (node) {
                node.data.noDestination = targetNodeId;
              }
            }
          }
          
          // Se não tem condição, criar edge direto
          if (!block.haveParticularCondition && block.previousMessageBlockId) {
            const previousNodeId = blockIdToNodeId.get(block.previousMessageBlockId);
            const targetNodeId = blockIdToNodeId.get(block.id);
            if (previousNodeId && targetNodeId) {
              newEdges.push({
                id: `${previousNodeId}-${targetNodeId}`,
                source: previousNodeId,
                target: targetNodeId,
                sourceHandle: 'source',
                targetHandle: 'target',
                animated: true,
              });
            }
          }
        });
        
        setNodes(newNodes);
        setEdges(newEdges);
        setFlowState(prev => ({ ...prev, nodeCount: newNodes.length }));
        
      } catch (error) {
        console.error('Erro ao carregar fluxo:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar fluxo. Verifique se o fluxo existe.",
          variant: "destructive",
        });
        navigate(`/dashboard/company/${companyId}/agents/create/conversation-flow`);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadExistingFlowchart();
  }, [flowchartId]);

  // Função para atualizar dados do nó
  const onUpdateNodeData = useCallback((nodeId: string, newData: Partial<MessageNodeData>) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              ...newData,
            },
          };
        }
        return node;
      })
    );

    // Lógica especial: quando ativar condição em um bloco que já tem conexão
    if (newData.hasCondition === true) {
      // Encontrar conexão existente deste nó
      const existingConnection = edges.find(edge => edge.source === nodeId);
      
      if (existingConnection) {
        // Transformar a conexão existente em conexão "SIM"
        setEdges((eds) =>
          eds.map((edge) => {
            if (edge.source === nodeId && edge.id === existingConnection.id) {
              return {
                ...edge,
                sourceHandle: 'yes',
                style: { 
                  strokeWidth: 3,
                  stroke: '#22c55e' // Verde para SIM
                },
                className: 'edge-yes',
                data: {
                  ...edge.data,
                  condition: 'yes',
                  sourcehandle: 'yes'
                }
              };
            }
            return edge;
          })
        );

        // Atualizar os dados do nó para refletir a nova conexão SIM
        const targetNodeId = existingConnection.target;
        setNodes((nds) =>
          nds.map((node) => {
            if (node.id === nodeId) {
              return {
                ...node,
                data: {
                  ...node.data,
                  ...newData,
                  yesDestination: targetNodeId, // Definir destino SIM
                },
              };
            }
            return node;
          })
        );
      }
    }
    
    // Lógica inversa: quando desativar condição, voltar conexão ao normal
    if (newData.hasCondition === false) {
      // Encontrar conexão "SIM" existente deste nó
      const existingYesConnection = edges.find(edge => 
        edge.source === nodeId && edge.sourceHandle === 'yes'
      );
      
      if (existingYesConnection) {
        // Transformar a conexão "SIM" de volta em conexão normal
        setEdges((eds) =>
          eds.map((edge) => {
            if (edge.source === nodeId && edge.id === existingYesConnection.id) {
              return {
                ...edge,
                sourceHandle: undefined,
                style: { 
                  strokeWidth: 3,
                  stroke: '#3b82f6' // Azul para conexão normal
                },
                className: 'edge-normal',
                data: {
                  ...edge.data,
                  condition: undefined,
                  sourcehandle: undefined
                }
              };
            }
            return edge;
          })
        );

        // Limpar os destinos condicionais do nó
        setNodes((nds) =>
          nds.map((node) => {
            if (node.id === nodeId) {
              return {
                ...node,
                data: {
                  ...node.data,
                  ...newData,
                  yesDestination: null,
                  noDestination: null,
                },
              };
            }
            return node;
          })
        );
      }
    }

    // Se está editando timing manualmente pela sidebar, marcar como edição manual
    if (newData.timing && !Object.prototype.hasOwnProperty.call(newData, 'manualTimingEdit')) {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                manualTimingEdit: true, // Marcar como edição manual
              },
            };
          }
          return node;
        })
      );
    }
  }, [setNodes, edges, setEdges]);

  // Função para fechar sidebar
  const closeSidebar = useCallback(() => {
    setFlowState(prev => ({ 
      ...prev, 
      isSidebarOpen: false,
      selectedNodeId: null 
    }));
    setIsMobileSidebarOpen(false);
  }, []);

  // Função para deletar um nó
  const onDeleteNode = useCallback((nodeId: string) => {
    // Remover o nó
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    
    // Remover todas as edges conectadas ao nó
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    
    // Se o nó selecionado foi deletado, fechar a sidebar
    if (flowState.selectedNodeId === nodeId) {
      closeSidebar();
    }
    
    // Atualizar contagem de nós
    setFlowState(prev => ({ ...prev, nodeCount: prev.nodeCount - 1 }));
  }, [setNodes, setEdges, flowState.selectedNodeId, closeSidebar]);

  // Função para atualizar timing baseado no tipo de nó
  const updateNodeTiming = useCallback((nodeId: string, forceUpdate: boolean = false) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    // Se o usuário editou manualmente e não é uma atualização forçada, não sobrescrever
    if (node.data.manualTimingEdit && !forceUpdate) {
      return;
    }

    const hasDataCollection = node.data.dataCollection.length > 0;
    const hasOutgoingConnections = edges.some(edge => edge.source === nodeId);
    const isFirstNode = node.data.isStartNode;

    // Lógica dinâmica para intervalo entre mensagens
    let newInterval = 10; // Padrão: 10 segundos
    
    if (hasDataCollection) {
      const dataFieldCount = node.data.dataCollection.length;
      // Aumentar baseado na quantidade de variáveis de coleta
      if (dataFieldCount >= 3) {
        newInterval = 30; // 30 segundos para 3+ variáveis
      } else if (dataFieldCount >= 1) {
        newInterval = 20; // 20 segundos para 1-2 variáveis
      }
    }

    // Lógica dinâmica para tempo máximo de espera
    let newMaxWait = 0; // Padrão: 0 segundos (sem limite)
    
    if (hasOutgoingConnections) {
      newMaxWait = 3600; // 3600 segundos se há conexões
    }

    // Só atualizar se os valores mudaram
    if (node.data.timing.interval !== newInterval || node.data.timing.maxWait !== newMaxWait) {
      onUpdateNodeData(nodeId, {
        timing: {
          interval: newInterval,
          maxWait: newMaxWait,
        },
        manualTimingEdit: false, // Resetar flag quando atualizar automaticamente
      });
    }
  }, [nodes, edges, onUpdateNodeData]);

  // Efeito para monitorar mudanças nas conexões e atualizar timing automaticamente
  React.useEffect(() => {
    // Criar um Set de todos os nós que podem ter sido afetados
    const affectedNodes = new Set<string>();
    
    // Adicionar todos os nós que têm conexões de saída
    edges.forEach(edge => {
      affectedNodes.add(edge.source);
    });
    
    // Adicionar todos os nós que não têm conexões de saída (podem ter perdido conexões)
    nodes.forEach(node => {
      const hasOutgoingConnections = edges.some(edge => edge.source === node.id);
      if (!hasOutgoingConnections) {
        affectedNodes.add(node.id);
      }
    });
    
    // Atualizar timing de todos os nós afetados
    // Para conexões, forçar atualização para garantir que o maxWait seja atualizado
    affectedNodes.forEach(nodeId => {
      const node = nodes.find(n => n.id === nodeId);
      if (node) {
        const hasOutgoingConnections = edges.some(edge => edge.source === nodeId);
        const currentMaxWait = node.data.timing.maxWait;
        
        // Se há conexões e maxWait é 0, ou se não há conexões e maxWait é 3600
        // então forçar atualização (mudança de estado de conexão)
        if ((hasOutgoingConnections && currentMaxWait === 0) || 
            (!hasOutgoingConnections && currentMaxWait === 3600)) {
          updateNodeTiming(nodeId, true); // Forçar atualização para mudanças de conexão
        } else {
          updateNodeTiming(nodeId, false); // Atualização normal
        }
      }
    });
  }, [edges, nodes, updateNodeTiming]);

  // Função para conectar nós
  const onConnect = useCallback(
    (params: Connection) => {
      // Verificar se já existe uma conexão da mesma saída
      const existingEdge = edges.find(edge => 
        edge.source === params.source && edge.sourceHandle === params.sourceHandle
      );
      
      if (existingEdge) {
        // Remover a conexão existente antes de criar a nova
        setEdges((eds) => eds.filter(edge => edge.id !== existingEdge.id));
        
        // Limpar a referência no nó de origem
        if (existingEdge.sourceHandle === 'yes') {
          onUpdateNodeData(existingEdge.source, { yesDestination: null });
        } else if (existingEdge.sourceHandle === 'no') {
          onUpdateNodeData(existingEdge.source, { noDestination: null });
        }
      }
      
      const edge: Edge = {
        ...params,
        id: `${params.source}-${params.target}`,
        type: 'smoothstep',
        animated: true,
        style: { 
          strokeWidth: 3,
          stroke: params.sourceHandle === 'yes' ? '#22c55e' : 
                  params.sourceHandle === 'no' ? '#ef4444' : '#3b82f6'
        },
        data: {
          condition: params.sourceHandle === 'yes' ? 'yes' : 
                    params.sourceHandle === 'no' ? 'no' : undefined,
          sourcehandle: params.sourceHandle
        },
        // Adicionar atributos HTML para CSS
        className: params.sourceHandle === 'yes' ? 'edge-yes' : 
                  params.sourceHandle === 'no' ? 'edge-no' : 'edge-normal'
      };
      
      // Atualizar dados do nó de origem para sincronizar com a sidebar
      if (params.source && params.target) {
        if (params.sourceHandle === 'yes') {
          onUpdateNodeData(params.source, { yesDestination: params.target });
        } else if (params.sourceHandle === 'no') {
          onUpdateNodeData(params.source, { noDestination: params.target });
        }
        
        // Atualizar timing dos nós afetados
        setTimeout(() => {
          updateNodeTiming(params.source, false); // Não forçar se editado manualmente
          updateNodeTiming(params.target, false); // Não forçar se editado manualmente
        }, 100);
      }
      
      setEdges((eds) => addEdge(edge, eds));
    },
    [setEdges, onUpdateNodeData, edges]
  );

  // Função para lidar com mudanças nas edges (incluindo remoção)
  const onEdgesChangeHandler = useCallback((changes: EdgeChange[]) => {
    const nodesToUpdate = new Set<string>();
    
    changes.forEach((change) => {
      if (change.type === 'remove') {
        const edgeToRemove = edges.find(edge => edge.id === change.id);
        if (edgeToRemove) {
          // Limpar a referência no nó de origem
          const sourceHandle = edgeToRemove.sourceHandle;
          if (sourceHandle === 'yes') {
            onUpdateNodeData(edgeToRemove.source, { yesDestination: null });
          } else if (sourceHandle === 'no') {
            onUpdateNodeData(edgeToRemove.source, { noDestination: null });
          }
          
          // Marcar nó para atualização de timing
          nodesToUpdate.add(edgeToRemove.source);
        }
      }
    });
    
    onEdgesChange(changes);
    
    // Atualizar timing dos nós afetados após a remoção
    setTimeout(() => {
      nodesToUpdate.forEach(nodeId => {
        updateNodeTiming(nodeId, false); // Não forçar se editado manualmente
      });
    }, 100);
  }, [edges, onEdgesChange, onUpdateNodeData]);

  // Função para atualizar status de nó inicial
  const updateStartNodeStatus = useCallback(() => {
    // Se não há nós, não fazer nada
    if (nodes.length === 0) return;
    
    // Se só há um nó, ele deve ser o nó inicial
    if (nodes.length === 1) {
      const singleNode = nodes[0];
      if (!singleNode.data.isStartNode) {
        onUpdateNodeData(singleNode.id, { isStartNode: true });
        // Atualizar timing para valores de primeiro bloco
        setTimeout(() => {
          updateNodeTiming(singleNode.id, false); // Não forçar se editado manualmente
        }, 100);
      }
    }
    // Se há múltiplos nós, garantir que apenas um seja o nó inicial
    else if (nodes.length > 1) {
      const startNodes = nodes.filter(n => n.data.isStartNode);
      
      // Se não há nó inicial, marcar o primeiro como inicial
      if (startNodes.length === 0) {
        onUpdateNodeData(nodes[0].id, { isStartNode: true });
        // Atualizar timing para valores de primeiro bloco
        setTimeout(() => {
          updateNodeTiming(nodes[0].id, false); // Não forçar se editado manualmente
        }, 100);
      }
      // Se há mais de um nó inicial, manter apenas o primeiro
      else if (startNodes.length > 1) {
        startNodes.slice(1).forEach(node => {
          onUpdateNodeData(node.id, { isStartNode: false });
          // Atualizar timing para valores de bloco intermediário
          setTimeout(() => {
            updateNodeTiming(node.id, false); // Não forçar se editado manualmente
          }, 100);
        });
      }
    }
  }, [nodes, onUpdateNodeData, updateNodeTiming]);

  // Função para adicionar novo bloco
  const onAddNewBlock = useCallback(() => {
    const newNodeId = `${Date.now()}`;
    
    // Verificar se não há nenhum nó (projeto vazio)
    const isFirstNode = nodes.length === 0;
    
    // Calcular posição próxima aos blocos existentes
    let newPosition = { x: 100, y: 100 };
    
    if (nodes.length > 0) {
      // Encontrar o bloco mais à direita
      const rightmostNode = nodes.reduce((rightmost, node) => 
        node.position.x > rightmost.position.x ? node : rightmost
      );
      
      // Posicionar o novo bloco à direita do último bloco com espaçamento
      newPosition = {
        x: rightmostNode.position.x + 300, // 300px à direita
        y: rightmostNode.position.y + (Math.random() * 100 - 50), // Pequena variação vertical
      };
    }
    
    // Determinar valores padrão baseados na lógica dinâmica
    const defaultInterval = 10; // 10 segundos
    const defaultMaxWait = 0; // 0 segundos (sem conexões por padrão)
    
    const newNode: Node<MessageNodeData> = {
      id: newNodeId,
      type: 'messageBlock',
      position: newPosition,
      data: {
        id: newNodeId,
        title: 'Nova Mensagem',
        messagePurpose: 'Definir propósito da mensagem',
        message: 'Digite sua mensagem aqui...',
        variables: [],
        examples: [],
        dataCollection: [],
        hasCondition: false,
        conditionQuestion: '',
        yesDestination: null,
        noDestination: null,
        timing: {
          interval: defaultInterval,
          maxWait: defaultMaxWait,
        },
        isStartNode: isFirstNode, // Primeiro nó é sempre start node
      },
    };

    setNodes((nds) => nds.concat(newNode));
    
    // Atualizar o estado para selecionar o novo nó e abrir a sidebar
    setFlowState(prev => ({
      ...prev,
      nodeCount: prev.nodeCount + 1,
      selectedNodeId: newNodeId, // Selecionar o novo nó
      isSidebarOpen: true, // Abrir a sidebar
    }));
    
    // Garantir que o novo nó seja visualmente selecionado
    setTimeout(() => {
      setFlowState(prev => ({
        ...prev,
        selectedNodeId: newNodeId, // Reforçar a seleção
      }));
    }, 100);
  }, [setNodes, nodes]);

  // Função personalizada para mudanças nos nós
  const onNodesChangeHandler = useCallback((changes: NodeChange[]) => {
    onNodesChange(changes);
    
    // Verificar se houve remoção de nós
    const hasRemovals = changes.some(change => change.type === 'remove');
    if (hasRemovals) {
      // Se o nó removido estava selecionado, limpar a seleção
      const removedNodeIds = changes
        .filter(change => change.type === 'remove')
        .map(change => change.id);
      
      if (removedNodeIds.includes(flowState.selectedNodeId || '')) {
        setFlowState(prev => ({
          ...prev,
          selectedNodeId: null,
          selectedEdgeId: null,
          isSidebarOpen: false,
        }));
      }
      
      setTimeout(() => {
        updateStartNodeStatus();
      }, 100);
    }
  }, [onNodesChange, updateStartNodeStatus, flowState.selectedNodeId]);

  // Função para selecionar nó
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    event.stopPropagation(); // Prevenir propagação do evento
    setFlowState(prev => ({ 
      ...prev, 
      selectedNodeId: node.id,
      selectedEdgeId: null, // Limpar seleção de edge
      isSidebarOpen: true 
    }));
    setIsMobileSidebarOpen(true);
  }, []);

  // Função para selecionar edge
  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.stopPropagation(); // Prevenir propagação do evento
    // Selecionar edge e limpar seleção de nó
    setFlowState(prev => ({ 
      ...prev, 
      selectedNodeId: null,
      selectedEdgeId: edge.id,
      isSidebarOpen: false 
    }));
    setIsMobileSidebarOpen(false);
  }, []);

  // Função para lidar com cliques no pane (fundo)
  const onPaneClick = useCallback(() => {
    // Limpar todas as seleções quando clicar no fundo
    setFlowState(prev => ({ 
      ...prev, 
      selectedNodeId: null,
      selectedEdgeId: null,
      isSidebarOpen: false 
    }));
    setIsMobileSidebarOpen(false);
  }, []);

  // Função para lidar com teclas pressionadas
  const onKeyDown = useCallback((event: KeyboardEvent) => {
    // Verificar se Delete ou Backspace foi pressionado
    if (event.key === 'Delete' || event.key === 'Backspace') {
      // Se há uma edge selecionada, deletar ela
      if (flowState.selectedEdgeId) {
        event.preventDefault();
        
        // Encontrar a edge a ser removida
        const edgeToRemove = edges.find(edge => edge.id === flowState.selectedEdgeId);
        if (edgeToRemove) {
          // Limpar a referência no nó de origem
          const sourceHandle = edgeToRemove.sourceHandle;
          if (sourceHandle === 'yes') {
            onUpdateNodeData(edgeToRemove.source, { yesDestination: null });
          } else if (sourceHandle === 'no') {
            onUpdateNodeData(edgeToRemove.source, { noDestination: null });
          }
          
          // Remover a edge
          setEdges((eds) => eds.filter(edge => edge.id !== flowState.selectedEdgeId));
          
          // Limpar seleção
          setFlowState(prev => ({ 
            ...prev, 
            selectedEdgeId: null 
          }));
          
          // Atualizar timing do nó afetado
          setTimeout(() => {
            updateNodeTiming(edgeToRemove.source, false);
          }, 100);
        }
      }
      // Se há um nó selecionado, deixar o ReactFlow lidar com isso
      else if (flowState.selectedNodeId) {
        // Não prevenir o comportamento padrão, deixar o ReactFlow deletar o nó
        return;
      }
    }
  }, [flowState.selectedEdgeId, flowState.selectedNodeId, edges, onUpdateNodeData, setEdges, updateNodeTiming]);

  // Adicionar event listener para teclas
  React.useEffect(() => {
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onKeyDown]);

  // Função para salvar fluxo
  const onSave = useCallback(async () => {
    setIsLoading(true);
    try {
      // Verificar se há empresa selecionada
      if (!companyId) {
        toast({
          title: "Erro",
          description: "Nenhuma empresa selecionada",
          variant: "destructive",
        });
        return;
      }
      
      let messagesFlowchartId: string;
      
      if (isEditMode && flowchartId) {
        // Se estamos editando, usar o ID existente
        messagesFlowchartId = flowchartId;
        
        // Primeiro, buscar o flowchart atual para pegar os blocos existentes
        const currentFlowchart = await ApiService.getMessagesFlowchart(flowchartId);
        
        // Deletar todos os blocos existentes
        // Nota: Em uma implementação mais sofisticada, poderíamos fazer um diff
        // e atualizar apenas o que mudou
        for (const block of currentFlowchart.messagesFlowchart.messageBlockSequence) {
          try {
            await ApiService.deleteMessageBlock(block.id);
          } catch (error) {
            console.warn(`Erro ao deletar bloco ${block.id}:`, error);
          }
        }
        
      } else {
        // Se estamos criando um novo, criar o fluxograma
        const flowchartResponse = await ApiService.createMessagesFlowchart(companyId, {
          name: flowState.flowName || 'Novo Fluxo',
          messageBlockSequenceIds: []
        });
        messagesFlowchartId = flowchartResponse.messagesFlowchart.id;
      }
      
      // Mapear os nós para criar uma árvore de dependências
      const nodeMap = new Map<string, Node<MessageNodeData>>();
      nodes.forEach(node => {
        nodeMap.set(node.id, node);
      });
      
      // Encontrar a ordem correta de criação (de trás para frente)
      const creationOrder = getCreationOrder(nodes, edges);
      
      // Mapa para armazenar os IDs dos blocos criados na API
      const apiBlockIds = new Map<string, string>();
      
      // Criar os blocos na ordem correta
      for (const nodeId of creationOrder) {
        const node = nodeMap.get(nodeId);
        if (!node) continue;
        
        // Encontrar o bloco anterior (se houver)
        const previousEdge = edges.find(edge => edge.target === nodeId);
        const previousBlockId = previousEdge ? apiBlockIds.get(previousEdge.source) : undefined;
        
        // Mapear os destinos para os IDs da API
        const nodeData = { ...node.data };
        if (nodeData.yesDestination) {
          nodeData.yesDestination = apiBlockIds.get(nodeData.yesDestination) || nodeData.yesDestination;
        }
        if (nodeData.noDestination) {
          nodeData.noDestination = apiBlockIds.get(nodeData.noDestination) || nodeData.noDestination;
        }
        
        // Criar o bloco na API
        const createRequest = ApiService.mapNodeDataToCreateRequest(
          nodeData,
          messagesFlowchartId,
          previousBlockId
        );
        
        const blockResponse = await ApiService.createMessageBlock(messagesFlowchartId, createRequest);
        
        // Armazenar o ID do bloco criado
        apiBlockIds.set(nodeId, blockResponse.messageBlock.id);
      }
      
      // Se estamos editando, atualizar o flowchart com a nova sequência de blocos
      if (isEditMode && flowchartId) {
        // Coletar todos os IDs dos blocos criados na ordem correta
        const messageBlockSequenceIds = creationOrder
          .map(nodeId => apiBlockIds.get(nodeId))
          .filter((id): id is string => id !== undefined);
        
        // Atualizar o flowchart com o nome e a nova sequência
        await ApiService.editMessagesFlowchart(flowchartId, {
          name: flowState.flowName || 'Novo Fluxo',
          messageBlockSequenceIds
        });
      }
      
      toast({
        title: "Sucesso",
        description: isEditMode ? "Fluxo atualizado com sucesso!" : "Fluxo criado com sucesso!",
      });
      
      // Navegar de volta para a tela de seleção de fluxo de conversa
      setTimeout(() => {
        navigate(`/dashboard/company/${companyId}/agents/create/conversation-flow`);
      }, 1000);
    } catch (error) {
      console.error('Erro ao salvar fluxo:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar fluxo. Verifique sua conexão e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [nodes, edges, toast, companyId, flowState, navigate, isEditMode, flowchartId]);

  // Função para determinar a ordem de criação dos blocos (de trás para frente)
  const getCreationOrder = useCallback((nodes: Node<MessageNodeData>[], edges: Edge[]): string[] => {
    // Criar um mapa de adjacências (quem aponta para quem)
    const adjacencyMap = new Map<string, string[]>();
    const incomingEdges = new Map<string, number>();
    
    // Inicializar contadores
    nodes.forEach(node => {
      adjacencyMap.set(node.id, []);
      incomingEdges.set(node.id, 0);
    });
    
    // Construir o grafo
    edges.forEach(edge => {
      const sources = adjacencyMap.get(edge.source) || [];
      sources.push(edge.target);
      adjacencyMap.set(edge.source, sources);
      
      const incomingCount = incomingEdges.get(edge.target) || 0;
      incomingEdges.set(edge.target, incomingCount + 1);
    });
    
    // Encontrar nós finais (sem saídas)
    const finalNodes: string[] = [];
    nodes.forEach(node => {
      const outgoing = adjacencyMap.get(node.id) || [];
      if (outgoing.length === 0) {
        finalNodes.push(node.id);
      }
    });
    
    // Ordenação topológica reversa (começando pelos nós finais)
    const visited = new Set<string>();
    const result: string[] = [];
    
    const dfs = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      
      // Visitar todos os nós que apontam para este nó
      edges.forEach(edge => {
        if (edge.target === nodeId && !visited.has(edge.source)) {
          dfs(edge.source);
        }
      });
      
      result.push(nodeId);
    };
    
    // Começar pelos nós finais
    finalNodes.forEach(nodeId => {
      dfs(nodeId);
    });
    
    // Se ainda há nós não visitados (ciclos ou nós isolados), adicionar
    nodes.forEach(node => {
      if (!visited.has(node.id)) {
        dfs(node.id);
      }
    });
    
    return result;
  }, []);

  // Função para começar a editar o nome do fluxo
  const startEditingFlowName = useCallback(() => {
    setTempFlowName(flowState.flowName);
    setIsEditingFlowName(true);
  }, [flowState.flowName]);

  // Função para salvar o nome do fluxo
  const saveFlowName = useCallback(() => {
    if (tempFlowName.trim()) {
      setFlowState(prev => ({ ...prev, flowName: tempFlowName.trim() }));
    }
    setIsEditingFlowName(false);
  }, [tempFlowName]);

  // Função para cancelar a edição
  const cancelEditingFlowName = useCallback(() => {
    setIsEditingFlowName(false);
    setTempFlowName('');
  }, []);

  // Função para lidar com Enter e Escape
  const handleFlowNameKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveFlowName();
    } else if (e.key === 'Escape') {
      cancelEditingFlowName();
    }
  }, [saveFlowName, cancelEditingFlowName]);

  // Obter nó selecionado
  const selectedNode = useMemo(() => {
    return flowState.selectedNodeId 
      ? nodes.find(node => node.id === flowState.selectedNodeId) || null
      : null;
  }, [nodes, flowState.selectedNodeId]);

  // Processar nós para incluir informação de seleção
  const processedNodes = useMemo(() => {
    return nodes.map(node => {
      // Verificar se este nó tem conexões de entrada
      const hasIncomingConnections = edges.some(edge => edge.target === node.id);
      
      return {
        ...node,
        selected: node.id === flowState.selectedNodeId,
        data: {
          ...node.data,
          selected: node.id === flowState.selectedNodeId,
          hasIncomingConnections, // Passar informação sobre conexões de entrada
          onDelete: () => onDeleteNode(node.id), // Adicionar função de delete
        }
      };
    });
  }, [nodes, edges, flowState.selectedNodeId, onDeleteNode]);

  // Processar edges para incluir informação de seleção
  const processedEdges = useMemo(() => {
    return edges.map(edge => ({
      ...edge,
      selected: edge.id === flowState.selectedEdgeId,
      style: {
        ...edge.style,
        strokeWidth: edge.id === flowState.selectedEdgeId ? 4 : 3, // Linha mais grossa quando selecionada
        stroke: edge.id === flowState.selectedEdgeId 
          ? '#1f2937' // Cor escura quando selecionada
          : edge.style?.stroke || '#3b82f6', // Cor original
      },
    }));
  }, [edges, flowState.selectedEdgeId]);

  return (
    <div className="h-full w-full flex flex-col bg-[#f1f1f1] overflow-hidden flow-editor-page" style={{ margin: 0, padding: 0 }}>
      {/* Page Title - Fixed header with padding */}
      <div className="bg-[#f1f1f1] flex-shrink-0" style={{ margin: 0, padding: 0 }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ margin: 0 }}>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/dashboard/company/${companyId}/agents/create/conversation-flow`)}
              className="flex items-center gap-2"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Voltar
            </Button>
            <span className="text-gray-400 text-xl font-light">|</span>
            <h1 className="text-[21px] font-medium text-gray-900">
              {companyName}
            </h1>
            <span className="text-gray-400 text-xl font-light">|</span>
            {isEditingFlowName ? (
              <Input
                type="text"
                value={tempFlowName}
                onChange={(e) => setTempFlowName(e.target.value)}
                onBlur={saveFlowName}
                onKeyDown={handleFlowNameKeyPress}
                className="text-[21px] font-medium border border-gray-300 bg-white px-2 py-1 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                style={{ fontSize: '21px', minWidth: '200px' }}
                autoFocus
              />
            ) : (
              <span
                className="text-[21px] font-medium text-gray-900 cursor-text hover:text-blue-600 transition-all duration-200 px-3 py-2 rounded-md hover:bg-white hover:border hover:border-gray-300 hover:shadow-sm"
                onClick={startEditingFlowName}
                title="Clique para editar o nome do fluxo"
              >
                {flowState.flowName}
              </span>
            )}
          </div>
          
          <div className={`flex items-center gap-2 transition-all duration-300 ${flowState.isSidebarOpen ? 'xl:-translate-x-96' : 'translate-x-0'}`}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              className="xl:hidden"
            >
              <Bars3Icon className="w-5 h-5" />
            </Button>
            <button
              ref={helpButtonRef}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-transparent border-0 rounded-md hover:bg-gray-100 transition-colors hidden md:flex"
              onMouseEnter={(e) => {
                // Limpar timeout anterior se existir
                if (tooltipTimeoutRef.current) {
                  clearTimeout(tooltipTimeoutRef.current);
                }
                
                const rect = e.currentTarget.getBoundingClientRect();
                const tooltipWidth = 384; // w-96 = 384px
                const tooltipHeight = 80; // altura estimada
                
                // Posição original do centro do botão
                const buttonCenterX = rect.left + rect.width / 2;
                
                // Calcular posição horizontal do tooltip
                let x = buttonCenterX;
                const rightEdge = x + tooltipWidth / 2;
                const leftEdge = x - tooltipWidth / 2;
                
                // Ajustar se sair da tela pela direita
                if (rightEdge > window.innerWidth) {
                  x = window.innerWidth - tooltipWidth / 2 - 16; // 16px de margem
                }
                
                // Ajustar se sair da tela pela esquerda
                if (leftEdge < 0) {
                  x = tooltipWidth / 2 + 16; // 16px de margem
                }
                
                // Calcular posição da seta baseada na diferença
                const arrowPos = ((buttonCenterX - (x - tooltipWidth / 2)) / tooltipWidth) * 100;
                const clampedArrowPos = Math.max(10, Math.min(90, arrowPos)); // Limitar entre 10% e 90%
                
                // Calcular posição vertical
                let y = rect.bottom + 8;
                let direction: 'up' | 'down' = 'down';
                
                // Se não há espaço suficiente embaixo, colocar em cima
                if (y + tooltipHeight > window.innerHeight) {
                  y = rect.top - tooltipHeight - 8;
                  direction = 'up';
                }
                
                setTooltipPosition({ x, y });
                setTooltipDirection(direction);
                setArrowPosition(clampedArrowPos);
                
                // Mostrar tooltip com delay
                tooltipTimeoutRef.current = setTimeout(() => {
                  setShowTooltip(true);
                  setTimeout(() => setIsTooltipVisible(true), 10);
                }, 300);
              }}
              onMouseLeave={() => {
                // Limpar timeout se ainda não mostrou
                if (tooltipTimeoutRef.current) {
                  clearTimeout(tooltipTimeoutRef.current);
                }
                
                // Esconder tooltip com animação
                setIsTooltipVisible(false);
                setTimeout(() => setShowTooltip(false), 200);
              }}
            >
              <QuestionMarkCircleIcon className="w-4 h-4" />
              Ajuda
            </button>
            <Button
              onClick={onSave}
              size="sm"
              disabled={isLoading}
              className="btn-float"
            >
              {isLoading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content - No spacing, no scroll */}
      <div className="flex-1 flex relative bg-[#f1f1f1] overflow-hidden" style={{ margin: 0, padding: 0 }}>
        {/* Canvas with dotted background - Adjusts width when sidebar is open */}
        <div 
          className={`
            transition-all duration-300 ease-out bg-[#f1f1f1] overflow-hidden
            ${flowState.isSidebarOpen ? 'xl:w-[calc(100%-384px)]' : 'w-full'}
          `}
          style={{ margin: 0, padding: 0 }}
        >
          <ReactFlow
            nodes={processedNodes}
            edges={processedEdges}
            onNodesChange={onNodesChangeHandler}
            onEdgesChange={onEdgesChangeHandler}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            className="bg-[#f1f1f1] w-full h-full"
            defaultViewport={{ x: 100, y: 100, zoom: 0.8 }}
            minZoom={0.25}
            maxZoom={2}
            deleteKeyCode={null} // Desabilitar comportamento padrão
            multiSelectionKeyCode={['Meta', 'Ctrl']}
          >
            <Background 
              color="#9ca3af" 
              gap={20} 
              size={2}
              variant={BackgroundVariant.Dots}
            />
            <Controls className="bg-white shadow-lg" />
          </ReactFlow>

          {/* Floating Add Button */}
          <Button
            onClick={onAddNewBlock}
            className={`
              absolute bottom-6 z-30 w-14 h-14 rounded-full shadow-lg 
              btn-float transition-all duration-300 hover:scale-110
              ${flowState.isSidebarOpen ? 'xl:right-[calc(384px+2rem)] right-6' : 'right-6 xl:right-8'}
              xl:bottom-8
            `}
            size="sm"
          >
            <PlusIcon className="w-6 h-6" />
          </Button>
        </div>

        {/* Sidebar Overlay for Mobile */}
        {flowState.isSidebarOpen && (
          <div 
            className="xl:hidden flow-sidebar-overlay"
            onClick={closeSidebar}
          />
        )}

        {/* Sidebar - Fixed to right side, full height */}
        {flowState.isSidebarOpen && (
          <div className={`
            fixed top-16 bottom-0 right-0 z-50 w-96
            ${isMobileSidebarOpen ? 'block' : 'hidden xl:block'}
            bg-white border-l border-gray-200 shadow-lg
          `}>
            <FlowSidebar
              isOpen={flowState.isSidebarOpen}
              selectedNode={selectedNode}
              allNodes={nodes}
              onUpdateNodeData={onUpdateNodeData}
              onUpdateNodeTiming={updateNodeTiming}
              onClose={closeSidebar}
            />
          </div>
        )}
      </div>

      {/* Tooltip Portal */}
      {showTooltip && createPortal(
        <div
          className={`fixed px-4 py-3 bg-gray-900 text-white text-sm rounded-lg shadow-xl w-96 z-[99999] pointer-events-none transition-all duration-200 ease-out ${
            isTooltipVisible 
              ? 'opacity-100 scale-100 translate-y-0' 
              : 'opacity-0 scale-95 -translate-y-1'
          }`}
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="text-center leading-relaxed">
            Este fluxo serve como um mapa para o agente atender seu cliente de forma personalizada. Aqui você define todas as informações que o agente deve coletar e como ele deve seguir seu fluxo de vendas específico.
          </div>
          {/* Seta do tooltip */}
          <div
            className={`absolute w-0 h-0 border-l-4 border-r-4 border-transparent transition-all duration-200 ease-out ${
              tooltipDirection === 'down' 
                ? 'border-b-4 border-b-gray-900' 
                : 'border-t-4 border-t-gray-900'
            }`}
            style={{
              left: `${arrowPosition}%`,
              [tooltipDirection === 'down' ? 'top' : 'bottom']: '-4px',
              transform: 'translateX(-50%)',
            }}
          />
        </div>,
        document.body
      )}
    </div>
  );
};

export default FlowEditorPage; 