import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/services/api'
import { format } from 'date-fns'
import { Activity, Calendar, DollarSign, Download, Filter, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface LLMCostSummary {
  totalCost: number
  totalTokens: number
  totalRequests: number
  averageCostPerRequest: number
  averageTokensPerRequest: number
  costsByProvider: Array<{
    provider: string
    cost: number
    tokens: number
    requests: number
  }>
  costsByUser: Array<{
    userId: string
    userName: string
    cost: number
    tokens: number
    requests: number
  }>
  costsByClinic: Array<{
    clinicId: string
    clinicName: string
    cost: number
    tokens: number
    requests: number
  }>
}

interface LLMCostTrackingItem {
  id: string
  provider: string
  model: string
  aiResponseType: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
  totalCost: number
  currency: string
  createdAt: string
  chatLogId?: string
}

interface LLMCostTrackingFilters {
  provider?: string
  model?: string
  aiResponseType?: string
  startDate?: string
  endDate?: string
  userId?: string
  clinicId?: string
}

export function LLMCostTracking() {
  const { user } = useAuth()
  const [summary, setSummary] = useState<LLMCostSummary | null>(null)
  const [trackingItems, setTrackingItems] = useState<LLMCostTrackingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<LLMCostTrackingFilters>({})
  const [page, setPage] = useState(1)
  const [pageSize] = useState(50)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  // Check if user is admin
  useEffect(() => {
    const isAdmin = user?.id === '7fe8730b-a261-4c3f-8348-b8fddb9caef7'
    
    if (!isAdmin) {
      toast.error('Access denied. Only admins can view this page.')
      return
    }
  }, [user])

  // Fetch summary data
  const fetchSummary = async () => {
    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })

      const response = await api.get(`/llm-cost-tracking/summary?${params}`)
      setSummary(response.data.summary)
    } catch (error) {
      toast.error('Failed to fetch cost summary')
    }
  }

  // Fetch tracking items
  const fetchTrackingItems = async () => {
    try {
      const params = new URLSearchParams()
      params.append('page', page.toString())
      params.append('pageSize', pageSize.toString())
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })

      const response = await api.get(`/llm-cost-tracking?${params}`)
      setTrackingItems(response.data.data || []) // Changed from response.data.items to response.data.data with fallback
      setTotal(response.data.meta.totalCount || 0) // Changed from response.data.total to response.data.meta.totalCount with fallback
      setTotalPages(Math.ceil((response.data.meta.totalCount || 0) / (response.data.meta.perPage || pageSize))) // Calculate totalPages from totalCount and perPage with fallbacks
    } catch (error) {
      toast.error('Failed to fetch tracking data')
      // Set fallback values to prevent UI errors
      setTrackingItems([])
      setTotal(0)
      setTotalPages(0)
    }
  }

  // Load data on mount and filter changes
  useEffect(() => {
    const isAdmin = user?.id === '7fe8730b-a261-4c3f-8348-b8fddb9caef7'
    if (isAdmin) {
      setLoading(true)
      Promise.all([fetchSummary(), fetchTrackingItems()])
        .finally(() => setLoading(false))
    }
  }, [filters, page, user])

  // Handle filter changes
  const handleFilterChange = (key: keyof LLMCostTrackingFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value === 'all' ? undefined : value || undefined }))
    setPage(1) // Reset to first page when filters change
  }

  // Clear filters
  const clearFilters = () => {
    setFilters({})
    setPage(1)
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
    }).format(amount)
  }

  // Format numbers
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  const isAdmin = user?.id === '7fe8730b-a261-4c3f-8348-b8fddb9caef7'
  if (!isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
              <p className="text-gray-600">Only administrators can access this page.</p>
              
              {/* Debug info */}
              <div className="mt-4 p-4 bg-gray-100 rounded-lg text-left">
                <h3 className="font-bold mb-2">Debug Info:</h3>
                <p><strong>User object:</strong> {JSON.stringify(user, null, 2)}</p>
                <p><strong>User ID:</strong> {user?.id || 'undefined'}</p>
                <p><strong>Expected ID:</strong> 7fe8730b-a261-4c3f-8348-b8fddb9caef7</p>
                <p><strong>Is admin:</strong> {isAdmin ? 'true' : 'false'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">LLM Cost Tracking</h1>
        <Button variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export Data
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.totalCost)}</div>
              <p className="text-xs text-muted-foreground">
                Avg per request: {formatCurrency(summary.averageCostPerRequest)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(summary.totalTokens)}</div>
              <p className="text-xs text-muted-foreground">
                Avg per request: {formatNumber(summary.averageTokensPerRequest)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(summary.totalRequests)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Providers</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.costsByProvider?.length || 0}</div>
              <div className="flex gap-1 mt-2">
                {(summary.costsByProvider || []).map((provider) => (
                  <Badge key={provider.provider} variant="secondary" className="text-xs">
                    {provider.provider}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Provider</label>
              <Select value={filters.provider || ''} onValueChange={(value) => handleFilterChange('provider', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All providers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All providers</SelectItem>
                  <SelectItem value="deepseek">DeepSeek</SelectItem>
                  <SelectItem value="chatgpt">ChatGPT</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">AI Response Type</label>
              <Select value={filters.aiResponseType || ''} onValueChange={(value) => handleFilterChange('aiResponseType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="routing">Routing</SelectItem>
                  <SelectItem value="calendar">Calendar</SelectItem>
                  <SelectItem value="rag">RAG</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Start Date</label>
              <Input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">End Date</label>
              <Input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tracking Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent LLM Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Tokens</TableHead>
                <TableHead>Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(trackingItems || []).map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{format(new Date(item.createdAt), 'MMM dd, yyyy HH:mm')}</TableCell>
                  <TableCell>
                    <Badge variant={item.provider === 'deepseek' ? 'default' : 'secondary'}>
                      {item.provider}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{item.model}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.aiResponseType}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>In: {formatNumber(item.inputTokens)}</div>
                      <div>Out: {formatNumber(item.outputTokens)}</div>
                      <div className="font-semibold">Total: {formatNumber(item.totalTokens)}</div>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">
                    {formatCurrency(item.totalCost)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-600">
              Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, total)} of {total} items
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Provider Breakdown */}
      {summary && (summary.costsByProvider?.length || 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Cost by Provider</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(summary.costsByProvider || []).map((provider) => (
                <div key={provider.provider} className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold capitalize">{provider.provider}</h3>
                    <p className="text-sm text-gray-600">
                      {formatNumber(provider.requests)} requests • {formatNumber(provider.tokens)} tokens
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">{formatCurrency(provider.cost)}</div>
                    <div className="text-sm text-gray-600">
                      {((provider.cost / summary.totalCost) * 100).toFixed(1)}% of total
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 