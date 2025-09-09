# Flow Editor - Editor de Fluxo de Conversa

Este é um editor visual para criar fluxos de conversação em formato de blocos conectados.

## Componentes Principais

### 1. FlowEditorPage
- **Localização**: `src/pages/conversations/FlowEditorPage.tsx`
- **Responsabilidade**: Página principal do editor que gerencia o estado global do fluxo
- **Funcionalidades**:
  - Canvas principal com React Flow
  - Barra superior com controles
  - Gerenciamento de nós e conexões
  - Responsividade para mobile/desktop

### 2. MessageBlock
- **Localização**: `src/components/flow/MessageBlock.tsx`
- **Responsabilidade**: Componente visual que representa cada bloco de mensagem
- **Características**:
  - Visual customizado seguindo design system
  - Suporte a condições (Sim/Não)
  - Indicadores visuais de estado
  - Preview de conteúdo e configurações

### 3. FlowSidebar
- **Localização**: `src/components/flow/FlowSidebar.tsx`
- **Responsabilidade**: Painel lateral para configurar blocos selecionados
- **Seções**:
  - **Conteúdo**: Título, mensagem, variáveis
  - **Condição**: Lógica condicional para ramificação
  - **Timing**: Controle de temporização

## Funcionalidades Implementadas

### ✅ Recursos Principais
- [x] Canvas de arrastar e soltar
- [x] Blocos de mensagem customizados
- [x] Conexões entre blocos
- [x] Sidebar de configuração
- [x] Suporte a condições (Sim/Não)
- [x] Sistema de validação
- [x] Responsividade completa
- [x] Micro-interações
- [x] Controles de zoom/pan
- [x] Mini mapa
- [x] Botão flutuante para adicionar blocos

### ✅ Design System
- [x] Cores e tipografia consistentes
- [x] Estados visuais (hover, seleção, erro)
- [x] Animações suaves
- [x] Indicadores de status
- [x] Scrollbars customizadas

### ✅ Responsividade
- [x] Layout adaptativo
- [x] Sidebar overlay em mobile
- [x] Controles otimizados para touch
- [x] Botões redimensionados para mobile

## Como Usar

### Navegação
Acesse o editor através das rotas:
- `/conversations/flow-editor`
- `/company/:companyId/conversations/flow-editor`

### Criando um Fluxo
1. **Adicionar Blocos**: Clique no botão "+" flutuante
2. **Configurar Bloco**: Clique em qualquer bloco para abrir a sidebar
3. **Conectar Blocos**: Arraste das alças de conexão entre blocos
4. **Salvar**: Use o botão "Salvar" na barra superior

### Configurações de Bloco

#### Conteúdo
- **Título**: Nome identificador do bloco
- **Mensagem**: Texto que será enviado
- **Variáveis**: Inserção dinâmica de dados (ex: `{nome}`)

#### Condição
- **Ativar pergunta**: Toggle para criar ramificação
- **Destinos**: Definir para onde vai cada resposta (Sim/Não)

#### Timing
- **Imediato**: Envio instantâneo
- **Delay**: Atraso configurável
- **Agendado**: Horário específico

## Estrutura de Dados

### MessageNodeData
```typescript
interface MessageNodeData {
  title: string;
  message: string;
  hasCondition: boolean;
  conditionQuestion?: string;
  yesDestination?: string;
  noDestination?: string;
  examples: string[];
  dataCollection: string[];
  timing: {
    type: 'immediate' | 'delay' | 'schedule';
    value?: number;
    unit?: 'seconds' | 'minutes' | 'hours' | 'days';
  };
}
```

## Estilos Customizados

### CSS Classes
- `.react-flow__*`: Sobrescritas dos estilos do React Flow
- `.flow-sidebar`: Estilos da sidebar com scroll customizado
- `.btn-float`: Animação flutuante para botões
- `.field-error/.field-success`: Estados de validação

### Responsive Breakpoints
- `xl` (1200px+): Sidebar fixa
- `lg` (1024px-1199px): Sidebar overlay
- `md` (768px-1023px): Layout compacto
- `sm` (640px-767px): Mobile otimizado

## Próximos Passos

### 🔮 Funcionalidades Futuras
- [ ] Histórico de undo/redo
- [ ] Templates de fluxo
- [ ] Importar/exportar fluxos
- [ ] Preview interativo
- [ ] Teste A/B de mensagens
- [ ] Analytics de performance

### 🔧 Melhorias Técnicas
- [ ] Persistência em backend
- [ ] Validação de ciclos
- [ ] Otimização de performance
- [ ] Testes automatizados
- [ ] Documentação de API

## Dependências

- **React Flow**: Biblioteca base para diagramas
- **Lucide React**: Ícones
- **Tailwind CSS**: Estilização
- **Heroicons**: Ícones da interface
- **React Hot Toast**: Notificações (ou sistema interno)

## Contribuindo

Para contribuir com melhorias:
1. Mantenha consistência com o design system
2. Teste responsividade em diferentes dispositivos
3. Valide acessibilidade
4. Documente mudanças significativas 