import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IalogusButton } from '@/components/ui/ialogus-button';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function GoogleCalendarCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const success = searchParams.get('success') === 'true';
  const error = searchParams.get('error');

  useEffect(() => {
    // Send message to parent window if opened in popup
    if (window.opener) {
      window.opener.postMessage('google-calendar-connected', '*');
      // Close popup after delay
      setTimeout(() => {
        window.close();
      }, 2000);
    }
  }, []);

  const handleContinue = () => {
    const clinicId = localStorage.getItem('currentClinicId');
    if (clinicId) {
      navigate(`/dashboard/clinic/${clinicId}/calendar`);
    } else {
      navigate('/dashboard');
    }
  };

  if (window.opener) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <p className="text-lg font-medium">Conectando ao Google Calendar...</p>
              <p className="text-sm text-muted-foreground">Esta janela será fechada automaticamente</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex justify-center mb-4">
            {success ? (
              <CheckCircle2 className="w-16 h-16 text-green-500" />
            ) : (
              <XCircle className="w-16 h-16 text-red-500" />
            )}
          </div>
          <CardTitle className="text-center">
            {success ? 'Conexão bem-sucedida!' : 'Erro na conexão'}
          </CardTitle>
          <CardDescription className="text-center">
            {success
              ? 'Seu Google Calendar foi conectado com sucesso.'
              : error || 'Não foi possível conectar ao Google Calendar.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <IalogusButton
            onClick={handleContinue}
            className="w-full"
            variant="auth-gradient-no-blue"
          >
            {success ? 'Continuar para o calendário' : 'Voltar'}
          </IalogusButton>
        </CardContent>
      </Card>
    </div>
  );
}