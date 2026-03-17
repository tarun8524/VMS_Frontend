import { VisitStatus } from '@/types';

const labels: Record<VisitStatus, string> = {
  pending:     'Pending',
  approved:    'Approved',
  rejected:    'Rejected',
  checked_in:  'Checked In',
  checked_out: 'Checked Out',
};

export function StatusBadge({ status }: { status: VisitStatus }) {
  return (
    <span className={`badge badge-${status}`}>
      {status === 'pending'     && '⏳ '}
      {status === 'approved'    && '✓ '}
      {status === 'rejected'    && '✕ '}
      {status === 'checked_in'  && '→ '}
      {status === 'checked_out' && '← '}
      {labels[status]}
    </span>
  );
}
