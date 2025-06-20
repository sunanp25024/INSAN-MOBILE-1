
"use client";
import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { supabase, subscribeToTable, unsubscribeFromChannel, fetchDataFromTable } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Camera, ScanLine, PackagePlus, PackageCheck, PackageX, Upload, Info, Trash2, CheckCircle, XCircle, ChevronsUpDown, Calendar as CalendarIconLucide, AlertCircle, UserCheck as UserCheckIcon, UserCog, Users, Package as PackageIcon, Clock, TrendingUp, BarChart2, Activity, UserRoundCheck, UserRoundX, Truck, ListChecks, ArrowLeftRight, Filter as FilterIcon, Download as DownloadIcon, Search as SearchIcon, Briefcase } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { DailyPackageInput, PackageItem, UserProfile, AttendanceActivity, CourierWorkSummaryActivity, DashboardSummaryData, WeeklyShipmentSummary, MonthlySummaryData, Wilayah, Area, Hub } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from 'next/link';
import { Checkbox } from '@/components/ui/checkbox';
import { format, subDays, formatDistanceToNow, startOfWeek, endOfWeek, eachWeekOfInterval, getMonth, getYear } from 'date-fns';
import { id as indonesiaLocale } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ChartWrapper, 
  LazyWrapper,
  LazyBarChart,
  LazyPieChart,
  LazyLineChart,
  LazyResponsiveContainer,
  LazyBar,
  LazyXAxis,
  LazyYAxis,
  LazyCartesianGrid,
  LazyTooltip,
  LazyLegend,
  LazyPie,
  LazyCell,
  LazyLine
} from '@/components/lazy-wrapper';
import OptimizedImage, { OptimizedAvatar } from '@/components/optimized-image';
import { usePerformanceMonitoring } from '@/components/performance-monitor';

// Lazy load heavy components


// QR scanner removed as it's not used in the dashboard

const mockKurirProfileData: UserProfile = {
  id: 'PISTEST2025',
  fullName: 'Budi Santoso',
  role: 'Kurir',
  workLocation: 'Jakarta Pusat Hub',
  joinDate: new Date().toISOString(),
  position: 'Kurir Senior',
  contractStatus: 'Permanent',
  bankAccountNumber: '1234567890',
  bankName: 'Bank Central Asia',
  bankRecipientName: 'Budi Santoso',
  avatarUrl: 'https://placehold.co/100x100.png',
  photoIdUrl: 'https://placehold.co/300x200.png'
};

const packageInputSchema = z.object({
  totalPackages: z.coerce.number().min(1, "Total paket minimal 1").max(200, "Max 200 paket"),
  codPackages: z.coerce.number().min(0).max(200),
  nonCodPackages: z.coerce.number().min(0).max(200),
}).refine(data => data.codPackages + data.nonCodPackages === data.totalPackages, {
  message: "Jumlah paket COD dan Non-COD harus sama dengan Total Paket",
  path: ["totalPackages"],
});


const MotivationalQuotes = [
  "Setiap paket yang terkirim adalah senyum yang kau antarkan. Semangat!",
  "Hari ini adalah kesempatan baru untuk menjadi kurir terbaik!",
  "Kecepatan dan ketepatan adalah kunci kesuksesanmu. Terus bergerak!",
  "Jangan biarkan rintangan menghentikanmu. Kamu luar biasa!",
  "Terima kasih atas dedikasimu. Setiap langkahmu berarti!"
];

// Mock location data for filters
const mockLocations: Wilayah[] = [
  {
    id: 'all-wilayah', name: 'Semua Wilayah', areas: []
  },
  {
    id: 'jabodetabek-banten',
    name: 'Jabodetabek-Banten',
    areas: [
      { id: 'all-area-jb', name: 'Semua Area (Jabodetabek-Banten)', hubs: []},
      {
        id: 'jakarta-pusat-jb',
        name: 'Jakarta Pusat',
        hubs: [
          { id: 'all-hub-jp', name: 'Semua Hub (Jakarta Pusat)'},
          { id: 'jp-hub-thamrin', name: 'Hub Thamrin' },
          { id: 'jp-hub-sudirman', name: 'Hub Sudirman' },
        ],
      },
      {
        id: 'jakarta-timur-jb',
        name: 'Jakarta Timur',
        hubs: [
          { id: 'all-hub-jt', name: 'Semua Hub (Jakarta Timur)'},
          { id: 'jt-hub-cawang', name: 'Hub Cawang' },
          { id: 'jt-hub-rawamangun', name: 'Hub Rawamangun' },
        ],
      },
    ],
  },
  {
    id: 'jawa-barat',
    name: 'Jawa Barat',
    areas: [
      { id: 'all-area-jabar', name: 'Semua Area (Jawa Barat)', hubs: []},
      {
        id: 'bandung-kota-jabar',
        name: 'Bandung Kota',
        hubs: [
          { id: 'all-hub-bdg', name: 'Semua Hub (Bandung Kota)'},
          { id: 'bdg-hub-kota', name: 'Hub Bandung Kota' },
          { id: 'bdg-hub-dago', name: 'Hub Dago' },
        ],
      },
    ],
  },
];


export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [dailyInput, setDailyInput] = useState<DailyPackageInput | null>(null);
  const [managedPackages, setManagedPackages] = useState<PackageItem[]>([]);
  const [inTransitPackages, setInTransitPackages] = useState<PackageItem[]>([]);
  const [pendingReturnPackages, setPendingReturnPackages] = useState<PackageItem[]>([]);

  const [currentScannedResi, setCurrentScannedResi] = useState('');
  const [isManualCOD, setIsManualCOD] = useState(false);
  const [isScanning, setIsScanning] = useState(false); // For initial package input scan
  const [deliveryStarted, setDeliveryStarted] = useState(false);
  const [dayFinished, setDayFinished] = useState(false);

  const [motivationalQuote, setMotivationalQuote] = useState('');
  const [returnProofPhoto, setReturnProofPhoto] = useState<File | null>(null);
  const [returnLeadReceiverName, setReturnLeadReceiverName] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const photoCanvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [packagePhotoMap, setPackagePhotoMap] = useState<Record<string, string>>({});
  const [capturingForPackageId, setCapturingForPackageId] = useState<string | null>(null);
  const [photoRecipientName, setPhotoRecipientName] = useState('');
  const [isCourierCheckedIn, setIsCourierCheckedIn] = useState<boolean | null>(null);
  const [isScanningForDeliveryUpdate, setIsScanningForDeliveryUpdate] = useState(false); // For delivery update scan
  
  const scannerControlsRef = useRef<IScannerControls | null>(null);

  // Dashboard states for managerial roles
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummaryData | null>(null);
  const [attendanceActivities, setAttendanceActivities] = useState<AttendanceActivity[]>([]);
  const [courierWorkSummaries, setCourierWorkSummaries] = useState<CourierWorkSummaryActivity[]>([]);

  // Filter states
  const [selectedWilayah, setSelectedWilayah] = useState<string>('all-wilayah');
  const [selectedArea, setSelectedArea] = useState<string>('all-area');
  const [selectedHub, setSelectedHub] = useState<string>('all-hub');
  const [searchKurir, setSearchKurir] = useState<string>('');
  const [areaOptions, setAreaOptions] = useState<Area[]>([]);
  const [hubOptions, setHubOptions] = useState<Hub[]>([]);

  const { toast } = useToast();

  const { register, handleSubmit: handlePackageFormSubmit, watch, formState: { errors }, setValue, reset: resetPackageInputForm } = useForm<DailyPackageInput>({
    resolver: zodResolver(packageInputSchema),
    defaultValues: { totalPackages: 0, codPackages: 0, nonCodPackages: 0 }
  });

  const generateInitialDashboardSummary = (isFiltered = false): DashboardSummaryData => {
    const today = new Date();
    let baseActiveCouriers = Math.floor(Math.random() * 15) + 5;
    let basePackagesProcessed = Math.floor(Math.random() * 200) + 100;
    let basePackagesDelivered = Math.floor(Math.random() * (basePackagesProcessed - 20)) + (basePackagesProcessed > 100 ? 80 : 30);
    
    if (isFiltered) { 
        baseActiveCouriers = Math.floor(baseActiveCouriers * (Math.random() * 0.5 + 0.3)); 
        basePackagesProcessed = Math.floor(basePackagesProcessed * (Math.random() * 0.5 + 0.3));
        basePackagesDelivered = Math.floor(basePackagesDelivered * (Math.random() * 0.5 + 0.3));
        basePackagesDelivered = Math.min(basePackagesDelivered, basePackagesProcessed - Math.floor(basePackagesProcessed*0.1)); 
    }
    baseActiveCouriers = Math.max(1, baseActiveCouriers);
    basePackagesProcessed = Math.max(5, basePackagesProcessed);
    basePackagesDelivered = Math.max(0, basePackagesDelivered);


    const dailySummary = Array.from({ length: 7 }).map((_, i) => {
      const day = subDays(today, 6 - i);
      const delivered = Math.floor(Math.random() * (isFiltered ? 50 : 100)) + (isFiltered ? 10 : 50);
      const pending = Math.floor(Math.random() * (isFiltered ? 10 : 20)) + (isFiltered ? 1 : 5);
      return {
        date: day.toISOString(),
        name: format(day, 'dd/MM', { locale: indonesiaLocale }),
        terkirim: delivered,
        pending: pending,
      };
    });

    const weeklySummary: WeeklyShipmentSummary[] = [];
    const currentMonthWeeks = eachWeekOfInterval({
      start: startOfWeek(new Date(getYear(today), getMonth(today), 1), { weekStartsOn: 1 }),
      end: endOfWeek(new Date(getYear(today), getMonth(today) +1, 0), { weekStartsOn: 1 })
    }, { weekStartsOn: 1 });
    
    currentMonthWeeks.slice(-4).forEach((weekStart, index) => { 
      weeklySummary.push({
        week: `Minggu ${index + 1}`,
        terkirim: Math.floor(Math.random() * (isFiltered ? 150 : 300)) + (isFiltered ? 50 : 200),
        pending: Math.floor(Math.random() * (isFiltered ? 25 : 50)) + (isFiltered ? 5 : 10),
      });
    });

    const monthlySummary: MonthlySummaryData[] = Array.from({length: 3}).map((_, i) => {
      const monthDate = new Date(today.getFullYear(), today.getMonth() - (2-i), 1);
      const delivered = Math.floor(Math.random() * (isFiltered ? 600 : 1200)) + (isFiltered ? 200 : 800);
      const pending = Math.floor(Math.random() * (isFiltered ? 100 : 200)) + (isFiltered ? 20 : 50);
      return {
        month: format(monthDate, 'MMM yyyy', {locale: indonesiaLocale}),
        totalDelivered: delivered,
        totalPending: pending,
        successRate: (delivered / (delivered + pending)) * 100,
      };
    });

    return {
      activeCouriersToday: baseActiveCouriers,
      totalPackagesProcessedToday: basePackagesProcessed,
      totalPackagesDeliveredToday: basePackagesDelivered,
      onTimeDeliveryRateToday: Math.floor(Math.random() * 15) + 85,
      dailyShipmentSummary: dailySummary,
      weeklyShipmentSummary: weeklySummary,
      monthlyPerformanceSummary: monthlySummary,
    };
  };

// Referensi untuk channel realtime
  const attendanceChannelRef = useRef<RealtimeChannel | null>(null);
  const packageChannelRef = useRef<RealtimeChannel | null>(null);
  const dailyInputChannelRef = useRef<RealtimeChannel | null>(null);
  const deliveryActivitiesChannelRef = useRef<RealtimeChannel | null>(null);
  
  useEffect(() => {
    const userDataString = localStorage.getItem('loggedInUser');
    if (userDataString) {
      try {
        const parsedUser = JSON.parse(userDataString) as UserProfile;
        setCurrentUser(parsedUser);

        if (parsedUser.role !== 'Kurir') {
          // Mengambil data dashboard dari Supabase
          const fetchDashboardData = async () => {
            try {
              // Mengambil data attendance records dari Supabase
              const attendanceData = await fetchDataFromTable('attendance_records');
              if (attendanceData) {
                // Mengambil data user untuk mendapatkan nama kurir
                const usersData = await fetchDataFromTable('users');
                
                if (usersData) {
                  // Mengkonversi data attendance dari Supabase ke format aplikasi
                  const attendanceActivities: AttendanceActivity[] = attendanceData.map((record: any) => {
                    const user = usersData.find((u: any) => u.id === record.user_id);
                    const action = record.check_in_time && !record.check_out_time ? 'check-in' : 
                                  record.check_out_time ? 'check-out' : 'reported-late';
                    const timestamp = record.check_in_time ? 
                                    new Date(`${record.date}T${record.check_in_time}`).valueOf().toString() :
                                    new Date(`${record.date}T${record.check_out_time}`).valueOf().toString();
                    
                    // Mengambil data lokasi dari Supabase jika tersedia
                    const location = record.location;
                    
                    return {
                      id: record.id,
                      kurirName: user ? user.name : 'Unknown User',
                      kurirId: user ? user.username : 'Unknown ID',
                      action,
                      timestamp,
                      location
                    };
                  }).sort((a, b) => parseInt(b.timestamp) - parseInt(a.timestamp));
                  
                  setAttendanceActivities(attendanceActivities);
                }
              } else {
                // Fallback ke data mock jika tidak ada data dari Supabase
                const mockAttendance: AttendanceActivity[] = [
                  { id: 'att1', kurirName: 'Budi Santoso', kurirId: 'PISTEST2025', action: 'check-in', timestamp: subDays(new Date(), 0).setHours(7, 55, 0, 0).valueOf().toString(), location: 'Jakarta Pusat Hub (Thamrin)' },
                  { id: 'att2', kurirName: 'Ani Yudhoyono', kurirId: 'KURIR002', action: 'check-in', timestamp: subDays(new Date(), 0).setHours(8, 5, 0, 0).valueOf().toString(), location: 'Bandung Kota Hub (Kota)' },
                  { id: 'att3', kurirName: 'Charlie Van Houten', kurirId: 'KURIR003', action: 'reported-late', timestamp: subDays(new Date(), 0).setHours(9, 15, 0, 0).valueOf().toString(), location: 'Surabaya Timur Hub (Cawang)' }, 
                  { id: 'att4', kurirName: 'Budi Santoso', kurirId: 'PISTEST2025', action: 'check-out', timestamp: subDays(new Date(), 0).setHours(17, 2, 0, 0).valueOf().toString(), location: 'Jakarta Pusat Hub (Thamrin)' },
                ].sort((a,b) => parseInt(b.timestamp) - parseInt(a.timestamp));
                setAttendanceActivities(mockAttendance);
              }
              
              // Mengambil data packages dan delivery_activities untuk membuat courier work summaries
              const packagesData = await fetchDataFromTable('packages');
              const deliveryActivitiesData = await fetchDataFromTable('delivery_activities');
              
              if (packagesData && deliveryActivitiesData && usersData) {
                // Mengelompokkan paket berdasarkan kurir dan menghitung statistik
                const courierWorkSummaries: CourierWorkSummaryActivity[] = [];
                const courierPackages: Record<string, { assigned: number, delivered: number, pending: number }> = {};
                
                // Menghitung jumlah paket per kurir
                packagesData.forEach((pkg: any) => {
                  if (pkg.courier_id) {
                    if (!courierPackages[pkg.courier_id]) {
                      courierPackages[pkg.courier_id] = { assigned: 0, delivered: 0, pending: 0 };
                    }
                    courierPackages[pkg.courier_id].assigned++;
                    
                    if (pkg.status === 'delivered') {
                      courierPackages[pkg.courier_id].delivered++;
                    } else if (['pending', 'returned'].includes(pkg.status)) {
                      courierPackages[pkg.courier_id].pending++;
                    }
                  }
                });
                
                // Membuat ringkasan kerja kurir
                Object.entries(courierPackages).forEach(([courierId, stats], index) => {
                  const user = usersData.find((u: any) => u.id === courierId);
                  if (user) {
                    // Mencari lokasi hub kurir
                    const hubLocation = user.hub_id ? 'Hub Location' : 'Unknown Hub';
                    
                    courierWorkSummaries.push({
                      id: `sum${index + 1}`,
                      kurirName: user.name,
                      kurirId: user.username,
                      hubLocation,
                      timestamp: new Date().valueOf().toString(),
                      totalPackagesAssigned: stats.assigned,
                      packagesDelivered: stats.delivered,
                      packagesPendingOrReturned: stats.pending
                    });
                  }
                });
                
                setCourierWorkSummaries(courierWorkSummaries.sort((a, b) => parseInt(b.timestamp) - parseInt(a.timestamp)));
              } else {
                // Fallback ke data mock jika tidak ada data dari Supabase
                const mockCourierWorkSummariesData: CourierWorkSummaryActivity[] = [
                  { id: 'sum1', kurirName: 'Budi Santoso', kurirId: 'PISTEST2025', hubLocation: 'Jakarta Pusat Hub (Thamrin)', timestamp: subDays(new Date(), 0).setHours(17, 5, 0, 0).valueOf().toString(), totalPackagesAssigned: 50, packagesDelivered: 48, packagesPendingOrReturned: 2 },
                  { id: 'sum2', kurirName: 'Ani Yudhoyono', kurirId: 'KURIR002', hubLocation: 'Bandung Kota Hub (Kota)', timestamp: subDays(new Date(), 0).setHours(17, 30, 0, 0).valueOf().toString(), totalPackagesAssigned: 45, packagesDelivered: 40, packagesPendingOrReturned: 5 },
                  { id: 'sum3', kurirName: 'Dewi Persik', kurirId: 'KURIR004', hubLocation: 'Medan Barat Hub', timestamp: subDays(new Date(), 1).setHours(18, 0, 0, 0).valueOf().toString(), totalPackagesAssigned: 55, packagesDelivered: 55, packagesPendingOrReturned: 0 },
                ].sort((a,b) => parseInt(b.timestamp) - parseInt(a.timestamp));
                setCourierWorkSummaries(mockCourierWorkSummariesData);
              }
              
              // Mengambil data lokasi dari Supabase
              const locationsData = await fetchDataFromTable('locations');
              if (locationsData) {
                // Memproses data lokasi untuk dropdown filter
                // Untuk sementara tetap menggunakan mockLocations karena struktur data berbeda
                const allAreasOption: Area = { id: 'all-area', name: 'Semua Area', hubs: [] };
                let initialAreas: Area[] = [allAreasOption];
                mockLocations.forEach(w => {
                  if (w.id !== 'all-wilayah') {
                    w.areas.forEach(area => {
                      if(!area.id.startsWith('all-area-')){ // Don't add specific "Semua Area (Wilayah X)" to global list
                          initialAreas.push(area);
                          area.hubs.forEach(hub => {
                              if(!hub.id.startsWith('all-hub-') && !allAreasOption.hubs.find(h => h.id === hub.id)) {
                                 allAreasOption.hubs.push(hub); // Add unique hubs to "Semua Area"
                              }
                          })
                      }
                    });
                  }
                });
                setAreaOptions(initialAreas);

                const allHubsOption: Hub = { id: 'all-hub', name: 'Semua Hub' };
                let initialHubs: Hub[] = [allHubsOption];
                allAreasOption.hubs.forEach(hub => initialHubs.push(hub)); // Start with hubs from "Semua Area"
                setHubOptions(initialHubs);
              }
              
              // Menghasilkan data ringkasan dashboard
              setDashboardSummary(generateInitialDashboardSummary());
              
              // Setup realtime subscriptions untuk update data
              attendanceChannelRef.current = subscribeToTable('attendance_records', (payload) => {
                // Update attendance activities ketika ada perubahan
                fetchDashboardData();
              });
              
              packageChannelRef.current = subscribeToTable('packages', (payload) => {
                // Update dashboard data ketika ada perubahan pada paket
                fetchDashboardData();
              });
              
              dailyInputChannelRef.current = subscribeToTable('daily_package_inputs', (payload) => {
                // Update dashboard data ketika ada perubahan pada input paket harian
                fetchDashboardData();
              });
              
              deliveryActivitiesChannelRef.current = subscribeToTable('delivery_activities', (payload) => {
                // Update dashboard data ketika ada perubahan pada aktivitas pengiriman
                fetchDashboardData();
              });
              
            } catch (error) {
              console.error('Error fetching dashboard data from Supabase:', error);
              // Fallback ke data mock jika terjadi error
              setDashboardSummary(generateInitialDashboardSummary());
              
              const mockAttendance: AttendanceActivity[] = [
                { id: 'att1', kurirName: 'Budi Santoso', kurirId: 'PISTEST2025', action: 'check-in', timestamp: subDays(new Date(), 0).setHours(7, 55, 0, 0).valueOf().toString(), location: 'Jakarta Pusat Hub (Thamrin)' },
                { id: 'att2', kurirName: 'Ani Yudhoyono', kurirId: 'KURIR002', action: 'check-in', timestamp: subDays(new Date(), 0).setHours(8, 5, 0, 0).valueOf().toString(), location: 'Bandung Kota Hub (Kota)' },
                { id: 'att3', kurirName: 'Charlie Van Houten', kurirId: 'KURIR003', action: 'reported-late', timestamp: subDays(new Date(), 0).setHours(9, 15, 0, 0).valueOf().toString(), location: 'Surabaya Timur Hub (Cawang)' }, 
                { id: 'att4', kurirName: 'Budi Santoso', kurirId: 'PISTEST2025', action: 'check-out', timestamp: subDays(new Date(), 0).setHours(17, 2, 0, 0).valueOf().toString(), location: 'Jakarta Pusat Hub (Thamrin)' },
              ].sort((a,b) => parseInt(b.timestamp) - parseInt(a.timestamp));
              setAttendanceActivities(mockAttendance);
              
              const mockCourierWorkSummariesData: CourierWorkSummaryActivity[] = [
                { id: 'sum1', kurirName: 'Budi Santoso', kurirId: 'PISTEST2025', hubLocation: 'Jakarta Pusat Hub (Thamrin)', timestamp: subDays(new Date(), 0).setHours(17, 5, 0, 0).valueOf().toString(), totalPackagesAssigned: 50, packagesDelivered: 48, packagesPendingOrReturned: 2 },
                { id: 'sum2', kurirName: 'Ani Yudhoyono', kurirId: 'KURIR002', hubLocation: 'Bandung Kota Hub (Kota)', timestamp: subDays(new Date(), 0).setHours(17, 30, 0, 0).valueOf().toString(), totalPackagesAssigned: 45, packagesDelivered: 40, packagesPendingOrReturned: 5 },
                { id: 'sum3', kurirName: 'Dewi Persik', kurirId: 'KURIR004', hubLocation: 'Medan Barat Hub', timestamp: subDays(new Date(), 1).setHours(18, 0, 0, 0).valueOf().toString(), totalPackagesAssigned: 55, packagesDelivered: 55, packagesPendingOrReturned: 0 },
              ].sort((a,b) => parseInt(b.timestamp) - parseInt(a.timestamp));
              setCourierWorkSummaries(mockCourierWorkSummariesData);
              
              const allAreasOption: Area = { id: 'all-area', name: 'Semua Area', hubs: [] };
              let initialAreas: Area[] = [allAreasOption];
              mockLocations.forEach(w => {
                if (w.id !== 'all-wilayah') {
                  w.areas.forEach(area => {
                    if(!area.id.startsWith('all-area-')){
                        initialAreas.push(area);
                        area.hubs.forEach(hub => {
                            if(!hub.id.startsWith('all-hub-') && !allAreasOption.hubs.find(h => h.id === hub.id)) {
                               allAreasOption.hubs.push(hub);
                            }
                        })
                    }
                  });
                }
              });
              setAreaOptions(initialAreas);

              const allHubsOption: Hub = { id: 'all-hub', name: 'Semua Hub' };
              let initialHubs: Hub[] = [allHubsOption];
              allAreasOption.hubs.forEach(hub => initialHubs.push(hub));
              setHubOptions(initialHubs);
            }
          };
          
          fetchDashboardData();
        }
      } catch (error) {
        console.error("Failed to parse user data from localStorage for dashboard", error);
      }
    }
    
    // Cleanup function untuk unsubscribe dari channel realtime
    return () => {
      if (attendanceChannelRef.current) {
        unsubscribeFromChannel(attendanceChannelRef.current);
      }
      if (packageChannelRef.current) {
        unsubscribeFromChannel(packageChannelRef.current);
      }
      if (dailyInputChannelRef.current) {
        unsubscribeFromChannel(dailyInputChannelRef.current);
      }
      if (deliveryActivitiesChannelRef.current) {
        unsubscribeFromChannel(deliveryActivitiesChannelRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (currentUser?.role !== 'Kurir') return;

    const updateCheckInStatus = async () => {
      try {
        // Cek status check-in dari localStorage terlebih dahulu untuk responsivitas UI
        const checkedInDate = localStorage.getItem('courierCheckedInToday');
        const today = new Date().toISOString().split('T')[0];
        const isCheckedInFromLocal = checkedInDate === today;
        setIsCourierCheckedIn(isCheckedInFromLocal);
        
        // Kemudian verifikasi dengan data dari Supabase
        if (currentUser?.id) {
          const { data: attendanceData, error } = await supabase
            .from('attendance_records')
            .select('*')
            .eq('user_id', currentUser.id)
            .eq('date', today)
            .maybeSingle();
          
          if (error) {
            console.error('Error fetching attendance data:', error);
            return;
          }
          
          // Update status check-in berdasarkan data dari Supabase
          const isCheckedInFromSupabase = !!attendanceData?.check_in_time;
          
          // Jika status dari Supabase berbeda dengan localStorage, update localStorage
          if (isCheckedInFromSupabase !== isCheckedInFromLocal) {
            if (isCheckedInFromSupabase) {
              localStorage.setItem('courierCheckedInToday', today);
            } else {
              localStorage.removeItem('courierCheckedInToday');
            }
            setIsCourierCheckedIn(isCheckedInFromSupabase);
          }
        }
      } catch (error) {
        console.error('Error in updateCheckInStatus:', error);
      }
    };

    updateCheckInStatus(); 

    // Setup realtime subscription untuk attendance_records
    const attendanceChannel = subscribeToTable('attendance_records', (payload) => {
      // Jika ada perubahan pada attendance_records yang terkait dengan user ini
      if (payload.new && payload.new.user_id === currentUser.id) {
        updateCheckInStatus();
      }
    });

    window.addEventListener('focus', updateCheckInStatus);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        updateCheckInStatus();
      }
    });

    return () => {
      window.removeEventListener('focus', updateCheckInStatus);
      document.removeEventListener('visibilitychange', updateCheckInStatus);
      if (attendanceChannel) {
        unsubscribeFromChannel(attendanceChannel);
      }
    };
  }, [currentUser]);

  useEffect(() => {
    setMotivationalQuote(MotivationalQuotes[Math.floor(Math.random() * MotivationalQuotes.length)]);
  }, []);

  // Effect for Camera Permission and Stream Setup
  useEffect(() => {
    let stream: MediaStream | null = null;
    const getCameraStream = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      } catch (err) {
        console.warn("Rear camera not accessible, trying default camera:", err);
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
        } catch (error) {
          console.error('Error accessing any camera:', error);
          setHasCameraPermission(false);
          toast({
            variant: 'destructive',
            title: 'Akses Kamera Gagal',
            description: 'Tidak dapat mengakses kamera. Mohon periksa izin kamera di browser Anda.',
          });
          setIsScanning(false);
          setCapturingForPackageId(null);
          setIsScanningForDeliveryUpdate(false);
          return;
        }
      }
      setHasCameraPermission(true);
      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(playError => console.error("Error playing video:", playError));
        }
      }
    };

    if (isScanning || capturingForPackageId || isScanningForDeliveryUpdate) {
      getCameraStream();
    }

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const currentStream = videoRef.current.srcObject as MediaStream;
        currentStream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      if (scannerControlsRef.current) {
        scannerControlsRef.current.stop();
        scannerControlsRef.current = null;
      }
    };
  }, [isScanning, capturingForPackageId, isScanningForDeliveryUpdate, toast]);


  // Effect for Barcode Scanning
  useEffect(() => {
    if ((isScanning || isScanningForDeliveryUpdate) && videoRef.current && hasCameraPermission) {
      const codeReader = new BrowserMultiFormatReader();
      
      const startScan = async () => {
        try {
          if (!videoRef.current || !videoRef.current.srcObject) {
            // console.log("Video stream not ready for scanning yet.");
            return;
          }
          await videoRef.current.play(); // Ensure video is playing

          const controls = await codeReader.decodeFromVideoElementContinuously(
            videoRef.current,
            (result, err, scanControls) => {
              if (scannerControlsRef.current === null && scanControls) {
                 scannerControlsRef.current = scanControls;
              }
              if (result) {
                if (scannerControlsRef.current) {
                    scannerControlsRef.current.stop();
                    scannerControlsRef.current = null;
                }
                const scannedText = result.getText();
                toast({ title: "Barcode Terbaca!", description: `Resi: ${scannedText}` });

                if (isScanning) { // Initial package input scan
                  setCurrentScannedResi(scannedText);
                  // Auto-add or require user to confirm? For now, auto-add.
                  // Need to consider if isManualCOD should be set or if it's determined later
                  if (dailyInput && managedPackages.length < dailyInput.totalPackages) {
                    const isCODForScanned = managedPackages.filter(p => p.isCOD).length < dailyInput.codPackages;
                     setManagedPackages(prev => [...prev, { id: scannedText, status: 'process', isCOD: isCODForScanned, lastUpdateTime: new Date().toISOString() }]);
                     setIsManualCOD(false); // Reset for next manual input if any
                     if (managedPackages.length + 1 === dailyInput.totalPackages) {
                        setIsScanning(false);
                     }
                  } else if (dailyInput) {
                    toast({ title: "Batas Paket Tercapai", description: "Jumlah paket yang di-scan sudah sesuai total.", variant: "destructive" });
                    setIsScanning(false);
                  }
                } else if (isScanningForDeliveryUpdate) { // Delivery update scan
                  const packageToUpdate = inTransitPackages.find(p => p.id === scannedText && p.status === 'in_transit');
                  if (packageToUpdate) {
                    handleOpenPackageCamera(packageToUpdate.id);
                  } else {
                    toast({
                      variant: 'destructive',
                      title: "Resi Tidak Cocok",
                      description: `Resi ${scannedText} tidak ditemukan dalam daftar paket yang sedang diantar atau sudah terupdate.`,
                    });
                  }
                  setIsScanningForDeliveryUpdate(false);
                }
              }
              if (err && !(err instanceof NotFoundException) && !(err instanceof ChecksumException) && !(err instanceof FormatException)) {
                console.error('Barcode scan error:', err);
                // toast({ title: 'Error Scan', description: 'Gagal membaca barcode.', variant: 'destructive' });
                // Don't show toast for every failed attempt, only for persistent errors if needed.
              }
            }
          );
          scannerControlsRef.current = controls;

        } catch (error) {
          console.error("Error starting barcode scanner:", error);
          toast({ title: 'Scanner Error', description: 'Tidak dapat memulai pemindai barcode.', variant: 'destructive' });
          setIsScanning(false);
          setIsScanningForDeliveryUpdate(false);
        }
      };

      // Ensure video is ready before starting scan
      if (videoRef.current.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) {
        startScan();
      } else {
        videoRef.current.oncanplay = () => {
          startScan();
          videoRef.current!.oncanplay = null; // Remove listener
        };
      }
    }

    return () => {
      if (scannerControlsRef.current) {
        scannerControlsRef.current.stop();
        scannerControlsRef.current = null;
      }
    };
  }, [isScanning, isScanningForDeliveryUpdate, hasCameraPermission, videoRef, toast, dailyInput, managedPackages, inTransitPackages]);


  const handleDailyPackageInputSubmit: SubmitHandler<DailyPackageInput> = async (data) => {
    try {
      // Simpan ke state lokal terlebih dahulu untuk UX yang responsif
      setDailyInput(data);
      
      // Simpan ke Supabase jika user sudah login
      if (currentUser?.id) {
        const today = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD
        
        const { data: supabaseData, error } = await supabase
          .from('daily_package_inputs')
          .insert([
            {
              user_id: currentUser.id,
              date: today,
              total_packages: parseInt(data.totalPackages.toString()),
              cod_packages: parseInt(data.codPackages.toString()),
              non_cod_packages: parseInt(data.nonCodPackages.toString())
            }
          ])
          .select();
        
        if (error) {
          console.error('Error saving daily package input to Supabase:', error);
          toast({ 
            title: "Data Tersimpan Lokal", 
            description: "Terjadi kesalahan saat menyimpan ke server. Data tetap tersimpan secara lokal.",
            variant: "warning"
          });
          return;
        }
        
        console.log('Daily package input saved to Supabase:', supabaseData);
      }
      
      toast({ title: "Data Paket Harian Disimpan", description: `Total ${data.totalPackages} paket akan diproses.` });
    } catch (error) {
      console.error('Error in handleDailyPackageInputSubmit:', error);
      toast({ 
        title: "Terjadi Kesalahan", 
        description: "Gagal menyimpan data paket. Silakan coba lagi.",
        variant: "destructive"
      });
    }
  };

  const handleStartScan = () => {
    if (!dailyInput) {
      toast({ title: "Input Data Paket Dulu", description: "Mohon isi total paket harian terlebih dahulu.", variant: "destructive" });
      return;
    }
    if (managedPackages.length >= dailyInput.totalPackages) {
      toast({ title: "Batas Paket Tercapai", description: "Jumlah paket yang di-scan sudah sesuai total.", variant: "destructive" });
      return;
    }
    setIsScanning(true);
  };

  const capturePhoto = () => {
    if (videoRef.current && photoCanvasRef.current && hasCameraPermission) {
      const video = videoRef.current;
      const canvas = photoCanvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context?.drawImage(video, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg');
    }
    return null;
  }

  const handleManualResiAdd = async () => {
    try {
      const resiToAdd = currentScannedResi.trim();
      if (!resiToAdd) {
        toast({ title: "Resi Kosong", description: "Masukkan nomor resi.", variant: "destructive" });
        return;
      }
      if (managedPackages.find(p => p.id === resiToAdd)) {
        toast({ title: "Resi Duplikat", description: "Nomor resi ini sudah ada.", variant: "destructive" });
        setCurrentScannedResi('');
        return;
      }
      
      if (dailyInput && managedPackages.length < dailyInput.totalPackages) {
        const now = new Date();
        const packageItem = { 
          id: resiToAdd, 
          status: 'process', 
          isCOD: isManualCOD, 
          lastUpdateTime: now.toISOString() 
        };
        
        // Update state lokal terlebih dahulu untuk UX yang responsif
        setManagedPackages(prev => [...prev, packageItem]);
        setCurrentScannedResi('');
        setIsManualCOD(false);
        
        // Simpan ke Supabase jika user sudah login
        if (currentUser?.id) {
          const { data: supabaseData, error } = await supabase
            .from('packages')
            .insert([
              {
                tracking_id: resiToAdd,
                courier_id: currentUser.id,
                status: 'process',
                is_cod: isManualCOD,
                last_update: now.toISOString(),
                created_at: now.toISOString()
              }
            ])
            .select();
          
          if (error) {
            console.error('Error saving package to Supabase:', error);
            // Tetap tampilkan toast sukses karena data sudah tersimpan secara lokal
          } else {
            console.log('Package saved to Supabase:', supabaseData);
          }
        }
        
        toast({ title: "Resi Ditambahkan", description: `${resiToAdd} (${isManualCOD ? "COD" : "Non-COD"}) berhasil ditambahkan.` });
        
        if (managedPackages.length + 1 === dailyInput.totalPackages) {
          setIsScanning(false); // Close scanner if all packages are added this way too
        }
      } else if (dailyInput) {
        toast({ title: "Batas Paket Tercapai", description: "Jumlah paket yang di-scan sudah sesuai total.", variant: "destructive" });
      }
    } catch (error) {
      console.error('Error in handleManualResiAdd:', error);
      toast({ 
        title: "Terjadi Kesalahan", 
        description: "Gagal menambahkan paket. Silakan coba lagi.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteManagedPackage = async (resi: string) => {
    try {
      // Update state lokal terlebih dahulu untuk UX yang responsif
      setManagedPackages(prev => prev.filter(p => p.id !== resi));
      
      // Hapus dari Supabase jika user sudah login
      if (currentUser?.id) {
        const { error } = await supabase
          .from('packages')
          .delete()
          .eq('tracking_id', resi)
          .eq('courier_id', currentUser.id);
        
        if (error) {
          console.error('Error deleting package from Supabase:', error);
        } else {
          console.log(`Package ${resi} deleted from Supabase`);
        }
      }
      
      toast({ title: "Resi Dihapus", description: `${resi} dihapus dari daftar.` });
    } catch (error) {
      console.error('Error in handleDeleteManagedPackage:', error);
      toast({ 
        title: "Terjadi Kesalahan", 
        description: "Gagal menghapus paket. Paket sudah dihapus dari daftar lokal.",
        variant: "warning"
      });
    }
  };

  const handleStartDelivery = async () => {
    try {
      if (!dailyInput || managedPackages.length !== dailyInput.totalPackages) {
        toast({ title: "Paket Belum Lengkap", description: "Pastikan semua paket telah di-scan sesuai total harian.", variant: "destructive" });
        return;
      }
      
      const now = new Date();
      const updatedPackages = managedPackages.map(p => ({ 
        ...p, 
        status: 'in_transit', 
        lastUpdateTime: now.toISOString() 
      }));
      
      // Update state lokal terlebih dahulu untuk UX yang responsif
      setInTransitPackages(updatedPackages);
      setManagedPackages([]);
      setDeliveryStarted(true);
      
      // Update status paket di Supabase jika user sudah login
      if (currentUser?.id) {
        // Buat array promises untuk update semua paket secara paralel
        const updatePromises = updatedPackages.map(async (pkg) => {
          const { error } = await supabase
            .from('packages')
            .update({ 
              status: 'in_transit',
              last_update: now.toISOString() 
            })
            .eq('tracking_id', pkg.id)
            .eq('courier_id', currentUser.id);
          
          if (error) {
            console.error(`Error updating package ${pkg.id} status in Supabase:`, error);
            return false;
          }
          return true;
        });
        
        // Tunggu semua update selesai
        const results = await Promise.all(updatePromises);
        const failedUpdates = results.filter(result => !result).length;
        
        if (failedUpdates > 0) {
          console.warn(`${failedUpdates} packages failed to update in Supabase`);
        } else {
          console.log('All packages updated to in_transit in Supabase');
        }
        
        // Buat entri delivery_activities di Supabase
        const { error: activityError } = await supabase
          .from('delivery_activities')
          .insert([
            {
              user_id: currentUser.id,
              date: now.toISOString().split('T')[0],
              start_time: now.toISOString(),
              packages_count: updatedPackages.length,
              status: 'in_progress'
            }
          ]);
        
        if (activityError) {
          console.error('Error creating delivery activity in Supabase:', activityError);
        }
      }
      
      toast({ title: "Pengantaran Dimulai", description: "Semangat mengantarkan paket!" });
    } catch (error) {
      console.error('Error in handleStartDelivery:', error);
      toast({ 
        title: "Terjadi Kesalahan", 
        description: "Gagal memulai pengantaran. Silakan coba lagi.",
        variant: "destructive"
      });
    }
  };

  const handleOpenPackageCamera = (packageId: string) => {
    setCapturingForPackageId(packageId);
    setPhotoRecipientName('');
  };

  const handleCapturePackagePhoto = async () => {
    try {
      if (!capturingForPackageId) return;

      if (!photoRecipientName.trim()) {
        toast({ title: "Nama Penerima Kosong", description: "Harap isi nama penerima paket.", variant: "destructive" });
        return;
      }

      const photoDataUrl = capturePhoto();
      if (!photoDataUrl) {
        toast({ title: "Gagal Mengambil Foto", variant: "destructive" });
        return;
      }
      
      const now = new Date();
      
      // Update state lokal terlebih dahulu untuk UX yang responsif
      setPackagePhotoMap(prev => ({ ...prev, [capturingForPackageId]: photoDataUrl }));
      setInTransitPackages(prev => prev.map(p =>
        p.id === capturingForPackageId ? { 
            ...p, 
            deliveryProofPhotoUrl: photoDataUrl, 
            status: 'delivered', 
            recipientName: photoRecipientName.trim(),
            lastUpdateTime: now.toISOString() 
        } : p
      ));
      
      // Update status paket di Supabase jika user sudah login
      if (currentUser?.id) {
        // Upload foto bukti pengiriman ke Supabase Storage
        let proofPhotoUrl = null;
        
        try {
          // Upload to Supabase Storage menggunakan fungsi helper
          const fileName = `delivery_proof/${currentUser.id}/${capturingForPackageId}_${now.getTime()}.jpg`;
          
          const { publicUrl, error: uploadError } = await uploadFileToStorage(
            'delivery_proofs',
            fileName,
            photoDataUrl,
            { 
              contentType: 'image/jpeg',
              cacheControl: '3600',
              upsert: false
            }
          );
            
          if (uploadError) {
            console.error('Error uploading proof photo:', uploadError);
            toast({
              title: "Gagal mengunggah bukti pengiriman",
              description: `Error: ${uploadError.message || 'Terjadi kesalahan saat mengunggah foto'}`,
              variant: "destructive"
            });
          } else {
            proofPhotoUrl = publicUrl;
            console.log('Delivery proof uploaded successfully:', proofPhotoUrl);
            toast({
              title: "Bukti pengiriman berhasil diunggah",
              description: "Foto bukti pengiriman berhasil disimpan",
              variant: "default"
            });
          }
        } catch (uploadErr) {
          console.error('Error processing photo upload:', uploadErr);
          toast({
            title: "Gagal memproses foto",
            description: "Terjadi kesalahan saat memproses foto. Silakan coba lagi.",
            variant: "destructive"
          });
        }
        
        // Update package status in Supabase
        const { error: updateError } = await supabase
          .from('packages')
          .update({ 
            status: 'delivered',
            last_update: now.toISOString(),
            recipient_name: photoRecipientName.trim(),
            proof_photo_url: proofPhotoUrl
          })
          .eq('tracking_id', capturingForPackageId)
          .eq('courier_id', currentUser.id);
        
        if (updateError) {
          console.error(`Error updating package ${capturingForPackageId} status in Supabase:`, updateError);
        } else {
          console.log(`Package ${capturingForPackageId} marked as delivered in Supabase`);
        }
      }
      
      toast({ title: "Foto Bukti Terkirim", description: `Foto untuk paket ${capturingForPackageId} disimpan. Penerima: ${photoRecipientName.trim()}.` });
      setCapturingForPackageId(null);
      setPhotoRecipientName('');
    } catch (error) {
      console.error('Error in handleCapturePackagePhoto:', error);
      toast({ 
        title: "Terjadi Kesalahan", 
        description: "Gagal menyimpan bukti pengiriman. Silakan coba lagi.",
        variant: "destructive"
      });
    }
  };

  const handleDeletePackagePhoto = async (packageId: string) => {
    try {
      const now = new Date();
      
      // Update state lokal terlebih dahulu untuk UX yang responsif
      setPackagePhotoMap(prev => {
        const newState = {...prev};
        delete newState[packageId];
        return newState;
      });
      
      setInTransitPackages(prev => prev.map(p =>
          p.id === packageId ? { 
            ...p, 
            deliveryProofPhotoUrl: undefined, 
            status: 'in_transit', 
            recipientName: undefined, 
            lastUpdateTime: now.toISOString() 
          } : p
      ));
      
      // Update status paket di Supabase jika user sudah login
      if (currentUser?.id) {
        // Update package status back to in_transit in Supabase
        const { error: updateError } = await supabase
          .from('packages')
          .update({ 
            status: 'in_transit',
            last_update: now.toISOString(),
            recipient_name: null,
            proof_photo_url: null
          })
          .eq('tracking_id', packageId)
          .eq('courier_id', currentUser.id);
        
        if (updateError) {
          console.error(`Error updating package ${packageId} status in Supabase:`, updateError);
        } else {
          console.log(`Package ${packageId} reverted to in_transit in Supabase`);
          
          // Note: We're not deleting the photo from storage to keep a record
          // But we could implement that here if needed
        }
      }
      
      toast({ title: "Foto Dihapus", description: `Foto untuk paket ${packageId} dihapus.` });
    } catch (error) {
      console.error('Error in handleDeletePackagePhoto:', error);
      toast({ 
        title: "Terjadi Kesalahan", 
        description: "Gagal menghapus foto bukti. Status paket sudah diubah secara lokal.",
        variant: "warning"
      });
    }
  };

  const handleFinishDay = async () => {
    try {
      const remainingInTransit = inTransitPackages.filter(p => p.status === 'in_transit');
      const now = new Date();

      if (remainingInTransit.length > 0) {
        if (!returnProofPhoto) {
          toast({ title: "Upload Bukti Paket Pending", description: "Harap upload foto bukti pengembalian paket yang tidak terkirim.", variant: "destructive" });
          setPendingReturnPackages(remainingInTransit.map(p => ({ ...p, status: 'pending_return', lastUpdateTime: now.toISOString() })));
          return;
        }
        if (!returnLeadReceiverName.trim()) {
          toast({ title: "Nama Leader Serah Terima Kosong", description: "Harap isi nama leader yang menerima paket retur.", variant: "destructive" });
          setPendingReturnPackages(remainingInTransit.map(p => ({ ...p, status: 'pending_return', lastUpdateTime: now.toISOString() })));
          return;
        }
      }

      // Update state lokal terlebih dahulu untuk UX yang responsif
      const returnProofPhotoUrl = returnProofPhoto ? URL.createObjectURL(returnProofPhoto) : undefined;
      setPendingReturnPackages(remainingInTransit.map(p => ({ 
        ...p, 
        status: 'pending_return', 
        returnProofPhotoUrl: returnProofPhotoUrl, 
        returnLeadReceiverName: returnLeadReceiverName.trim(), 
        lastUpdateTime: now.toISOString() 
      })));
      setInTransitPackages(prev => prev.filter(p => p.status === 'delivered'));
      setDayFinished(true);
      
      // Update Supabase jika user sudah login dan ada paket yang dikembalikan
      if (currentUser?.id && remainingInTransit.length > 0) {
        let storageReturnProofUrl = null;
        
        // Upload foto bukti pengembalian ke Supabase Storage jika ada
        if (returnProofPhoto) {
          try {
            const fileName = `return_proof/${currentUser.id}/${now.getTime()}.jpg`;
            
            // Gunakan fungsi helper untuk upload
            const { publicUrl, error: uploadError } = await uploadFileToStorage(
              'delivery_proofs',
              fileName,
              returnProofPhoto,
              { 
                contentType: 'image/jpeg',
                cacheControl: '3600',
                upsert: false
              }
            );
              
            if (uploadError) {
              console.error('Error uploading return proof photo:', uploadError);
              toast({
                title: "Gagal mengunggah bukti pengembalian",
                description: `Error: ${uploadError.message || 'Terjadi kesalahan saat mengunggah foto'}`,
                variant: "destructive"
              });
            } else {
              storageReturnProofUrl = publicUrl;
              console.log('Return proof uploaded successfully:', storageReturnProofUrl);
              toast({
                title: "Bukti pengembalian berhasil diunggah",
                description: "Foto bukti pengembalian berhasil disimpan",
                variant: "default"
              });
            }
          } catch (uploadErr) {
            console.error('Error processing return photo upload:', uploadErr);
            toast({
              title: "Gagal memproses foto pengembalian",
              description: "Terjadi kesalahan saat memproses foto. Silakan coba lagi.",
              variant: "destructive"
            });
          }
        }
        
        // Update status semua paket yang dikembalikan di Supabase
        const updatePromises = remainingInTransit.map(async (pkg) => {
          const { error } = await supabase
            .from('packages')
            .update({ 
              status: 'returned',
              last_update: now.toISOString(),
              return_proof_url: storageReturnProofUrl,
              return_receiver_name: returnLeadReceiverName.trim()
            })
            .eq('tracking_id', pkg.id)
            .eq('courier_id', currentUser.id);
          
          if (error) {
            console.error(`Error updating package ${pkg.id} status to returned in Supabase:`, error);
            return false;
          }
          return true;
        });
        
        // Tunggu semua update selesai
        const results = await Promise.all(updatePromises);
        const failedUpdates = results.filter(result => !result).length;
        
        if (failedUpdates > 0) {
          console.warn(`${failedUpdates} packages failed to update to returned in Supabase`);
        } else {
          console.log('All remaining packages updated to returned in Supabase');
        }
        
        // Update delivery_activities di Supabase
        const { error: activityError } = await supabase
          .from('delivery_activities')
          .update({
            end_time: now.toISOString(),
            status: 'completed',
            delivered_count: inTransitPackages.filter(p => p.status === 'delivered').length,
            returned_count: remainingInTransit.length
          })
          .eq('user_id', currentUser.id)
          .eq('date', now.toISOString().split('T')[0])
          .eq('status', 'in_progress');
        
        if (activityError) {
          console.error('Error updating delivery activity in Supabase:', activityError);
        } else {
          console.log('Delivery activity marked as completed in Supabase');
        }
      }
      
      toast({ title: "Pengantaran Selesai", description: `Terima kasih untuk kerja keras hari ini! Paket retur diserahkan kepada ${returnLeadReceiverName.trim() || 'N/A'}.` });
    } catch (error) {
      console.error('Error in handleFinishDay:', error);
      toast({ 
        title: "Terjadi Kesalahan", 
        description: "Gagal menyelesaikan pengantaran. Silakan coba lagi.",
        variant: "destructive"
      });
    }
  };

  const handleReturnProofUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setReturnProofPhoto(event.target.files[0]);
      toast({ title: "Foto Bukti Return Diupload", description: event.target.files[0].name });
    }
  };

  const resetDay = async () => {
    try {
      // Reset semua state lokal terlebih dahulu untuk UX yang responsif
      setDailyInput(null);
      resetPackageInputForm({ totalPackages: 0, codPackages: 0, nonCodPackages: 0 });
      setManagedPackages([]);
      setInTransitPackages([]);
      setPendingReturnPackages([]);
      setDeliveryStarted(false);
      setDayFinished(false);
      setReturnProofPhoto(null);
      setReturnLeadReceiverName('');
      setPackagePhotoMap({});
      setMotivationalQuote(MotivationalQuotes[Math.floor(Math.random() * MotivationalQuotes.length)]);
      
      if (currentUser?.role === 'Kurir') {
        setIsCourierCheckedIn(false); 
        localStorage.removeItem('courierCheckedInToday'); 
      }
      
      // Reset data di Supabase jika user sudah login
      if (currentUser?.id) {
        // Tandai semua paket yang masih dalam status 'process' atau 'in_transit' sebagai 'cancelled'
        const now = new Date();
        const { error: packagesError } = await supabase
          .from('packages')
          .update({ 
            status: 'cancelled',
            last_update: now.toISOString(),
            notes: 'Cancelled due to day reset'
          })
          .eq('courier_id', currentUser.id)
          .in('status', ['process', 'in_transit']);
        
        if (packagesError) {
          console.error('Error resetting packages in Supabase:', packagesError);
        } else {
          console.log('All pending packages marked as cancelled in Supabase');
        }
        
        // Tandai semua delivery_activities yang masih 'in_progress' sebagai 'cancelled'
        const { error: activitiesError } = await supabase
          .from('delivery_activities')
          .update({
            end_time: now.toISOString(),
            status: 'cancelled',
            notes: 'Cancelled due to day reset'
          })
          .eq('user_id', currentUser.id)
          .eq('status', 'in_progress');
        
        if (activitiesError) {
          console.error('Error resetting delivery activities in Supabase:', activitiesError);
        } else {
          console.log('All in-progress delivery activities marked as cancelled in Supabase');
        }
      }
      
      toast({ title: "Hari Baru Dimulai", description: "Semua data telah direset. Selamat bekerja!" });
    } catch (error) {
      console.error('Error in resetDay:', error);
      toast({ 
        title: "Terjadi Kesalahan", 
        description: "Gagal mereset data. Data lokal sudah direset.",
        variant: "warning"
      });
    }
  };

  const handleOpenDeliveryScan = () => {
    if (!inTransitPackages.some(p => p.status === 'in_transit')) {
      toast({ title: "Semua Paket Terupdate", description: "Tidak ada paket dalam perjalanan yang menunggu update scan."});
      return;
    }
    setIsScanningForDeliveryUpdate(true);
  };

  const deliveredCount = inTransitPackages.filter(p => p.status === 'delivered').length + pendingReturnPackages.filter(p => p.status === 'returned').length;
  const pendingCountOnFinish = pendingReturnPackages.filter(p => p.status === 'pending_return').length; 
  const dailyTotalForChart = (dailyInput?.totalPackages || 0) === 0 ? 1 : (dailyInput?.totalPackages || 0);

  const performanceData = [
    { name: 'Terkirim', value: deliveredCount, color: 'hsl(var(--chart-1))' },
    { name: 'Pending/Retur', value: pendingCountOnFinish, color: 'hsl(var(--chart-2))' },
  ];

  const formatActivityTimestamp = (timestamp: string): string => {
    const date = new Date(parseInt(timestamp));
    if (isNaN(date.getTime())) {
      return "Invalid date";
    }
    return formatDistanceToNow(date, { addSuffix: true, locale: indonesiaLocale });
  };

  const getAttendanceActionIcon = (action: AttendanceActivity['action']) => {
    switch (action) {
      case 'check-in': return <UserRoundCheck className="h-5 w-5 text-green-500" />;
      case 'check-out': return <UserRoundX className="h-5 w-5 text-red-500" />;
      case 'reported-late': return <Clock className="h-5 w-5 text-yellow-500" />;
      default: return <Activity className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getCourierWorkSummaryIcon = () => {
    return <ListChecks className="h-5 w-5 text-blue-500" />;
  };

  const triggerFilterSimulation = () => {
    setDashboardSummary(generateInitialDashboardSummary(true)); 
    
    const wilayahName = mockLocations.find(w => w.id === selectedWilayah)?.name || 'Semua Wilayah';
    const areaName = areaOptions.find(a => a.id === selectedArea)?.name || 'Semua Area';
    const hubName = hubOptions.find(h => h.id === selectedHub)?.name || 'Semua Hub';

    let filterMessage = `Menerapkan filter: Wilayah (${wilayahName}), Area (${areaName}), Hub (${hubName})`;
    if (searchKurir) {
      filterMessage += `, Kurir (${searchKurir})`;
    }
    toast({ title: "Filter Diterapkan (Simulasi)", description: filterMessage });
  };

  const handleWilayahChange = (wilayahId: string) => {
    setSelectedWilayah(wilayahId);
    const currentWilayah = mockLocations.find(w => w.id === wilayahId);
    
    let newAreaOptions: Area[] = [{ id: 'all-area', name: 'Semua Area', hubs: [] }];
    let allHubsForCurrentWilayah: Hub[] = [{id: 'all-hub', name: 'Semua Hub'}];

    if (wilayahId === 'all-wilayah') {
        mockLocations.forEach(w => {
            if (w.id !== 'all-wilayah') {
                w.areas.forEach(area => {
                    if(!area.id.startsWith('all-area-')){
                        newAreaOptions.push(area);
                        area.hubs.forEach(hub => {
                            if(!hub.id.startsWith('all-hub-') && !allHubsForCurrentWilayah.find(h => h.id === hub.id)) {
                               allHubsForCurrentWilayah.push(hub);
                            }
                        });
                    }
                });
            }
        });
    } else if (currentWilayah) {
        newAreaOptions = [
            { id: `all-area-${currentWilayah.id}`, name: `Semua Area (${currentWilayah.name})`, hubs: [] },
            ...currentWilayah.areas.filter(a => !a.id.startsWith('all-area-'))
        ];
        currentWilayah.areas.forEach(area => {
            if(!area.id.startsWith('all-area-')){
                area.hubs.forEach(hub => {
                     if(!hub.id.startsWith('all-hub-') && !allHubsForCurrentWilayah.find(h => h.id === hub.id)) {
                        allHubsForCurrentWilayah.push(hub);
                    }
                });
            }
        });
    }
    
    setAreaOptions(newAreaOptions);
    setSelectedArea(newAreaOptions[0].id); 
    
    setHubOptions(allHubsForCurrentWilayah);
    setSelectedHub(allHubsForCurrentWilayah[0].id);
    triggerFilterSimulation();
  };

  const handleAreaChange = (areaId: string) => {
    setSelectedArea(areaId);
    const currentWilayah = mockLocations.find(w => w.id === selectedWilayah);
    let newHubOptions: Hub[] = [{ id: 'all-hub', name: 'Semua Hub' }];

    if (areaId.startsWith('all-area-')) { // "Semua Area (Wilayah X)" or global "Semua Area"
        if (selectedWilayah === 'all-wilayah' || areaId === 'all-area') { // Global "Semua Area"
             mockLocations.forEach(w => {
                if (w.id !== 'all-wilayah') {
                    w.areas.forEach(ar => {
                        if (!ar.id.startsWith('all-area-')) { 
                            ar.hubs.forEach(hub => {
                                if(!hub.id.startsWith('all-hub-') && !newHubOptions.find(h => h.id === hub.id)) {
                                   newHubOptions.push(hub);
                                }
                            });
                        }
                    });
                }
            });
        } else if (currentWilayah) { // "Semua Area (Wilayah X)"
             currentWilayah.areas.forEach(ar => {
                 if (!ar.id.startsWith('all-area-')) { 
                    ar.hubs.forEach(hub => {
                        if(!hub.id.startsWith('all-hub-') && !newHubOptions.find(h => h.id === hub.id)) {
                           newHubOptions.push(hub);
                        }
                    });
                 }
             });
        }
    } else { // Specific Area selected
        const areaData = areaOptions.find(a => a.id === areaId);
        if (areaData) {
             newHubOptions = [
                 { id: `all-hub-${areaData.id}`, name: `Semua Hub (${areaData.name})`, },
                 ...areaData.hubs.filter(h => !h.id.startsWith('all-hub-'))
             ];
        }
    }
    setHubOptions(newHubOptions);
    setSelectedHub(newHubOptions[0].id);
    triggerFilterSimulation();
  };

  const handleHubChange = (hubId: string) => {
    setSelectedHub(hubId);
    triggerFilterSimulation();
  };
  
  const handleSearchKurirChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchKurir(event.target.value);
    triggerFilterSimulation(); 
  };

  const handleDashboardFilterApply = () => {
    triggerFilterSimulation(); 
  };
  
  const handleDownloadDashboardSummary = () => {
    const wilayahName = mockLocations.find(w => w.id === selectedWilayah)?.name || 'Semua Wilayah';
    const areaName = areaOptions.find(a => a.id === selectedArea)?.name || 'Semua Area';
    const hubName = hubOptions.find(h => h.id === selectedHub)?.name || 'Semua Hub';
    
    const description = `File Excel akan berisi: Statistik Utama (Kurir Aktif, Paket Diproses, dll.), Ringkasan Pengiriman Harian, Mingguan, Bulanan, dan daftar Aktivitas Absensi serta Ringkasan Penyelesaian Kerja Kurir terbaru. Filter aktif: Wilayah (${wilayahName}), Area (${areaName}), Hub (${hubName}), Kurir (${searchKurir || 'Semua'}).`;
    toast({ title: "Simulasi Unduh Ringkasan Dashboard (Excel)", description: description, duration: 7000 });
  };


  if (!currentUser) {
    return <div className="flex justify-center items-center h-screen"><p>Memuat data pengguna...</p></div>;
  }
  
  if (currentUser.role === 'Kurir' && isCourierCheckedIn === null) {
    return <div className="flex justify-center items-center h-screen"><p>Memeriksa status absensi...</p></div>;
  }

  if (currentUser.role === 'Kurir' && dayFinished) {
    return (
      <div className="space-y-6">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-primary">Laporan Performa Harian</CardTitle>
            <CardDescription>Ringkasan pengantaran paket hari ini.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="space-y-2">
                <p>Total Paket Dibawa: <strong>{dailyInput?.totalPackages || 0}</strong></p>
                <p>Total Paket Terkirim: <strong className="text-green-600 dark:text-green-400">{deliveredCount}</strong></p>
                <p>Total Paket Pending/Retur: <strong className="text-red-600 dark:text-red-400">{pendingCountOnFinish}</strong></p>
                <p>Tingkat Keberhasilan: <strong className="text-primary">{((deliveredCount / dailyTotalForChart) * 100).toFixed(1)}%</strong></p>
                {pendingReturnPackages.length > 0 && (
                    <p>Paket Retur Diserahkan ke Leader: <strong>{returnLeadReceiverName || 'N/A'}</strong></p>
                )}
              </div>
              <div className="h-60 w-full">
                <ChartWrapper>
                  <LazyResponsiveContainer width="100%" height="100%">
                    <LazyPieChart>
                      <LazyPie data={performanceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                         {performanceData.map((entry, index) => (
                          <LazyCell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </LazyPie>
                      <LazyTooltip
                        contentStyle={{
                          background: "hsl(var(--background))",
                          borderColor: "hsl(var(--border))",
                          borderRadius: "var(--radius)",
                        }}
                      />
                      <LazyLegend wrapperStyle={{fontSize: "0.8rem"}}/>
                    </LazyPieChart>
                  </LazyResponsiveContainer>
                </ChartWrapper>
              </div>
            </div>
            {pendingReturnPackages.length > 0 && returnProofPhoto && (
              <div className="mt-6">
                <h3 className="font-semibold text-lg mb-2">Bukti Paket Retur:</h3>
                <Image
                  src={URL.createObjectURL(returnProofPhoto)}
                  alt="Bukti Retur"
                  className="max-w-sm w-full md:max-w-xs rounded-lg shadow-md border border-border"
                  width={300}
                  height={200}
                  style={{objectFit: 'contain'}}
                  data-ai-hint="package receipt"
                />
              </div>
            )}
             {pendingReturnPackages.length > 0 && !returnProofPhoto && (
                <p className="text-muted-foreground text-center">Tidak ada foto bukti retur yang diupload untuk paket pending.</p>
            )}
          </CardContent>
          <CardFooter className="flex flex-col items-center space-y-4 pt-6 border-t mt-6">
             <p className="text-lg italic text-muted-foreground text-center px-4">{motivationalQuote}</p>
            <Button onClick={resetDay} size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto">
              Mulai Hari Baru
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (currentUser.role === 'Kurir') {
    return (
      <div className="space-y-8">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={currentUser.avatarUrl || mockKurirProfileData.avatarUrl} alt={currentUser.fullName} data-ai-hint="man face"/>
              <AvatarFallback>{currentUser.fullName.split(" ").map(n=>n[0]).join("")}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">{currentUser.fullName}</CardTitle>
              <CardDescription>{currentUser.id} - {currentUser.workLocation || mockKurirProfileData.workLocation}</CardDescription>
            </div>
          </CardHeader>
        </Card>

        {!isCourierCheckedIn && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Anda Belum Melakukan Absen!</AlertTitle>
            <AlertDescription>
              Silakan lakukan <Link href="/attendance" className="font-bold underline hover:text-destructive-foreground">Check-In</Link> terlebih dahulu untuk memulai pekerjaan dan menginput data paket.
            </AlertDescription>
          </Alert>
        )}

        {!dailyInput && isCourierCheckedIn && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><PackagePlus className="mr-2 h-6 w-6 text-primary" /> Data Input Paket Harian</CardTitle>
              <CardDescription>Masukkan jumlah total paket yang akan dibawa hari ini.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePackageFormSubmit(handleDailyPackageInputSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="totalPackages">Total Paket Dibawa</Label>
                  <Input id="totalPackages" type="number" {...register("totalPackages")} placeholder="cth: 50" />
                  {errors.totalPackages && <p className="text-destructive text-sm mt-1">{errors.totalPackages.message}</p>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="codPackages">Total Paket COD</Label>
                    <Input id="codPackages" type="number" {...register("codPackages")} placeholder="cth: 20" />
                    {errors.codPackages && <p className="text-destructive text-sm mt-1">{errors.codPackages.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="nonCodPackages">Total Paket Non-COD</Label>
                    <Input id="nonCodPackages" type="number" {...register("nonCodPackages")} placeholder="cth: 30" />
                    {errors.nonCodPackages && <p className="text-destructive text-sm mt-1">{errors.nonCodPackages.message}</p>}
                  </div>
                </div>
                {errors.totalPackages && errors.totalPackages.type === "refine" && <p className="text-destructive text-sm mt-1">{errors.totalPackages.message}</p>}
                <Button type="submit" className="w-full">Input Data Paket</Button>
              </form>
            </CardContent>
          </Card>
        )}

        {dailyInput && !deliveryStarted && isCourierCheckedIn && (
          <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><ScanLine className="mr-2 h-6 w-6 text-primary" /> Scan & Kelola Paket</CardTitle>
              <CardDescription>Scan barcode atau input manual nomor resi. Total {managedPackages.length}/{dailyInput.totalPackages} paket.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2">
                  <Button onClick={handleStartScan} disabled={managedPackages.length >= dailyInput.totalPackages} className="flex-1">
                      <Camera className="mr-2 h-4 w-4" /> Mulai Scan Barcode
                  </Button>
              </div>
              <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <Input
                          type="text"
                          placeholder="Input manual nomor resi"
                          value={currentScannedResi}
                          onChange={(e) => setCurrentScannedResi(e.target.value)}
                          disabled={managedPackages.length >= dailyInput.totalPackages}
                          className="flex-grow"
                      />
                      <Button onClick={handleManualResiAdd} variant="outline" disabled={managedPackages.length >= dailyInput.totalPackages} className="sm:w-auto w-full">Tambah</Button>
                  </div>
                  <div className="flex items-center space-x-2 pt-1">
                      <Checkbox
                          id="isManualCOD"
                          checked={isManualCOD}
                          onCheckedChange={(checked) => setIsManualCOD(checked as boolean)}
                          disabled={managedPackages.length >= dailyInput.totalPackages}
                      />
                      <Label htmlFor="isManualCOD" className="text-sm font-normal text-muted-foreground">
                          Paket COD
                      </Label>
                  </div>
              </div>


              {isScanning && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                  <Card className="w-[calc(100%-2rem)] max-w-2xl">
                    <CardHeader>
                      <CardTitle>Scan Barcode Paket</CardTitle>
                      <CardDescription>Arahkan kamera ke barcode paket. Pemindaian otomatis.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <video ref={videoRef} className="w-full aspect-video rounded-md bg-muted" autoPlay muted playsInline />
                      <canvas ref={photoCanvasRef} style={{display: 'none'}} />
                      {hasCameraPermission === false && (
                        <Alert variant="destructive" className="mt-2">
                          <AlertTitle>Akses Kamera Dibutuhkan</AlertTitle>
                          <AlertDescription>Mohon izinkan akses kamera.</AlertDescription>
                        </Alert>
                      )}
                      {hasCameraPermission === true && <p className="text-sm text-muted-foreground mt-2">Mencari barcode...</p>}
                      {hasCameraPermission === null && <p>Meminta izin kamera...</p>}
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsScanning(false)} className="w-full sm:w-auto">Tutup</Button>
                    </CardFooter>
                  </Card>
                </div>
              )}

              {managedPackages.length > 0 && (
                <div className="space-y-2 max-h-60 overflow-y-auto p-1 border rounded-md">
                  <h3 className="font-semibold text-muted-foreground px-2">Paket Diproses ({managedPackages.length}):</h3>
                  {managedPackages.map(pkg => (
                    <div key={pkg.id} className="flex items-center justify-between p-2 bg-card-foreground/5 rounded-md">
                      <span className="text-sm break-all">{pkg.id} ({pkg.isCOD ? 'COD' : 'Non-COD'}) - <span className="italic text-xs text-primary">Proses</span></span>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive flex-shrink-0" onClick={() => handleDeleteManagedPackage(pkg.id)}>
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <Progress value={(managedPackages.length / dailyInput.totalPackages) * 100} className="w-full h-2.5" />
            </CardContent>
            <CardFooter>
              <Button onClick={handleStartDelivery} className="w-full" disabled={managedPackages.length !== dailyInput.totalPackages}>
                Mulai Pengantaran ({managedPackages.length}/{dailyInput.totalPackages})
              </Button>
            </CardFooter>
          </Card>
          </>
        )}

        {deliveryStarted && inTransitPackages.length > 0 && isCourierCheckedIn && (
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="flex-grow">
                      <CardTitle className="flex items-center"><PackageCheck className="mr-2 h-6 w-6 text-green-500" /> Sedang Dalam Pengantaran</CardTitle>
                      <CardDescription>Daftar paket yang sedang diantarkan. {inTransitPackages.filter(p => p.status === 'in_transit').length} paket belum terkirim.</CardDescription>
                  </div>
                  <Button 
                      onClick={handleOpenDeliveryScan} 
                      variant="outline" 
                      size="sm" 
                      className="w-full sm:w-auto"
                      disabled={!inTransitPackages.some(p => p.status === 'in_transit')}>
                    <ScanLine className="mr-2 h-4 w-4" /> Scan Update Kirim
                  </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[500px] overflow-y-auto">
              {[...inTransitPackages]
                  .sort((a, b) => {
                    if (a.status === 'delivered' && b.status !== 'delivered') return 1; 
                    if (a.status !== 'delivered' && b.status === 'delivered') return -1;
                    return new Date(b.lastUpdateTime).getTime() - new Date(a.lastUpdateTime).getTime(); 
                  })
                  .map(pkg => (
                <Card key={pkg.id} className={`p-3 ${pkg.status === 'delivered' ? 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700' : 'bg-card'}`}>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-1">
                    <p className="font-semibold break-all">{pkg.id} <span className={`text-xs px-2 py-0.5 rounded-full ${pkg.isCOD ? 'bg-yellow-400/20 text-yellow-600 dark:text-yellow-300' : 'bg-blue-400/20 text-blue-600 dark:text-blue-300'}`}>{pkg.isCOD ? 'COD' : 'Non-COD'}</span></p>
                    {pkg.status === 'delivered' ? (
                      <span className="text-xs text-green-600 dark:text-green-400 flex items-center flex-shrink-0"><CheckCircle size={14} className="mr-1"/> Terkirim</span>
                    ) : (
                      <span className="text-xs text-orange-500 dark:text-orange-400 flex-shrink-0">Dalam Perjalanan</span>
                    )}
                  </div>
                  {pkg.status === 'in_transit' && (
                    <div className="flex items-center gap-2 mt-2">
                      <Button variant="outline" size="sm" onClick={() => handleOpenPackageCamera(pkg.id)} className="flex-1">
                        <Camera size={16} className="mr-1" /> Foto Bukti & Nama Penerima
                      </Button>
                    </div>
                  )}
                  {pkg.deliveryProofPhotoUrl && (
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground mb-1">Penerima: <span className="font-medium text-foreground">{pkg.recipientName || 'N/A'}</span></p>
                      <div className="flex items-end gap-2">
                          <Image src={pkg.deliveryProofPhotoUrl} alt={`Bukti ${pkg.id}`} className="w-24 h-24 object-cover rounded border" width={96} height={96} data-ai-hint="package at door"/>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeletePackagePhoto(pkg.id)}>
                              <Trash2 size={16} />
                          </Button>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </CardContent>
            {capturingForPackageId && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                  <Card className="w-[calc(100%-2rem)] max-w-2xl">
                    <CardHeader>
                      <CardTitle>Foto Bukti Paket: {capturingForPackageId}</CardTitle>
                      <CardDescription>Ambil foto dan masukkan nama penerima.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <video ref={videoRef} className="w-full aspect-video rounded-md bg-muted" autoPlay muted playsInline />
                      <canvas ref={photoCanvasRef} style={{display: 'none'}} />
                      {hasCameraPermission === false && (
                        <Alert variant="destructive" className="mt-2">
                          <AlertTitle>Akses Kamera Dibutuhkan</AlertTitle>
                        </Alert>
                      )}
                      <div>
                          <Label htmlFor="photoRecipientName">Nama Penerima <span className="text-destructive">*</span></Label>
                          <Input
                              id="photoRecipientName"
                              type="text"
                              placeholder="Masukkan nama penerima"
                              value={photoRecipientName}
                              onChange={(e) => setPhotoRecipientName(e.target.value)}
                          />
                      </div>
                    </CardContent>
                    <CardFooter className="flex flex-col sm:flex-row justify-between gap-2">
                      <Button variant="outline" onClick={() => setCapturingForPackageId(null)} className="w-full sm:w-auto">Batal</Button>
                      <Button onClick={handleCapturePackagePhoto} disabled={!hasCameraPermission || !photoRecipientName.trim()} className="w-full sm:w-auto">
                          <Camera className="mr-2 h-4 w-4" /> Ambil & Simpan
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              )}
              {isScanningForDeliveryUpdate && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                  <Card className="w-[calc(100%-2rem)] max-w-2xl">
                    <CardHeader>
                      <CardTitle>Scan Resi Paket untuk Update Pengiriman</CardTitle>
                      <CardDescription>Arahkan kamera ke barcode paket yang akan diupdate. Pemindaian otomatis.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <video ref={videoRef} className="w-full aspect-video rounded-md bg-muted" autoPlay muted playsInline />
                      <canvas ref={photoCanvasRef} style={{display: 'none'}} />
                       {hasCameraPermission === false && (
                        <Alert variant="destructive" className="mt-2">
                          <AlertTitle>Akses Kamera Dibutuhkan</AlertTitle>
                          <AlertDescription>Mohon izinkan akses kamera.</AlertDescription>
                        </Alert>
                      )}
                      {hasCameraPermission === true && <p className="text-sm text-muted-foreground mt-2">Mencari barcode...</p>}
                      {hasCameraPermission === null && <p>Meminta izin kamera...</p>}
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsScanningForDeliveryUpdate(false)} className="w-full sm:w-auto">Tutup</Button>
                    </CardFooter>
                  </Card>
                </div>
              )}
            <CardFooter>
              <Button onClick={handleFinishDay} className="w-full" variant="destructive">
                  Selesaikan Pengantaran Hari Ini
              </Button>
            </CardFooter>
          </Card>
        )}

        {deliveryStarted && pendingReturnPackages.length > 0 && !dayFinished && isCourierCheckedIn && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><PackageX className="mr-2 h-6 w-6 text-red-500" /> Paket Pending/Retur</CardTitle>
              <CardDescription>{pendingReturnPackages.length} paket belum terkirim dan perlu di-retur.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                  <Label htmlFor="returnProof" className="mb-1 block">Upload Foto Bukti Pengembalian Semua Paket Pending ke Gudang <span className="text-destructive">*</span></Label>
                  <Input id="returnProof" type="file" accept="image/*" onChange={handleReturnProofUpload} />
                  {returnProofPhoto && <p className="text-xs text-green-500 dark:text-green-400 mt-1">{returnProofPhoto.name} dipilih.</p>}
              </div>
              <div>
                  <Label htmlFor="returnLeadReceiverName">Nama Leader Serah Terima <span className="text-destructive">*</span></Label>
                  <Input
                      id="returnLeadReceiverName"
                      type="text"
                      placeholder="Nama Leader/Supervisor"
                      value={returnLeadReceiverName}
                      onChange={(e) => setReturnLeadReceiverName(e.target.value)}
                  />
              </div>
              <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-1">
                  <h4 className="text-sm font-medium text-muted-foreground">Daftar Resi Pending:</h4>
                  {pendingReturnPackages.map(pkg => (
                      <p key={pkg.id} className="text-sm text-muted-foreground break-all">{pkg.id} - <span className="italic">Pending Retur</span></p>
                  ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleFinishDay} className="w-full" variant="destructive" disabled={!returnProofPhoto || !returnLeadReceiverName.trim()}>
                  Konfirmasi Selesai dengan Paket Pending
              </Button>
            </CardFooter>
          </Card>
        )}

        {!dayFinished && isCourierCheckedIn && (
            <Card className="bg-gradient-to-r from-primary/10 to-accent/10 dark:from-primary/20 dark:to-accent/20 border-transparent">
              <CardContent className="pt-6">
                  <p className="text-center text-lg italic text-foreground/70 dark:text-primary-foreground/80">{motivationalQuote}</p>
              </CardContent>
            </Card>
        )}

      </div>
    );
  }

  if (!dashboardSummary) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Memuat ringkasan dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-primary flex items-center">
            {currentUser.role === 'MasterAdmin' ? <UserCog className="mr-2 h-7 w-7" /> : currentUser.role === 'Admin' ? <Users className="mr-2 h-7 w-7" /> : <Briefcase className="mr-2 h-7 w-7" />}
             Selamat Datang, {currentUser.fullName}!
          </CardTitle>
          <CardDescription>Anda login sebagai {currentUser.role}. Berikut ringkasan operasional kurir.</CardDescription>
        </CardHeader>
      </Card>

      {currentUser.role !== 'Kurir' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <FilterIcon className="mr-2 h-5 w-5 text-primary" />
              Filter & Aksi Cepat Dashboard
            </CardTitle>
            <CardDescription>
              Saring data yang ditampilkan di dashboard atau unduh ringkasan. (Perubahan filter akan memberi efek simulasi pada statistik)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
              <div>
                <Label htmlFor="dashboard-wilayah">Wilayah</Label>
                <Select value={selectedWilayah} onValueChange={handleWilayahChange}>
                  <SelectTrigger id="dashboard-wilayah">
                    <SelectValue placeholder="Pilih Wilayah" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockLocations.map(w => (
                      <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="dashboard-area">Area Operasional</Label>
                <Select value={selectedArea} onValueChange={handleAreaChange} disabled={areaOptions.length === 0 || (selectedWilayah === 'all-wilayah' && areaOptions.length <=1)}>
                  <SelectTrigger id="dashboard-area">
                    <SelectValue placeholder="Pilih Area" />
                  </SelectTrigger>
                  <SelectContent>
                     {areaOptions.map(a => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="dashboard-lokasi-kerja">Lokasi Kerja (Hub)</Label>
                 <Select value={selectedHub} onValueChange={handleHubChange} disabled={hubOptions.length === 0 || (selectedArea === 'all-area' && hubOptions.length <= 1) || (selectedArea.startsWith('all-area-') && hubOptions.length <=1)}>
                  <SelectTrigger id="dashboard-lokasi-kerja">
                    <SelectValue placeholder="Pilih Hub" />
                  </SelectTrigger>
                  <SelectContent>
                    {hubOptions.map(h => (
                      <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="lg:col-span-2">
                <Label htmlFor="dashboard-search-kurir">Cari Kurir (Nama/ID)</Label>
                <div className="relative">
                  <SearchIcon className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    id="dashboard-search-kurir" 
                    type="search" 
                    placeholder="Masukkan Nama atau ID Kurir..." 
                    className="pl-8" 
                    value={searchKurir}
                    onChange={handleSearchKurirChange}
                  />
                </div>
              </div>
              <Button onClick={handleDashboardFilterApply} className="w-full lg:w-auto self-end">
                <FilterIcon className="mr-2 h-4 w-4" /> Terapkan Filter
              </Button>
            </div>
          </CardContent>
           <CardFooter>
              <Button onClick={handleDownloadDashboardSummary} variant="outline" className="w-full sm:w-auto">
                <DownloadIcon className="mr-2 h-4 w-4" /> Unduh Ringkasan Dashboard
              </Button>
            </CardFooter>
        </Card>
      )}


      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kurir Aktif Hari Ini</CardTitle>
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardSummary.activeCouriersToday}</div>
            <p className="text-xs text-muted-foreground">Total kurir yang beroperasi</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paket Diproses Hari Ini</CardTitle>
            <PackageIcon className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardSummary.totalPackagesProcessedToday}</div>
            <p className="text-xs text-muted-foreground">Total paket ditugaskan</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paket Terkirim Hari Ini</CardTitle>
            <PackageCheck className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardSummary.totalPackagesDeliveredToday}</div>
            <p className="text-xs text-muted-foreground">
              Dari {dashboardSummary.totalPackagesProcessedToday} paket
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rate Tepat Waktu</CardTitle>
            <Clock className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardSummary.onTimeDeliveryRateToday}%</div>
            <p className="text-xs text-muted-foreground">Pengiriman berhasil tepat waktu</p>
          </CardContent>
        </Card>
      </div>

      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
            <CardHeader>
            <CardTitle className="flex items-center text-xl text-primary"><BarChart2 className="mr-2 h-5 w-5"/>Ringkasan Pengiriman (7 Hari Terakhir)</CardTitle>
            <CardDescription>Visualisasi jumlah paket terkirim dan pending/retur.</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] pt-4">
            <ChartWrapper>
              <LazyResponsiveContainer width="100%" height="100%">
                  <LazyBarChart data={dashboardSummary.dailyShipmentSummary} margin={{ top: 5, right: 0, left: -25, bottom: 5 }}>
                  <LazyCartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.5)" />
                  <LazyXAxis dataKey="name" tick={{fontSize: '0.75rem'}}/>
                  <LazyYAxis tick={{fontSize: '0.75rem'}}/>
                  <LazyTooltip
                      contentStyle={{
                          background: "hsl(var(--background))",
                          borderColor: "hsl(var(--border))",
                          borderRadius: "var(--radius)",
                          fontSize: "0.8rem",
                          padding: "0.5rem"
                      }}
                      cursor={{ fill: "hsl(var(--accent)/0.2)" }}
                  />
                  <LazyLegend wrapperStyle={{fontSize: "0.8rem"}}/>
                  <LazyBar dataKey="terkirim" name="Terkirim" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} barSize={20}/>
                   <LazyBar dataKey="pending" name="Pending/Retur" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} barSize={20}/>
                   </LazyBarChart>
               </LazyResponsiveContainer>
             </ChartWrapper>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center text-xl text-primary"><TrendingUp className="mr-2 h-5 w-5" />Tren Pengiriman Mingguan (4 Minggu)</CardTitle>
                <CardDescription>Performa pengiriman paket terkirim dan pending per minggu.</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] pt-4">
                <ChartWrapper>
                  <LazyResponsiveContainer width="100%" height="100%">
                      <LazyLineChart data={dashboardSummary.weeklyShipmentSummary} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                          <LazyCartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.5)" />
                          <LazyXAxis dataKey="week" tick={{fontSize: '0.75rem'}} />
                          <LazyYAxis tick={{fontSize: '0.75rem'}} />
                          <LazyTooltip
                              contentStyle={{ background: "hsl(var(--background))", borderColor: "hsl(var(--border))", borderRadius: "var(--radius)", fontSize: "0.8rem", padding: "0.5rem" }}
                              cursor={{ fill: "hsl(var(--accent)/0.2)" }}
                          />
                          <LazyLegend wrapperStyle={{fontSize: "0.8rem"}} />
                          <LazyLine type="monotone" dataKey="terkirim" name="Terkirim" stroke="hsl(var(--chart-3))" strokeWidth={2} activeDot={{ r: 6 }} />
                          <LazyLine type="monotone" dataKey="pending" name="Pending/Retur" stroke="hsl(var(--chart-4))" strokeWidth={2} activeDot={{ r: 6 }} />
                      </LazyLineChart>
                  </LazyResponsiveContainer>
                </ChartWrapper>
            </CardContent>
        </Card>
        <Card className="md:col-span-2">
            <CardHeader>
                <CardTitle className="flex items-center text-xl text-primary"><BarChart2 className="mr-2 h-5 w-5" />Ringkasan Performa Bulanan (3 Bulan Terakhir)</CardTitle>
                <CardDescription>Perbandingan total paket terkirim dan pending.</CardDescription>
            </CardHeader>
            <CardContent className="h-[320px] pt-4">
                 <ChartWrapper>
                   <LazyResponsiveContainer width="100%" height="100%">
                      <LazyBarChart data={dashboardSummary.monthlyPerformanceSummary} margin={{ top: 5, right: 0, left: -25, bottom: 5 }}>
                          <LazyCartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.5)" />
                          <LazyXAxis dataKey="month" tick={{fontSize: '0.75rem'}} />
                          <LazyYAxis yAxisId="left" orientation="left" stroke="hsl(var(--chart-1))" tick={{fontSize: '0.75rem'}} />
                          <LazyYAxis yAxisId="right" orientation="right" stroke="hsl(var(--chart-5))" tick={{fontSize: '0.75rem'}} />
                          <LazyTooltip
                              contentStyle={{ background: "hsl(var(--background))", borderColor: "hsl(var(--border))", borderRadius: "var(--radius)", fontSize: "0.8rem", padding: "0.5rem" }}
                              cursor={{ fill: "hsl(var(--accent)/0.2)" }}
                          />
                          <LazyLegend wrapperStyle={{fontSize: "0.8rem"}} />
                          <LazyBar yAxisId="left" dataKey="totalDelivered" name="Total Terkirim" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} barSize={25} />
                          <LazyBar yAxisId="right" dataKey="totalPending" name="Total Pending" fill="hsl(var(--chart-5))" radius={[4, 4, 0, 0]} barSize={25} />
                      </LazyBarChart>
                   </LazyResponsiveContainer>
                 </ChartWrapper>
            </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-xl text-primary"><Activity className="mr-2 h-5 w-5"/>Aktivitas Absensi Terkini</CardTitle>
            <CardDescription>Update check-in/out kurir. Termasuk lokasi kerja kurir.</CardDescription>
          </CardHeader>
          <CardContent className="max-h-[400px] overflow-y-auto pr-2">
            {attendanceActivities.length > 0 ? (
              <ul className="space-y-3">
                {attendanceActivities.map(activity => (
                  <li key={activity.id} className="flex items-start space-x-3 p-3 bg-card-foreground/5 rounded-md">
                    <div className="flex-shrink-0 mt-0.5">
                      {getAttendanceActionIcon(activity.action)}
                    </div>
                    <div className="flex-grow">
                      <p className="text-sm font-medium">
                        {activity.kurirName} <span className="text-xs text-muted-foreground">({activity.kurirId})</span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {activity.action === 'check-in' ? 'melakukan check-in' : activity.action === 'check-out' ? 'melakukan check-out' : 'melaporkan keterlambatan'}
                        {activity.location && <span className="text-xs"> di {activity.location}</span>}
                      </p>
                      <p className="text-xs text-muted-foreground/80 mt-0.5">{formatActivityTimestamp(activity.timestamp)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-center py-4">Belum ada aktivitas absensi.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-xl text-primary"><ListChecks className="mr-2 h-5 w-5"/>Ringkasan Penyelesaian Kerja Kurir</CardTitle>
            <CardDescription>Laporan ringkas setelah kurir menyelesaikan tugas harian.</CardDescription>
          </CardHeader>
          <CardContent className="max-h-[400px] overflow-y-auto pr-2">
            {courierWorkSummaries.length > 0 ? (
              <ul className="space-y-3">
                {courierWorkSummaries.map(summary => (
                  <li key={summary.id} className="flex items-start space-x-3 p-3 bg-card-foreground/5 rounded-md">
                     <div className="flex-shrink-0 mt-0.5">
                      {getCourierWorkSummaryIcon()}
                    </div>
                    <div className="flex-grow">
                      <p className="text-sm font-medium">
                        {summary.kurirName} <span className="text-xs text-muted-foreground">({summary.kurirId})</span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Dari Hub: <span className="font-semibold">{summary.hubLocation}</span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Menyelesaikan pekerjaan: <strong className="text-foreground">{summary.totalPackagesAssigned}</strong> paket dibawa, <strong className="text-green-500">{summary.packagesDelivered}</strong> terkirim, <strong className="text-red-500">{summary.packagesPendingOrReturned}</strong> retur/pending.
                      </p>
                      <p className="text-xs text-muted-foreground/80 mt-0.5">{formatActivityTimestamp(summary.timestamp)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-center py-4">Belum ada ringkasan kerja kurir.</p>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}

