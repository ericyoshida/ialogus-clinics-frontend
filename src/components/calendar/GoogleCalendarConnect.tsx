import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, Calendar, Loader2, AlertCircle, X } from 'lucide-react';
import { calendarService } from '@/services';
import { useToast } from '@/hooks/use-toast';

interface GoogleCalendarConnectProps {
  calendarId: string;
  isConnected: boolean;
  onConnectionChange?: (connected: boolean) => void;
}

export function GoogleCalendarConnect({ 
  calendarId, 
  isConnected: initialIsConnected, 
  onConnectionChange 
}: GoogleCalendarConnectProps) {
  const [isConnected, setIsConnected] = useState(initialIsConnected);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const { toast } = useToast();

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      
      // Get authorization URL from backend
      const authUrl = await calendarService.getGoogleAuthUrl(calendarId);
      
      // Open OAuth popup
      const width = 500;
      const height = 600;
      const left = (window.innerWidth - width) / 2;
      const top = (window.innerHeight - height) / 2;
      
      const popup = window.open(
        authUrl,
        'google-oauth',
        `width=${width},height=${height},left=${left},top=${top}`
      );
      
      // Check if popup was closed
      const checkInterval = setInterval(() => {
        if (popup && popup.closed) {
          clearInterval(checkInterval);
          setIsConnecting(false);
        }
      }, 1000);
      
      // Listen for success or error messages
      const handleMessage = (event: MessageEvent) => {
        if (event.data === 'google-calendar-connected') {
          setIsConnected(true);
          onConnectionChange?.(true);
          toast({
            title: 'Conectado com sucesso!',
            description: 'Seu Google Calendar foi conectado.',
          });
          clearInterval(checkInterval);
          setIsConnecting(false);
        } else if (event.data === 'google-calendar-error') {
          toast({
            title: 'Erro na autenticação',
            description: 'Não foi possível conectar ao Google Calendar. Tente novamente.',
            variant: 'destructive',
          });
          clearInterval(checkInterval);
          setIsConnecting(false);
        }
      };
      
      window.addEventListener('message', handleMessage);
      
      // Cleanup
      return () => {
        window.removeEventListener('message', handleMessage);
        clearInterval(checkInterval);
      };
    } catch (error) {
      toast({
        title: 'Erro ao conectar',
        description: 'Não foi possível conectar ao Google Calendar.',
        variant: 'destructive',
      });
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setIsDisconnecting(true);
      await calendarService.disconnectGoogleCalendar(calendarId);
      setIsConnected(false);
      onConnectionChange?.(false);
      toast({
        title: 'Desconectado',
        description: 'Google Calendar foi desconectado.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao desconectar',
        description: 'Não foi possível desconectar o Google Calendar.',
        variant: 'destructive',
      });
    } finally {
      setIsDisconnecting(false);
    }
  };

  if (isConnected) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertDescription className="flex items-center justify-between">
          <span className="text-green-800">Google Calendar conectado</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDisconnect}
            disabled={isDisconnecting}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            {isDisconnecting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <X className="w-4 h-4 mr-1" />
                Desconectar
              </>
            )}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Integração com Google Calendar
        </CardTitle>
        <CardDescription>
          Conecte seu Google Calendar para sincronizar automaticamente seus eventos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
              Sincronize eventos automaticamente
            </p>
            <p className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
              Evite conflitos de horários
            </p>
            <p className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
              Gerencie tudo em um só lugar
            </p>
          </div>
          
          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full"
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Conectando...
              </>
            ) : (
              <>
                <img
                  src="https://www.gstatic.com/images/branding/product/1x/googleg_16dp.png"
                  alt="Google"
                  className="w-4 h-4 mr-2"
                />
                Conectar com Google Calendar
              </>
            )}
          </Button>
          
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Você será redirecionado para o Google para autorizar o acesso.
              Seus dados estão seguros e você pode desconectar a qualquer momento.
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  );
}