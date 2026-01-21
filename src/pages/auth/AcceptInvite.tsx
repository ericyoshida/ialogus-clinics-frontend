import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { IalogusButton } from '@/components/ui/ialogus-button'
import { IalogusLogo } from '@/components/ui/ialogus-logo'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import {
  acceptInvite,
  getInvitationDetails,
  InvitationDetails
} from '@/services/auth'
import { BuildingOffice2Icon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();

  const pendingMembershipId = searchParams.get('pmId') || '';
  const invitationToken = searchParams.get('token') || '';

  const [invitationDetails, setInvitationDetails] = useState<InvitationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvitationDetails = async () => {
      if (!pendingMembershipId || !invitationToken) {
        setError('Link de convite invalido. Por favor, verifique o link recebido por email.');
        setLoading(false);
        return;
      }

      try {
        const details = await getInvitationDetails(pendingMembershipId, invitationToken);
        setInvitationDetails(details);

        // Se for novo usuario e registro nao estiver completo, redireciona
        if (details.isNewUser) {
          navigate(`/auth/complete-registration?pmId=${pendingMembershipId}&token=${invitationToken}`);
          return;
        }
      } catch (err: any) {
        console.error('Erro ao buscar detalhes do convite:', err);
        const errorMessage = err.response?.data?.message || 'Convite invalido ou expirado.';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchInvitationDetails();
  }, [pendingMembershipId, invitationToken, navigate]);

  const handleAccept = async () => {
    setAccepting(true);
    try {
      await acceptInvite(pendingMembershipId, invitationToken);

      toast({
        title: 'Convite aceito!',
        description: `Voce agora faz parte de ${invitationDetails?.clinicName}.`,
      });

      // Redireciona para o dashboard
      // Se estiver autenticado, vai para o dashboard direto
      // Se nao, vai para o login
      if (isAuthenticated) {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/auth/login', { replace: true });
      }
    } catch (err: any) {
      console.error('Erro ao aceitar convite:', err);
      const errorMessage = err.response?.data?.message || 'Nao foi possivel aceitar o convite.';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setAccepting(false);
    }
  };

  const handleDecline = () => {
    toast({
      title: 'Convite recusado',
      description: 'Voce recusou o convite para a clinica.',
    });

    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    } else {
      navigate('/auth/login', { replace: true });
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'destructive';
      case 'DENTISTA':
        return 'default';
      case 'SECRETARIA':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <IalogusLogo size="md" />
          <p className="mt-4 text-gray-500">Carregando convite...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <IalogusLogo size="md" />
          <h2 className="mt-6 text-xl font-semibold text-red-600">Convite Invalido</h2>
          <p className="mt-2 text-gray-500">{error}</p>
          <IalogusButton
            variant="outline"
            className="mt-6"
            onClick={() => navigate('/auth/login')}
          >
            Ir para Login
          </IalogusButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-lg">
        <div className="mb-8 flex justify-center">
          <IalogusLogo size="md" />
        </div>

        <Card className="shadow-lg">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <BuildingOffice2Icon className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Convite para Clinica</CardTitle>
            <CardDescription>
              Voce foi convidado para fazer parte de uma equipe
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Detalhes do convite */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Clinica</span>
                <span className="font-semibold text-lg">{invitationDetails?.clinicName}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Seu cargo</span>
                <Badge variant={getRoleBadgeVariant(invitationDetails?.role || '') as any} className="text-sm">
                  {invitationDetails?.roleLabel}
                </Badge>
              </div>

              {invitationDetails?.userName && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Bem-vindo(a)</span>
                  <span className="font-medium">{invitationDetails.userName}</span>
                </div>
              )}
            </div>

            {/* Mensagem informativa */}
            <p className="text-sm text-center text-gray-500">
              Ao aceitar o convite, voce tera acesso aos recursos da clinica de acordo com seu cargo.
            </p>

            {/* Botoes de acao */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <IalogusButton
                variant="outline"
                className="flex-1"
                onClick={handleDecline}
                disabled={accepting}
              >
                <XCircleIcon className="w-5 h-5 mr-2" />
                Recusar
              </IalogusButton>

              <IalogusButton
                variant="auth-gradient"
                className="flex-1"
                onClick={handleAccept}
                disabled={accepting}
              >
                {accepting ? (
                  'Aceitando...'
                ) : (
                  <>
                    <CheckCircleIcon className="w-5 h-5 mr-2" />
                    Aceitar Convite
                  </>
                )}
              </IalogusButton>
            </div>
          </CardContent>
        </Card>

        {!isAuthenticated && (
          <p className="mt-6 text-center text-sm text-gray-500">
            Ja tem uma conta?{' '}
            <a
              href="/auth/login"
              className="text-primary hover:underline font-medium"
            >
              Faca login
            </a>{' '}
            antes de aceitar o convite.
          </p>
        )}
      </div>
    </div>
  );
}
