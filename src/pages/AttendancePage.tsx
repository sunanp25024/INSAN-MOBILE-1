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
import { AttendanceModel, Attendance } from '@/models/attendance.model';
import { UserModel, User } from '@/models/user.model';
import { Calendar, Search, RefreshCw, Clock, MapPin, CheckCircle, XCircle, AlertCircle, Camera } from 'lucide-react';
import { getCurrentPosition, LocationData } from '@/lib/geolocation';
import { takePhoto, PhotoData } from '@/lib/camera';
import { toast } from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function AttendancePage() {
  const { user } = useAuth();
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [filteredAttendances, setFilteredAttendances] = useState<Attendance[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<string>(new Date().toISOString().split('T')[0]);
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [photo, setPhoto] = useState<PhotoData | null>(null);
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [showPhotoPreview, setShowPhotoPreview] = useState(false);
  const [photoAction, setPhotoAction] = useState<'check-in' | 'check-out' | null>(null);

  // Fungsi untuk mendapatkan data absensi
  const fetchAttendances = async () => {
    try {
      setIsLoading(true);
      let attendanceData: Attendance[] = [];

      // Fetch absensi berdasarkan peran pengguna
      if (user) {
        try {
          if (user.role === 'Kurir' || user.role === 'PIC') {
            // Kurir dan PIC hanya melihat absensi mereka sendiri
            attendanceData = await AttendanceModel.getByUserId(user.id);
          } else {
            // Admin dan MasterAdmin melihat semua absensi
            attendanceData = await AttendanceModel.getByDate(dateFilter);
          }

          // Jika user adalah Kurir atau PIC, cek apakah sudah absen hari ini
          if (user.role === 'Kurir' || user.role === 'PIC') {
            const today = new Date().toISOString().split('T')[0];
            const todayAttendances = attendanceData.filter(
              (attendance) => attendance.date.split('T')[0] === today
            );
            setTodayAttendance(todayAttendances.length > 0 ? todayAttendances[0] : null);
          }

          setAttendances(attendanceData);
          setFilteredAttendances(attendanceData);
        } catch (error) {
          console.error('Error fetching attendance data:', error);
          toast({
            title: 'Error',
            description: 'Gagal memuat data absensi',
            variant: 'destructive',
          });
        }
      }

      // Fetch users untuk menampilkan nama
      if (user && (user.role === 'Admin' || user.role === 'MasterAdmin')) {
        try {
          const userData = await UserModel.getAll();
          setUsers(userData);
        } catch (error) {
          console.error('Error fetching users data:', error);
          toast({
            title: 'Error',
            description: 'Gagal memuat data pengguna',
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      console.error('Error fetching attendances:', error);
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan saat memuat data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAttendances();
    }
  }, [user, dateFilter]);

  // Filter absensi berdasarkan pencarian
  useEffect(() => {
    if (!searchTerm) {
      setFilteredAttendances(attendances);
      return;
    }

    const filtered = attendances.filter((attendance) => {
      // Jika Admin/MasterAdmin, cari berdasarkan nama user
      if (user?.role === 'Admin' || user?.role === 'MasterAdmin') {
        const attendanceUser = users.find((u) => u.id === attendance.user_id);
        return (
          attendanceUser?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          attendanceUser?.email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      // Jika Kurir/PIC, cari berdasarkan tanggal atau lokasi
      return (
        attendance.date.toLowerCase().includes(searchTerm.toLowerCase()) ||
        attendance.check_in_location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        attendance.check_out_location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });

    setFilteredAttendances(filtered);
  }, [attendances, searchTerm, users, user]);

  // Fungsi untuk mendapatkan lokasi saat ini
  const getLocation = async () => {
    try {
      setIsLoadingLocation(true);
      setLocationError(null);
      const location = await getCurrentPosition();
      setCurrentLocation(location);
      return location;
    } catch (error: any) {
      console.error('Error getting location:', error);
      setLocationError(error.message || 'Gagal mendapatkan lokasi');
      toast.error('Gagal mendapatkan lokasi. Pastikan GPS aktif dan izin lokasi diberikan.');
      return null;
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Fungsi untuk mengambil foto
  const capturePhoto = async () => {
    try {
      setIsTakingPhoto(true);
      setPhotoError(null);
      const photoData = await takePhoto({
        quality: 90,
        width: 1024,
        height: 1024,
        promptLabelHeader: photoAction === 'check-in' ? 'Foto Check-In' : 'Foto Check-Out',
        promptLabelCancel: 'Batal',
        promptLabelPhoto: 'Ambil Foto'
      });
      setPhoto(photoData);
      return photoData;
    } catch (error: any) {
      console.error('Error taking photo:', error);
      setPhotoError(error.message || 'Gagal mengambil foto');
      toast.error('Gagal mengambil foto. Pastikan izin kamera diberikan.');
      return null;
    } finally {
      setIsTakingPhoto(false);
    }
  };

  // Fungsi untuk memulai proses check-in dengan foto
  const startCheckInWithPhoto = () => {
    setPhotoAction('check-in');
    setShowPhotoPreview(true);
    capturePhoto();
  };

  // Fungsi untuk memulai proses check-out dengan foto
  const startCheckOutWithPhoto = () => {
    setPhotoAction('check-out');
    setShowPhotoPreview(true);
    capturePhoto();
  };

  // Fungsi untuk melakukan check-in
  const handleCheckIn = async () => {
    if (!user || !photo) return;

    try {
      setIsCheckingIn(true);
      
      // Mendapatkan lokasi saat ini
      const location = await getLocation();
      if (!location) {
        toast.error('Check-in gagal: Tidak dapat mendapatkan lokasi');
        return;
      }
      
      const locationString = location.address || 
        `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
      
      // Dalam implementasi nyata, upload foto ke server dan simpan URL-nya
      // Untuk contoh ini, kita anggap foto sudah disimpan dan kita gunakan base64 string
      const photoUrl = photo.dataUrl;
      
      await AttendanceModel.checkIn(user.id, locationString, photoUrl);
      toast.success('Check-in berhasil!');
      await fetchAttendances(); // Refresh data
      setShowPhotoPreview(false);
      setPhoto(null);
    } catch (error: any) {
      console.error('Error checking in:', error);
      toast.error(error.message || 'Check-in gagal. Silakan coba lagi.');
    } finally {
      setIsCheckingIn(false);
    }
  };

  // Fungsi untuk melakukan check-out
  const handleCheckOut = async () => {
    if (!user || !todayAttendance || !photo) return;

    try {
      setIsCheckingOut(true);
      
      // Mendapatkan lokasi saat ini
      const location = await getLocation();
      if (!location) {
        toast.error('Check-out gagal: Tidak dapat mendapatkan lokasi');
        return;
      }
      
      const locationString = location.address || 
        `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
      
      // Dalam implementasi nyata, upload foto ke server dan simpan URL-nya
      // Untuk contoh ini, kita anggap foto sudah disimpan dan kita gunakan base64 string
      const photoUrl = photo.dataUrl;
      
      await AttendanceModel.checkOut(todayAttendance.id, locationString, photoUrl);
      toast.success('Check-out berhasil!');
      await fetchAttendances(); // Refresh data
      setShowPhotoPreview(false);
      setPhoto(null);
    } catch (error: any) {
      console.error('Error checking out:', error);
      toast.error(error.message || 'Check-out gagal. Silakan coba lagi.');
    } finally {
      setIsCheckingOut(false);
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
  const formatTime = (timeString: string | null) => {
    if (!timeString) return '-';
    return new Date(timeString).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Fungsi untuk mendapatkan nama user berdasarkan ID
  const getUserName = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    return user?.full_name || 'Unknown';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Dialog Preview Foto */}
        <Dialog open={showPhotoPreview} onOpenChange={setShowPhotoPreview}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {photoAction === 'check-in' ? 'Konfirmasi Check-In' : 'Konfirmasi Check-Out'}
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col space-y-4">
              {photo ? (
                <div className="flex flex-col items-center space-y-4">
                  <img 
                    src={photo.dataUrl} 
                    alt="Preview" 
                    className="rounded-md max-h-[300px] object-cover" 
                  />
                  <div className="text-sm text-muted-foreground">
                    Foto diambil pada {new Date().toLocaleString()}
                  </div>
                  <div className="flex space-x-2 w-full">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => {
                        setPhoto(null);
                        capturePhoto();
                      }}
                    >
                      Ambil Ulang
                    </Button>
                    <Button 
                      className="flex-1"
                      onClick={photoAction === 'check-in' ? handleCheckIn : handleCheckOut}
                      disabled={isCheckingIn || isCheckingOut}
                    >
                      {isCheckingIn || isCheckingOut ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Memproses...
                        </>
                      ) : (
                        <>Konfirmasi</>
                      )}
                    </Button>
                  </div>
                </div>
              ) : photoError ? (
                <div className="flex flex-col items-center space-y-4">
                  <div className="text-red-500 flex items-center">
                    <AlertCircle className="mr-2 h-5 w-5" />
                    <span>{photoError}</span>
                  </div>
                  <Button onClick={capturePhoto}>
                    Coba Lagi
                  </Button>
                </div>
              ) : (
                <div className="flex justify-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Absensi</h1>
            <p className="text-muted-foreground">Kelola absensi harian</p>
          </div>

          {/* Tombol Check-in/Check-out - Hanya untuk Kurir dan PIC */}
          <RoleBasedContent allowedRoles={['Kurir', 'PIC']}>
            <div className="flex flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0">
              {!todayAttendance ? (
                <Button 
                  onClick={startCheckInWithPhoto} 
                  disabled={isCheckingIn || isLoadingLocation || isTakingPhoto}
                  className="flex items-center"
                >
                  {isCheckingIn || isLoadingLocation || isTakingPhoto ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="mr-2 h-4 w-4" />
                  )}
                  {isTakingPhoto ? 'Mengambil Foto...' : 
                   isLoadingLocation ? 'Mendapatkan Lokasi...' : 'Check In dengan Foto'}
                </Button>
              ) : !todayAttendance.check_out_time ? (
                <Button 
                  onClick={startCheckOutWithPhoto} 
                  disabled={isCheckingOut || isLoadingLocation || isTakingPhoto}
                  className="flex items-center"
                >
                  {isCheckingOut || isLoadingLocation || isTakingPhoto ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="mr-2 h-4 w-4" />
                  )}
                  {isTakingPhoto ? 'Mengambil Foto...' : 
                   isLoadingLocation ? 'Mendapatkan Lokasi...' : 'Check Out dengan Foto'}
                </Button>
              ) : (
                <Badge className="bg-green-500 text-white px-3 py-2">
                  Absensi Hari Ini Selesai
                </Badge>
              )}
              
              {currentLocation && (
                <div className="text-sm text-muted-foreground flex items-center">
                  <MapPin className="mr-1 h-4 w-4" />
                  <span className="truncate max-w-[200px]">
                    {currentLocation.address || 
                     `${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}`}
                  </span>
                </div>
              )}
              
              {locationError && (
                <div className="text-sm text-red-500 flex items-center">
                  <AlertCircle className="mr-1 h-4 w-4" />
                  <span>{locationError}</span>
                </div>
              )}
              
              {photoError && (
                <div className="text-sm text-red-500 flex items-center">
                  <AlertCircle className="mr-1 h-4 w-4" />
                  <span>{photoError}</span>
                </div>
              )}
            </div>
          </RoleBasedContent>
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
                  <Label htmlFor="search">
                    {user?.role === 'Admin' || user?.role === 'MasterAdmin'
                      ? 'Cari Pengguna'
                      : 'Cari Absensi'}
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder={
                        user?.role === 'Admin' || user?.role === 'MasterAdmin'
                          ? 'Cari berdasarkan nama atau email'
                          : 'Cari berdasarkan tanggal atau lokasi'
                      }
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <Button variant="outline" onClick={() => fetchAttendances()}>
                <RefreshCw className="mr-2 h-4 w-4" /> Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabel Absensi */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Absensi</CardTitle>
            <CardDescription>
              {filteredAttendances.length} absensi ditemukan
              {user?.role === 'Admin' || user?.role === 'MasterAdmin'
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
            ) : filteredAttendances.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-lg font-medium">Tidak ada absensi ditemukan</p>
                <p className="text-sm text-muted-foreground">
                  {user?.role === 'Admin' || user?.role === 'MasterAdmin'
                    ? 'Coba ubah tanggal atau kata kunci pencarian Anda'
                    : 'Belum ada data absensi untuk ditampilkan'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {(user?.role === 'Admin' || user?.role === 'MasterAdmin') && (
                        <TableHead>Nama</TableHead>
                      )}
                      <TableHead>Tanggal</TableHead>
                      <TableHead>
                        <div className="flex items-center">
                          <Clock className="mr-2 h-4 w-4" /> Check In
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center">
                          <Clock className="mr-2 h-4 w-4" /> Check Out
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center">
                          <MapPin className="mr-2 h-4 w-4" /> Lokasi Check In
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center">
                          <MapPin className="mr-2 h-4 w-4" /> Lokasi Check Out
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAttendances.map((attendance) => (
                      <TableRow key={attendance.id}>
                        {(user?.role === 'Admin' || user?.role === 'MasterAdmin') && (
                          <TableCell className="font-medium">
                            {getUserName(attendance.user_id)}
                          </TableCell>
                        )}
                        <TableCell>{formatDate(attendance.date)}</TableCell>
                        <TableCell>{formatTime(attendance.check_in_time)}</TableCell>
                        <TableCell>{formatTime(attendance.check_out_time)}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {attendance.check_in_location || '-'}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {attendance.check_out_location || '-'}
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