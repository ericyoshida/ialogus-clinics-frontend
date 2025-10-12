import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IalogusButton } from '@/components/ui/ialogus-button';
import { CalendarDays, CheckCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

interface EmptyCalendarStateProps {
  onCreateCalendar?: () => void;
  isCreating?: boolean;
}

export function EmptyCalendarState({ onCreateCalendar, isCreating }: EmptyCalendarStateProps) {
  const navigate = useNavigate();
  const { clinicId } = useParams<{ clinicId: string }>();
  
  const handleCreateClick = () => {
    if (onCreateCalendar) {
      onCreateCalendar();
    } else {
      navigate(`/dashboard/clinic/${clinicId}/calendar/create`);
    }
  };
  
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <CalendarDays className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Crie seu calendário de agendamentos</CardTitle>
          <CardDescription className="mt-2">
            Você ainda não criou seu calendário. Configure agora para começar a gerenciar seus agendamentos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                Gerencie eventos e compromissos em um só lugar
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                Sincronize com o Google Calendar (opcional)
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                Permita que seus clientes agendem horários disponíveis
              </p>
            </div>
          </div>
          
          <IalogusButton 
            onClick={handleCreateClick} 
            className="w-full" 
            size="lg"
            variant="auth-gradient-no-blue"
            disabled={isCreating}
          >
            {isCreating ? 'Criando calendário...' : 'Criar calendário'}
          </IalogusButton>
        </CardContent>
      </Card>
    </div>
  );
}