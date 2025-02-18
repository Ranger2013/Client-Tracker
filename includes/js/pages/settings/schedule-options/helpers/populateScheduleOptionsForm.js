
import ManageUser from "../../../../classes/ManageUser.js";

export default async function populateScheduleOptionsForm(form){
	try{
		const manageUser = new ManageUser();

		// Get the scheduling options
		const scheduleOptions = await manageUser.getScheduleOptions();

		for(const value in scheduleOptions){
			form[value].value = scheduleOptions[value];
		}
	}
	catch(err){
		const { default: errorLogs } = await import("../../../../utils/error-messages/errorLogs.js");
		await errorLogs('populateScheduleOptionsFormError', 'Populate Schedule Options Form Error: ', err);
	}
}