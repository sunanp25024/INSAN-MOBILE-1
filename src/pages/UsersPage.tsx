'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { useAuth } from '@/hooks/useAuth';
import { UserModel, User } from '@/models/user.model';
import { Plus, Search, Filter, RefreshCw, Eye, Edit, Trash, Lock } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

// Extend the User type to include phone_number
interface ExtendedUser extends User {
  phone_number?: string | null;
}

function UsersPageContent() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<ExtendedUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<ExtendedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        try {
          const userData = await UserModel.getAll();
          
          // Filter out MasterAdmin users if current user is Admin
          const filteredData = currentUser?.role === 'Admin' 
            ? userData.filter(user => user.role !== 'MasterAdmin')
            : userData;
            
          setUsers(filteredData);
          setFilteredUsers(filteredData);
        } catch (error) {
          console.error('Error fetching user data:', error);
          toast({
            title: 'Error',
            description: 'Gagal memuat data pengguna',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        toast({
          title: 'Error',
          description: 'Terjadi kesalahan saat memuat data pengguna',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [currentUser]);

  // Filter users berdasarkan pencarian dan peran
  useEffect(() => {
    let filtered = users;

    // Filter berdasarkan pencarian
    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.phone_number?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter berdasarkan peran
    if (roleFilter !== 'all') {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, roleFilter]);

  // Fungsi untuk mendapatkan badge status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Aktif</Badge>;
      case 'inactive':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Tidak Aktif</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Ditangguhkan</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Fungsi untuk mendapatkan badge peran
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'MasterAdmin':
        return <Badge className="bg-purple-500 text-white">Master Admin</Badge>;
      case 'Admin':
        return <Badge className="bg-blue-500 text-white">Admin</Badge>;
      case 'PIC':
        return <Badge className="bg-yellow-500 text-black">PIC</Badge>;
      case 'Kurir':
        return <Badge className="bg-green-500 text-white">Kurir</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manajemen Pengguna</h1>
          <p className="text-muted-foreground">Kelola semua pengguna dalam sistem</p>
        </div>

        <Button>
          <Plus className="mr-2 h-4 w-4" /> Tambah Pengguna
        </Button>
      </div>

      {/* Filter dan Pencarian */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col space-y-4 md:flex-row md:items-end md:justify-between md:space-x-4 md:space-y-0">
            <div className="flex flex-1 flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0">
              <div className="flex-1 space-y-2">
                <Label htmlFor="search">Cari Pengguna</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Cari berdasarkan nama, email, atau nomor telepon"
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="w-full space-y-2 md:w-[180px]">
                <Label htmlFor="role">Peran</Label>
                <select
                  id="role"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  aria-label="Filter Peran Pengguna"
                >
                  <option value="all">Semua Peran</option>
                  {currentUser?.role === 'MasterAdmin' && (
                    <option value="MasterAdmin">Master Admin</option>
                  )}
                  <option value="Admin">Admin</option>
                  <option value="PIC">PIC</option>
                  <option value="Kurir">Kurir</option>
                </select>
              </div>
            </div>
            <Button variant="outline" onClick={() => window.location.reload()}>
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabel Pengguna */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Pengguna</CardTitle>
          <CardDescription>
            {filteredUsers.length} pengguna ditemukan dari total {users.length} pengguna
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="mr-2 h-6 w-6 animate-spin" />
              <span>Memuat data...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-lg font-medium">Tidak ada pengguna ditemukan</p>
              <p className="text-sm text-muted-foreground">
                Coba ubah filter atau kata kunci pencarian Anda
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telepon</TableHead>
                    <TableHead>Peran</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.full_name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.phone_number || '-'}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>{getStatusBadge(user.status || 'active')}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {/* Tidak bisa mengedit MasterAdmin jika user adalah Admin */}
                          {!(currentUser?.role === 'Admin' && user.role === 'MasterAdmin') && (
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {/* Tombol Reset Password */}
                          {!(currentUser?.role === 'Admin' && user.role === 'MasterAdmin') && (
                            <Button variant="ghost" size="icon">
                              <Lock className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {/* Tombol Hapus - Tidak bisa menghapus diri sendiri atau MasterAdmin jika user adalah Admin */}
                          {currentUser?.id !== user.id && 
                           !(currentUser?.role === 'Admin' && user.role === 'MasterAdmin') && (
                            <Button variant="ghost" size="icon">
                              <Trash className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function UsersPage() {
  return (
    <ProtectedRoute allowedRoles={['Admin', 'MasterAdmin']}>
      <DashboardLayout>
        <UsersPageContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}