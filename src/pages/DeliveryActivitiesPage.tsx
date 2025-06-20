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
import { RoleBasedContent } from '@/components/auth/role-based-content';
import { useAuth } from '@/hooks/useAuth';
import { DeliveryActivityModel, DeliveryActivity } from '@/models/delivery-activity.model';
import { PackageModel, Package } from '@/models/package.model';
import { UserModel, User } from '@/models/user.model';
import { Calendar, Search, RefreshCw, MapPin, Clock, Truck, CheckCircle, XCircle, Camera, FileText } from 'lucide-react';

function DeliveryActivitiesContent() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<DeliveryActivity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<DeliveryActivity[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<string>(new Date().toISOString().split('T')[0]);

  // Fungsi untuk mendapatkan data aktivitas pengiriman
  const fetchActivities = async () => {
    try {
      setIsLoading(true);
      let activityData: DeliveryActivity[] = [];

      if (user) {
        if (user.role === 'Kurir') {
          // Kurir hanya melihat aktivitas pengiriman mereka sendiri
          activityData = await DeliveryActivityModel.getByCourierId(user.id);
        } else {
          // Admin dan MasterAdmin melihat semua aktivitas pengiriman berdasarkan tanggal
          activityData = await DeliveryActivityModel.getByDate(dateFilter);
        }

        setActivities(activityData);
        setFilteredActivities(activityData);

        // Fetch packages untuk mendapatkan detail paket
        const packageIds = [...new Set(activityData.map(activity => activity.package_id))];
        if (packageIds.length > 0) {
          const packageData = await Promise.all(
            packageIds.map(id => PackageModel.getById(id))
          );
          setPackages(packageData.filter(Boolean) as Package[]);
        }

        // Fetch users untuk mendapatkan nama kurir (hanya untuk Admin/MasterAdmin)
        if (user.role === 'Admin' || user.role === 'MasterAdmin') {
          const userData = await UserModel.getByRole('Kurir');
          setUsers(userData);
        }
      }
    } catch (error) {
      console.error('Error fetching delivery activities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchActivities();
    }
  }, [user, dateFilter]);

  // Filter aktivitas berdasarkan pencarian
  useEffect(() => {
    if (!searchTerm) {
      setFilteredActivities(activities);
      return;
    }

    const filtered = activities.filter((activity) => {
      // Cari paket yang terkait dengan aktivitas
      const relatedPackage = packages.find(pkg => pkg.id === activity.package_id);
      
      // Jika Admin/MasterAdmin, cari berdasarkan nama kurir juga
      if (user?.role === 'Admin' || user?.role === 'MasterAdmin') {
        const courier = users.find(u => u.id === activity.courier_id);
        const courierMatch = courier?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
        if (courierMatch) return true;
      }
      
      return (
        activity.activity_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        relatedPackage?.tracking_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        relatedPackage?.recipient_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });

    setFilteredActivities(filtered);
  }, [activities, searchTerm, packages, users, user]);

  // Fungsi untuk mendapatkan badge tipe aktivitas
  const getActivityTypeBadge = (type: string) => {
    switch (type) {
      case 'pickup':
        return <Badge className="bg-blue-500 text-white">Pengambilan</Badge>;
      case 'delivery':
        return <Badge className="bg-green-500 text-white">Pengiriman</Badge>;
      case 'failed_delivery':
        return <Badge variant="destructive">Gagal Kirim</Badge>;
      case 'returned':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Dikembalikan</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
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

  // Fungsi untuk memformat waktu
  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Fungsi untuk mendapatkan detail paket berdasarkan ID
  const getPackageDetails = (packageId: string) => {
    return packages.find(pkg => pkg.id === packageId);
  };

  // Fungsi untuk mendapatkan nama kurir berdasarkan ID
  const getCourierName = (courierId: string) => {
    const courier = users.find(user => user.id === courierId);
    return courier?.full_name || 'Unknown';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Aktivitas Pengiriman</h1>
          <p className="text-muted-foreground">Kelola aktivitas pengiriman paket</p>
        </div>
      </div>

      {/* Filter dan Pencarian */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col space-y-4 md:flex-row md:items-end md:justify-between md:space-x-4 md:space-y-0">
            <div className="flex flex-1 flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0">
              {/* Filter Tanggal - Hanya untuk Admin dan MasterAdmin */}
              <RoleBasedContent allowedRoles={['Admin', 'MasterAdmin']}>
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
              </RoleBasedContent>

              <div className="flex-1 space-y-2">
                <Label htmlFor="search">Cari Aktivitas</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder={
                      user?.role === 'Kurir'
                        ? 'Cari berdasarkan nomor tracking, penerima, atau lokasi'
                        : 'Cari berdasarkan kurir, nomor tracking, atau lokasi'
                    }
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <Button variant="outline" onClick={() => fetchActivities()}>
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabel Aktivitas Pengiriman */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Aktivitas Pengiriman</CardTitle>
          <CardDescription>
            {filteredActivities.length} aktivitas ditemukan
            {(user?.role === 'Admin' || user?.role === 'MasterAdmin')
              ? ` untuk tanggal ${formatDate(dateFilter)}`
              : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="mr-2 h-6 w-6 animate-spin" />
              <span>Memuat data...</span>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-lg font-medium">Tidak ada aktivitas ditemukan</p>
              <p className="text-sm text-muted-foreground">
                {user?.role === 'Kurir'
                  ? 'Belum ada aktivitas pengiriman untuk ditampilkan'
                  : 'Coba ubah tanggal atau kata kunci pencarian Anda'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Waktu</TableHead>
                    {(user?.role === 'Admin' || user?.role === 'MasterAdmin') && (
                      <TableHead>Kurir</TableHead>
                    )}
                    <TableHead>No. Tracking</TableHead>
                    <TableHead>Penerima</TableHead>
                    <TableHead>Tipe Aktivitas</TableHead>
                    <TableHead>
                      <div className="flex items-center">
                        <MapPin className="mr-2 h-4 w-4" /> Lokasi
                      </div>
                    </TableHead>
                    <TableHead>Catatan</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredActivities.map((activity) => {
                    const packageDetail = getPackageDetails(activity.package_id);
                    return (
                      <TableRow key={activity.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{formatDate(activity.timestamp)}</span>
                            <span className="text-sm text-muted-foreground">
                              {formatTime(activity.timestamp)}
                            </span>
                          </div>
                        </TableCell>
                        {(user?.role === 'Admin' || user?.role === 'MasterAdmin') && (
                          <TableCell>{getCourierName(activity.courier_id)}</TableCell>
                        )}
                        <TableCell className="font-medium">
                          {packageDetail?.tracking_number || 'N/A'}
                        </TableCell>
                        <TableCell>{packageDetail?.recipient_name || 'N/A'}</TableCell>
                        <TableCell>{getActivityTypeBadge(activity.activity_type)}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {activity.location || '-'}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {activity.notes || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button variant="ghost" size="icon">
                              <FileText className="h-4 w-4" />
                            </Button>
                            {activity.photo_url && (
                              <Button variant="ghost" size="icon">
                                <Camera className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function DeliveryActivitiesPage() {
  return (
    <ProtectedRoute allowedRoles={['Kurir', 'Admin', 'MasterAdmin']}>
      <DashboardLayout>
        <DeliveryActivitiesContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}