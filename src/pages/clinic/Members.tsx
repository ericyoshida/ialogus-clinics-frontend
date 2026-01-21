import { WorkingHoursSelector } from '@/components/calendar/WorkingHoursSelector';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import { useClinics } from '@/hooks/use-clinics';
import { toast } from '@/hooks/use-toast';
import { api } from '@/services';
import { WorkingHours } from '@/services/calendar';
import {
    ArrowLeftIcon,
    CalendarDaysIcon,
    EllipsisVerticalIcon,
    MagnifyingGlassIcon,
    PencilIcon,
    TrashIcon,
    UserIcon,
    UserPlusIcon
} from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

interface Member {
  membershipId: string;
  userId: string;
  user: {
    name: string;
    email: string;
  };
  roles: string[];
  status: 'active' | 'pending';
  createdAt: string;
  updatedAt?: string;
}

interface CalendarData {
  calendarId: string;
  membershipId: string;
}

const DEFAULT_WORKING_HOURS: WorkingHours[] = [
  { weekday: 1, startTime: '08:00', endTime: '12:00' },
  { weekday: 1, startTime: '13:00', endTime: '17:00' },
  { weekday: 2, startTime: '08:00', endTime: '12:00' },
  { weekday: 2, startTime: '13:00', endTime: '17:00' },
  { weekday: 3, startTime: '08:00', endTime: '12:00' },
  { weekday: 3, startTime: '13:00', endTime: '17:00' },
  { weekday: 4, startTime: '08:00', endTime: '12:00' },
  { weekday: 4, startTime: '13:00', endTime: '17:00' },
  { weekday: 5, startTime: '08:00', endTime: '12:00' },
  { weekday: 5, startTime: '13:00', endTime: '17:00' },
];

export default function Members() {
  const { clinicId } = useParams<{ clinicId: string }>();
  const navigate = useNavigate();
  const { clinics } = useClinics();
  const { user: currentUser } = useAuth();
  
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  
  // Estados para adicionar membro
  const [emailToInvite, setEmailToInvite] = useState('');
  const [roleToInvite, setRoleToInvite] = useState('SECRETARIA');
  const [isInviting, setIsInviting] = useState(false);

  // Estados para editar calendário
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [selectedMemberForCalendar, setSelectedMemberForCalendar] = useState<Member | null>(null);
  const [workingHours, setWorkingHours] = useState<WorkingHours[]>(DEFAULT_WORKING_HOURS);
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);
  const [isSavingCalendar, setIsSavingCalendar] = useState(false);
  
  const clinic = clinics.find(c => c.id === clinicId);
  
  const roleOptions = [
    { value: 'ADMIN', label: 'Administrador' },
    { value: 'DENTISTA', label: 'Doutor' },
    { value: 'SECRETARIA', label: 'Secretária' }
  ];
  
  // Buscar membros da clínica
  const fetchMembers = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/clinics/${clinicId}/memberships`);
      setMembers(response.data.memberships);
      setFilteredMembers(response.data.memberships);
    } catch (error) {
      console.error('Erro ao buscar membros:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os membros.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (clinicId) {
      fetchMembers();
    }
  }, [clinicId]);
  
  // Filtrar membros por pesquisa
  useEffect(() => {
    const filtered = members.filter(member =>
      member.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.roles.some(role => role.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredMembers(filtered);
  }, [searchTerm, members]);
  
  // Adicionar novo membro por email
  const handleAddMember = async () => {
    if (!emailToInvite || !emailToInvite.includes('@')) {
      toast({
        title: 'Erro',
        description: 'Por favor, insira um email válido.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsInviting(true);
    try {
      const response = await api.post(`/clinics/${clinicId}/memberships/invite-by-email`, {
        email: emailToInvite.toLowerCase().trim(),
        role: roleToInvite,
      });

      const isNewUser = response.data?.isNewUser;
      toast({
        title: 'Sucesso',
        description: isNewUser
          ? 'Convite enviado! Um email foi enviado para o usuário criar sua conta.'
          : 'Convite enviado! O usuário receberá um email para aceitar o convite.',
      });

      setIsAddModalOpen(false);
      setEmailToInvite('');
      setRoleToInvite('SECRETARIA');
      fetchMembers();
    } catch (error: any) {
      console.error('Erro ao convidar membro:', error);
      const errorMessage = error.response?.data?.message || 'Não foi possível enviar o convite.';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsInviting(false);
    }
  };
  
  // Editar cargo do membro
  const handleEditMember = async () => {
    if (!selectedMember) return;
    
    try {
      await api.put(`/memberships/${selectedMember.membershipId}`, {
        roles: selectedRoles,
      });
      
      toast({
        title: 'Sucesso',
        description: 'Cargo atualizado com sucesso.',
      });
      
      setIsEditModalOpen(false);
      setSelectedMember(null);
      setSelectedRoles([]);
      fetchMembers();
    } catch (error) {
      console.error('Erro ao editar membro:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o cargo.',
        variant: 'destructive',
      });
    }
  };
  
  // Excluir membro
  const handleDeleteMember = async () => {
    if (!selectedMember) return;
    
    try {
      await api.delete(`/memberships/${selectedMember.membershipId}`);
      
      toast({
        title: 'Sucesso',
        description: 'Membro removido com sucesso.',
      });
      
      setIsDeleteModalOpen(false);
      setSelectedMember(null);
      fetchMembers();
    } catch (error) {
      console.error('Erro ao remover membro:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o membro.',
        variant: 'destructive',
      });
    }
  };
  
  const openEditModal = (member: Member) => {
    setSelectedMember(member);
    setSelectedRoles([...member.roles]);
    setIsEditModalOpen(true);
  };
  
  const openDeleteModal = (member: Member) => {
    setSelectedMember(member);
    setIsDeleteModalOpen(true);
  };
  
  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedMember(null);
    setSelectedRoles([]);
  };
  
  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedMember(null);
  };
  
  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setEmailToInvite('');
    setRoleToInvite('SECRETARIA');
  };

  // Funções para gerenciar calendário
  const hasCalendarRole = (member: Member) => {
    return member.roles.some(role => ['ADMIN', 'DENTISTA'].includes(role));
  };

  const openCalendarModal = async (member: Member) => {
    setSelectedMemberForCalendar(member);
    setIsCalendarModalOpen(true);
    setIsLoadingCalendar(true);

    try {
      // Buscar calendário do membro
      const response = await api.get(`/memberships/${member.membershipId}/calendars`);
      const calendar = response.data.calendar;

      setCalendarData({
        calendarId: calendar.calendarId,
        membershipId: calendar.membershipId,
      });

      // Converter working hours do backend para o formato esperado pelo WorkingHoursSelector
      if (calendar.workingHours && Array.isArray(calendar.workingHours)) {
        const formattedWorkingHours: WorkingHours[] = calendar.workingHours.map(
          (wh: { weekday: number; startTime: string; endTime: string }) => ({
            weekday: wh.weekday,
            startTime: wh.startTime,
            endTime: wh.endTime,
          })
        );
        setWorkingHours(formattedWorkingHours);
      } else {
        setWorkingHours([]);
      }
    } catch (error: any) {
      console.error('Erro ao buscar calendário:', error);
      if (error.response?.status === 404) {
        toast({
          title: 'Calendário não encontrado',
          description: 'Este membro ainda não possui um calendário configurado.',
          variant: 'destructive',
        });
        setIsCalendarModalOpen(false);
      } else {
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar o calendário.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoadingCalendar(false);
    }
  };

  const closeCalendarModal = () => {
    setIsCalendarModalOpen(false);
    setSelectedMemberForCalendar(null);
    setCalendarData(null);
    setWorkingHours(DEFAULT_WORKING_HOURS);
  };

  const handleSaveWorkingHours = async () => {
    if (!calendarData) return;

    setIsSavingCalendar(true);
    try {
      // Agrupar working hours por dia da semana
      const workingHoursByDay: Record<number, { startTime: string; endTime: string }[]> = {};

      // Inicializar todos os dias com array vazio
      for (let i = 0; i <= 6; i++) {
        workingHoursByDay[i] = [];
      }

      // Preencher com os horários selecionados
      workingHours.forEach(wh => {
        workingHoursByDay[wh.weekday].push({
          startTime: wh.startTime,
          endTime: wh.endTime,
        });
      });

      // Salvar cada dia
      for (const [weekdayStr, dayHours] of Object.entries(workingHoursByDay)) {
        const weekday = parseInt(weekdayStr);
        await api.put(`/calendars/${calendarData.calendarId}/working-hours`, {
          weekday,
          workingHours: dayHours,
        });
      }

      toast({
        title: 'Sucesso',
        description: 'Horários de trabalho atualizados com sucesso.',
      });

      closeCalendarModal();
    } catch (error) {
      console.error('Erro ao salvar horários:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar os horários de trabalho.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingCalendar(false);
    }
  };
  
  // Verificar se o usuário pode editar/excluir o membro
  const canEditMember = (member: Member) => {
    return member.userId !== currentUser?.id;
  };
  
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'destructive';
      case 'DENTISTA':
        return 'default';
      case 'SECRETARIA':
        return 'secondary';
      default:
        return 'secondary';
    }
  };
  
  const getRoleLabel = (role: string) => {
    const option = roleOptions.find(opt => opt.value === role);
    return option ? option.label : role;
  };

  const getStatusBadgeVariant = (status: string) => {
    return status === 'active' ? 'default' : 'secondary';
  };

  const getStatusLabel = (status: string) => {
    return status === 'active' ? 'Ativo' : 'Pendente';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/dashboard/clinic/${clinicId}`)}
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">Membros da Clínica</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {clinic?.name || 'Carregando...'}
            </p>
          </div>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <UserPlusIcon className="h-4 w-4 mr-2" />
          Convidar Membro
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Gerenciar Membros</CardTitle>
          <CardDescription>
            Convide, edite ou remova membros da clínica
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar por nome, email ou cargo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Members Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Carregando membros...</p>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <UserIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? 'Nenhum membro encontrado' : 'Nenhum membro cadastrado'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data de Entrada</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member) => (
                  <TableRow key={member.membershipId}>
                    <TableCell className="font-medium">
                      {member.user.name}
                    </TableCell>
                    <TableCell>{member.user.email}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {member.roles.map((role) => (
                          <Badge
                            key={role}
                            variant={getRoleBadgeVariant(role) as any}
                          >
                            {getRoleLabel(role)}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getStatusBadgeVariant(member.status) as any}
                        className={member.status === 'active' ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'}
                      >
                        {getStatusLabel(member.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(member.createdAt).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Botão de calendário - aparece para todos com role ADMIN/DENTISTA ativos */}
                        {hasCalendarRole(member) && member.status === 'active' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openCalendarModal(member)}
                            title="Editar Calendário"
                          >
                            <CalendarDaysIcon className="h-4 w-4" />
                          </Button>
                        )}

                        {/* Menu de ações - só aparece para outros membros */}
                        {canEditMember(member) ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <EllipsisVerticalIcon className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditModal(member)}>
                                <PencilIcon className="h-4 w-4 mr-2" />
                                Editar Cargo
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => openDeleteModal(member)}
                                className="text-destructive"
                              >
                                <TrashIcon className="h-4 w-4 mr-2" />
                                Remover Membro
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <span className="text-sm text-muted-foreground px-2">Você</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Member Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={(open) => !open && closeAddModal()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convidar Novo Membro</DialogTitle>
            <DialogDescription>
              Digite o email e selecione o cargo do membro que deseja convidar para a clínica.
              Se a pessoa não tiver uma conta, ela receberá um convite para criar uma.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Email do Usuário</label>
              <Input
                type="email"
                placeholder="exemplo@email.com"
                value={emailToInvite}
                onChange={(e) => setEmailToInvite(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Cargo</label>
              <Select
                value={roleToInvite}
                onValueChange={(value) => setRoleToInvite(value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione um cargo" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeAddModal}>
              Cancelar
            </Button>
            <Button onClick={handleAddMember} disabled={isInviting}>
              {isInviting ? 'Enviando...' : 'Enviar Convite'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Member Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={(open) => !open && closeEditModal()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Cargo do Membro</DialogTitle>
            <DialogDescription>
              Altere o cargo de {selectedMember?.user.name}.
            </DialogDescription>
          </DialogHeader>
          
          <div>
            <label className="text-sm font-medium">Cargo</label>
            <Select 
              value={selectedRoles[0]} 
              onValueChange={(value) => setSelectedRoles([value])}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Selecione um cargo" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={closeEditModal}>
              Cancelar
            </Button>
            <Button onClick={handleEditMember}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Member Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={(open) => !open && closeDeleteModal()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover Membro</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover {selectedMember?.user.name} da clínica?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={closeDeleteModal}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteMember}>
              Remover Membro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Calendar Working Hours Modal */}
      <Dialog open={isCalendarModalOpen} onOpenChange={(open) => !open && closeCalendarModal()}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Horários de Trabalho</DialogTitle>
            <DialogDescription>
              Configure os horários de atendimento de {selectedMemberForCalendar?.user.name}.
              Clique e arraste para selecionar os horários disponíveis.
            </DialogDescription>
          </DialogHeader>

          {isLoadingCalendar ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Carregando calendário...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Botões de atalho */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setWorkingHours([
                      { weekday: 1, startTime: '09:00', endTime: '18:00' },
                      { weekday: 2, startTime: '09:00', endTime: '18:00' },
                      { weekday: 3, startTime: '09:00', endTime: '18:00' },
                      { weekday: 4, startTime: '09:00', endTime: '18:00' },
                      { weekday: 5, startTime: '09:00', endTime: '18:00' },
                    ]);
                  }}
                  className="px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50 transition-colors"
                >
                  Comercial (Seg-Sex 9h-18h)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setWorkingHours([
                      { weekday: 1, startTime: '08:00', endTime: '12:00' },
                      { weekday: 1, startTime: '13:00', endTime: '17:00' },
                      { weekday: 2, startTime: '08:00', endTime: '12:00' },
                      { weekday: 2, startTime: '13:00', endTime: '17:00' },
                      { weekday: 3, startTime: '08:00', endTime: '12:00' },
                      { weekday: 3, startTime: '13:00', endTime: '17:00' },
                      { weekday: 4, startTime: '08:00', endTime: '12:00' },
                      { weekday: 4, startTime: '13:00', endTime: '17:00' },
                      { weekday: 5, startTime: '08:00', endTime: '12:00' },
                      { weekday: 5, startTime: '13:00', endTime: '17:00' },
                    ]);
                  }}
                  className="px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50 transition-colors"
                >
                  CLT (Seg-Sex 8h-12h, 13h-17h)
                </button>
                <button
                  type="button"
                  onClick={() => setWorkingHours([])}
                  className="px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50 transition-colors ml-auto"
                >
                  Limpar tudo
                </button>
              </div>

              {/* Seletor visual de horários */}
              <WorkingHoursSelector
                value={workingHours}
                onChange={setWorkingHours}
              />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeCalendarModal}>
              Cancelar
            </Button>
            <Button onClick={handleSaveWorkingHours} disabled={isSavingCalendar || isLoadingCalendar}>
              {isSavingCalendar ? 'Salvando...' : 'Salvar Horários'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}