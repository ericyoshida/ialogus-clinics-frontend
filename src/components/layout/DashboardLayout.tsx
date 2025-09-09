import { ConversationProvider } from '@/contexts/ConversationContext'
import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

export default function DashboardLayout() {
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const location = useLocation();
  
  // Check if current route is the flow editor
  const isFlowEditor = location.pathname.includes('/flow-editor');
  
  // Fechar a sidebar mobile quando clicar fora ou quando a tela for redimensionada para desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setShowMobileSidebar(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  const toggleMobileSidebar = () => {
    setShowMobileSidebar(!showMobileSidebar);
  };

  return (
    <ConversationProvider>
      <div className="flex flex-col h-screen">
        <Header onToggleMobileSidebar={toggleMobileSidebar} />
        
        <div className="flex flex-1 overflow-hidden relative">
          {/* Sidebar para desktop (embutida no layout) */}
          <div className="hidden md:block">
            <Sidebar />
          </div>
          
          {/* Sidebar para mobile (overlay) */}
          {showMobileSidebar && (
            <>
              <div 
                className="fixed inset-0 bg-black/50 z-20 md:hidden"
                onClick={toggleMobileSidebar}
                aria-hidden="true"
              />
              <div className="fixed left-0 top-16 bottom-0 z-30 md:hidden">
                <Sidebar mobile onCloseMobile={toggleMobileSidebar} />
              </div>
            </>
          )}
          
          <main className={`flex-1 overflow-y-auto bg-[#f1f1f1] ${isFlowEditor ? '' : 'p-4 md:p-6 lg:p-8'}`}>
            <Outlet />
          </main>
        </div>
      </div>
    </ConversationProvider>
  );
}
