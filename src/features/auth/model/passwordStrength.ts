/**
 * Password strength rules (pure, testable). Drives the runtime checklist + meter on the reset
 * screen and gates the Reset button. Rule labels are i18n keys (auth namespace) — no hard-coded
 * user-facing strings (CLAUDE.md §16.6).
 */
export interface PasswordRule {
  id: string;
  labelKey: string;
  test: (password: string) => boolean;
}

export const PASSWORD_RULES: readonly PasswordRule[] = [
  { id: 'length', labelKey: 'reset.rules.length', test: (p) => p.length >= 8 },
  { id: 'uppercase', labelKey: 'reset.rules.uppercase', test: (p) => /[A-Z]/.test(p) },
  { id: 'lowercase', labelKey: 'reset.rules.lowercase', test: (p) => /[a-z]/.test(p) },
  { id: 'number', labelKey: 'reset.rules.number', test: (p) => /\d/.test(p) },
  { id: 'special', labelKey: 'reset.rules.special', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export type StrengthLevel = 'weak' | 'medium' | 'strong';

export interface RuleResult {
  id: string;
  labelKey: string;
  passed: boolean;
}

export interface PasswordStrength {
  results: RuleResult[];
  passedCount: number;
  total: number;
  /** 0–1, share of rules satisfied. */
  score: number;
  level: StrengthLevel;
  /** True only when every rule passes — gates the Reset button. */
  isStrong: boolean;
}

export function evaluatePassword(password: string): PasswordStrength {
  const results = PASSWORD_RULES.map((rule) => ({
    id: rule.id,
    labelKey: rule.labelKey,
    passed: password.length > 0 && rule.test(password),
  }));
  const passedCount = results.filter((r) => r.passed).length;
  const total = PASSWORD_RULES.length;
  const level: StrengthLevel = passedCount >= total ? 'strong' : passedCount >= 3 ? 'medium' : 'weak';
  return {
    results,
    passedCount,
    total,
    score: passedCount / total,
    level,
    isStrong: passedCount === total,
  };
}
