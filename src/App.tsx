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
import { ClinicProvider } from "./contexts/ClinicContext"
import { ConversationProvider } from "./contexts/ConversationContext"
import NotFound from "./pages/NotFound"
import { LLMCostTracking } from "./pages/admin/LLMCostTracking"
import AgentsPage from "./pages/agents/AgentsPage"
import AdditionalInfoPage from "./pages/agents/create/AdditionalInfoPage"
import AgentNamePage from "./pages/agents/create/AgentNamePage"
import CreateProductCatalogPage from "./pages/agents/create/CreateProductCatalogPage"
import CreateProductPageAgent from './pages/agents/create/CreateProductPage'
import EditProductPage from './pages/agents/create/EditProductPage'
import SelectProductCatalogPage from "./pages/agents/create/SelectProductCatalogPage"
import SuccessPage from "./pages/agents/create/SuccessPage"
import ForgotPassword from "./pages/auth/ForgotPassword"
import Login from "./pages/auth/Login"
import Register from "./pages/auth/Register"
import ChannelDetailPage from "./pages/channels/ChannelDetailPage"
import ChannelsPage from "./pages/channels/ChannelsPage"
import MetaCallbackPage from "./pages/channels/create/MetaCallbackPage"
import MetaConnectionPage from "./pages/channels/create/MetaConnectionPage"
import SelectAgentsPage from "./pages/channels/create/SelectAgentsPage"
import SelectChannelTypePage from "./pages/channels/create/SelectChannelTypePage"
import ChannelSuccessPage from "./pages/channels/create/SuccessPage"
import ClinicMenu from "./pages/clinic/ClinicMenu"
import CreateClinicPage from "./pages/clinic/CreateClinicPage"
import EditClinicPage from "./pages/clinic/EditClinicPage"
import Members from "./pages/clinic/Members"
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
                  <ClinicProvider>
                    <ConversationProvider>
                      <DashboardLayout />
                    </ConversationProvider>
                  </ClinicProvider>
                } path="/dashboard">
                  <Route index element={<Dashboard />} />
                  
                  {/* Rotas legadas - mantidas para compatibilidade, mas preferencialmente use as rotas com clinicId */}
                  {/* <Route path="agents" element={<AgentsPage />} /> */}
                  {/* <Route path="contacts" element={<ContactsPage />} /> */}
                  {/* <Route path="conversations" element={<ConversationsPage />} /> */}
                  {/* <Route path="conversations/flow-editor" element={<FlowEditorPage />} /> */}
                  
                  {/* Rotas de clínica */}
                  <Route path="clinic" element={<ClinicMenu />} />
                  <Route path="clinic/create" element={<CreateClinicPage />} />
                  <Route path="clinic/edit/:clinicId" element={<EditClinicPage />} />
                  
                  {/* Rotas de admin */}
                  <Route path="admin/llm-cost-tracking" element={<LLMCostTracking />} />
                  
                  {/* Rota de perfil do usuário */}
                  <Route path="profile" element={<ProfilePage />} />
                  
                  {/* Rotas específicas por clínica */}
                  <Route path="clinic/:clinicId" element={<ClinicMenu />} />
                  <Route path="clinic/:clinicId/agents" element={<AgentsPage />} />
                  <Route path="clinic/:clinicId/members" element={<Members />} />
                  <Route path="clinic/:clinicId/contacts" element={<ContactsPage />} />
                  <Route path="clinic/:clinicId/conversations" element={<ConversationsPage />} />
                  <Route path="clinic/:clinicId/conversations/flow-editor" element={<FlowEditorPage />} />
                  <Route path="clinic/:clinicId/calendar" element={<CalendarsPage />} />
                  <Route path="clinic/:clinicId/calendar/create" element={<CreateCalendarPage />} />
                  <Route path="clinic/:clinicId/agents/:agentId" element={<AgentDetailPage />} />
                  <Route path="clinic/:clinicId/channels" element={<ChannelsPage />} />
                  <Route path="clinic/:clinicId/channels/:channelId" element={<ChannelDetailPage />} />
                  <Route path="clinic/:clinicId/catalogs" element={<CatalogsPage />} />
                  <Route path="clinic/:clinicId/catalogs/create" element={<CreateCatalogPage />} />
                  <Route path="clinic/:clinicId/catalogs/edit/:catalogId" element={<CreateCatalogPage />} />
                  <Route path="clinic/:clinicId/catalogs/products/create" element={<CreateProductPage />} />
                  <Route path="clinic/:clinicId/catalogs/products/edit/:productId" element={<CreateProductPage />} />
                  
                  {/* Rotas para criação de agente com clinicId */}
                  <Route path="clinic/:clinicId/agents/create" element={<AgentNamePage />} />
                  <Route path="clinic/:clinicId/agents/create/product-catalog" element={<SelectProductCatalogPage />} />
                  <Route path="clinic/:clinicId/agents/create/product-catalog/create" element={<CreateProductCatalogPage />} />
                  <Route path="clinic/:clinicId/agents/create/product-catalog/create/product" element={<CreateProductPageAgent />} />
                  <Route path="clinic/:clinicId/agents/create/product-catalog/edit/product/:productId" element={<EditProductPage />} />
                  <Route path="clinic/:clinicId/agents/create/additional-info" element={<AdditionalInfoPage />} />
                  <Route path="clinic/:clinicId/agents/create/success" element={<SuccessPage />} />

                  {/* Rotas para envio em massa de mensagens com clinicId */}
                  <Route path="clinic/:clinicId/messages/bulk/channel" element={<SelectChannelPage />} />
                  <Route path="clinic/:clinicId/messages/bulk/agent" element={<SelectAgentPage />} />
                  <Route path="clinic/:clinicId/messages/bulk/template" element={<SelectTemplatePage />} />
                  <Route path="clinic/:clinicId/messages/bulk/template/create" element={<CreateTemplatePage />} />
                  <Route path="clinic/:clinicId/messages/bulk/template/edit/:templateId" element={<EditTemplatePage />} />
                  <Route path="clinic/:clinicId/messages/bulk/contacts" element={<SelectContactsPage />} />
                  <Route path="clinic/:clinicId/messages/bulk/results" element={<BulkSendResultsPage />} />
                  
                  {/* Rotas legadas para envio em massa - manter para compatibilidade */}
                  <Route path="messages/bulk/channel" element={<SelectChannelPage />} />
                  <Route path="messages/bulk/agent" element={<SelectAgentPage />} />
                  <Route path="messages/bulk/template" element={<SelectTemplatePage />} />
                  <Route path="messages/bulk/template/create" element={<CreateTemplatePage />} />
                  <Route path="messages/bulk/template/edit/:templateId" element={<EditTemplatePage />} />
                  <Route path="messages/bulk/contacts" element={<SelectContactsPage />} />
                  <Route path="messages/bulk/results" element={<BulkSendResultsPage />} />
                  
                  {/* Rotas para criação de canal com clinicId */}
                  <Route path="clinic/:clinicId/channels/create" element={<Navigate to="type" replace />} />
                  <Route path="clinic/:clinicId/channels/create/type" element={<SelectChannelTypePage />} />
                  <Route path="clinic/:clinicId/channels/create/agents" element={<SelectAgentsPage />} />
                  <Route path="clinic/:clinicId/channels/create/meta-connection" element={<MetaConnectionPage />} />
                  <Route path="clinic/:clinicId/channels/create/meta-callback" element={<MetaCallbackPage />} />
                  <Route path="clinic/:clinicId/channels/create/success" element={<ChannelSuccessPage />} />
                  
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
