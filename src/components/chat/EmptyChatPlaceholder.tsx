export function EmptyChatPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-between h-full bg-[#FAFAFA]">
      <div className="flex-grow flex flex-col items-center justify-center w-full">
        <div className="flex flex-col items-center max-w-lg px-6 text-center">
          <div className="text-gray-500 mb-6">
            <img 
              src="/images/ialogus_logo web RGB  principal.png" 
              alt="Ialogus" 
              className="h-16 object-contain filter grayscale opacity-60 brightness-125" 
              style={{ filter: 'grayscale(1) brightness(1.2) opacity(0.65)' }}
            />
          </div>
          <p className="text-base font-medium text-gray-600 mb-4 mx-auto">
            Selecione uma conversa para começar.
          </p>
          <p className="text-xs text-gray-500 max-w-lg leading-relaxed text-justify px-2">
            Acompanhe as conversas dos seus agentes em tempo real,
            interrompa e assuma o atendimento com um clique a qualquer momento.
          </p>
        </div>
      </div>
      
      <div className="w-full border-t border-gray-100 py-4 mt-8 flex justify-center">
        <div className="flex items-center max-w-md px-6 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
          <p className="text-xs text-gray-400">
            Todas as conversas são protegidas por criptografia de ponta a ponta.
          </p>
        </div>
      </div>
    </div>
  );
} 