export type PasswordStrength = 'weak' | 'medium' | 'strong' | 'very-strong';

export interface StrengthResult {
  level: PasswordStrength;
  score: number;
  label: string;
}

export function getPasswordStrength(pw: string): StrengthResult {
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (pw.length >= 12) score++;

  if (score <= 1) return { level: 'weak', score: 1, label: 'Fraca' };
  if (score <= 2) return { level: 'medium', score: 2, label: 'Média' };
  if (score <= 4) return { level: 'strong', score: 3, label: 'Forte' };
  return { level: 'very-strong', score: 4, label: 'Muito forte' };
}

export const strengthColors: Record<PasswordStrength, string> = {
  'weak': 'hsl(0 72% 51%)',
  'medium': 'hsl(38 92% 50%)',
  'strong': 'hsl(142 71% 45%)',
  'very-strong': 'hsl(152 100% 40%)',
};
