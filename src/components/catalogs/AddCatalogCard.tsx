interface AddCatalogCardProps {
  onClick: () => void;
}

export function AddCatalogCard({ onClick }: AddCatalogCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-[250px] h-[250px] bg-transparent border-none outline-none focus:outline-none p-0 m-0 cursor-pointer transition-all duration-300 ease-in-out hover:scale-[1.02] hover:drop-shadow-[6px_6px_10px_rgba(0,0,0,0.15)]"
      aria-label="Adicionar novo catálogo"
    >
      <img 
        src="/images/add-product-catalog.svg" 
        alt="Adicionar novo catálogo" 
        className="w-full h-full object-contain"
      />
    </button>
  );
}