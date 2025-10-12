import { cn } from '@/lib/utils';

interface AddClinicCardProps {
  onClick?: () => void;
  className?: string;
}

export function AddClinicCard({ onClick, className }: AddClinicCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full h-full aspect-square bg-transparent border-none outline-none focus:outline-none p-0 m-0 cursor-pointer",
        "transition-all duration-300 ease-in-out",
        "hover:scale-[1.02] hover:drop-shadow-[6px_6px_10px_rgba(0,0,0,0.15)]",
        className
      )}
      aria-label="Adicionar nova clínica"
    >
      <img 
        src="/images/add-clinic.svg" 
        alt="Adicionar clínica" 
        className="w-full h-full object-contain"
      />
    </button>
  );
} 