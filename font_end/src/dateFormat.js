export function formatDateTime(value) {
	if (value === null || value === undefined || value === '') return 'Data não registrada';

	const dateOnlyMatch = typeof value === 'string'
		? /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
		: null;
	let date = value;
	let options = { dateStyle: 'medium', timeStyle: 'short' };
	let timeZone = 'America/Sao_Paulo';

	if (dateOnlyMatch) {
		const [, year, month, day] = dateOnlyMatch;
		date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12));
		if (
			date.getUTCFullYear() !== Number(year)
			|| date.getUTCMonth() !== Number(month) - 1
			|| date.getUTCDate() !== Number(day)
		) {
			return 'Data não registrada';
		}
		options = { dateStyle: 'medium' };
		timeZone = 'UTC';
	} else if (typeof value === 'string') {
		date = value.replace(/^(\d{4}-\d{2}-\d{2})\s+/, '$1T');
	}

	date = new Date(date);
	if (Number.isNaN(date.getTime())) return 'Data não registrada';

	return new Intl.DateTimeFormat('pt-BR', {
		...options,
		timeZone,
	}).format(date);
}
