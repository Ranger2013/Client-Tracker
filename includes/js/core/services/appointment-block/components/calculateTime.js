export default function calculateTime(time1, time2) {
	try {
		let times = [time1, time2];
		let seconds = 0;
		for (let time of times) {
			let [hour, minute, second] = time.split(':').map(parseFloat);
			seconds += hour * 3600;
			seconds += minute * 60;
			seconds += second ? second : 0; // Handle cases where 'second' is undefined
		}

		let hours = Math.floor(seconds / 3600);
		seconds -= hours * 3600;
		let minutes = Math.floor(seconds / 60);
		seconds -= minutes * 60;

		if (seconds <= 9) {
			seconds = "0" + seconds;
		}
		if (minutes <= 9) {
			minutes = "0" + minutes;
		}
		if (hours <= 9) {
			hours = "0" + hours;
		}
		return `${hours}:${minutes}:${seconds}`;
	}
	catch (err) {
		throw err;
	} 
}