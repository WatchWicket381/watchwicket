export type MatchStatus = "draft" | "live" | "completed" | "abandoned" | "deleted";

export function normalizeStatus(input: any): MatchStatus {
  if (typeof input !== 'string') {
    return 'draft';
  }

  const normalized = input.toLowerCase();

  switch (normalized) {
    case 'draft':
    case 'upcoming':
      return 'draft';
    case 'live':
    case 'in progress':
      return 'live';
    case 'completed':
      return 'completed';
    case 'abandoned':
      return 'abandoned';
    case 'deleted':
      return 'deleted';
    default:
      return 'draft';
  }
}

export function getStatusLabel(status: any): string {
  const normalized = normalizeStatus(status);

  switch (normalized) {
    case 'draft':
      return 'Draft';
    case 'live':
      return 'Live';
    case 'completed':
      return 'Completed';
    case 'abandoned':
      return 'Abandoned';
    case 'deleted':
      return 'Deleted';
    default:
      return 'Draft';
  }
}

export function getStatusColor(status: any): string {
  const normalized = normalizeStatus(status);

  switch (normalized) {
    case 'draft':
      return 'bg-blue-900 text-blue-300';
    case 'live':
      return 'bg-green-900 text-green-300';
    case 'completed':
      return 'bg-gray-700 text-gray-300';
    case 'abandoned':
      return 'bg-orange-900 text-orange-300';
    case 'deleted':
      return 'bg-red-900 text-red-300';
    default:
      return 'bg-gray-700 text-gray-300';
  }
}
