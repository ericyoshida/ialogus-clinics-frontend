import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IalogusButton } from '@/components/ui/ialogus-button';
import { WorkingHoursSelector } from '@/components/calendar/WorkingHoursSelector';
import { useCalendar } from '@/hooks/use-calendar';
import { useToast } from '@/hooks/use-toast';
import { WorkingHours } from '@/services/calendar';
import { ArrowLeft, Calendar, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export default function CreateCalendarPage() {
  const navigate = useNavigate();
  const { companyId } = useParams<{ companyId: string }>();
  const { createCalendar } = useCalendar();
  const { toast } = useToast();
  
  const [isCreating, setIsCreating] = useState(false);
  const [workingHours, setWorkingHours] = useState<WorkingHours[]>([
    { weekday: 1, startTime: '09:00', endTime: '18:00' },
    { weekday: 2, startTime: '09:00', endTime: '18:00' },
    { weekday: 3, startTime: '09:00', endTime: '18:00' },
    { weekday: 4, startTime: '09:00', endTime: '18:00' },
    { weekday: 5, startTime: '09:00', endTime: '18:00' },
  ]);

  const handleSubmit = async () => {
    if (workingHours.length === 0) {
      toast({
        title: 'Horários obrigatórios',
        description: 'Selecione pelo menos um horário de trabalho.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsCreating(true);
      await createCalendar({
        workingHours,
      });
      
      toast({
        title: 'Calendário criado',
        description: 'Seu calendário foi configurado com sucesso!',
      });
      
      navigate(`/dashboard/company/${companyId}/calendar`);
    } catch (error) {
      toast({
        title: 'Erro ao criar calendário',
        description: 'Não foi possível criar o calendário. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 px-4">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold">Configurar Calendário</h1>
          <p className="text-muted-foreground">Configure seus horários de trabalho e integrações</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Horários de Trabalho</CardTitle>
          <CardDescription>
            Selecione os horários em que você está disponível para atendimento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              type="button"
              onClick={() => {
                // Segunda a sexta, 9h às 18h
                setWorkingHours([
                  { weekday: 1, startTime: '09:00', endTime: '18:00' },
                  { weekday: 2, startTime: '09:00', endTime: '18:00' },
                  { weekday: 3, startTime: '09:00', endTime: '18:00' },
                  { weekday: 4, startTime: '09:00', endTime: '18:00' },
                  { weekday: 5, startTime: '09:00', endTime: '18:00' },
                ]);
              }}
              className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm border rounded-md hover:bg-gray-50 transition-colors"
            >
              <span className="sm:hidden">Seg-Sex 9-18h</span>
              <span className="hidden sm:inline">Comercial (Seg-Sex 9h-18h)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                // Segunda a sexta, 8h às 17h
                setWorkingHours([
                  { weekday: 1, startTime: '08:00', endTime: '17:00' },
                  { weekday: 2, startTime: '08:00', endTime: '17:00' },
                  { weekday: 3, startTime: '08:00', endTime: '17:00' },
                  { weekday: 4, startTime: '08:00', endTime: '17:00' },
                  { weekday: 5, startTime: '08:00', endTime: '17:00' },
                ]);
              }}
              className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm border rounded-md hover:bg-gray-50 transition-colors"
            >
              <span className="sm:hidden">Seg-Sex 8-17h</span>
              <span className="hidden sm:inline">Comercial (Seg-Sex 8h-17h)</span>
            </button>
            <button
              type="button"
              onClick={() => setWorkingHours([])}
              className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm border rounded-md hover:bg-gray-50 transition-colors ml-auto"
            >
              Limpar tudo
            </button>
          </div>
          
          <WorkingHoursSelector
            value={workingHours}
            onChange={setWorkingHours}
          />
        </CardContent>
      </Card>


      <div className="flex gap-3 justify-end">
        <IalogusButton
          variant="ghost"
          onClick={() => navigate(-1)}
          disabled={isCreating}
        >
          Cancelar
        </IalogusButton>
        <IalogusButton
          onClick={handleSubmit}
          disabled={isCreating}
          variant="auth-gradient-no-blue"
        >
          {isCreating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Criando calendário...
            </>
          ) : (
            <>
              <Calendar className="w-4 h-4 mr-2" />
              Criar Calendário
            </>
          )}
        </IalogusButton>
      </div>
    </div>
  );
}