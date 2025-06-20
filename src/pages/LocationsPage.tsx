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
import { LocationModel, Location } from '@/models/location.model';
import { Plus, Search, RefreshCw, Edit, Trash, MapPin } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

function LocationsContent() {
  const { user } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isCreating, setIsCreating] = useState(false);
  const [newLocation, setNewLocation] = useState({
    name: '',
    address: '',
    city: '',
    province: '',
    postal_code: '',
    type: 'warehouse',
    latitude: '',
    longitude: '',
  });

  // Fungsi untuk mendapatkan data lokasi
  const fetchLocations = async () => {
    try {
      setIsLoading(true);
      try {
        const locationData = await LocationModel.getAll();
        setLocations(locationData);
        setFilteredLocations(locationData);
      } catch (error) {
        console.error('Error fetching location data:', error);
        toast({
          title: 'Error',
          description: 'Gagal memuat data lokasi',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan saat memuat data lokasi',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  // Filter lokasi berdasarkan pencarian dan tipe
  useEffect(() => {
    let filtered = locations;

    // Filter berdasarkan pencarian
    if (searchTerm) {
      filtered = filtered.filter(
        (location) =>
          location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          location.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
          location.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
          location.province.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter berdasarkan tipe
    if (typeFilter !== 'all') {
      filtered = filtered.filter((location) => location.type === typeFilter);
    }

    setFilteredLocations(filtered);
  }, [locations, searchTerm, typeFilter]);

  // Fungsi untuk menambah lokasi baru
  const handleCreateLocation = async () => {
    try {
      setIsLoading(true);
      
      try {
        await LocationModel.create({
          name: newLocation.name,
          address: newLocation.address,
          city: newLocation.city,
          province: newLocation.province,
          postal_code: newLocation.postal_code,
          type: newLocation.type,
          latitude: newLocation.latitude ? parseFloat(newLocation.latitude) : null,
          longitude: newLocation.longitude ? parseFloat(newLocation.longitude) : null,
        });
        
        // Reset form dan refresh data
        setNewLocation({
          name: '',
          address: '',
          city: '',
          province: '',
          postal_code: '',
          type: 'warehouse',
          latitude: '',
          longitude: '',
        });
        setIsCreating(false);
        
        toast({
          title: 'Sukses',
          description: 'Lokasi berhasil ditambahkan',
        });
        
        await fetchLocations();
      } catch (error) {
        console.error('Error creating location data:', error);
        toast({
          title: 'Error',
          description: 'Gagal menambahkan lokasi',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error creating location:', error);
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan saat menambahkan lokasi',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fungsi untuk mendapatkan badge tipe lokasi
  const getLocationTypeBadge = (type: string) => {
    switch (type) {
      case 'warehouse':
        return <Badge className="bg-blue-500 text-white">Gudang</Badge>;
      case 'drop_point':
        return <Badge className="bg-green-500 text-white">Drop Point</Badge>;
      case 'office':
        return <Badge className="bg-purple-500 text-white">Kantor</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manajemen Lokasi</h1>
          <p className="text-muted-foreground">Kelola semua lokasi dalam sistem</p>
        </div>

        <Button onClick={() => setIsCreating(!isCreating)}>
          {isCreating ? 'Batal' : <><Plus className="mr-2 h-4 w-4" /> Tambah Lokasi</>}
        </Button>
      </div>

      {/* Form Tambah Lokasi */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Tambah Lokasi Baru</CardTitle>
            <CardDescription>Masukkan detail lokasi baru</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Lokasi</Label>
                <Input
                  id="name"
                  value={newLocation.name}
                  onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                  placeholder="Gudang Pusat Jakarta"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Tipe Lokasi</Label>
                <select
                  id="type"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  value={newLocation.type}
                  onChange={(e) => setNewLocation({ ...newLocation, type: e.target.value })}
                >
                  <option value="warehouse">Gudang</option>
                  <option value="drop_point">Drop Point</option>
                  <option value="office">Kantor</option>
                </select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address">Alamat</Label>
                <Input
                  id="address"
                  value={newLocation.address}
                  onChange={(e) => setNewLocation({ ...newLocation, address: e.target.value })}
                  placeholder="Jl. Contoh No. 123"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Kota</Label>
                <Input
                  id="city"
                  value={newLocation.city}
                  onChange={(e) => setNewLocation({ ...newLocation, city: e.target.value })}
                  placeholder="Jakarta"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="province">Provinsi</Label>
                <Input
                  id="province"
                  value={newLocation.province}
                  onChange={(e) => setNewLocation({ ...newLocation, province: e.target.value })}
                  placeholder="DKI Jakarta"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postal_code">Kode Pos</Label>
                <Input
                  id="postal_code"
                  value={newLocation.postal_code}
                  onChange={(e) => setNewLocation({ ...newLocation, postal_code: e.target.value })}
                  placeholder="12345"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude (opsional)</Label>
                <Input
                  id="latitude"
                  type="text"
                  value={newLocation.latitude}
                  onChange={(e) => setNewLocation({ ...newLocation, latitude: e.target.value })}
                  placeholder="-6.2088"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude (opsional)</Label>
                <Input
                  id="longitude"
                  type="text"
                  value={newLocation.longitude}
                  onChange={(e) => setNewLocation({ ...newLocation, longitude: e.target.value })}
                  placeholder="106.8456"
                />
              </div>
              <div className="sm:col-span-2">
                <Button
                  className="w-full"
                  onClick={handleCreateLocation}
                  disabled={
                    !newLocation.name ||
                    !newLocation.address ||
                    !newLocation.city ||
                    !newLocation.province
                  }
                >
                  <Plus className="mr-2 h-4 w-4" /> Simpan Lokasi
                </Button>
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
              <div className="flex-1 space-y-2">
                <Label htmlFor="search">Cari Lokasi</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Cari berdasarkan nama, alamat, kota, atau provinsi"
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="w-full space-y-2 md:w-[180px]">
                <Label htmlFor="type">Tipe Lokasi</Label>
                <select
                  id="type"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="all">Semua Tipe</option>
                  <option value="warehouse">Gudang</option>
                  <option value="drop_point">Drop Point</option>
                  <option value="office">Kantor</option>
                </select>
              </div>
            </div>
            <Button variant="outline" onClick={() => fetchLocations()}>
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabel Lokasi */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Lokasi</CardTitle>
          <CardDescription>
            {filteredLocations.length} lokasi ditemukan dari total {locations.length} lokasi
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="mr-2 h-6 w-6 animate-spin" />
              <span>Memuat data...</span>
            </div>
          ) : filteredLocations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-lg font-medium">Tidak ada lokasi ditemukan</p>
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
                    <TableHead>Tipe</TableHead>
                    <TableHead>Alamat</TableHead>
                    <TableHead>Kota</TableHead>
                    <TableHead>Provinsi</TableHead>
                    <TableHead>Kode Pos</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLocations.map((location) => (
                    <TableRow key={location.id}>
                      <TableCell className="font-medium">{location.name}</TableCell>
                      <TableCell>{getLocationTypeBadge(location.type)}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {location.address}
                      </TableCell>
                      <TableCell>{location.city}</TableCell>
                      <TableCell>{location.province}</TableCell>
                      <TableCell>{location.postal_code}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="ghost" size="icon">
                            <MapPin className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Trash className="h-4 w-4" />
                          </Button>
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

export default function LocationsPage() {
  return (
    <ProtectedRoute allowedRoles={['Admin', 'MasterAdmin']}>
      <DashboardLayout>
        <LocationsContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}