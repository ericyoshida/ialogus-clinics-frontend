import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/services/api'
import { getCurrentPlanInfo, Plan, PLANS, updateUserPlan } from '@/services/plans'
import { CreditCard, Crown, Edit3, Package, Save, Star, User as UserIcon, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface UserSubscription {
  id: string
  planId: string
  status: 'active' | 'inactive' | 'past_due' | 'canceled'
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
}

interface BillingInfo {
  id: string
  stripeCustomerId?: string
  name: string
  email: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  taxId?: string
}

export default function ProfilePage() {
  const { user, isLoading: authLoading } = useAuth()
  const [subscription, setSubscription] = useState<UserSubscription | null>(null)
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null)
  const [isEditingBasic, setIsEditingBasic] = useState(false)
  const [isEditingBilling, setIsEditingBilling] = useState(false)
  const [dataLoading, setDataLoading] = useState(false)
  const [showPlanSelector, setShowPlanSelector] = useState(false)

  // Debug logging
  console.log('=== PROFILE PAGE DEBUG ===')
  console.log('ProfilePage - User data:', JSON.stringify(user, null, 2))
  console.log('ProfilePage - User exists:', !!user)
  console.log('ProfilePage - User name:', user?.name)
  console.log('ProfilePage - User email:', user?.email)
  console.log('ProfilePage - User plan:', user?.plan)
  console.log('ProfilePage - Loading state:', dataLoading)
  console.log('=== FIM PROFILE PAGE DEBUG ===')

  // Formulários de edição
  const [basicForm, setBasicForm] = useState({
    name: '',
    email: ''
  })

  const [billingForm, setBillingForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Brasil',
    taxId: ''
  })

  useEffect(() => {
    console.log('ProfilePage useEffect - User changed:', JSON.stringify(user, null, 2))
    if (user) {
      console.log('ProfilePage - Usuário encontrado, inicializando formulário...')
      setBasicForm({
        name: user.name || '',
        email: user.email || ''
      })
      console.log('ProfilePage - Formulário inicializado com:', { name: user.name, email: user.email })
      fetchUserSubscription()
      fetchBillingInfo()
    } else {
      console.log('ProfilePage - Nenhum usuário encontrado, mantendo loading...')
      // Se não há usuário, não definir loading como false ainda
      // Deixar o AuthContext gerenciar o estado de loading
    }
  }, [user])

  const fetchUserSubscription = async () => {
    try {
      const response = await api.get('/user/subscription')
      setSubscription(response.data)
    } catch (error) {
      console.error('Erro ao buscar assinatura:', error)
      // Se não encontrar assinatura, usuário pode estar no plano gratuito
    }
  }

  const fetchBillingInfo = async () => {
    try {
      setDataLoading(true)
      const response = await api.get('/user/billing')
      setBillingInfo(response.data)
      setBillingForm({
        name: response.data.name || '',
        email: response.data.email || '',
        phone: response.data.phone || '',
        address: response.data.address || '',
        city: response.data.city || '',
        state: response.data.state || '',
        zipCode: response.data.zipCode || '',
        country: response.data.country || 'Brasil',
        taxId: response.data.taxId || ''
      })
    } catch (error) {
      console.error('Erro ao buscar informações de billing:', error)
    } finally {
      setDataLoading(false)
    }
  }

  const handleSaveBasicInfo = async () => {
    try {
      await api.put('/user/profile', basicForm)
      toast.success('Informações básicas atualizadas com sucesso!')
      setIsEditingBasic(false)
    } catch (error) {
      console.error('Erro ao atualizar informações básicas:', error)
      toast.error('Erro ao atualizar informações básicas')
    }
  }

  const handleSaveBillingInfo = async () => {
    try {
      await api.put('/user/billing', billingForm)
      toast.success('Informações de billing atualizadas com sucesso!')
      setIsEditingBilling(false)
      await fetchBillingInfo()
    } catch (error) {
      console.error('Erro ao atualizar informações de billing:', error)
      toast.error('Erro ao atualizar informações de billing')
    }
  }

  const handleUpdatePlan = async (newPlan: Plan) => {
    try {
      await updateUserPlan(newPlan)
      toast.success('Plano atualizado com sucesso!')
      setShowPlanSelector(false)
      // Refresh user data to get the updated plan
      window.location.reload()
    } catch (error) {
      console.error('Erro ao atualizar plano:', error)
      toast.error('Erro ao atualizar plano')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      active: { label: 'Ativo', variant: 'default' as const },
      inactive: { label: 'Inativo', variant: 'secondary' as const },
      past_due: { label: 'Pagamento Pendente', variant: 'destructive' as const },
      canceled: { label: 'Cancelado', variant: 'destructive' as const }
    }
    
    return statusMap[status as keyof typeof statusMap] || { label: status, variant: 'secondary' as const }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const currentPlanInfo = getCurrentPlanInfo(user?.plan)

  const getPlanIcon = (planName: Plan) => {
    const iconMap = {
      'FREE': <Package className="h-5 w-5" />,
      'START': <Star className="h-5 w-5" />,
      'PRO': <Crown className="h-5 w-5" />
    }
    return iconMap[planName] || <Package className="h-5 w-5" />
  }

  // Show loading while authentication is loading
  if (authLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  // Show loading while fetching additional data (subscription/billing)
  if (dataLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64 flex-col">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Dados do usuário não disponíveis</h2>
          <p className="text-gray-600 mb-4">Por favor, faça login novamente.</p>
          <Button onClick={() => window.location.href = '/auth/login'}>
            Fazer Login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Meu Perfil</h1>
      </div>

      {/* Informações Básicas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            <CardTitle>Informações Básicas</CardTitle>
          </div>
          {!isEditingBasic ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditingBasic(true)}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Editar
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditingBasic(false)
                  setBasicForm({
                    name: user?.name || '',
                    email: user?.email || ''
                  })
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleSaveBasicInfo}
              >
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nome</Label>
              {isEditingBasic ? (
                <Input
                  id="name"
                  value={basicForm.name}
                  onChange={(e) => setBasicForm({ ...basicForm, name: e.target.value })}
                />
              ) : (
                <p className="mt-1 text-sm text-gray-900">{user?.name}</p>
              )}
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              {isEditingBasic ? (
                <Input
                  id="email"
                  type="email"
                  value={basicForm.email}
                  onChange={(e) => setBasicForm({ ...basicForm, email: e.target.value })}
                />
              ) : (
                <p className="mt-1 text-sm text-gray-900">{user?.email}</p>
              )}
            </div>
            <div>
              <Label>Função</Label>
              <p className="mt-1 text-sm text-gray-900">{user?.role || 'Usuário'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plano Atual */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            <CardTitle>Plano Atual</CardTitle>
          </div>
          <Button variant="outline">
            Alterar Plano
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getPlanIcon(user?.plan as Plan || 'FREE')}
                <div>
                  <h3 className="text-lg font-semibold">{currentPlanInfo.displayName}</h3>
                  <p className="text-sm text-gray-600">{currentPlanInfo.description}</p>
                  <p className="text-xl font-bold text-green-600 mt-1">{currentPlanInfo.price}</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setShowPlanSelector(!showPlanSelector)}
              >
                {showPlanSelector ? 'Cancelar' : 'Alterar Plano'}
              </Button>
            </div>

            {showPlanSelector && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-semibold mb-3">Escolha seu plano:</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(PLANS).map(([planKey, planInfo]) => (
                    <div 
                      key={planKey}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        user?.plan === planKey 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      } ${planInfo.isPopular ? 'ring-2 ring-blue-500' : ''}`}
                      onClick={() => handleUpdatePlan(planKey as Plan)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getPlanIcon(planKey as Plan)}
                          <h5 className="font-semibold">{planInfo.displayName}</h5>
                        </div>
                        {planInfo.isPopular && (
                          <Badge variant="secondary">Popular</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{planInfo.description}</p>
                      <p className="text-lg font-bold text-green-600 mb-3">{planInfo.price}</p>
                      <ul className="space-y-1">
                        {planInfo.features.map((feature, index) => (
                          <li key={index} className="text-xs text-gray-600 flex items-center">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></div>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Recursos Inclusos</Label>
              <ul className="mt-2 space-y-1">
                {currentPlanInfo.features.map((feature, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-center">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></div>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações de Billing */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            <CardTitle>Informações de Billing</CardTitle>
          </div>
          {!isEditingBilling ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditingBilling(true)}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Editar
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditingBilling(false)
                  if (billingInfo) {
                    setBillingForm({
                      name: billingInfo.name || '',
                      email: billingInfo.email || '',
                      phone: billingInfo.phone || '',
                      address: billingInfo.address || '',
                      city: billingInfo.city || '',
                      state: billingInfo.state || '',
                      zipCode: billingInfo.zipCode || '',
                      country: billingInfo.country || 'Brasil',
                      taxId: billingInfo.taxId || ''
                    })
                  }
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleSaveBillingInfo}
              >
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {billingInfo || isEditingBilling ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="billing-name">Nome</Label>
                {isEditingBilling ? (
                  <Input
                    id="billing-name"
                    value={billingForm.name}
                    onChange={(e) => setBillingForm({ ...billingForm, name: e.target.value })}
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{billingInfo?.name || '-'}</p>
                )}
              </div>
              <div>
                <Label htmlFor="billing-email">Email</Label>
                {isEditingBilling ? (
                  <Input
                    id="billing-email"
                    type="email"
                    value={billingForm.email}
                    onChange={(e) => setBillingForm({ ...billingForm, email: e.target.value })}
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{billingInfo?.email || '-'}</p>
                )}
              </div>
              <div>
                <Label htmlFor="billing-phone">Telefone</Label>
                {isEditingBilling ? (
                  <Input
                    id="billing-phone"
                    value={billingForm.phone}
                    onChange={(e) => setBillingForm({ ...billingForm, phone: e.target.value })}
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{billingInfo?.phone || '-'}</p>
                )}
              </div>
              <div>
                <Label htmlFor="billing-taxId">CPF/CNPJ</Label>
                {isEditingBilling ? (
                  <Input
                    id="billing-taxId"
                    value={billingForm.taxId}
                    onChange={(e) => setBillingForm({ ...billingForm, taxId: e.target.value })}
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{billingInfo?.taxId || '-'}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="billing-address">Endereço</Label>
                {isEditingBilling ? (
                  <Input
                    id="billing-address"
                    value={billingForm.address}
                    onChange={(e) => setBillingForm({ ...billingForm, address: e.target.value })}
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{billingInfo?.address || '-'}</p>
                )}
              </div>
              <div>
                <Label htmlFor="billing-city">Cidade</Label>
                {isEditingBilling ? (
                  <Input
                    id="billing-city"
                    value={billingForm.city}
                    onChange={(e) => setBillingForm({ ...billingForm, city: e.target.value })}
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{billingInfo?.city || '-'}</p>
                )}
              </div>
              <div>
                <Label htmlFor="billing-state">Estado</Label>
                {isEditingBilling ? (
                  <Input
                    id="billing-state"
                    value={billingForm.state}
                    onChange={(e) => setBillingForm({ ...billingForm, state: e.target.value })}
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{billingInfo?.state || '-'}</p>
                )}
              </div>
              <div>
                <Label htmlFor="billing-zipCode">CEP</Label>
                {isEditingBilling ? (
                  <Input
                    id="billing-zipCode"
                    value={billingForm.zipCode}
                    onChange={(e) => setBillingForm({ ...billingForm, zipCode: e.target.value })}
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{billingInfo?.zipCode || '-'}</p>
                )}
              </div>
              <div>
                <Label htmlFor="billing-country">País</Label>
                {isEditingBilling ? (
                  <Input
                    id="billing-country"
                    value={billingForm.country}
                    onChange={(e) => setBillingForm({ ...billingForm, country: e.target.value })}
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{billingInfo?.country || '-'}</p>
                )}
              </div>
              {billingInfo?.stripeCustomerId && (
                <div className="md:col-span-2">
                  <Label>ID do Cliente Stripe</Label>
                  <p className="mt-1 text-sm text-gray-500 font-mono">{billingInfo.stripeCustomerId}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma informação de billing</h3>
              <p className="text-gray-600 mb-4">Adicione suas informações de faturamento para realizar pagamentos.</p>
              <Button onClick={() => setIsEditingBilling(true)}>
                Adicionar Informações
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 