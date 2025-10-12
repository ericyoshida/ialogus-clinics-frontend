import { useAuth } from '@/contexts/AuthContext'
import { useClinics } from '@/hooks/use-clinics'
import { cn } from '@/lib/utils'
import { Clinic } from '@/services/clinics'
import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

// Adicionando interface estendida para incluir clinicId
interface ClinicWithClinicId extends Clinic {
  clinicId?: string;
}

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  to: string;
  isActive?: boolean;
  isCollapsed?: boolean;
  mobile?: boolean;
}

const SidebarItem = ({ icon, label, to, isActive, isCollapsed, mobile }: SidebarItemProps) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <Link 
      to={to}
      className={cn(
        "flex items-center py-0.5 transition-all relative rounded-md",
        isCollapsed ? "px-2 justify-center" : (mobile ? "px-3" : "px-6"),
        isActive 
          ? "text-[#F15A24]" 
          : "text-gray-500 hover:text-gray-700"
      )}
      title={isCollapsed ? label : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative w-full overflow-hidden rounded-md">
        {(isHovered || isActive) && !isCollapsed && (
          <div 
            className="absolute inset-y-0 inset-x-0"
            style={{
              background: 'linear-gradient(90deg, rgba(241,241,241,0) 0%, #F1F1F1 100%)',
              zIndex: 0
            }}
          />
        )}
        
        <div className={cn(
          "flex items-center z-10 px-1.5 py-1.5", 
          isCollapsed ? "justify-center" : ""
        )}>
          <div className={cn(
            "flex items-center justify-center", 
            isCollapsed ? "w-auto" : (mobile ? "w-4 mr-2" : "w-5 mr-3"),
            (isHovered || isActive) ? "text-[#F15A24]" : ""
          )}>
            {isCollapsed ? 
              React.cloneElement(icon as React.ReactElement, { 
                className: cn((icon as React.ReactElement).props.className || "", "w-5 h-5") 
              }) : 
              icon
            }
          </div>
          {!isCollapsed && 
            <span 
              className={cn(
                "z-10 text-base line-clamp-2", 
                isActive ? "font-bold" : "font-medium"
              )}
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {label}
            </span>
          }
        </div>

        {(isActive || isHovered) && !isCollapsed && (
          <div 
            className="absolute inset-x-0 bottom-0"
            style={{ zIndex: 1 }}
          >
            <div 
              className={cn(
                'w-full transition-all duration-200', 
                isHovered || isActive
                  ? 'h-0.5' 
                  : 'h-0.5'
              )}
              style={{
                background: 'linear-gradient(90deg, #F6921E 14%, #EE413D 45%, #E63F42 50%, #D33952 57%, #B2306D 66%, #852492 76%, #4B14C1 87%, #0501FA 99%, #0000FF 100%)'
              }}
            />
          </div>
        )}
      </div>
    </Link>
  );
}

interface SidebarSectionProps {
  title: string;
  children: React.ReactNode;
  isCollapsed?: boolean;
  mobile?: boolean;
}

const SidebarSection = ({ title, children, isCollapsed, mobile }: SidebarSectionProps) => {
  return (
    <div className="mb-1.5">
      {!isCollapsed && (
        <h3 className={cn(
          "text-[#0a0070] font-bold text-base mb-0.5",
          mobile ? "px-3" : "px-6"
        )}>
          {title}
        </h3>
      )}
      <div className="space-y-0">
        {children}
      </div>
    </div>
  );
}

interface ClinicItemProps {
  name: string;
  isActive?: boolean;
  onClick: () => void;
  svgPath?: string;
  index: number;
  isCollapsed?: boolean;
  mobile?: boolean;
}

const ClinicItem = ({ name, isActive, onClick, svgPath, index, isCollapsed, mobile }: ClinicItemProps) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Determina o caminho do SVG com base no índice (ciclo de 1-2-3)
  const getSvgPath = () => {
    const svgIndex = (index % 3) + 1;
    return `/images/ialogus-clinic-${svgIndex}.svg`;
  };

  const path = svgPath || getSvgPath();

  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center py-0.5 w-full text-left transition-all relative rounded-md",
        isCollapsed ? "px-2 justify-center" : (mobile ? "px-3" : "px-6"),
        isActive ? "text-[#F15A24]" : "text-gray-500 hover:text-gray-700"
      )}
      title={isCollapsed ? name : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative w-full overflow-hidden rounded-md">
        {isHovered && !isActive && !isCollapsed && (
          <div 
            className="absolute inset-y-0 inset-x-0"
            style={{
              background: 'linear-gradient(90deg, rgba(241,241,241,0) 0%, #F1F1F1 100%)',
              zIndex: 0
            }}
          />
        )}
        
        <div className={cn(
          "flex items-center z-10 px-1.5 py-1.5", 
          isCollapsed ? "justify-center" : ""
        )}>
          <div 
            className={cn(
              "flex items-center justify-center",
              isCollapsed ? "w-6 h-6" : (mobile ? "w-4 h-4 mr-2" : "w-5 h-5 mr-3")
            )}
            style={{
              position: 'relative',
              minWidth: isCollapsed ? '24px' : (mobile ? '16px' : '20px'),
              minHeight: isCollapsed ? '24px' : (mobile ? '16px' : '20px')
            }}
          >
            {isActive ? (
              <div 
                style={{
                  position: 'absolute',
                  top: '0',
                  left: '0',
                  width: '100%',
                  height: '100%',
                  backgroundImage: `url(${path})`,
                  backgroundSize: 'contain',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  transform: 'scale(1.1)',
                  filter: 'drop-shadow(0 0 1px rgba(0,0,0,0.2))'
                }}
              />
            ) : (
              <div 
                style={{
                  position: 'absolute',
                  top: '0',
                  left: '0',
                  width: '100%',
                  height: '100%',
                  backgroundImage: `url(${path})`,
                  backgroundSize: 'contain',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  opacity: 0.5,
                  filter: isHovered ? 'grayscale(0)' : 'grayscale(100%)',
                  transition: 'filter 0.2s ease'
                }}
              />
            )}
          </div>
          {!isCollapsed && 
            <span 
              className={cn(
                "z-10 text-base line-clamp-2", 
                isActive ? "font-bold" : "font-medium"
              )}
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {name}
            </span>
          }
        </div>
      </div>
    </button>
  );
}

interface SidebarProps {
  mobile?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ mobile, onCloseMobile }: SidebarProps) {
  const { user } = useAuth();
  const { clinics, loading, error } = useClinics();
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;
  const [selectedClinic, setSelectedClinic] = useState<string | null>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Debug do usuário
  useEffect(() => {
    console.log('=== SIDEBAR DEBUG ===')
    console.log('Sidebar - Verificando usuário:', JSON.stringify(user, null, 2))
    console.log('Sidebar - User is null?:', user === null)
    console.log('Sidebar - User is undefined?:', user === undefined)
    console.log('Sidebar - Email do usuário:', user?.email)
    console.log('Sidebar - Nome do usuário:', user?.name)
    console.log('Sidebar - ID do usuário:', user?.id)
    console.log('Sidebar - ID esperado:', '7fe8730b-a261-4c3f-8348-b8fddb9caef7')
    console.log('Sidebar - Deve mostrar Admin?', user?.id === '7fe8730b-a261-4c3f-8348-b8fddb9caef7')
    console.log('=== FIM SIDEBAR DEBUG ===')
  }, [user])
  
  // Usar o hook useClinics para buscar as clínicas do usuário
  
  // Função para extrair o ID da clínica da URL
  const extractClinicIdFromUrl = (path: string) => {
    // Verifica se a URL contém /clinic/ que indica uma página de clínica
    if (path.includes('/dashboard/clinic/')) {
      // Extrai o segmento após /clinic/
      const match = path.match(/\/dashboard\/clinic\/([^/]+)/);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  };
  
  useEffect(() => {
    // Remover seleção automática da primeira clínica
    // Agora nenhuma clínica será selecionada por padrão
    
    // Verificar o tamanho da tela e colapsar automaticamente em telas menores
    // Não colapsar automaticamente se for a versão mobile overlay
    const handleResize = () => {
      if (!mobile) {
        setIsCollapsed(window.innerWidth < 1024);
      }
    };
    
    // Definir o estado inicial
    handleResize();
    
    // Adicionar listener para redimensionamento
    window.addEventListener('resize', handleResize);
    
    // Limpar listener ao desmontar
    return () => window.removeEventListener('resize', handleResize);
  }, [mobile]);

  // Se for mobile, nunca colapsar a sidebar (sempre mostrar textos)
  useEffect(() => {
    if (mobile) {
      setIsCollapsed(false);
    }
  }, [mobile]);

  // Atualizar a clínica selecionada com base na URL
  useEffect(() => {
    // Debug das clínicas carregadas
    if (clinics.length > 0) {
      console.log("Clínicas disponíveis:", clinics.map(c => ({ 
        id: c.id, 
        name: c.name,
        clinicId: (c as ClinicWithClinicId).clinicId || 'não disponível'
      })));
    }
    
    // Tenta extrair o ID da clínica da URL atual
    const clinicIdFromUrl = extractClinicIdFromUrl(path);
    if (clinicIdFromUrl) {
      console.log("ID de clínica encontrado na URL:", clinicIdFromUrl);
    }
    
    // Se encontrou um ID na URL, usa ele
    if (clinicIdFromUrl) {
      // Verifica se o ID corresponde a uma clínica existente
      const clinicExists = clinics.some(c => c.id === clinicIdFromUrl);
      
      if (clinicExists) {
        setSelectedClinic(clinicIdFromUrl);
        // Também atualiza o localStorage para manter consistência
        localStorage.setItem('selectedClinicId', clinicIdFromUrl);
      } else {
        console.log(`Clínica com ID ${clinicIdFromUrl} não encontrada nos dados atuais`);
      }
    } else {
      // Se não houver clínica na URL, verifica o localStorage
      const savedClinicId = localStorage.getItem('selectedClinicId');
      if (savedClinicId && !selectedClinic) {
        // Verifica se a clínica ainda existe
        const clinicExists = clinics.some(c => c.id === savedClinicId);
        if (clinicExists) {
          setSelectedClinic(savedClinicId);
        } else {
          console.log(`Clínica salva com ID ${savedClinicId} não encontrada nos dados atuais`);
        }
      }
    }
  }, [path, clinics, selectedClinic]);

  // Verificar se a clínica com o ID selecionado existe nos dados atuais
  useEffect(() => {
    if (clinics.length > 0 && selectedClinic) {
      const clinicExists = clinics.some(c => c.id === selectedClinic);
      
      if (!clinicExists) {
        // Se a clínica selecionada não existe mais, desselecionar
        setSelectedClinic(null);
        localStorage.removeItem('selectedClinicId');
      }
    }
  }, [clinics, selectedClinic]);

  const getActiveIcon = (path: string, Icon: React.ReactElement) => {
    const isActive = location.pathname.includes(path);
    return React.cloneElement(Icon, {
      className: cn(isCollapsed ? "w-5 h-5" : "w-4 h-4", isActive ? "text-ialogus-orange" : "text-gray-500")
    });
  };

  const handleClinicSelect = (clinic: Clinic) => {
    // Verificar se a clínica tem um ID válido
    if (!clinic || !clinic.id) {
      console.error('Tentativa de selecionar clínica sem ID:', clinic);
      return;
    }
    
    // Salvar o ID da clínica selecionada no localStorage
    localStorage.setItem('selectedClinicId', clinic.id);
    
    const currentPath = location.pathname;
    const newPath = `/dashboard/clinic/${clinic.id}`;
    
    // Log para depuração
    console.log('Navegando para clínica:', {
      id: clinic.id,
      clinicId: (clinic as ClinicWithClinicId).clinicId || 'não disponível',
      name: clinic.name,
      newPath
    });
    
    // Atualizar estado local
    setSelectedClinic(clinic.id);
    
    // Se for mobile, fechar a sidebar após selecionar uma clínica
    if (mobile && onCloseMobile) {
      onCloseMobile();
    }
    
    // Se estiver em uma página de clínica e apenas mudando a clínica
    if (currentPath.includes('/dashboard/clinic/')) {
      // Forçar navegação mesmo que pareça ser a mesma rota (diferente clínica)
      navigate('/', { replace: true }); // Primeiro navega para outra página para forçar remontagem
      setTimeout(() => {
        navigate(newPath); // Depois navega para a nova página da clínica
      }, 0);
    } else {
      // Navegação normal para a página da clínica
      navigate(newPath);
    }
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };
  
  // Em dispositivos móveis, a largura deve ser um pouco menor ou maior dependendo do conteúdo
  const sidebarWidth = mobile ? "w-56" : (isCollapsed ? "w-14" : "w-56");

  return (
    <div 
      className={cn(
        "h-full flex flex-col border-r overflow-hidden transition-all duration-300",
        sidebarWidth,
        mobile && "shadow-lg"
      )} 
      style={{
        background: 'linear-gradient(30deg, #F1F1F1, #DDDEDF)'
      }}
    >
      <div className={cn(
        "flex items-center p-1.5",
        isCollapsed ? "justify-center" : "justify-between"
      )}>
        {mobile && (
          <span className="text-xs font-medium text-gray-500 pl-2">Menu</span>
        )}
        <button 
          onClick={mobile && onCloseMobile ? onCloseMobile : toggleSidebar}
          className={cn(
            "text-gray-500 hover:text-gray-700 p-1 rounded-full transition-colors flex items-center",
            isCollapsed ? "justify-center" : (mobile ? "justify-start px-2" : "justify-start px-5")
          )}
          title={isCollapsed ? "Expandir menu" : "Colapsar menu"}
        >
          {mobile ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : isCollapsed ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              <span className="font-medium text-xs">Fechar</span>
            </>
          )}
        </button>
      </div>
      
      <nav className="flex-1 pt-1.5 overflow-y-auto">
        <SidebarSection title="Home" isCollapsed={isCollapsed} mobile={mobile}>
          <SidebarItem 
            icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={path === '/dashboard' ? 2.5 : 1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>}
            label="Home" 
            to="/dashboard" 
            isActive={path === '/dashboard'}
            isCollapsed={isCollapsed}
            mobile={mobile}
          />
        </SidebarSection>

        {/* Admin Section - Only show for admin users */}
        {user?.id === '7fe8730b-a261-4c3f-8348-b8fddb9caef7' && (
          <SidebarSection title="Admin" isCollapsed={isCollapsed} mobile={mobile}>
            <div 
              onMouseEnter={() => setHoveredItem('llm-cost-tracking')} 
              onMouseLeave={() => setHoveredItem(null)}
            >
              <SidebarItem 
                icon={<svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  strokeWidth={path.includes('/admin/llm-cost-tracking') ? 2.5 : 1.5} 
                  stroke="currentColor" 
                  className={mobile ? "w-4 h-4" : "w-5 h-5"}
                  style={{
                    filter: path.includes('/admin/llm-cost-tracking') 
                      ? 'invert(48%) sepia(93%) saturate(2467%) hue-rotate(346deg) brightness(97%) contrast(95%) drop-shadow(0 0 1px rgba(0,0,0,0.5))' 
                      : hoveredItem === 'llm-cost-tracking' 
                        ? 'invert(48%) sepia(93%) saturate(2467%) hue-rotate(346deg) brightness(97%) contrast(95%)' 
                        : undefined,
                    transform: path.includes('/admin/llm-cost-tracking') ? 'scale(1.1)' : 'scale(1)'
                  }}
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    d="M2.25 18L9 11.25l4.306 4.306a11.95 11.95 0 010 5.814c-5.077 0-9.196-4.119-9.196-9.196A9.025 9.025 0 016.75 12l-4.5 6z" 
                  />
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    d="M11.25 4.533A9.707 9.707 0 006 3a9.735 9.735 0 00-3.25.555.75.75 0 00-.5.707v14.25a.75.75 0 001 .707A8.237 8.237 0 016 18.75c1.995 0 3.823.707 5.25 1.886V4.533z" 
                  />
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    d="M12.75 20.25c1.427-1.179 3.255-1.886 5.25-1.886 1.07 0 2.062.169 3 .482a.75.75 0 001-.707V4.533a.75.75 0 00-.5-.707A9.735 9.735 0 0018 3a9.707 9.707 0 00-5.25 1.533v15.714z" 
                  />
                </svg>}
                label="LLM Cost Tracking" 
                to="/dashboard/admin/llm-cost-tracking" 
                isActive={path.includes('/admin/llm-cost-tracking')}
                isCollapsed={isCollapsed}
                mobile={mobile}
              />
            </div>
          </SidebarSection>
        )}

        <SidebarSection title="Clínicas" isCollapsed={isCollapsed} mobile={mobile}>
          {loading ? (
            // Mostrar indicador de carregamento quando estiver buscando as clínicas
            <div className={cn(
              "flex items-center py-2",
              isCollapsed ? "justify-center px-2" : (mobile ? "px-3" : "px-6")
            )}>
              <div className="animate-pulse w-5 h-5 bg-gray-200 rounded-full mr-2"></div>
              {!isCollapsed && <div className="animate-pulse h-4 bg-gray-200 rounded w-24"></div>}
            </div>
          ) : error ? (
            // Mostrar mensagem de erro se houver falha ao buscar clínicas
            <div className={cn(
              "text-red-500 text-sm",
              isCollapsed ? "text-center px-2" : (mobile ? "px-3" : "px-6")
            )}>
              {!isCollapsed && error}
              {isCollapsed && "Erro"}
            </div>
          ) : clinics.length === 0 ? (
            // Mensagem quando não há clínicas
            <div className={cn(
              "text-gray-500 text-sm",
              isCollapsed ? "text-center px-2" : (mobile ? "px-3" : "px-6")
            )}>
              {!isCollapsed && "Nenhuma clínica encontrada"}
              {isCollapsed && "0"}
            </div>
          ) : (
            // Listar as clínicas do usuário
            clinics
              .filter(clinic => Boolean(clinic.id)) // Garante que só clínicas com ID são mostradas
              .map((clinic, index) => (
                <ClinicItem 
                  key={clinic.id}
                  name={clinic.name} 
                  isActive={selectedClinic === clinic.id}
                  onClick={() => handleClinicSelect(clinic)}
                  index={index}
                  isCollapsed={isCollapsed}
                  mobile={mobile}
                />
              ))
          )}
        </SidebarSection>

        {selectedClinic && (
          <SidebarSection title="Gestão" isCollapsed={isCollapsed} mobile={mobile}>
            <div 
              onMouseEnter={() => setHoveredItem('agents')} 
              onMouseLeave={() => setHoveredItem(null)}
            >
              <SidebarItem 
                icon={<img 
                  src="/images/icons/agent.svg" 
                  alt="Agentes"
                  className={mobile ? "w-4 h-4" : "w-5 h-5"} 
                  style={{
                    filter: path.includes('/agents') 
                      ? 'invert(48%) sepia(93%) saturate(2467%) hue-rotate(346deg) brightness(97%) contrast(95%) drop-shadow(0 0 1px rgba(0,0,0,0.5))' 
                      : hoveredItem === 'agents' 
                        ? 'invert(48%) sepia(93%) saturate(2467%) hue-rotate(346deg) brightness(97%) contrast(95%)' 
                        : undefined,
                    transform: path.includes('/agents') ? 'scale(1.1)' : 'scale(1)'
                  }}
                />}
                label="Agentes" 
                to={selectedClinic ? `/dashboard/clinic/${selectedClinic}/agents` : "/dashboard/agents"} 
                isActive={path.includes('/agents')}
                isCollapsed={isCollapsed}
                mobile={mobile}
              />
            </div>
            <div 
              onMouseEnter={() => setHoveredItem('conversations')} 
              onMouseLeave={() => setHoveredItem(null)}
            >
              <SidebarItem 
                icon={<img 
                  src="/images/icons/chat.svg" 
                  alt="Conversas"
                  className={mobile ? "w-4 h-4" : "w-5 h-5"} 
                  style={{
                    filter: path.includes('/conversations') 
                      ? 'invert(48%) sepia(93%) saturate(2467%) hue-rotate(346deg) brightness(97%) contrast(95%) drop-shadow(0 0 1px rgba(0,0,0,0.5))' 
                      : hoveredItem === 'conversations' 
                        ? 'invert(48%) sepia(93%) saturate(2467%) hue-rotate(346deg) brightness(97%) contrast(95%)' 
                        : undefined,
                    transform: path.includes('/conversations') ? 'scale(1.1)' : 'scale(1)'
                  }}
                />}
                label="Conversas" 
                to={selectedClinic ? `/dashboard/clinic/${selectedClinic}/conversations` : "/dashboard/conversations"} 
                isActive={path.includes('/conversations')}
                isCollapsed={isCollapsed}
                mobile={mobile}
              />
            </div>
            <div 
              onMouseEnter={() => setHoveredItem('contacts')} 
              onMouseLeave={() => setHoveredItem(null)}
            >
              <SidebarItem 
                icon={<img 
                  src="/images/icons/contact.svg" 
                  alt="Contatos"
                  className={mobile ? "w-4 h-4" : "w-5 h-5"} 
                  style={{
                    filter: (path.includes('/clinic/') && path.includes('/contacts')) 
                      ? 'invert(48%) sepia(93%) saturate(2467%) hue-rotate(346deg) brightness(97%) contrast(95%) drop-shadow(0 0 1px rgba(0,0,0,0.5))' 
                      : hoveredItem === 'contacts' 
                        ? 'invert(48%) sepia(93%) saturate(2467%) hue-rotate(346deg) brightness(97%) contrast(95%)' 
                        : undefined,
                    transform: (path.includes('/clinic/') && path.includes('/contacts')) ? 'scale(1.1)' : 'scale(1)'
                  }}
                />}
                label="Contatos" 
                to={selectedClinic ? `/dashboard/clinic/${selectedClinic}/contacts` : "/dashboard/contacts"} 
                isActive={path.includes('/clinic/') && path.includes('/contacts')}
                isCollapsed={isCollapsed}
                mobile={mobile}
              />
            </div>
            <div 
              onMouseEnter={() => setHoveredItem('messages')} 
              onMouseLeave={() => setHoveredItem(null)}
            >
              <SidebarItem 
                icon={<svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  strokeWidth={path.includes('/messages') ? 2.5 : 1.5} 
                  stroke="currentColor" 
                  className={mobile ? "w-4 h-4" : "w-5 h-5"}
                  style={{
                    filter: path.includes('/messages') 
                      ? 'invert(48%) sepia(93%) saturate(2467%) hue-rotate(346deg) brightness(97%) contrast(95%) drop-shadow(0 0 1px rgba(0,0,0,0.5))' 
                      : hoveredItem === 'messages' 
                        ? 'invert(48%) sepia(93%) saturate(2467%) hue-rotate(346deg) brightness(97%) contrast(95%)' 
                        : undefined,
                    transform: path.includes('/messages') ? 'scale(1.1)' : 'scale(1)'
                  }}
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L8.32 9.424a2.25 2.25 0 01-1.07-1.916V6.75" 
                  />
                </svg>}
                label="Envio em Massa" 
                to={selectedClinic ? `/dashboard/clinic/${selectedClinic}/messages/bulk/channel` : "/dashboard/messages/bulk/channel"} 
                isActive={path.includes('/messages')}
                isCollapsed={isCollapsed}
                mobile={mobile}
              />
            </div>
            <div 
              onMouseEnter={() => setHoveredItem('calendar')} 
              onMouseLeave={() => setHoveredItem(null)}
            >
              <SidebarItem 
                icon={<img 
                  src="/images/icons/calendar.svg" 
                  alt="Calendários"
                  className="w-4 h-4" 
                  style={{
                    filter: path.includes('/calendar') 
                      ? 'invert(48%) sepia(93%) saturate(2467%) hue-rotate(346deg) brightness(97%) contrast(95%) drop-shadow(0 0 1px rgba(0,0,0,0.5))' 
                      : hoveredItem === 'calendar' 
                        ? 'invert(48%) sepia(93%) saturate(2467%) hue-rotate(346deg) brightness(97%) contrast(95%)' 
                        : undefined,
                    transform: path.includes('/calendar') ? 'scale(1.1)' : 'scale(1)'
                  }}
                />}
                label="Calendários" 
                to={selectedClinic ? `/dashboard/clinic/${selectedClinic}/calendar` : "/dashboard/calendar"} 
                isActive={path.includes('/calendar')}
                isCollapsed={isCollapsed}
                mobile={mobile}
              />
            </div>
          </SidebarSection>
        )}

        {/* Seção de Configurações - REMOVED as requested */}
      </nav>
      
      <div className="border-t" style={{
        background: 'linear-gradient(135deg, #DDDEDF 0%, #F1F1F1 30%)'
      }}>
        <button 
          onClick={() => navigate('/dashboard/profile')}
          className={cn(
            "py-3 flex items-center w-full hover:bg-gray-100 transition-colors cursor-pointer", 
            isCollapsed ? "px-2 justify-center" : (mobile ? "px-3" : "px-6")
          )}
        >
          <div className={cn(
            "bg-[#39b54a] rounded-full overflow-hidden flex items-center justify-center flex-shrink-0",
            isCollapsed ? "w-9 h-9" : "w-8 h-8"
          )}>
            <span className={cn(
              "text-white font-medium",
              isCollapsed ? "text-base" : "text-sm"
            )}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </span>
          </div>
          {!isCollapsed && (
            <div className="ml-3 min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-700 truncate">
                {user?.name ? user.name.split(' ')[0] : 'Usuário'}
              </p>
            </div>
          )}
        </button>
      </div>
    </div>
  );
}
