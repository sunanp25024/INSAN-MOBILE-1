import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Users, MapPin, Activity, TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { RoleBasedContent } from '@/components/auth/role-based-content';

interface DashboardStats {
  totalPackages: number;
  pendingPackages: number;
  deliveredPackages: number;
  totalUsers: number;
  totalLocations: number;
  todayDeliveries: number;
  monthlyDeliveries: number;
  activeUsers: number;
}

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalPackages: 0,
    pendingPackages: 0,
    deliveredPackages: 0,
    totalUsers: 0,
    totalLocations: 0,
    todayDeliveries: 0,
    monthlyDeliveries: 0,
    activeUsers: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch data based on user role
        const userRole = user.user_metadata?.role || 'Kurir';
        
        if (userRole === 'Admin' || userRole === 'MasterAdmin') {
          // Admin can see all data
          const [packagesRes, usersRes, locationsRes] = await Promise.all([
            supabase.from('packages').select('status'),
            supabase.from('users').select('id, last_sign_in_at'),
            supabase.from('locations').select('id')
          ]);

          if (packagesRes.error) throw packagesRes.error;
          if (usersRes.error) throw usersRes.error;
          if (locationsRes.error) throw locationsRes.error;

          const packages = packagesRes.data || [];
          const users = usersRes.data || [];
          const locations = locationsRes.data || [];

          // Calculate today's deliveries
          const today = new Date().toISOString().split('T')[0];
          const { data: todayDeliveries } = await supabase
            .from('packages')
            .select('id')
            .eq('status', 'delivered')
            .gte('updated_at', today);

          // Calculate monthly deliveries
          const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
          const { data: monthlyDeliveries } = await supabase
            .from('packages')
            .select('id')
            .eq('status', 'delivered')
            .gte('updated_at', monthStart);

          // Calculate active users (signed in within last 7 days)
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
          const activeUsers = users.filter(u => 
            u.last_sign_in_at && new Date(u.last_sign_in_at) > new Date(weekAgo)
          ).length;

          setStats({
            totalPackages: packages.length,
            pendingPackages: packages.filter(p => p.status === 'process').length,
            deliveredPackages: packages.filter(p => p.status === 'delivered').length,
            totalUsers: users.length,
            totalLocations: locations.length,
            todayDeliveries: todayDeliveries?.length || 0,
            monthlyDeliveries: monthlyDeliveries?.length || 0,
            activeUsers
          });
        } else if (userRole === 'Kurir') {
          // Courier can only see their own packages
          const { data: packages, error: packagesError } = await supabase
            .from('packages')
            .select('status, last_update_time')
            .eq('assigned_courier_id', user.id);

          if (packagesError) throw packagesError;

          const packageList = packages || [];
          const today = new Date().toISOString().split('T')[0];
          const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

          setStats({
            totalPackages: packageList.length,
            pendingPackages: packageList.filter(p => p.status === 'process').length,
            deliveredPackages: packageList.filter(p => p.status === 'delivered').length,
            todayDeliveries: packageList.filter(p => 
              p.status === 'delivered' && p.last_update_time >= today
            ).length,
            monthlyDeliveries: packageList.filter(p => 
              p.status === 'delivered' && p.last_update_time >= monthStart
            ).length,
            totalUsers: 0,
            totalLocations: 0,
            activeUsers: 0
          });
        } else if (userRole === 'PIC') {
          // PIC can see packages for their location
          const { data: packages, error: packagesError } = await supabase
            .from('packages')
            .select('status, last_update_time')
            .eq('hub_location', user.user_metadata?.location_id);

          if (packagesError) throw packagesError;

          const packageList = packages || [];
          const today = new Date().toISOString().split('T')[0];
          const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

          setStats({
            totalPackages: packageList.length,
            pendingPackages: packageList.filter(p => p.status === 'process').length,
            deliveredPackages: packageList.filter(p => p.status === 'delivered').length,
            todayDeliveries: packageList.filter(p => 
              p.status === 'delivered' && p.last_update_time >= today
            ).length,
            monthlyDeliveries: packageList.filter(p => 
              p.status === 'delivered' && p.last_update_time >= monthStart
            ).length,
            totalUsers: 0,
            totalLocations: 0,
            activeUsers: 0
          });
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-4" />
            <p className="text-destructive">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline" 
              className="mt-4"
            >
              Retry
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's an overview of your delivery operations.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Paket</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPackages}</div>
              <p className="text-xs text-muted-foreground">
                Total packages in system
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paket Tertunda</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingPackages}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting delivery
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paket Terkirim</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.deliveredPackages}</div>
              <p className="text-xs text-muted-foreground">
                Successfully delivered
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pengiriman Hari Ini</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayDeliveries}</div>
              <p className="text-xs text-muted-foreground">
                Delivered today
              </p>
            </CardContent>
          </Card>
        </div>

        <RoleBasedContent allowedRoles={['Admin', 'MasterAdmin']}>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  Registered users
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Locations</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalLocations}</div>
                <p className="text-xs text-muted-foreground">
                  Active locations
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeUsers}</div>
                <p className="text-xs text-muted-foreground">
                  Active in last 7 days
                </p>
              </CardContent>
            </Card>
          </div>
        </RoleBasedContent>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Performance</CardTitle>
              <CardDescription>
                Delivery statistics for this month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Monthly Deliveries</span>
                  <Badge variant="secondary">{stats.monthlyDeliveries}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Today's Deliveries</span>
                  <Badge variant="secondary">{stats.todayDeliveries}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Completion Rate</span>
                  <Badge variant="secondary">
                    {stats.totalPackages > 0 
                      ? Math.round((stats.deliveredPackages / stats.totalPackages) * 100)
                      : 0}%
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks and shortcuts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <RoleBasedContent allowedRoles={['Admin', 'MasterAdmin', 'PIC']}>
                  <Button className="w-full justify-start" variant="outline">
                    <Package className="mr-2 h-4 w-4" />
                    Add New Package
                  </Button>
                </RoleBasedContent>
                <RoleBasedContent allowedRoles={['Admin', 'MasterAdmin']}>
                  <Button className="w-full justify-start" variant="outline">
                    <Users className="mr-2 h-4 w-4" />
                    Manage Users
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <MapPin className="mr-2 h-4 w-4" />
                    Manage Locations
                  </Button>
                </RoleBasedContent>
                <Button className="w-full justify-start" variant="outline">
                  <Activity className="mr-2 h-4 w-4" />
                  View Reports
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Future: Activity feed and recent deliveries */}
        {/* <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            Activity table will be implemented here
          </CardContent>
        </Card> */}

        {/* Future: Daily package input summary for PIC role */}
        {/* <RoleBasedContent allowedRoles={['PIC']}>
          <Card>
            <CardHeader>
              <CardTitle>Daily Package Input Summary</CardTitle>
            </CardHeader>
            <CardContent>
              Daily input summary will be implemented here
            </CardContent>
          </Card>
        </RoleBasedContent> */}
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;