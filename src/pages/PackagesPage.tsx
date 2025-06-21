'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { RoleBasedContent } from '@/components/auth/role-based-content';
import { useAuth } from '@/hooks/useAuth';
import { PackageModel, Package } from '@/models/package.model';
import { UserModel } from '@/models/user.model';
import { LocationModel } from '@/models/location.model';
import { Plus, Search, Filter, RefreshCw, Eye, Edit, Trash, Truck, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Extended Package type with additional properties needed in this component
type ExtendedPackage = Package & {
  tracking_number: string;
  recipient_address: string;
};

export default function PackagesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [packages, setPackages] = useState<ExtendedPackage[]>([]);
  const [filteredPackages, setFilteredPackages] = useState<ExtendedPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setIsLoading(true);
        let packageData: Package[] = [];

        // Fetch paket berdasarkan peran pengguna
        if (user) {
          try {
            if (user.role === 'Kurir') {
              // Kurir hanya melihat paket yang ditugaskan kepadanya
              packageData = await PackageModel.getByCourier(user.id);
            } else {
              // Admin, MasterAdmin, dan PIC melihat semua paket
              packageData = await PackageModel.getAll();
            }
            
            // Map Package objects to ExtendedPackage objects with default values for missing properties
            const extendedPackages: ExtendedPackage[] = packageData.map(pkg => ({
              ...pkg,
              tracking_number: pkg.id, // Using id as tracking number as a fallback
              recipient_address: 'Alamat tidak tersedia' // Default value for recipient_address
            }));
            
            setPackages(extendedPackages);
            setFilteredPackages(extendedPackages);
          } catch (error) {
            console.error('Error fetching package data:', error);
            toast({
              title: 'Error',
              description: 'Gagal memuat data paket',
              variant: 'destructive',
            });
          }
        }
      } catch (error) {
        console.error('Error fetching packages:', error);
        toast({
          title: 'Error',
          description: 'Terjadi kesalahan saat memuat data paket',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchPackages();
    }
  }, [user]);

  // Filter paket berdasarkan pencarian dan status
  useEffect(() => {
    let filtered = packages;

    // Filter berdasarkan pencarian
    if (searchTerm) {
      filtered = filtered.filter(
        (pkg) =>
          pkg.tracking_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (pkg.recipient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
          pkg.recipient_address.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter berdasarkan status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((pkg) => pkg.status === statusFilter);
    }

    setFilteredPackages(filtered);
  }, [packages, searchTerm, statusFilter]);

  // Fungsi untuk mendapatkan badge status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">Tertunda</Badge>;
      case 'processing':
        return <Badge variant="secondary">Diproses</Badge>;
      case 'in_transit':
        return <Badge variant="default">Dalam Pengiriman</Badge>;
      case 'delivered':
        return <Badge variant="default" className="bg-green-500 text-white">Terkirim</Badge>;
      case 'failed':
        return <Badge variant="destructive">Gagal</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Manajemen Paket</h1>
            <p className="text-muted-foreground">Kelola semua paket dalam sistem</p>
          </div>

          {/* Tombol Tambah Paket - Hanya untuk Admin, MasterAdmin, dan PIC */}
          <RoleBasedContent allowedRoles={['Admin', 'MasterAdmin', 'PIC']}>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Tambah Paket
            </Button>
          </RoleBasedContent>
        </div>

        {/* Filter dan Pencarian */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col space-y-4 md:flex-row md:items-end md:justify-between md:space-x-4 md:space-y-0">
              <div className="flex flex-1 flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="search">Cari Paket</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Cari berdasarkan nomor, nama, atau alamat"
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="w-full space-y-2 md:w-[180px]">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    aria-label="Filter by status"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">Semua Status</option>
                    <option value="pending">Tertunda</option>
                    <option value="processing">Diproses</option>
                    <option value="in_transit">Dalam Pengiriman</option>
                    <option value="delivered">Terkirim</option>
                    <option value="failed">Gagal</option>
                  </select>
                </div>
              </div>
              <Button variant="outline" onClick={() => window.location.reload()}>
                <RefreshCw className="mr-2 h-4 w-4" /> Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabel Paket */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Paket</CardTitle>
            <CardDescription>
              {filteredPackages.length} paket ditemukan dari total {packages.length} paket
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="mr-2 h-6 w-6 animate-spin" />
                <span>Memuat data...</span>
              </div>
            ) : filteredPackages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-lg font-medium">Tidak ada paket ditemukan</p>
                <p className="text-sm text-muted-foreground">
                  Coba ubah filter atau kata kunci pencarian Anda
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No. Tracking</TableHead>
                      <TableHead>Penerima</TableHead>
                      <TableHead>Alamat</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPackages.map((pkg) => (
                      <TableRow key={pkg.id}>
                        <TableCell className="font-medium">{pkg.tracking_number}</TableCell>
                        <TableCell>{pkg.recipient_name}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {pkg.recipient_address}
                        </TableCell>
                        <TableCell>{formatDate(pkg.created_at)}</TableCell>
                        <TableCell>{getStatusBadge(pkg.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>

                            {/* Tombol Edit - Hanya untuk Admin, MasterAdmin, dan PIC */}
                            <RoleBasedContent allowedRoles={['Admin', 'MasterAdmin', 'PIC']}>
                              <Button variant="ghost" size="icon">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </RoleBasedContent>

                            {/* Tombol Hapus - Hanya untuk Admin dan MasterAdmin */}
                            <RoleBasedContent allowedRoles={['Admin', 'MasterAdmin']}>
                              <Button variant="ghost" size="icon">
                                <Trash className="h-4 w-4" />
                              </Button>
                            </RoleBasedContent>

                            {/* Tombol Kirim - Hanya untuk Kurir */}
                            <RoleBasedContent allowedRoles={['Kurir']}>
                              {pkg.status === 'in_transit' && (
                                <>
                                  <Button variant="outline" size="sm">
                                    <CheckCircle className="mr-2 h-4 w-4" /> Terkirim
                                  </Button>
                                  <Button variant="outline" size="sm">
                                    <XCircle className="mr-2 h-4 w-4" /> Gagal
                                  </Button>
                                </>
                              )}
                              {pkg.status === 'process' && (
                                <Button variant="outline" size="sm">
                                  <Truck className="mr-2 h-4 w-4" /> Ambil
                                </Button>
                              )}
                            </RoleBasedContent>
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
    </DashboardLayout>
  );
}