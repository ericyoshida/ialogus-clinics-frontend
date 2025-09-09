import { IalogusLogo } from '@/components/ui/ialogus-logo';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, HelpCircle, LogOut, Menu } from 'lucide-react';

interface HeaderProps {
  onToggleMobileSidebar: () => void;
}

export function Header({ onToggleMobileSidebar }: HeaderProps) {
  const { logout, user } = useAuth();

  return (
    <header className="bg-[#0a0070] h-16 flex items-center justify-between px-4">
      <div className="flex-1 flex items-center">
        <button 
          className="md:hidden p-2 mr-2 rounded-full hover:bg-blue-900 text-white"
          onClick={onToggleMobileSidebar}
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <IalogusLogo variant="white" size="sm" linkTo="/dashboard" />
      </div>
      
      <div className="flex items-center space-x-4">
        <button 
          className="hidden sm:block py-2 px-6 font-normal rounded-md text-white border-none hover:opacity-90 transition-all relative overflow-hidden"
        >
          <div 
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(78deg, #E63F42 0%, #D33952 40%, #B2306D 90%, #852492 130%)',
              zIndex: 0
            }}
          />
          <span className="relative z-10">
            Faça o upgrade do seu plano
          </span>
        </button>
        
        <button className="p-2 rounded-full hover:bg-blue-900">
          <HelpCircle className="w-5 h-5 text-white" />
        </button>
        
        <button className="p-2 rounded-full hover:bg-blue-900 relative">
          <Bell className="w-5 h-5 text-white" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        <div className="flex items-center">
          <div className="hidden md:block mr-2 text-white text-sm">
            {user?.name?.split(' ')[0]}
          </div>
          <button 
            onClick={logout} 
            className="p-2 rounded-full hover:bg-blue-900 text-white flex items-center justify-center"
            aria-label="Sair"
            title="Sair"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
