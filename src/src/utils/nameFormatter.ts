export function formatPlayerName(fullName: string): string {
  if (!fullName || typeof fullName !== 'string') {
    return '';
  }

  const parts = fullName.trim().split(/\s+/);

  if (parts.length === 0) {
    return '';
  }

  if (parts.length === 1) {
    return parts[0];
  }

  const firstNameInitial = parts[0].charAt(0).toUpperCase();
  const surname = parts[parts.length - 1];

  return `${firstNameInitial} ${surname}`;
}
