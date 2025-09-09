import { IalogusButton } from '@/components/ui/ialogus-button'
import { IalogusInput } from '@/components/ui/ialogus-input'
import { IalogusLogo } from '@/components/ui/ialogus-logo'
import { useToast } from "@/hooks/use-toast"
import React, { useState } from 'react'
import { Link } from 'react-router-dom'

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (email) {
      setIsSubmitted(true);
      toast({
        title: "E-mail enviado",
        description: "Se o e-mail existir em nosso sistema, você receberá instruções para redefinir sua senha.",
      });
    } else {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, informe seu e-mail.",
        variant: "destructive",
      });
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
          
          <h2 className="text-xl font-normal mb-4 text-left text-gray-500">Recupere sua Senha</h2>
          
          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <IalogusInput
                  label="Digite seu e-mail ou CPF"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              
              <p className="text-xs text-gray-600 mt-2">
                Enviaremos um e-mail com instruções para redefinir sua senha.
              </p>
              
              <div className="mt-6">
                <IalogusButton
                  type="submit"
                  variant="auth-gradient"
                  size="lg"
                  fullWidth
                >
                  Recuperar Senha
                </IalogusButton>
              </div>
            </form>
          ) : (
            <div className="text-center">
              <div className="text-green-500 text-lg mb-4">
                E-mail enviado com sucesso!
              </div>
              <p className="text-gray-600 mb-6">
                Enviamos instruções para {email}. Verifique sua caixa de entrada.
              </p>
            </div>
          )}
          
          <div className="mt-8 text-center">
            <Link to="/auth/login" className="text-ialogus-purple hover:underline focus:outline-none">
              Voltar para o login
            </Link>
          </div>
        </div>
      </div>
      
      {/* Seção da direita - Imagem */}
      <div className="hidden md:block md:w-1/2 bg-white flex items-center justify-center">
        <div className="flex items-center justify-center w-full h-full">
          <img
            src="/images/forgot-password-image.svg"
            alt="Ilustração de recuperação de senha"
            className="w-3/4 h-3/4 object-contain"
          />
        </div>
      </div>
    </div>
  );
}
