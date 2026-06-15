import { describe, expect, it } from 'vitest';
import { evaluatePassword } from './passwordStrength';

describe('evaluatePassword', () => {
  it('treats an empty password as weak with no rules passed', () => {
    const s = evaluatePassword('');
    expect(s.passedCount).toBe(0);
    expect(s.isStrong).toBe(false);
    expect(s.level).toBe('weak');
  });

  it('flags a partial password as medium and not strong', () => {
    // length + lowercase + number => 3 rules
    const s = evaluatePassword('abcd1234');
    expect(s.results.find((r) => r.id === 'uppercase')?.passed).toBe(false);
    expect(s.isStrong).toBe(false);
    expect(s.level).toBe('medium');
  });

  it('marks a password meeting every rule as strong', () => {
    const s = evaluatePassword('Abcd123!');
    expect(s.passedCount).toBe(s.total);
    expect(s.isStrong).toBe(true);
    expect(s.level).toBe('strong');
    expect(s.score).toBe(1);
  });
});
