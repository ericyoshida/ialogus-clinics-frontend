import { WorkingHoursSelector } from '@/components/calendar/WorkingHoursSelector'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useCalendar } from '@/hooks/use-calendar'
import { useToast } from '@/hooks/use-toast'
import { updateWorkingHours, WorkingHours } from '@/services/calendar'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Calendar, Check, Clock, Loader2, RotateCcw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

export default function EditCalendarPage() {
  const navigate = useNavigate()
  const { clinicId } = useParams<{ clinicId: string }>()
  const { calendar, isLoading: isLoadingCalendar, refetchCalendar } = useCalendar()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [workingHours, setWorkingHours] = useState<WorkingHours[]>([])
  const [hasChanges, setHasChanges] = useState(false)

  // Carregar horários atuais do calendário
  useEffect(() => {
    if (calendar?.workingHours) {
      setWorkingHours(calendar.workingHours)
    }
  }, [calendar])

  // Detectar mudanças
  useEffect(() => {
    if (calendar?.workingHours) {
      const original = JSON.stringify(calendar.workingHours.sort((a, b) => a.weekday - b.weekday || a.startTime.localeCompare(b.startTime)))
      const current = JSON.stringify(workingHours.sort((a, b) => a.weekday - b.weekday || a.startTime.localeCompare(b.startTime)))
      setHasChanges(original !== current)
    }
  }, [workingHours, calendar])

  // Mutation para salvar
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!calendar?.calendarId) throw new Error('Calendar ID not found')
      return updateWorkingHours(calendar.calendarId, workingHours)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
      toast({
        title: 'Horários salvos',
        description: 'Seus horários de trabalho foram atualizados com sucesso!',
      })
      navigate(`/dashboard/clinic/${clinicId}/calendar`)
    },
    onError: (error) => {
      console.error('Erro ao salvar horários:', error)
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar os horários. Tente novamente.',
        variant: 'destructive',
      })
    },
  })

  const handleSave = () => {
    saveMutation.mutate()
  }

  const handleReset = () => {
    if (calendar?.workingHours) {
      setWorkingHours(calendar.workingHours)
    }
  }

  // Presets de horários
  const presets = [
    {
      label: 'Comercial',
      description: 'Seg-Sex 8h-18h',
      hours: [
        { weekday: 1, startTime: '08:00', endTime: '18:00' },
        { weekday: 2, startTime: '08:00', endTime: '18:00' },
        { weekday: 3, startTime: '08:00', endTime: '18:00' },
        { weekday: 4, startTime: '08:00', endTime: '18:00' },
        { weekday: 5, startTime: '08:00', endTime: '18:00' },
      ],
    },
    {
      label: 'CLT',
      description: 'Seg-Sex 8h-12h, 13h-17h',
      hours: [
        { weekday: 1, startTime: '08:00', endTime: '12:00' },
        { weekday: 1, startTime: '13:00', endTime: '17:00' },
        { weekday: 2, startTime: '08:00', endTime: '12:00' },
        { weekday: 2, startTime: '13:00', endTime: '17:00' },
        { weekday: 3, startTime: '08:00', endTime: '12:00' },
        { weekday: 3, startTime: '13:00', endTime: '17:00' },
        { weekday: 4, startTime: '08:00', endTime: '12:00' },
        { weekday: 4, startTime: '13:00', endTime: '17:00' },
        { weekday: 5, startTime: '08:00', endTime: '12:00' },
        { weekday: 5, startTime: '13:00', endTime: '17:00' },
      ],
    },
    {
      label: 'Meio período',
      description: 'Seg-Sex 8h-12h',
      hours: [
        { weekday: 1, startTime: '08:00', endTime: '12:00' },
        { weekday: 2, startTime: '08:00', endTime: '12:00' },
        { weekday: 3, startTime: '08:00', endTime: '12:00' },
        { weekday: 4, startTime: '08:00', endTime: '12:00' },
        { weekday: 5, startTime: '08:00', endTime: '12:00' },
      ],
    },
  ]

  if (isLoadingCalendar) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando calendário...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto pb-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate(`/dashboard/clinic/${clinicId}/calendar`)}
          className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Editar Horários de Trabalho</h1>
          <p className="text-muted-foreground mt-1">
            Configure os horários em que você está disponível para atendimento
          </p>
        </div>
      </div>

      {/* Presets */}
      <Card className="mb-6 border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Modelos de Horário
          </CardTitle>
          <CardDescription>
            Selecione um modelo pré-definido ou personalize seus horários abaixo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {presets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => setWorkingHours(preset.hours)}
                className="group p-4 border-2 rounded-xl hover:border-primary hover:bg-primary/5 transition-all text-left"
              >
                <div className="font-medium text-gray-900 group-hover:text-primary">
                  {preset.label}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {preset.description}
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={() => setWorkingHours([])}
            className="mt-3 text-sm text-muted-foreground hover:text-destructive transition-colors"
          >
            Limpar todos os horários
          </button>
        </CardContent>
      </Card>

      {/* Working Hours Selector */}
      <Card className="mb-6 border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Grade de Horários
          </CardTitle>
          <CardDescription>
            Clique e arraste para selecionar os períodos de atendimento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WorkingHoursSelector value={workingHours} onChange={setWorkingHours} />
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="mb-6 border-0 shadow-sm bg-gray-50">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Check className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="font-medium text-gray-900">
                  {workingHours.length > 0
                    ? `${workingHours.length} período(s) configurado(s)`
                    : 'Nenhum horário configurado'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {workingHours.length > 0
                    ? 'Seus pacientes poderão agendar nesses horários'
                    : 'Selecione os horários de atendimento acima'}
                </div>
              </div>
            </div>
            {hasChanges && (
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                Alterações não salvas
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={handleReset}
          disabled={!hasChanges || saveMutation.isPending}
          className="gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Desfazer alterações
        </Button>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => navigate(`/dashboard/clinic/${clinicId}/calendar`)}
            disabled={saveMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending || !hasChanges}
            className="gap-2 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white border-0"
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Salvar Horários
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
