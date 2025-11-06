import { format, parseISO } from 'date-fns';
import { sv } from 'date-fns/locale';

/**
 * Format a PostgreSQL interval (e.g., "00:02:34.567") to a readable time string
 */
export function formatTime(interval: string | null): string {
  if (!interval) return '-';

  // Handle PostgreSQL interval format
  // Could be "00:02:34.567" or "2 minutes 34.567 seconds"
  const timeMatch = interval.match(/(\d{2}):(\d{2}):(\d{2})\.?(\d+)?/);

  if (timeMatch) {
    const [, hours, minutes, seconds, milliseconds] = timeMatch;
    const h = parseInt(hours);
    const m = parseInt(minutes);
    const s = parseInt(seconds);
    const ms = milliseconds ? parseInt(milliseconds.padEnd(3, '0').slice(0, 3)) : 0;

    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  }

  return interval;
}

/**
 * Format a date string to Swedish locale
 */
export function formatDate(dateString: string | null, formatString: string = 'PPP'): string {
  if (!dateString) return '-';

  try {
    const date = parseISO(dateString);
    return format(date, formatString, { locale: sv });
  } catch (error) {
    return dateString;
  }
}

/**
 * Format a date to short format (e.g., "15 maj 2024")
 */
export function formatDateShort(dateString: string | null): string {
  return formatDate(dateString, 'd MMM yyyy');
}

/**
 * Calculate age from birth date
 */
export function calculateAge(birthDate: string | null): number | null {
  if (!birthDate) return null;

  const today = new Date();
  const birth = parseISO(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

/**
 * Get ordinal suffix for position (1st, 2nd, 3rd, etc.)
 */
export function getOrdinalSuffix(position: number): string {
  const j = position % 10;
  const k = position % 100;

  if (j === 1 && k !== 11) return `${position}:a`;
  if (j === 2 && k !== 12) return `${position}:a`;
  return `${position}:e`;
}

/**
 * Format points with optional decimal places
 */
export function formatPoints(points: number | null): string {
  if (points === null) return '0';

  // If whole number, don't show decimals
  if (points % 1 === 0) {
    return points.toString();
  }

  // Otherwise show up to 2 decimal places
  return points.toFixed(2).replace(/\.?0+$/, '');
}

/**
 * Normalize UCI ID (remove spaces)
 */
export function normalizeUCIID(uciId: string): string {
  return uciId.replace(/\s+/g, '');
}

/**
 * Format UCI ID for display (add spaces for readability)
 * Example: "10138828101" -> "101 388 281 01"
 */
export function formatUCIID(uciId: string | null): string {
  if (!uciId) return '-';

  const normalized = normalizeUCIID(uciId);

  // UCI IDs are typically 11 digits
  // Format: XXX XXX XXX XX
  if (normalized.length === 11) {
    return `${normalized.slice(0, 3)} ${normalized.slice(3, 6)} ${normalized.slice(6, 9)} ${normalized.slice(9, 11)}`;
  }

  return normalized;
}

/**
 * Get CSS class for competition status
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'completed':
      return 'bg-green-900 text-green-300';
    case 'ongoing':
      return 'bg-yellow-900 text-yellow-300';
    case 'upcoming':
      return 'bg-blue-900 text-blue-300';
    case 'cancelled':
      return 'bg-red-900 text-red-300';
    default:
      return 'bg-gray-900 text-gray-300';
  }
}

/**
 * Get Swedish translation for status
 */
export function translateStatus(status: string): string {
  const translations: Record<string, string> = {
    'upcoming': 'Kommande',
    'ongoing': 'Pågående',
    'completed': 'Avslutad',
    'cancelled': 'Inställd',
    'FIN': 'Målgång',
    'DNF': 'Bröt',
    'DNS': 'Startade ej',
    'DSQ': 'Diskad',
  };

  return translations[status] || status;
}

/**
 * Get Swedish translation for competition format
 */
export function translateFormat(format: string): string {
  const translations: Record<string, string> = {
    'DH': 'Downhill',
    'ENDURO': 'Enduro',
    'XC': 'Cross Country',
    'OTHER': 'Annat',
  };

  return translations[format] || format;
}

/**
 * Get CSS class for result status
 */
export function getResultStatusColor(status: string): string {
  switch (status) {
    case 'FIN':
      return 'text-green-400';
    case 'DNF':
      return 'text-orange-400';
    case 'DNS':
      return 'text-gray-400';
    case 'DSQ':
      return 'text-red-400';
    default:
      return 'text-gray-300';
  }
}
