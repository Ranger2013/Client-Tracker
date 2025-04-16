// Set up debugMode
const COMPONENT = "Validate Username";
const DEBUG = false;
const debugLog = (...args) => {
	if (DEBUG) {
		console.log(`[${COMPONENT}]`, ...args);
	}
};

export default async function validateUsername(response){
	debugLog('Validating username: response: ', response);
}