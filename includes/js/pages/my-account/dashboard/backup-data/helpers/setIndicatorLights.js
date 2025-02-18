export default async function setIndicatorLights(response, indicatorEle) {
	try {
		for (const { status, msg, data } of response) {
			if (status === 'success' || status === 'no-update' || status === 'ok') {
				indicatorEle.src = "/public/siteImages/indicator_green_light.webp";
			}
			else if (status === 'error' || status === 'server-error') {
				indicatorEle.src = "/public/siteImages/indicator_red_light.png";
			}
			else if (status === 'validation-error') {
				if ((data.horse_name && data.horse_name.includes('already exists')) ||
					(data.client_name && data.client_name.includes('already exists')) ||
					(data.primaryKey && data.primaryKey.includes('already exists'))) {
					indicatorEle.src = "/public/siteImages/indicator_green_light.webp";
				}
				else {
					indicatorEle.src = "/public/siteImages/indicator_red_light.png";
				}
			}
		}
	}
	catch (err) {
		const { default: errorLogs } = await import("../../../../../utils/error-messages/errorLogs.js");
		await errorLogs('setIndicatorLightsError', 'Set Indicator Lights Error: ', err);
	}
}