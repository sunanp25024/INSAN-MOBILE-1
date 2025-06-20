'use client';

import { ReactNode, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AppLogo } from '@/components/icons/AppLogo';
import {
  BarChart3,
  Package,
  Users,
  Map,
  Calendar,
  Settings,
  LogOut,
  Menu,
  X,
  Home,
  Bell,
  User,
} from 'lucide-react';
import { RoleBasedContent } from '../auth/role-based-content';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handleLogout = async () => {
    await logout();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const getNavItems = () => {
    const items = [
      {
        name: 'Dashboard',
        icon: <Home className="h-5 w-5" />,
        href: '/dashboard',
        roles: ['MasterAdmin', 'Admin', 'PIC', 'Kurir'],
      },
      {
        name: 'Paket',
        icon: <Package className="h-5 w-5" />,
        href: '/dashboard/packages',
        roles: ['MasterAdmin', 'Admin', 'PIC', 'Kurir'],
      },
      {
        name: 'Pengiriman',
        icon: <Map className="h-5 w-5" />,
        href: '/dashboard/deliveries',
        roles: ['MasterAdmin', 'Admin', 'PIC', 'Kurir'],
      },
      {
        name: 'Absensi',
        icon: <Calendar className="h-5 w-5" />,
        href: '/dashboard/attendance',
        roles: ['MasterAdmin', 'Admin', 'PIC', 'Kurir'],
      },
      {
        name: 'Laporan',
        icon: <BarChart3 className="h-5 w-5" />,
        href: '/dashboard/reports',
        roles: ['MasterAdmin', 'Admin', 'PIC'],
      },
      {
        name: 'Pengguna',
        icon: <Users className="h-5 w-5" />,
        href: '/dashboard/users',
        roles: ['MasterAdmin', 'Admin'],
      },
      {
        name: 'Pengaturan',
        icon: <Settings className="h-5 w-5" />,
        href: '/dashboard/settings',
        roles: ['MasterAdmin', 'Admin', 'PIC', 'Kurir'],
      },
    ];

    return items.filter((item) => user && item.roles.includes(user.role));
  };

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background">
        {/* Sidebar untuk desktop */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-primary text-white transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <div className="flex h-16 items-center justify-between px-4 lg:justify-center">
            <div className="flex items-center space-x-2">
              <AppLogo className="h-8 w-8" />
              <span className="text-xl font-bold">INSAN MOBILE</span>
            </div>
            <button
              className="rounded-md p-2 text-white hover:bg-primary-foreground/10 lg:hidden"
              onClick={toggleSidebar}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="mt-4 px-4">
            <div className="mb-6 flex items-center space-x-3 rounded-lg bg-primary-foreground/10 p-3">
              <Avatar className="h-10 w-10 border-2 border-white">
                <AvatarImage src={user?.avatarUrl} alt={user?.fullName || 'User'} />
                <AvatarFallback>{user?.fullName ? getInitials(user.fullName) : 'U'}</AvatarFallback>
              </Avatar>
              <div className="overflow-hidden">
                <p className="truncate text-sm font-medium">{user?.fullName}</p>
                <p className="truncate text-xs opacity-80">{user?.role}</p>
              </div>
            </div>

            <nav className="space-y-1">
              {getNavItems().map((item) => (
                <Button
                  key={item.name}
                  variant="ghost"
                  className="w-full justify-start text-white hover:bg-primary-foreground/10"
                  onClick={() => {
                    router.push(item.href);
                    closeSidebar();
                  }}
                >
                  {item.icon}
                  <span className="ml-3">{item.name}</span>
                </Button>
              ))}

              <Button
                variant="ghost"
                className="w-full justify-start text-white hover:bg-primary-foreground/10"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5" />
                <span className="ml-3">Logout</span>
              </Button>
            </nav>
          </div>
        </aside>

        {/* Overlay untuk menutup sidebar di mobile */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={closeSidebar}
          ></div>
        )}

        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Header */}
          <header className="flex h-16 items-center justify-between border-b bg-card px-4 shadow-sm">
            <button
              className="rounded-md p-2 text-muted-foreground hover:bg-accent lg:hidden"
              onClick={toggleSidebar}
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500"></span>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/dashboard/profile')}
              >
                <User className="h-5 w-5" />
              </Button>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 overflow-auto p-4">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}