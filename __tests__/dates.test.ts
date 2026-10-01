import { formatTimeLeft } from '@/utils/dates';

describe('formatTimeLeft', () => {
  const baseTime = new Date('2026-01-15T12:00:00Z');

  it('returns "Expired" for dates at or before now', () => {
    // Exactly at now
    expect(formatTimeLeft('2026-01-15T12:00:00Z', baseTime)).toBe('Expired');
    // Before now
    expect(formatTimeLeft('2026-01-15T11:00:00Z', baseTime)).toBe('Expired');
  });

  it('returns "{m}m left" for times under 1 hour', () => {
    // 30 minutes left
    expect(formatTimeLeft('2026-01-15T12:30:00Z', baseTime)).toBe('30m left');
    // 1 minute left
    expect(formatTimeLeft('2026-01-15T12:01:00Z', baseTime)).toBe('1m left');
  });

  it('returns at least "1m left" for very soon (< 1 minute)', () => {
    // 30 seconds left
    expect(formatTimeLeft('2026-01-15T12:00:30Z', baseTime)).toBe('1m left');
  });

  it('returns "{h}h left" for times under 24 hours', () => {
    // Exactly 1 hour left
    expect(formatTimeLeft('2026-01-15T13:00:00Z', baseTime)).toBe('1h left');
    // 23 hours left
    expect(formatTimeLeft('2026-01-16T11:00:00Z', baseTime)).toBe('23h left');
    // Just under 24 hours
    expect(formatTimeLeft('2026-01-16T11:59:59Z', baseTime)).toBe('23h left');
  });

  it('returns "{d} day left" for exactly 1 day', () => {
    // Exactly 24 hours left
    expect(formatTimeLeft('2026-01-16T12:00:00Z', baseTime)).toBe('1 day left');
  });

  it('returns "{d} days left" for multiple days', () => {
    // 2 days left
    expect(formatTimeLeft('2026-01-17T12:00:00Z', baseTime)).toBe('2 days left');
    // 7 days left
    expect(formatTimeLeft('2026-01-22T12:00:00Z', baseTime)).toBe('7 days left');
    // 30 days left
    expect(formatTimeLeft('2026-02-14T12:00:00Z', baseTime)).toBe('30 days left');
  });

  it('returns "—" for invalid date strings', () => {
    expect(formatTimeLeft('invalid date', baseTime)).toBe('—');
    expect(formatTimeLeft('', baseTime)).toBe('—');
    expect(formatTimeLeft('not a date', baseTime)).toBe('—');
  });

  it('returns "—" for invalid Date objects', () => {
    expect(formatTimeLeft(new Date('invalid'), baseTime)).toBe('—');
  });

  it('uses current time as default', () => {
    // This test just checks that the function runs without error when no now is passed
    // We can't assert exact values without mocking Date, but we can check it doesn't throw
    expect(() => formatTimeLeft('2099-01-15T12:00:00Z')).not.toThrow();
  });

  it('handles Date objects as input', () => {
    const futureDate = new Date('2026-01-15T13:00:00Z');
    expect(formatTimeLeft(futureDate, baseTime)).toBe('1h left');
  });

  it('floors days (no rounding up)', () => {
    // 1 day and 1 hour left (should be 1 day, not 2)
    expect(formatTimeLeft('2026-01-16T13:00:00Z', baseTime)).toBe('1 day left');
    // 2 days and 23 hours left (should be 2 days, not 3)
    expect(formatTimeLeft('2026-01-18T11:59:00Z', baseTime)).toBe('2 days left');
  });

  it('floors hours within the 24-hour window', () => {
    // 1.5 hours left (should be 1h, not 2h)
    expect(formatTimeLeft('2026-01-15T13:30:00Z', baseTime)).toBe('1h left');
  });

  it('floors minutes within the 1-hour window', () => {
    // 1.5 minutes left (should be 1m, not 2m)
    expect(formatTimeLeft('2026-01-15T12:01:30Z', baseTime)).toBe('1m left');
  });

  it('handles the just-expired case (negative milliseconds)', () => {
    // A few hours ago
    expect(formatTimeLeft('2026-01-15T10:00:00Z', baseTime)).toBe('Expired');
  });
});
