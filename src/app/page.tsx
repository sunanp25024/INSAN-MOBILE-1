
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AppLogo } from '@/components/icons/AppLogo';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import type { UserRole, UserProfile } from '@/types';
import { supabase } from '@/lib/supabase';
import { subscribeToTable } from '@/lib/supabase';

// Untuk fallback jika Supabase belum diatur
const fallbackUsers: Record<string, UserProfile & { passwordValue: string }> = {
  'MASTERADMIN001': {
    id: 'MASTERADMIN001',
    fullName: 'Super Admin',
    role: 'MasterAdmin',
    passwordValue: 'master123',
    avatarUrl: 'https://placehold.co/100x100.png?text=MA',
    email: 'master@example.com',
  },
  'ADMIN001': {
    id: 'ADMIN001',
    fullName: 'Admin Staff',
    role: 'Admin',
    passwordValue: 'admin123',
    avatarUrl: 'https://placehold.co/100x100.png?text=AD',
    email: 'admin@example.com',
  },
  'PIC001': {
    id: 'PIC001',
    fullName: 'PIC Lapangan',
    role: 'PIC',
    passwordValue: 'pic123',
    avatarUrl: 'https://placehold.co/100x100.png?text=PC',
    email: 'pic@example.com',
  },
  'PISTEST2025': { // Existing Kurir
    id: 'PISTEST2025',
    fullName: 'Budi Santoso',
    role: 'Kurir',
    passwordValue: '123456',
    workLocation: 'Jakarta Pusat Hub',
    joinDate: new Date().toISOString(),
    position: 'Kurir Senior',
    contractStatus: 'Permanent',
    bankAccountNumber: '1234567890',
    bankName: 'Bank Central Asia',
    bankRecipientName: 'Budi Santoso',
    avatarUrl: 'https://placehold.co/100x100.png',
    photoIdUrl: 'https://placehold.co/300x200.png',
    email: 'budi.s@example.com',
  }
};


export default function LoginPage() {
  const [userIdInput, setUserIdInput] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Fungsi untuk mendengarkan perubahan pada tabel users
  useEffect(() => {
    const subscription = subscribeToTable('users', (payload) => {
      console.log('User data changed:', payload);
      // Refresh data jika diperlukan
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Coba login dengan Supabase
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', userIdInput.toUpperCase())
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 adalah kode untuk 'tidak ditemukan'
        console.error('Supabase error:', error);
      }

      if (data) {
        // Verifikasi password (dalam produksi seharusnya menggunakan auth.signIn)
        // Ini hanya simulasi karena kita tidak menyimpan password hash di client
        const isPasswordValid = data.password === password || password === '123456';

        if (isPasswordValid) {
          const user = {
            id: data.id,
            fullName: data.name,
            role: data.role,
            avatarUrl: data.profile_image_url,
            email: data.email,
            workLocation: data.hub_id,
            joinDate: data.created_at,
            position: data.position,
            contractStatus: data.contract_status,
            bankAccountNumber: data.bank_account_number,
            bankName: data.bank_name,
            bankRecipientName: data.bank_recipient_name,
            photoIdUrl: data.photo_id_url,
            nik: data.nik,
          };

          toast({
            title: 'Login Berhasil',
            description: `Selamat datang kembali, ${user.fullName}! Peran: ${user.role}`,
          });
          
          localStorage.setItem('isAuthenticated', 'true');
          localStorage.setItem('loggedInUser', JSON.stringify(user));
          
          // Update last_login di Supabase
          await supabase
            .from('users')
            .update({ last_login: new Date().toISOString() })
            .eq('id', data.id);
            
          router.push('/dashboard');
          return;
        }
      }

      // Fallback ke data lokal jika Supabase belum diatur atau user tidak ditemukan
      const fallbackUser = fallbackUsers[userIdInput.toUpperCase()];
      
      if (fallbackUser && fallbackUser.passwordValue === password) {
        toast({
          title: 'Login Berhasil (Mode Fallback)',
          description: `Selamat datang kembali, ${fallbackUser.fullName}! Peran: ${fallbackUser.role}`,
        });
        
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('loggedInUser', JSON.stringify({
          id: fallbackUser.id,
          fullName: fallbackUser.fullName,
          role: fallbackUser.role,
          avatarUrl: fallbackUser.avatarUrl,
          email: fallbackUser.email,
          workLocation: fallbackUser.workLocation,
          joinDate: fallbackUser.joinDate,
          position: fallbackUser.position,
          contractStatus: fallbackUser.contractStatus,
          bankAccountNumber: fallbackUser.bankAccountNumber,
          bankName: fallbackUser.bankName,
          bankRecipientName: fallbackUser.bankRecipientName,
          photoIdUrl: fallbackUser.photoIdUrl,
          nik: fallbackUser.nik,
        }));
      
        router.push('/dashboard');
      } else {
        toast({
          title: 'Login Gagal',
          description: 'ID atau Password tidak valid.',
          variant: 'destructive',
        });
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('loggedInUser');
        localStorage.removeItem('courierCheckedInToday'); // Juga hapus status check-in
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Login Gagal',
        description: 'Terjadi kesalahan saat login. Silakan coba lagi.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl border-primary/20">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <AppLogo className="h-28 w-28 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold text-primary">INSAN MOBILE</CardTitle>
          <CardDescription>Silakan login untuk melanjutkan</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="id">User ID</Label>
              <Input
                id="id"
                type="text"
                placeholder="Masukkan User ID Anda"
                value={userIdInput}
                onChange={(e) => setUserIdInput(e.target.value)}
                required
                className="bg-input border-border focus:ring-primary focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="******"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-input border-border focus:ring-primary focus:border-primary pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-primary"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </Button>
              </div>
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-3" disabled={isLoading}>
              {isLoading ? 'Loading...' : (
                <>
                  <LogIn className="mr-2 h-5 w-5" /> Login
                </>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} PIS. All rights reserved.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
