import { IalogusButton } from '@/components/ui/ialogus-button'
import { IalogusInput } from '@/components/ui/ialogus-input'
import { IalogusLogo } from '@/components/ui/ialogus-logo'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from "@/hooks/use-toast"
import React, { useState } from 'react'
import { Link } from 'react-router-dom'

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const { toast } = useToast();
  const { register, isLoading } = useAuth();

  const validatePassword = (value: string) => {
    if (value.length < 8) {
      setPasswordError('A senha deve conter no mínimo 8 caracteres sendo pelo menos 1 letra maiúscula, 1 caracter especial e 1 número.');
      return false;
    } else {
      const hasUpperCase = /[A-Z]/.test(value);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
      const hasNumber = /\d/.test(value);
      
      if (!hasUpperCase || !hasSpecialChar || !hasNumber) {
        setPasswordError('A senha deve conter no mínimo 8 caracteres sendo pelo menos 1 letra maiúscula, 1 caracter especial e 1 número.');
        return false;
      } else {
        setPasswordError('');
        return true;
      }
    }
  };

  const validateConfirmPassword = (value: string) => {
    if (value !== password) {
      setConfirmPasswordError('As senhas não são iguais, tente novamente.');
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
    
    if (!fullName || !email) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }
    
    if (fullName && email && isPasswordValid && isConfirmPasswordValid) {
      await register(fullName, email, password);
      // O redirecionamento é feito no contexto de autenticação após registro bem-sucedido
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Seção da esquerda - Formulário */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-10 flex justify-center">
            <IalogusLogo size="md" />
          </div>
          
          <h2 className="text-xl font-normal mb-4 text-left text-gray-500">Cadastre-se</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
            <IalogusInput
              label="Nome Completo"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={isLoading}
            />
            </div>
            
            <div>
            <IalogusInput
              label="E-mail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
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
              disabled={isLoading}
            />
            </div>
            
            <div>
            <IalogusInput
              label="Repetir Senha"
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (e.target.value) validateConfirmPassword(e.target.value);
              }}
              showPasswordToggle
              errorMessage={confirmPasswordError}
              disabled={isLoading}
              />
            </div>
            
            <div className="mt-6">
              <IalogusButton
                type="submit"
                variant="auth-gradient"
                size="lg"
                fullWidth
                disabled={isLoading}
              >
                {isLoading ? 'Cadastrando...' : 'Cadastrar'}
            </IalogusButton>
            </div>
          </form>
          
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-4 text-sm text-gray-500">Ou</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>
          
          <button 
            className="w-full flex items-center justify-center py-2.5 px-4 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-all focus:outline-none"
            disabled={isLoading}
            type="button"
          >
            <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Cadastre-se com o Google
          </button>
          
          <p className="mt-8 text-center text-sm text-gray-600">
            Já tem conta?{' '}
            <Link to="/auth/login" className="text-ialogus-orange hover:underline font-medium focus:outline-none">
              Faça seu login
            </Link>.
          </p>
        </div>
      </div>
      
      {/* Seção da direita - Imagem */}
      <div className="hidden md:block md:w-1/2 bg-white flex items-center justify-center">
        <div className="flex items-center justify-center w-full h-full">
        <img
            src="/images/register-image.svg"
            alt="Ilustração de cadastro"
            className="w-3/4 h-3/4 object-contain"
        />
        </div>
      </div>
    </div>
  );
}
