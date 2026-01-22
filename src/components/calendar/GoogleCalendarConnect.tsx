import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Loader2, Link2, Unlink } from 'lucide-react';
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
            title: 'Erro na autenticacao',
            description: 'Nao foi possivel conectar ao Google Calendar. Tente novamente.',
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
        description: 'Nao foi possivel conectar ao Google Calendar.',
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
        description: 'Nao foi possivel desconectar o Google Calendar.',
        variant: 'destructive',
      });
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <Card className="overflow-hidden shadow-sm">
      {/* Header com gradiente ialogus */}
      <CardHeader className="bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white p-4">
        <div className="flex items-center gap-2">
          <img
            src="https://www.gstatic.com/calendar/images/dynamiclogo_2020q4/calendar_31_2x.png"
            alt="Google Calendar"
            className="h-6 w-6"
          />
          <CardTitle className="text-base font-medium">
            Google Calendar
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        {isConnected ? (
          <>
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm font-medium">Conectado</span>
            </div>
            <p className="text-xs text-gray-500">
              Seus eventos estao sincronizados automaticamente.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
              onClick={handleDisconnect}
              disabled={isDisconnecting}
            >
              {isDisconnecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Unlink className="h-4 w-4 mr-2" />
                  Desconectar
                </>
              )}
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-600">
              Conecte para sincronizar seus eventos.
            </p>
            <div className="space-y-2 text-xs text-gray-500">
              <p className="flex items-start gap-2">
                <CheckCircle2 className="w-3 h-3 mt-0.5 text-green-500 flex-shrink-0" />
                Sincronize eventos automaticamente
              </p>
              <p className="flex items-start gap-2">
                <CheckCircle2 className="w-3 h-3 mt-0.5 text-green-500 flex-shrink-0" />
                Evite conflitos de horarios
              </p>
            </div>
            <Button
              className="w-full bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] hover:opacity-90"
              onClick={handleConnect}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4 mr-2" />
                  Conectar
                </>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
