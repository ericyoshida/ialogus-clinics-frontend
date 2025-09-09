import { FeatureCard } from '@/components/ui/feature-card';
import { cn } from '@/lib/utils';
import React from 'react';
import { useNavigate } from 'react-router-dom';

interface CompanyFeatureCardProps {
  name: string;
  id: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  svgPath?: string;
}

export function CompanyFeatureCard({ name, id, icon, onClick, svgPath }: CompanyFeatureCardProps) {
  const navigate = useNavigate();
  // Verifica se o nome é muito longo para considerar usar uma fonte menor
  const isLongName = name.length > 15;
  
  // Calculate the font size adjustment
  const fontSize = isLongName ? 'min(2.5vw, 14px)' : 'min(3vw, 16px)';
  
  // Font size adjustment for long names can be handled in the custom className
  const cardClassName = cn(
    "w-full h-full aspect-square"
  );
  
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      // Navegar para a página de menu da empresa usando o ID como parâmetro
      navigate(`/dashboard/company/${id}`);
    }
  };
  
  return (
    <FeatureCard
      title={name}
      icon={icon || (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-400">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15" />
        </svg>
      )}
      gradientColors={{ from: '#EB9B45', to: '#E05C5C' }}
      decorativeElement={svgPath ? "svg" : "circle"}
      svgPath={svgPath}
      onClick={handleClick}
      className={cardClassName}
    />
  );
} 