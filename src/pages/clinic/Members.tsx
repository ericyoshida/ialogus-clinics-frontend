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
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from '@/hooks/use-toast';
import { api } from '@/services';
import {
    ArrowLeftIcon,
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

export default function Members() {
  const { clinicId } = useParams<{ clinicId: string }>();
  const navigate = useNavigate();
  const { clinics } = useClinics();
  const { user: currentUser } = useAuth();
  const { canManageMembers } = useUserRole();
  
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

  // Verificar se o usuário pode editar/excluir o membro
  // Apenas ADMIN pode editar e não pode editar a si mesmo
  const canEditMember = (member: Member) => {
    return canManageMembers && member.userId !== currentUser?.id;
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
        {canManageMembers && (
          <Button onClick={() => setIsAddModalOpen(true)}>
            <UserPlusIcon className="h-4 w-4 mr-2" />
            Convidar Membro
          </Button>
        )}
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
                  {canManageMembers && <TableHead className="text-right">Ações</TableHead>}
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
                    {canManageMembers && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
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
                    )}
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

    </div>
  );
}