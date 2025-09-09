import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';

interface LogoProps {
  variant?: 'default' | 'white';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  linkTo?: string; // Permite especificar um caminho personalizado
}

export function IalogusLogo({ 
  variant = 'default', 
  size = 'md', 
  className,
  linkTo 
}: LogoProps) {
  const { isAuthenticated } = useAuth();
  
  // Define o destino do link conforme a autenticação do usuário
  // Se linkTo foi fornecido, usa esse valor. Caso contrário:
  // - Se estiver autenticado, vai para o dashboard
  // - Se não estiver autenticado, vai para a página inicial
  const destination = linkTo || (isAuthenticated ? '/dashboard' : '/');
  
  const sizeClasses = {
    sm: 'h-12',
    md: 'h-16',
    lg: 'h-24',
  };

  // Use the provided PNG logo that includes both the icon and text
  return (
    <Link to={destination} className={`flex items-center ${className}`}>
      <img 
        src="/images/ialogus_logo web RGB  principal.png" 
        alt="Ialogus Logo" 
        className={`${sizeClasses[size]} ${variant === 'white' ? 'brightness-0 invert' : ''} object-contain`}
      />
    </Link>
  );
}
