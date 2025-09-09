import { useEffect, useRef, useState } from 'react';

type AgentStatusButtonProps = {
  isActive: boolean;
  onClick: () => void;
  isLoading?: boolean;
};

export function AgentStatusButton({ isActive = true, onClick, isLoading = false }: AgentStatusButtonProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const confirmationRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Fechar o box de confirmação quando clicar fora dele
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (confirmationRef.current && !confirmationRef.current.contains(event.target as Node)) {
        setShowConfirmation(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleButtonClick = () => {
    if (isLoading) return;
    setShowConfirmation(true);
  };

  const handleConfirm = () => {
    if (isLoading) return;
    onClick();
    setShowConfirmation(false);
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        className={`w-full h-12 rounded-md text-white font-bold flex items-center justify-center gap-2 ${
          isActive ? "ialogus-gradient-auth" : "bg-blue-600 hover:bg-blue-700"
        } ${isLoading ? "opacity-75 cursor-not-allowed" : ""}`}
        onClick={handleButtonClick}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            Alterando...
          </>
        ) : isActive ? (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
            </svg>
            Atendimento IA
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            Atendimento Humano
          </>
        )}
      </button>
      
      {showConfirmation && !isLoading && (
        <div 
          ref={confirmationRef}
          className="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-white rounded-md shadow-lg border border-gray-200 p-3 w-56 z-50"
        >
          <div className="absolute bottom-[-8px] left-1/2 transform -translate-x-1/2 rotate-45 w-4 h-4 bg-white border-r border-b border-gray-200"></div>
          <p className="text-sm font-medium text-gray-800 mb-2">
            Mudar para {isActive ? "atendimento humano" : "atendimento IA"}?
          </p>
          <div className="flex justify-between gap-2">
            <button
              onClick={() => setShowConfirmation(false)}
              className="flex-1 py-1.5 px-2 text-xs font-medium bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              className={`flex-1 py-1.5 px-2 text-xs font-medium rounded text-white ${
                isActive ? "bg-blue-600 hover:bg-blue-700" : "ialogus-gradient-auth"
              }`}
            >
              Confirmar
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 