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
import { DailyPackageInputModel, DailyPackageInput } from '@/models/daily-package-input.model';
import { Calendar, Search, RefreshCw, Plus, Edit, Trash, FileText } from 'lucide-react';
import { dailyPackageInputSchema, validateInput } from '@/lib/validations';
import { toast } from '@/components/ui/use-toast';

function DailyPackageInputContent() {
  const { user } = useAuth();
  const [inputs, setInputs] = useState<DailyPackageInput[]>([]);
  const [filteredInputs, setFilteredInputs] = useState<DailyPackageInput[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isCreating, setIsCreating] = useState(false);
  const [newInput, setNewInput] = useState({
    date: new Date().toISOString().split('T')[0],
    total_packages: 0,
    processed_packages: 0,
    pending_packages: 0,
    notes: '',
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Fungsi untuk mendapatkan data input paket harian
  const fetchInputs = async () => {
    try {
      setIsLoading(true);
      let inputData: DailyPackageInput[] = [];

      if (user) {
        // Jika user adalah PIC, ambil data input paket harian berdasarkan user ID
        if (user.role === 'PIC') {
          inputData = await DailyPackageInputModel.getByUserId(user.id);
        } else {
          // Jika user adalah Admin atau MasterAdmin, ambil semua data
          inputData = await DailyPackageInputModel.getByDate(dateFilter);
        }

        setInputs(inputData);
        setFilteredInputs(inputData);
      }
    } catch (error) {
      console.error('Error fetching daily package inputs:', error);
      toast({
        title: 'Error',
        description: 'Gagal mengambil data input paket harian',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchInputs();
    }
  }, [user, dateFilter]);

  // Filter input berdasarkan pencarian
  useEffect(() => {
    if (!searchTerm) {
      setFilteredInputs(inputs);
      return;
    }

    const filtered = inputs.filter((input) => {
      return (
        input.date.toLowerCase().includes(searchTerm.toLowerCase()) ||
        input.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });

    setFilteredInputs(filtered);
  }, [inputs, searchTerm]);

  // Validasi input paket harian
  const validatePackageInput = () => {
    const result = validateInput(dailyPackageInputSchema, {
      date: newInput.date,
      total_packages: newInput.total_packages,
      processed_packages: newInput.processed_packages,
      pending_packages: newInput.pending_packages,
      notes: newInput.notes,
    });

    if (!result.success) {
      toast({
        title: 'Validasi Gagal',
        description: result.error,
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  // Fungsi untuk menambah input paket harian baru
  const handleCreateInput = async () => {
    if (!user) return;
    if (!validatePackageInput()) return;

    try {
      setIsCreating(true);
      
      try {
        await DailyPackageInputModel.create({
          user_id: user.id,
          date: newInput.date,
          total_packages: newInput.total_packages,
          processed_packages: newInput.processed_packages,
          pending_packages: newInput.pending_packages,
          notes: newInput.notes,
        });
        
        // Reset form dan refresh data
        setNewInput({
          date: new Date().toISOString().split('T')[0],
          total_packages: 0,
          processed_packages: 0,
          pending_packages: 0,
          notes: '',
        });
        setIsCreating(false);
        setErrors({});
        toast({
          title: 'Berhasil',
          description: 'Data input paket harian berhasil disimpan',
        });
        
        await fetchInputs(); // Refresh data
      } catch (error) {
        console.error('Error creating daily package input:', error);
        toast({
          title: 'Error',
          description: 'Gagal menyimpan data input paket harian',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error in handleCreateInput:', error);
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan saat menyimpan data',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Fungsi untuk memformat tanggal
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Handler untuk perubahan input
  const handleInputChange = (field: string, value: string | number) => {
    setNewInput({ ...newInput, [field]: value });
    // Hapus error untuk field yang diubah
    if (errors[field]) {
      const updatedErrors = { ...errors };
      delete updatedErrors[field];
      setErrors(updatedErrors);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Input Paket Harian</h1>
          <p className="text-muted-foreground">Kelola input paket harian</p>
        </div>

        {user?.role === 'PIC' && (
          <Button onClick={() => setIsCreating(!isCreating)}>
            {isCreating ? 'Batal' : <><Plus className="mr-2 h-4 w-4" /> Input Baru</>}
          </Button>
        )}
      </div>

      {/* Form Input Baru - Hanya untuk PIC */}
      {isCreating && user?.role === 'PIC' && (
        <Card>
          <CardHeader>
            <CardTitle>Input Paket Baru</CardTitle>
            <CardDescription>Masukkan data paket harian</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="input-date">Tanggal</Label>
                <Input
                  id="input-date"
                  type="date"
                  value={newInput.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  className={errors.date ? 'border-red-500' : ''}
                />
                {errors.date && <p className="text-sm text-red-500">{errors.date}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="total-packages">Total Paket</Label>
                <Input
                  id="total-packages"
                  type="number"
                  min="0"
                  value={newInput.total_packages}
                  onChange={(e) => handleInputChange('total_packages', parseInt(e.target.value) || 0)}
                  className={errors.total_packages ? 'border-red-500' : ''}
                />
                {errors.total_packages && <p className="text-sm text-red-500">{errors.total_packages}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="processed-packages">Paket Diproses</Label>
                <Input
                  id="processed-packages"
                  type="number"
                  min="0"
                  value={newInput.processed_packages}
                  onChange={(e) => handleInputChange('processed_packages', parseInt(e.target.value) || 0)}
                  className={errors.processed_packages ? 'border-red-500' : ''}
                />
                {errors.processed_packages && <p className="text-sm text-red-500">{errors.processed_packages}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="pending-packages">Paket Tertunda</Label>
                <Input
                  id="pending-packages"
                  type="number"
                  min="0"
                  value={newInput.pending_packages}
                  onChange={(e) => handleInputChange('pending_packages', parseInt(e.target.value) || 0)}
                  className={errors.pending_packages ? 'border-red-500' : ''}
                />
                {errors.pending_packages && <p className="text-sm text-red-500">{errors.pending_packages}</p>}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="notes">Catatan</Label>
                <Input
                  id="notes"
                  value={newInput.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Button
                  className="w-full"
                  onClick={handleCreateInput}
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Simpan Input
                </Button>
                {newInput.processed_packages + newInput.pending_packages !== newInput.total_packages && (
                  <p className="mt-2 text-sm text-red-500">
                    Total paket harus sama dengan jumlah paket diproses dan tertunda
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter dan Pencarian */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col space-y-4 md:flex-row md:items-end md:justify-between md:space-x-4 md:space-y-0">
            <div className="flex flex-1 flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0">
              {/* Filter Tanggal - Hanya untuk Admin dan MasterAdmin */}
              {(user?.role === 'Admin' || user?.role === 'MasterAdmin') && (
                <div className="w-full space-y-2 md:w-[200px]">
                  <Label htmlFor="date">Tanggal</Label>
                  <div className="relative">
                    <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="date"
                      type="date"
                      className="pl-8"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="flex-1 space-y-2">
                <Label htmlFor="search">Cari Input</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Cari berdasarkan tanggal atau catatan"
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <Button variant="outline" onClick={() => fetchInputs()}>
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabel Input Paket Harian */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Input Paket Harian</CardTitle>
          <CardDescription>
            {filteredInputs.length} input ditemukan
            {user?.role !== 'PIC' ? ` untuk tanggal ${formatDate(dateFilter)}` : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="mr-2 h-6 w-6 animate-spin" />
              <span>Memuat data...</span>
            </div>
          ) : filteredInputs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-lg font-medium">Tidak ada input ditemukan</p>
              <p className="text-sm text-muted-foreground">
                {user?.role === 'PIC'
                  ? 'Klik tombol "Input Baru" untuk menambahkan data'
                  : 'Coba ubah tanggal atau kata kunci pencarian Anda'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Total Paket</TableHead>
                    <TableHead>Diproses</TableHead>
                    <TableHead>Tertunda</TableHead>
                    <TableHead>Catatan</TableHead>
                    <TableHead>Status</TableHead>
                    {(user?.role === 'Admin' || user?.role === 'MasterAdmin') && (
                      <TableHead>PIC</TableHead>
                    )}
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInputs.map((input) => (
                    <TableRow key={input.id}>
                      <TableCell>{formatDate(input.date)}</TableCell>
                      <TableCell>{input.total_packages}</TableCell>
                      <TableCell>{input.processed_packages}</TableCell>
                      <TableCell>{input.pending_packages}</TableCell>
                      <TableCell>{input.notes || '-'}</TableCell>
                      <TableCell>
                        {input.processed_packages === input.total_packages ? (
                          <Badge className="bg-green-500 text-white">Selesai</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                            Proses
                          </Badge>
                        )}
                      </TableCell>
                      {(user?.role === 'Admin' || user?.role === 'MasterAdmin') && (
                        <TableCell>{input.user_name || 'Unknown'}</TableCell>
                      )}
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" size="icon">
                            <FileText className="h-4 w-4" />
                          </Button>
                          {user?.role === 'PIC' && (
                            <>
                              <Button variant="outline" size="icon">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="icon" className="text-red-500">
                                <Trash className="h-4 w-4" />
                              </Button>
                            </>
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

export default function DailyPackageInputPage() {
  return (
    <ProtectedRoute allowedRoles={['PIC', 'Admin', 'MasterAdmin']}>
      <DashboardLayout>
        <DailyPackageInputContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}