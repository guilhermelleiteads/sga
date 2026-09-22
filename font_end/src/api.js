const apiBaseUrl = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');

export function apiFetch(path, options) {
	return fetch(`${apiBaseUrl}${path}`, options);
}
