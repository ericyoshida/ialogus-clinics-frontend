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
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
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

interface WorkingHourSlot {
  startTime: string;
  endTime: string;
}

interface DayWorkingHours {
  enabled: boolean;
  slots: WorkingHourSlot[];
}

interface CalendarWithWorkingHours {
  calendarId: string;
  membershipId: string;
  workingHours: {
    weekday: number;
    startTime: string;
    endTime: string;
  }[];
}

const WEEKDAYS = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
];

const DEFAULT_WORKING_HOURS: Record<number, DayWorkingHours> = {
  0: { enabled: false, slots: [] },
  1: { enabled: true, slots: [{ startTime: '08:00', endTime: '12:00' }, { startTime: '13:00', endTime: '17:00' }] },
  2: { enabled: true, slots: [{ startTime: '08:00', endTime: '12:00' }, { startTime: '13:00', endTime: '17:00' }] },
  3: { enabled: true, slots: [{ startTime: '08:00', endTime: '12:00' }, { startTime: '13:00', endTime: '17:00' }] },
  4: { enabled: true, slots: [{ startTime: '08:00', endTime: '12:00' }, { startTime: '13:00', endTime: '17:00' }] },
  5: { enabled: true, slots: [{ startTime: '08:00', endTime: '12:00' }, { startTime: '13:00', endTime: '17:00' }] },
  6: { enabled: false, slots: [] },
};

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
  const [workingHours, setWorkingHours] = useState<Record<number, DayWorkingHours>>(DEFAULT_WORKING_HOURS);
  const [calendarData, setCalendarData] = useState<CalendarWithWorkingHours | null>(null);
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
        workingHours: calendar.workingHours || [],
      });

      // Converter working hours do backend para o formato do estado
      const newWorkingHours: Record<number, DayWorkingHours> = { ...DEFAULT_WORKING_HOURS };

      // Reset all days to disabled
      Object.keys(newWorkingHours).forEach(key => {
        newWorkingHours[parseInt(key)] = { enabled: false, slots: [] };
      });

      // Agrupar working hours por dia da semana
      if (calendar.workingHours && Array.isArray(calendar.workingHours)) {
        calendar.workingHours.forEach((wh: { weekday: number; startTime: string; endTime: string }) => {
          if (!newWorkingHours[wh.weekday]) {
            newWorkingHours[wh.weekday] = { enabled: true, slots: [] };
          } else {
            newWorkingHours[wh.weekday].enabled = true;
          }
          newWorkingHours[wh.weekday].slots.push({
            startTime: wh.startTime,
            endTime: wh.endTime,
          });
        });
      }

      setWorkingHours(newWorkingHours);
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

  const handleDayToggle = (weekday: number) => {
    setWorkingHours(prev => ({
      ...prev,
      [weekday]: {
        ...prev[weekday],
        enabled: !prev[weekday].enabled,
        slots: !prev[weekday].enabled ? [{ startTime: '08:00', endTime: '17:00' }] : prev[weekday].slots,
      },
    }));
  };

  const handleSlotChange = (weekday: number, slotIndex: number, field: 'startTime' | 'endTime', value: string) => {
    setWorkingHours(prev => ({
      ...prev,
      [weekday]: {
        ...prev[weekday],
        slots: prev[weekday].slots.map((slot, idx) =>
          idx === slotIndex ? { ...slot, [field]: value } : slot
        ),
      },
    }));
  };

  const addSlot = (weekday: number) => {
    setWorkingHours(prev => ({
      ...prev,
      [weekday]: {
        ...prev[weekday],
        slots: [...prev[weekday].slots, { startTime: '13:00', endTime: '17:00' }],
      },
    }));
  };

  const removeSlot = (weekday: number, slotIndex: number) => {
    setWorkingHours(prev => ({
      ...prev,
      [weekday]: {
        ...prev[weekday],
        slots: prev[weekday].slots.filter((_, idx) => idx !== slotIndex),
      },
    }));
  };

  const handleSaveWorkingHours = async () => {
    if (!calendarData) return;

    setIsSavingCalendar(true);
    try {
      // Salvar cada dia que tem horários
      for (const [weekdayStr, dayData] of Object.entries(workingHours)) {
        const weekday = parseInt(weekdayStr);
        const workingHoursData = dayData.enabled
          ? dayData.slots.map(slot => ({
              startTime: slot.startTime,
              endTime: slot.endTime,
            }))
          : [];

        await api.put(`/calendars/${calendarData.calendarId}/working-hours`, {
          weekday,
          workingHours: workingHoursData,
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
                            {hasCalendarRole(member) && member.status === 'active' && (
                              <DropdownMenuItem onClick={() => openCalendarModal(member)}>
                                <CalendarDaysIcon className="h-4 w-4 mr-2" />
                                Editar Calendário
                              </DropdownMenuItem>
                            )}
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
                        <span className="text-sm text-muted-foreground">Você</span>
                      )}
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Horários de Trabalho</DialogTitle>
            <DialogDescription>
              Configure os horários de atendimento de {selectedMemberForCalendar?.user.name}.
            </DialogDescription>
          </DialogHeader>

          {isLoadingCalendar ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Carregando calendário...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {WEEKDAYS.map(({ value: weekday, label }) => (
                <div key={weekday} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={workingHours[weekday]?.enabled || false}
                        onCheckedChange={() => handleDayToggle(weekday)}
                      />
                      <Label className="font-medium">{label}</Label>
                    </div>
                    {workingHours[weekday]?.enabled && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addSlot(weekday)}
                      >
                        + Adicionar horário
                      </Button>
                    )}
                  </div>

                  {workingHours[weekday]?.enabled && workingHours[weekday].slots.length > 0 && (
                    <div className="space-y-2 ml-10">
                      {workingHours[weekday].slots.map((slot, slotIndex) => (
                        <div key={slotIndex} className="flex items-center gap-2">
                          <Input
                            type="time"
                            value={slot.startTime}
                            onChange={(e) => handleSlotChange(weekday, slotIndex, 'startTime', e.target.value)}
                            className="w-32"
                          />
                          <span className="text-muted-foreground">até</span>
                          <Input
                            type="time"
                            value={slot.endTime}
                            onChange={(e) => handleSlotChange(weekday, slotIndex, 'endTime', e.target.value)}
                            className="w-32"
                          />
                          {workingHours[weekday].slots.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeSlot(weekday, slotIndex)}
                              className="text-destructive hover:text-destructive"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {workingHours[weekday]?.enabled && workingHours[weekday].slots.length === 0 && (
                    <p className="text-sm text-muted-foreground ml-10">
                      Nenhum horário configurado. Clique em &quot;Adicionar horário&quot; para começar.
                    </p>
                  )}
                </div>
              ))}
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