import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string | Date | undefined): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export function formatTime(timeOrDateString: string | Date | undefined): string {
  if (!timeOrDateString) return '-';

  // Check if it's already a HH:mm or HH:mm:ss format (time string from API)
  if (typeof timeOrDateString === 'string' && /^\d{1,2}:\d{2}(:\d{2})?$/.test(timeOrDateString)) {
    // Just return the HH:mm part
    return timeOrDateString.slice(0, 5);
  }

  // Otherwise parse as Date
  const date = new Date(timeOrDateString);
  if (isNaN(date.getTime())) return '-';

  return date.toLocaleTimeString('de-CH', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    rehearsal: 'Probe',
    performance: 'Auftritt',
    concert: 'Konzert',
    general_meeting: 'Generalversammlung',
    other: 'Sonstiges',
    logistics: 'Logistik',
    social: 'Geselliges'
  };
  return labels[category] || category;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: 'Aktiv',
    inactive: 'Inaktiv',
    pending: 'Ausstehend',
    archived: 'Archiviert'
  };
  return labels[status] || status;
}
