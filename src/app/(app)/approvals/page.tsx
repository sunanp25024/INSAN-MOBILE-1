
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ApprovalModel, Approval } from '@/models/approval.model';
import { useToast } from '@/components/ui/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';

export default function ApprovalsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
  const [notes, setNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');

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

    fetchApprovals();
  }, [user]);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const pendingApprovals = await ApprovalModel.getByStatus('pending');
      setApprovals(pendingApprovals);
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

  const handleAction = (approval: Approval, type: 'approve' | 'reject') => {
    setSelectedApproval(approval);
    setActionType(type);
    setNotes('');
    setActionDialogOpen(true);
  };

  const submitAction = async () => {
    if (!selectedApproval || !user) return;

    try {
      setActionLoading(true);
      
      if (actionType === 'approve') {
        await ApprovalModel.approve(selectedApproval.id, user.id, notes);
        toast({
          title: 'Persetujuan Berhasil',
          description: 'Permintaan telah disetujui.',
        });
      } else {
        await ApprovalModel.reject(selectedApproval.id, user.id, notes);
        toast({
          title: 'Penolakan Berhasil',
          description: 'Permintaan telah ditolak.',
        });
      }

      // Refresh data
      await fetchApprovals();
      setActionDialogOpen(false);
    } catch (error) {
      console.error(`Error ${actionType === 'approve' ? 'approving' : 'rejecting'} request:`, error);
      toast({
        title: 'Gagal',
        description: `Terjadi kesalahan saat ${actionType === 'approve' ? 'menyetujui' : 'menolak'} permintaan.`,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
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
            <ShieldCheck className="mr-3 h-7 w-7" />
            Persetujuan Perubahan Data
          </CardTitle>
          <CardDescription>
            Tinjau dan setujui atau tolak permintaan perubahan data yang diajukan oleh Admin atau PIC.
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
                        <Badge variant="outline" className="text-xs">
                          ID: {approval.id.substring(0, 8)}
                        </Badge>
                      </div>
                      <div className="text-sm space-y-0.5">
                        <p><strong>Diajukan oleh:</strong> {approval.requested_by_role} (ID: {approval.requested_by.substring(0, 8)})</p>
                        <p><strong>Tanggal Diajukan:</strong> {new Date(approval.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                        {renderApprovalDetails(approval)}
                      </div>
                    </div>
                    <div className="flex flex-row sm:flex-col gap-2 mt-3 sm:mt-0">
                      <Button 
                        size="sm" 
                        variant="default" 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleAction(approval, 'approve')}
                      >
                        Setujui
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleAction(approval, 'reject')}
                      >
                        Tolak
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Tidak ada permintaan persetujuan yang menunggu.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Setujui Permintaan' : 'Tolak Permintaan'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-4">
              Anda akan {actionType === 'approve' ? 'menyetujui' : 'menolak'} permintaan ini. 
              {actionType === 'reject' && ' Harap berikan alasan penolakan.'}
            </p>
            <Textarea
              placeholder={actionType === 'approve' ? 'Catatan tambahan (opsional)' : 'Alasan penolakan'}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[100px]"
              required={actionType === 'reject'}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialogOpen(false)} disabled={actionLoading}>
              Batal
            </Button>
            <Button 
              onClick={submitAction} 
              disabled={actionLoading || (actionType === 'reject' && !notes.trim())}
              variant={actionType === 'approve' ? 'default' : 'destructive'}
            >
              {actionLoading ? <Spinner size="sm" className="mr-2" /> : null}
              {actionType === 'approve' ? 'Setujui' : 'Tolak'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
