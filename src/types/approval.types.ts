import { Approval } from '@/models/approval.model';

export type ApprovalTableData = Approval & {
  requesterName: string;
  approverName?: string;
};

export type ApprovalFormData = {
  request_type: 'add_user' | 'update_user' | 'deactivate_user' | 'other';
  notes?: string;
  data_json: any;
};

export type ApprovalActionData = {
  id: string;
  notes?: string;
};

export type ApprovalStats = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
};

export type ApprovalFilter = {
  status?: 'all' | 'pending' | 'approved' | 'rejected';
  requestType?: 'all' | 'add_user' | 'update_user' | 'deactivate_user' | 'other';
  dateRange?: {
    start: Date;
    end: Date;
  };
  requestedBy?: string;
};