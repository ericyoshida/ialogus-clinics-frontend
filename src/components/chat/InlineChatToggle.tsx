import { useEffect, useRef, useState } from 'react';

type InlineChatToggleProps = {
  isAgentActive: boolean;
  onToggle: () => void;
  isVisible: boolean;
};

export function InlineChatToggle({ 
  isAgentActive = true, 
  onToggle,
  isVisible = true
}: InlineChatToggleProps) {
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
    setShowConfirmation(true);
  };

  const handleConfirm = () => {
    onToggle();
    setShowConfirmation(false);
  };

  if (!isVisible) return null;

  return (
    <div className="w-full border-t border-gray-200 bg-white py-1.5 px-4 relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {isAgentActive ? (
            <>
              <div className="w-2.5 h-2.5 rounded-full mr-2 bg-green-500 animate-pulse"></div>
              <span className="text-sm text-gray-700 font-medium">Atendimento IA ativo</span>
            </>
          ) : (
            <>
              <div className="w-2.5 h-2.5 rounded-full mr-2 bg-blue-500"></div>
              <span className="text-sm text-gray-700 font-medium">Atendimento humano ativo</span>
            </>
          )}
        </div>
        
        <button
          ref={buttonRef}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md border text-sm transition-all duration-200 ${
            isAgentActive 
              ? "border-blue-600 text-blue-600 hover:bg-blue-50" 
              : "border-green-600 text-green-600 hover:bg-green-50"
          }`}
          onClick={handleButtonClick}
          title={`Alternar para ${isAgentActive ? 'atendimento humano' : 'atendimento IA'}`}
        >
          {isAgentActive ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              <span className="font-medium">Mudar para humano</span>
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
              </svg>
              <span className="font-medium">Mudar para IA</span>
            </>
          )}
        </button>
      </div>
      
      {showConfirmation && (
        <div 
          ref={confirmationRef}
          className="absolute z-50 bottom-12 right-4 bg-white rounded-md shadow-lg border border-gray-200 p-4 w-64 animate-fade-in"
        >
          <div className="absolute bottom-[-8px] right-8 transform rotate-45 w-4 h-4 bg-white border-r border-b border-gray-200"></div>
          <p className="text-sm font-medium text-gray-800 mb-3">
            Mudar para {isAgentActive ? "atendimento humano" : "atendimento IA"}?
          </p>
          <div className="flex justify-between gap-3">
            <button
              onClick={() => setShowConfirmation(false)}
              className="flex-1 py-2 px-3 text-sm font-medium bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-md text-white transition-colors ${
                isAgentActive 
                  ? "bg-blue-600 hover:bg-blue-700" 
                  : "bg-green-600 hover:bg-green-700"
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