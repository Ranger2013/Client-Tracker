export function formatPhone(value) {
	let cleaned = ('' + value).replace(/\D/g, '');
	let match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);

	if(!match) return false;

	return `${match[1]}-${match[2]}-${match[3]}`;
}

export function formatEmail(value){
	const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

	return value.match(emailPattern);
}
