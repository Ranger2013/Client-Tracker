import checkAppointment from '../../../../../core/services/appointment-block/checkAppointment.js';
import { getValidElement } from '../../../../../core/utils/dom/elements.js';
import { buildSubmitButtonSection, buildTwoColumnInputSection, buildTwoColumnSelectElementSection } from '../../../../../core/utils/dom/forms/buildUtils.min.js';
import { trimCycleConfigurations } from '../../../../../core/utils/dom/forms/trimCycleConfigurations.js';

// Set up the logging
const COMPONENT = 'Build and Shoe Client Form';
const DEBUG = false;

const debugLog = (...args) => {
	if(DEBUG){
		console.log(`[${COMPONENT}]`, ...args);
	}
};

export default async function buildAndShowClientForm({evt, manageClient, manageUser}){
	try{
		const clientContainer = getValidElement('client-container');

		if(evt.target.value === 'null') {
			clientContainer.innerHTML = '';
			return;
		}

		const [trimCycleSection, appDateSection, appTimeSection, submitButton] = await Promise.all([
			buildTwoColumnSelectElementSection({
				labelText: 'Trimming/Shoeing Cycle:',
				selectID: 'trim-cycle',
				selectName: 'trim_cycle',
				selectTitle: 'Select the trimming/shoeing cycle for the client',
				required: true,
				options: trimCycleConfigurations(),
			}),
			buildTwoColumnInputSection({
				labelText: 'Next Trimming:',
				inputID: 'next-trim-date',
				inputType: 'date',
				inputName: 'next_trim_date',
				inputTitle: 'Next Appointment',
				required: true,
			}),
			buildTwoColumnInputSection({
				labelText: 'Appointment Time:',
				inputID: 'app-time',
				inputType: 'time',
				inputName: 'app_time',
				inputTitle: 'Appointment Time',
				required: true,
			}),
			buildSubmitButtonSection('Create Duplicate Client'),
		]);

		// Clear the container
		clientContainer.innerHTML = '';
		clientContainer.append(trimCycleSection, appDateSection, appTimeSection, submitButton);

		checkAppointment({
			trimDate: 'next-trim-date',
			trimCycle: 'trim-cycle',
			appBlock: 'appointment-block',
			projAppBlock: 'projected-appointment-block',
			manageClient,
			manageUser,
		});
	}
	catch(err){
		const { AppError } = await import("../../../../../core/errors/models/AppError.js");
		AppError.process(err, {
			errorCode: AppError.Types.RENDER_ERROR,
			userMessage: 'Unable to display the Duplicate Form at this time.',
			displayTarget: 'form-msg',
		},true);
	}
}