
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClipboardList } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ApprovalModel, Approval } from '@/models/approval.model';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function PendingApprovalsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    // Verify user role is Admin
    if (user && user.role !== 'Admin') {
      toast({
        title: 'Akses Ditolak',
        description: 'Anda tidak memiliki akses ke halaman ini.',
        variant: 'destructive',
      });
      return;
    }

    fetchApprovals();
  }, [user]);

  const fetchApprovals = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const userApprovals = await ApprovalModel.getByRequestedUser(user.id);
      setApprovals(userApprovals);
    } catch (error) {
      console.error('Error fetching approvals:', error);
      toast({
        title: 'Gagal memuat data',
        description: 'Terjadi kesalahan saat memuat data persetujuan.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const showDetails = (approval: Approval) => {
    setSelectedApproval(approval);
    setDetailsOpen(true);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Menunggu</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">Disetujui</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">Ditolak</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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
            <ClipboardList className="mr-3 h-7 w-7" />
            Status Permintaan Persetujuan
          </CardTitle>
          <CardDescription>
            Lihat status permintaan persetujuan yang telah Anda ajukan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {approvals.length > 0 ? (
            <div className="space-y-4">
              {approvals.map((approval) => (
                <Card key={approval.id} className="bg-card-foreground/5 p-4">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
                    <div className="flex-grow">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-md font-semibold text-foreground">
                          {formatRequestType(approval.request_type)}
                        </h3>
                        {getStatusBadge(approval.status)}
                      </div>
                      <div className="text-sm space-y-0.5">
                        <p><strong>ID Permintaan:</strong> {approval.id.substring(0, 8)}</p>
                        <p><strong>Tanggal Diajukan:</strong> {new Date(approval.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                        {approval.status !== 'pending' && (
                          <>
                            <p><strong>Tanggal Diproses:</strong> {approval.approval_date ? new Date(approval.approval_date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}</p>
                            {approval.notes && <p><strong>Catatan:</strong> {approval.notes}</p>}
                          </>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 sm:mt-0">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => showDetails(approval)}
                      >
                        Detail
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Anda belum memiliki permintaan persetujuan.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Detail Permintaan
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
                    
                    <p><strong>Status:</strong></p>
                    <p>{getStatusBadge(selectedApproval.status)}</p>
                    
                    <p><strong>Tanggal Diajukan:</strong></p>
                    <p>{new Date(selectedApproval.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    
                    {selectedApproval.status !== 'pending' && (
                      <>
                        <p><strong>Tanggal Diproses:</strong></p>
                        <p>{selectedApproval.approval_date ? new Date(selectedApproval.approval_date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}</p>
                        
                        {selectedApproval.notes && (
                          <>
                            <p><strong>Catatan:</strong></p>
                            <p>{selectedApproval.notes}</p>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Detail Data</h4>
                  <div className="text-sm">
                    {renderApprovalDetails(selectedApproval)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
