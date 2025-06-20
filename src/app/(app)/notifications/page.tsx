
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ApprovalModel, Approval } from '@/models/approval.model';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  isRead: boolean;
  type: 'approval' | 'system' | 'info';
  relatedId?: string; // ID of related item (e.g., approval ID)
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    // Verify user role is MasterAdmin
    if (user && user.role !== 'MasterAdmin') {
      toast({
        title: 'Akses Ditolak',
        description: 'Anda tidak memiliki akses ke halaman ini.',
        variant: 'destructive',
      });
      return;
    }

    fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      // Fetch pending approvals to convert to notifications
      const pendingApprovals = await ApprovalModel.getByStatus('pending');
      
      // Convert approvals to notifications format
      const approvalNotifications: Notification[] = pendingApprovals.map(approval => {
        let title = '';
        let message = '';
        
        switch (approval.request_type) {
          case 'add_user':
            title = 'Permintaan Penambahan Pengguna Baru';
            message = `${approval.requested_by_role} mengajukan penambahan pengguna baru: ${approval.data_json.full_name}`;
            break;
          case 'update_user':
            title = 'Permintaan Perubahan Data Pengguna';
            message = `${approval.requested_by_role} mengajukan perubahan data untuk pengguna: ${approval.data_json.full_name}`;
            break;
          case 'deactivate_user':
            title = 'Permintaan Nonaktifkan Pengguna';
            message = `${approval.requested_by_role} mengajukan permintaan untuk menonaktifkan pengguna: ${approval.data_json.full_name}`;
            break;
          default:
            title = 'Permintaan Persetujuan Baru';
            message = `${approval.requested_by_role} mengajukan permintaan persetujuan baru`;
        }
        
        return {
          id: `notif-${approval.id}`,
          title,
          message,
          date: approval.created_at,
          isRead: false,
          type: 'approval',
          relatedId: approval.id
        };
      });
      
      // Add some system notifications
      const systemNotifications: Notification[] = [
        {
          id: 'sys-001',
          title: 'Pemeliharaan Sistem',
          message: 'Sistem akan mengalami pemeliharaan pada tanggal 15 Juli 2023 pukul 23:00 - 01:00 WIB.',
          date: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
          isRead: true,
          type: 'system'
        },
        {
          id: 'sys-002',
          title: 'Pembaruan Aplikasi',
          message: 'Versi baru aplikasi telah tersedia. Beberapa fitur baru telah ditambahkan.',
          date: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          isRead: false,
          type: 'info'
        }
      ];
      
      // Combine and sort by date (newest first)
      const allNotifications = [...approvalNotifications, ...systemNotifications]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setNotifications(allNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: 'Gagal memuat data',
        description: 'Terjadi kesalahan saat memuat notifikasi.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (notification.type === 'approval' && notification.relatedId) {
      try {
        const approval = await ApprovalModel.getById(notification.relatedId);
        if (approval) {
          setSelectedApproval(approval);
          setDetailsOpen(true);
        }
      } catch (error) {
        console.error('Error fetching approval details:', error);
        toast({
          title: 'Gagal memuat detail',
          description: 'Terjadi kesalahan saat memuat detail persetujuan.',
          variant: 'destructive',
        });
      }
    }
    
    // Mark as read
    setNotifications(prev => 
      prev.map(n => n.id === notification.id ? {...n, isRead: true} : n)
    );
  };

  const formatRequestType = (type: string) => {
    switch (type) {
      case 'add_user': return 'Penambahan Pengguna';
      case 'update_user': return 'Perubahan Data Pengguna';
      case 'deactivate_user': return 'Nonaktifkan Pengguna';
      case 'other': return 'Permintaan Lainnya';
      default: return type;
    }
  };

  const renderApprovalDetails = (approval: Approval) => {
    const data = approval.data_json;
    
    switch (approval.request_type) {
      case 'add_user':
        return (
          <>
            <p><strong>Nama:</strong> {data.full_name}</p>
            <p><strong>Peran:</strong> {data.role}</p>
            {data.email && <p><strong>Email:</strong> {data.email}</p>}
            {data.area && <p><strong>Area:</strong> {data.area}</p>}
          </>
        );
      case 'update_user':
        return (
          <>
            <p><strong>ID Pengguna:</strong> {data.id}</p>
            <p><strong>Nama:</strong> {data.full_name}</p>
            <p><strong>Perubahan:</strong></p>
            <ul className="list-disc pl-5 text-sm">
              {Object.entries(data.changes || {}).map(([key, value]: [string, any]) => (
                <li key={key}>
                  {key}: <span className="line-through text-muted-foreground">{value.old}</span> → <span className="text-green-500">{value.new}</span>
                </li>
              ))}
            </ul>
          </>
        );
      case 'deactivate_user':
        return (
          <>
            <p><strong>ID Pengguna:</strong> {data.id}</p>
            <p><strong>Nama:</strong> {data.full_name}</p>
            <p><strong>Peran:</strong> {data.role}</p>
            {data.reason && <p><strong>Alasan:</strong> {data.reason}</p>}
          </>
        );
      default:
        return <pre className="text-xs overflow-auto max-h-40">{JSON.stringify(data, null, 2)}</pre>;
    }
  };

  const getNotificationTypeIcon = (type: Notification['type']) => {
    switch (type) {
      case 'approval':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">Persetujuan</Badge>;
      case 'system':
        return <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">Sistem</Badge>;
      case 'info':
        return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">Info</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl text-primary">
            <Bell className="mr-3 h-7 w-7" />
            Notifikasi
          </CardTitle>
          <CardDescription>
            Lihat notifikasi sistem dan permintaan persetujuan yang memerlukan tindakan Anda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notifications.length > 0 ? (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <Card 
                  key={notification.id} 
                  className={`p-4 ${notification.isRead ? 'bg-card-foreground/5' : 'bg-blue-50 dark:bg-blue-900/10'} cursor-pointer hover:bg-card-foreground/10 transition-colors`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-grow">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-md font-semibold text-foreground">
                          {notification.title}
                        </h3>
                        {!notification.isRead && (
                          <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{notification.message}</p>
                      <div className="flex justify-between items-center mt-2">
                        <p className="text-xs text-muted-foreground">
                          {new Date(notification.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {getNotificationTypeIcon(notification.type)}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Tidak ada notifikasi saat ini.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Detail Permintaan Persetujuan
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {selectedApproval && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Informasi Permintaan</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <p><strong>Jenis:</strong></p>
                    <p>{formatRequestType(selectedApproval.request_type)}</p>
                    
                    <p><strong>Diajukan oleh:</strong></p>
                    <p>{selectedApproval.requested_by_role} (ID: {selectedApproval.requested_by.substring(0, 8)})</p>
                    
                    <p><strong>Tanggal Diajukan:</strong></p>
                    <p>{new Date(selectedApproval.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Detail Data</h4>
                  <div className="text-sm">
                    {renderApprovalDetails(selectedApproval)}
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setDetailsOpen(false)}
                  >
                    Tutup
                  </Button>
                  <Button 
                    variant="default" 
                    onClick={() => {
                      setDetailsOpen(false);
                      // Redirect to approvals page
                      window.location.href = '/approvals';
                    }}
                  >
                    Lihat di Halaman Persetujuan
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
