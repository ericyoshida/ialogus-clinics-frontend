import { Badge } from '@/components/ui/badge'
import { IalogusButton } from '@/components/ui/ialogus-button'
import { IalogusInput } from '@/components/ui/ialogus-input'
import { IalogusLogo } from '@/components/ui/ialogus-logo'
import { useToast } from '@/hooks/use-toast'
import {
  completeRegistration,
  getInvitationDetails,
  InvitationDetails
} from '@/services/auth'
import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

export default function CompleteRegistration() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const pendingMembershipId = searchParams.get('pmId') || '';
  const invitationToken = searchParams.get('token') || '';

  const [invitationDetails, setInvitationDetails] = useState<InvitationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

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

        // Se nao for novo usuario, redireciona para pagina de aceitar convite
        if (!details.isNewUser) {
          navigate(`/auth/accept-invite?pmId=${pendingMembershipId}&token=${invitationToken}`);
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

  const validatePassword = (value: string) => {
    if (value.length < 8) {
      setPasswordError('A senha deve conter no minimo 8 caracteres sendo pelo menos 1 letra maiuscula, 1 caracter especial e 1 numero.');
      return false;
    } else {
      const hasUpperCase = /[A-Z]/.test(value);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
      const hasNumber = /\d/.test(value);

      if (!hasUpperCase || !hasSpecialChar || !hasNumber) {
        setPasswordError('A senha deve conter no minimo 8 caracteres sendo pelo menos 1 letra maiuscula, 1 caracter especial e 1 numero.');
        return false;
      } else {
        setPasswordError('');
        return true;
      }
    }
  };

  const validateConfirmPassword = (value: string) => {
    if (value !== password) {
      setConfirmPasswordError('As senhas nao sao iguais, tente novamente.');
      return false;
    } else {
      setConfirmPasswordError('');
      return true;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isPasswordValid = validatePassword(password);
    const isConfirmPasswordValid = validateConfirmPassword(confirmPassword);

    if (!name.trim()) {
      toast({
        title: 'Campo obrigatorio',
        description: 'Por favor, informe seu nome.',
        variant: 'destructive',
      });
      return;
    }

    if (!isPasswordValid || !isConfirmPasswordValid) {
      return;
    }

    setSubmitting(true);
    try {
      await completeRegistration({
        pendingMembershipId,
        invitationToken,
        name: name.trim(),
        password,
      });

      toast({
        title: 'Registro completado',
        description: 'Agora voce pode aceitar o convite para a clinica.',
      });

      // Redireciona para a pagina de aceitar convite
      navigate(`/auth/accept-invite?pmId=${pendingMembershipId}&token=${invitationToken}`);
    } catch (err: any) {
      console.error('Erro ao completar registro:', err);
      const errorMessage = err.response?.data?.message || 'Nao foi possivel completar o registro.';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <IalogusLogo size="md" />
          <p className="mt-4 text-gray-500">Carregando convite...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Secao da esquerda - Formulario */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex justify-center">
            <IalogusLogo size="md" />
          </div>

          <h2 className="text-xl font-normal mb-2 text-left text-gray-500">Complete seu Cadastro</h2>
          <p className="text-sm text-gray-400 mb-6">
            Voce foi convidado para fazer parte de uma clinica. Complete seus dados para continuar.
          </p>

          {/* Card com informacoes do convite */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Clinica</span>
              <span className="font-medium">{invitationDetails?.clinicName}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Email</span>
              <span className="font-medium">{invitationDetails?.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Cargo</span>
              <Badge variant={getRoleBadgeVariant(invitationDetails?.role || '') as any}>
                {invitationDetails?.roleLabel}
              </Badge>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <IalogusInput
                label="Seu Nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Digite seu nome completo"
                disabled={submitting}
              />
            </div>

            <div>
              <IalogusInput
                label="Criar Senha"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (e.target.value) validatePassword(e.target.value);
                }}
                showPasswordToggle
                errorMessage={passwordError}
                disabled={submitting}
              />
            </div>

            <div>
              <IalogusInput
                label="Confirmar Senha"
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (e.target.value) validateConfirmPassword(e.target.value);
                }}
                showPasswordToggle
                errorMessage={confirmPasswordError}
                disabled={submitting}
              />
            </div>

            <div className="mt-6">
              <IalogusButton
                type="submit"
                variant="auth-gradient"
                size="lg"
                fullWidth
                disabled={submitting}
              >
                {submitting ? 'Completando...' : 'Completar Cadastro'}
              </IalogusButton>
            </div>
          </form>
        </div>
      </div>

      {/* Secao da direita - Imagem */}
      <div className="hidden md:block md:w-1/2 bg-white flex items-center justify-center">
        <div className="flex items-center justify-center w-full h-full">
          <img
            src="/images/register-image.svg"
            alt="Ilustracao de cadastro"
            className="w-3/4 h-3/4 object-contain"
          />
        </div>
      </div>
    </div>
  );
}
