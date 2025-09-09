import { FeatureCard } from '@/components/ui/feature-card';

interface ConnectChannelsCardProps {
  onClick?: () => void;
}

export function ConnectChannelsCard({ onClick }: ConnectChannelsCardProps) {
  // SVG icon for cloud connectivity
  const cloudIcon = (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24" 
      strokeWidth={1.5} 
      stroke="currentColor" 
      className="w-full h-full text-gray-400"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" 
      />
    </svg>
  );

  return (
    <FeatureCard
      title="Canais"
      subtitle="Conectar"
      description="Conecte seus canais de comunicação."
      icon={cloudIcon}
      gradientColors={{ from: '#EB9B45', to: '#E05C5C' }}
      decorativeElement="cloud"
      onClick={onClick}
      className="w-full h-full aspect-square"
    />
  );
} 