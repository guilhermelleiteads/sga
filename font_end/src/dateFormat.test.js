import { formatDateTime } from './dateFormat';

describe('formatDateTime', () => {
	it('shows a useful fallback when the request has no date', () => {
		expect(formatDateTime(null)).toBe('Data não registrada');
		expect(formatDateTime('')).toBe('Data não registrada');
	});

	it('formats a valid timestamp without falling back to the Unix epoch', () => {
		const formatted = formatDateTime('2026-11-04T20:29:00-03:00');

		expect(formatted).not.toBe('Data não registrada');
		expect(formatted).not.toContain('1969');
		expect(formatted).toContain('2026');
		expect(formatted).toContain('20:29');
	});

	it('does not display a fabricated 21:00 time for date-only values', () => {
		const formatted = formatDateTime('2026-11-04');

		expect(formatted).toContain('4 de nov. de 2026');
		expect(formatted).not.toContain('21:00');
		expect(formatted).not.toContain(':');
	});

	it('formats a SQL timestamp with a space between the date and time', () => {
		const formatted = formatDateTime('2026-11-04 20:29:00-03:00');

		expect(formatted).toContain('4 de nov. de 2026');
		expect(formatted).toContain('20:29');
	});

	it('returns a fallback for an invalid calendar date', () => {
		expect(formatDateTime('2026-02-30')).toBe('Data não registrada');
	});
});
