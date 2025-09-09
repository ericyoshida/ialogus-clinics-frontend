import { CustomToastProvider } from "@/components/ui/ToastContainer"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { Toaster } from "@/components/ui/toaster"
import { TooltipProvider } from "@/components/ui/tooltip"
import AgentDetailPage from '@/pages/agents/AgentDetailPage'
import CalendarsPage from '@/pages/calendars/CalendarsPage'
import CreateCalendarPage from '@/pages/calendars/CreateCalendarPage'
import GoogleCalendarCallback from '@/pages/calendars/GoogleCalendarCallback'
import CatalogsPage from '@/pages/catalogs/CatalogsPage'
import CreateCatalogPage from '@/pages/catalogs/CreateCatalogPage'
import CreateProductPage from '@/pages/catalogs/CreateProductPage'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { AuthRedirect } from "./components/AuthRedirect"
import { HomeRedirect } from "./components/HomeRedirect"
import { ProtectedRoute } from "./components/ProtectedRoute"
import DashboardLayout from "./components/layout/DashboardLayout"
import { AuthProvider } from "./contexts/AuthContext"
import { CompanyProvider } from "./contexts/CompanyContext"
import { ConversationProvider } from "./contexts/ConversationContext"
import NotFound from "./pages/NotFound"
import { LLMCostTracking } from "./pages/admin/LLMCostTracking"
import AgentsPage from "./pages/agents/AgentsPage"
import AdditionalInfoPage from "./pages/agents/create/AdditionalInfoPage"
import CreateProductCatalogPage from "./pages/agents/create/CreateProductCatalogPage"
import CreateProductPageAgent from './pages/agents/create/CreateProductPage'
import EditProductPage from './pages/agents/create/EditProductPage'
import SelectAgentTypePage from "./pages/agents/create/SelectAgentTypePage"
import SelectCompanyPage from "./pages/agents/create/SelectCompanyPage"
import SelectConversationFlowPage from "./pages/agents/create/SelectConversationFlowPage"
import SelectProductCatalogPage from "./pages/agents/create/SelectProductCatalogPage"
import SuccessPage from "./pages/agents/create/SuccessPage"
import ForgotPassword from "./pages/auth/ForgotPassword"
import Login from "./pages/auth/Login"
import Register from "./pages/auth/Register"
import CompanyMenu from "./pages/company/CompanyMenu"
import CreateCompanyPage from "./pages/company/CreateCompanyPage"
import EditCompanyPage from "./pages/company/EditCompanyPage"
import ContactsPage from "./pages/contacts/ContactsPage"
import ConversationsPage from "./pages/conversations/ConversationsPage"
import FlowEditorPage from "./pages/conversations/FlowEditorPage"
import Dashboard from "./pages/dashboard/Dashboard"
import BulkSendResultsPage from "./pages/messages/bulk/BulkSendResultsPage"
import CreateTemplatePage from "./pages/messages/bulk/CreateTemplatePage"
import EditTemplatePage from "./pages/messages/bulk/EditTemplatePage"
import SelectAgentPage from "./pages/messages/bulk/SelectAgentPage"
import SelectChannelPage from "./pages/messages/bulk/SelectChannelPage"
import SelectContactsPage from "./pages/messages/bulk/SelectContactsPage"
import SelectTemplatePage from "./pages/messages/bulk/SelectTemplatePage"
import ProfilePage from "./pages/user/ProfilePage"
import SelectChannelTypePage from "./pages/channels/create/SelectChannelTypePage"
import SelectAgentsPage from "./pages/channels/create/SelectAgentsPage"
import MetaConnectionPage from "./pages/channels/create/MetaConnectionPage"
import MetaCallbackPage from "./pages/channels/create/MetaCallbackPage"
import ChannelSuccessPage from "./pages/channels/create/SuccessPage"
import ChannelsPage from "./pages/channels/ChannelsPage"
import ChannelDetailPage from "./pages/channels/ChannelDetailPage"
import Members from "./pages/company/Members"

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CustomToastProvider>
        <Sonner />
        <Toaster />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Redireciona para o dashboard se autenticado, ou login se não autenticado */}
              <Route path="/" element={<HomeRedirect />} />
              
              {/* Rotas de autenticação - redireciona para dashboard se já estiver autenticado */}
              <Route element={<AuthRedirect />}>
                <Route path="/auth/login" element={<Login />} />
                <Route path="/auth/register" element={<Register />} />
                <Route path="/auth/forgot-password" element={<ForgotPassword />} />
              </Route>
              
              {/* Rotas protegidas do dashboard */}
              <Route element={<ProtectedRoute />}>
                <Route element={
                  <CompanyProvider>
                    <ConversationProvider>
                      <DashboardLayout />
                    </ConversationProvider>
                  </CompanyProvider>
                } path="/dashboard">
                  <Route index element={<Dashboard />} />
                  
                  {/* Rotas legadas - mantidas para compatibilidade, mas preferencialmente use as rotas com companyId */}
                  {/* <Route path="agents" element={<AgentsPage />} /> */}
                  {/* <Route path="contacts" element={<ContactsPage />} /> */}
                  {/* <Route path="conversations" element={<ConversationsPage />} /> */}
                  {/* <Route path="conversations/flow-editor" element={<FlowEditorPage />} /> */}
                  
                  {/* Rotas de empresa */}
                  <Route path="company" element={<CompanyMenu />} />
                  <Route path="company/create" element={<CreateCompanyPage />} />
                  <Route path="company/edit/:companyId" element={<EditCompanyPage />} />
                  
                  {/* Rotas de admin */}
                  <Route path="admin/llm-cost-tracking" element={<LLMCostTracking />} />
                  
                  {/* Rota de perfil do usuário */}
                  <Route path="profile" element={<ProfilePage />} />
                  
                  {/* Rotas específicas por empresa */}
                  <Route path="company/:companyId" element={<CompanyMenu />} />
                  <Route path="company/:companyId/agents" element={<AgentsPage />} />
                  <Route path="company/:companyId/members" element={<Members />} />
                  <Route path="company/:companyId/contacts" element={<ContactsPage />} />
                  <Route path="company/:companyId/conversations" element={<ConversationsPage />} />
                  <Route path="company/:companyId/conversations/flow-editor" element={<FlowEditorPage />} />
                  <Route path="company/:companyId/calendar" element={<CalendarsPage />} />
                  <Route path="company/:companyId/calendar/create" element={<CreateCalendarPage />} />
                  <Route path="company/:companyId/agents/:agentId" element={<AgentDetailPage />} />
                  <Route path="company/:companyId/channels" element={<ChannelsPage />} />
                  <Route path="company/:companyId/channels/:channelId" element={<ChannelDetailPage />} />
                  <Route path="company/:companyId/catalogs" element={<CatalogsPage />} />
                  <Route path="company/:companyId/catalogs/create" element={<CreateCatalogPage />} />
                  <Route path="company/:companyId/catalogs/edit/:catalogId" element={<CreateCatalogPage />} />
                  <Route path="company/:companyId/catalogs/products/create" element={<CreateProductPage />} />
                  <Route path="company/:companyId/catalogs/products/edit/:productId" element={<CreateProductPage />} />
                  
                  {/* Rotas para criação de agente com companyId */}
                  <Route path="company/:companyId/agents/create" element={<SelectAgentTypePage />} />
                  <Route path="company/:companyId/agents/create/agent-type" element={<SelectAgentTypePage />} />
                  <Route path="company/:companyId/agents/create/conversation-flow" element={<SelectConversationFlowPage />} />
                  <Route path="company/:companyId/agents/create/product-catalog" element={<SelectProductCatalogPage />} />
                  <Route path="company/:companyId/agents/create/product-catalog/create" element={<CreateProductCatalogPage />} />
                  <Route path="company/:companyId/agents/create/product-catalog/create/product" element={<CreateProductPageAgent />} />
                  <Route path="company/:companyId/agents/create/product-catalog/edit/product/:productId" element={<EditProductPage />} />
                  <Route path="company/:companyId/agents/create/additional-info" element={<AdditionalInfoPage />} />
                  <Route path="company/:companyId/agents/create/success" element={<SuccessPage />} />
                  
                  {/* Rotas legadas de criação de agente - manter para compatibilidade */}
                  {/* <Route path="agents/create/company" element={<SelectCompanyPage />} />
                  <Route path="agents/create/agent-type" element={<SelectAgentTypePage />} />
                  <Route path="agents/create/conversation-flow" element={<SelectConversationFlowPage />} />
                  <Route path="agents/create/product-catalog" element={<SelectProductCatalogPage />} />
                  <Route path="agents/create/product-catalog/create" element={<CreateProductCatalogPage />} />
                  <Route path="agents/create/product-catalog/create/product" element={<CreateProductPage />} />
                  <Route path="agents/create/product-catalog/edit/product/:productId" element={<EditProductPage />} />
                  <Route path="agents/create/additional-info" element={<AdditionalInfoPage />} /> */}
                  
                  {/* Rotas para envio em massa de mensagens com companyId */}
                  <Route path="company/:companyId/messages/bulk/channel" element={<SelectChannelPage />} />
                  <Route path="company/:companyId/messages/bulk/agent" element={<SelectAgentPage />} />
                  <Route path="company/:companyId/messages/bulk/template" element={<SelectTemplatePage />} />
                  <Route path="company/:companyId/messages/bulk/template/create" element={<CreateTemplatePage />} />
                  <Route path="company/:companyId/messages/bulk/template/edit/:templateId" element={<EditTemplatePage />} />
                  <Route path="company/:companyId/messages/bulk/contacts" element={<SelectContactsPage />} />
                  <Route path="company/:companyId/messages/bulk/results" element={<BulkSendResultsPage />} />
                  
                  {/* Rotas legadas para envio em massa - manter para compatibilidade */}
                  <Route path="messages/bulk/channel" element={<SelectChannelPage />} />
                  <Route path="messages/bulk/agent" element={<SelectAgentPage />} />
                  <Route path="messages/bulk/template" element={<SelectTemplatePage />} />
                  <Route path="messages/bulk/template/create" element={<CreateTemplatePage />} />
                  <Route path="messages/bulk/template/edit/:templateId" element={<EditTemplatePage />} />
                  <Route path="messages/bulk/contacts" element={<SelectContactsPage />} />
                  <Route path="messages/bulk/results" element={<BulkSendResultsPage />} />
                  
                  {/* Rotas para criação de canal com companyId */}
                  <Route path="company/:companyId/channels/create" element={<Navigate to="type" replace />} />
                  <Route path="company/:companyId/channels/create/type" element={<SelectChannelTypePage />} />
                  <Route path="company/:companyId/channels/create/agents" element={<SelectAgentsPage />} />
                  <Route path="company/:companyId/channels/create/meta-connection" element={<MetaConnectionPage />} />
                  <Route path="company/:companyId/channels/create/meta-callback" element={<MetaCallbackPage />} />
                  <Route path="company/:companyId/channels/create/success" element={<ChannelSuccessPage />} />
                  
                  {/* Rotas legadas para criação de canal - manter para compatibilidade */}
                  <Route path="channels/create" element={<Navigate to="/dashboard/channels/create/type" replace />} />
                  <Route path="channels/create/type" element={<SelectChannelTypePage />} />
                  <Route path="channels/create/agents" element={<SelectAgentsPage />} />
                  <Route path="channels/create/meta-connection" element={<MetaConnectionPage />} />
                  <Route path="channels/create/meta-callback" element={<MetaCallbackPage />} />
                </Route>
              </Route>
              
              {/* Rota de callback do Google Calendar - fora do layout do dashboard */}
              <Route path="/calendar/connected" element={<GoogleCalendarCallback />} />
              
              {/* Rota 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </CustomToastProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
