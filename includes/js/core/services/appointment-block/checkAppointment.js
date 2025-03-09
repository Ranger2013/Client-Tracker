import { getValidElement } from '../../utils/dom/elements.js';
import { clearMsg, safeDisplayMessage } from '../../utils/dom/messages.js';
import buildAppointmentBlock from './components/buildAppointmentBlock.js';
import buildNoAppointmentsBlock from './components/buildNoAppointmentsBlock.js';
import buildProjectedAppointmentBlock from './components/buildProjectedAppointmentBlock.js';
import getCurrentAppointments from './components/getCurrentAppointments.js';
import getProjectedAppointments from './components/getProjectedAppointments.js';

const COMPONENT_ID = 'check-appointment';

/**
 * Asynchronously checks and builds the appointment blocks.
 *
 * @param {Object} params - The parameters for checking appointments.
 * @param {HTMLElement|string} params.trimDate - The trim date element or Element Id.
 * @param {string} params.trimCycle - The trim cycle.
 * @param {HTMLElement|string} params.appBlock - The appointment block element or element id.
 * @param {HTMLElement|string} params.projAppBlock - The projected appointment block element or elment id.
 * @param {string|null} [params.clientInfo=null] - The client Information.
 * @param {Object} params.manageClient - The ManageClient instance.
 * @param {Object} params.manageUser - The ManageUser instance.
 * @returns {Promise<void>} - A Promise that resolves when the appointment blocks have been built.
 * @throws {Error} - Throws an error if the appointment blocks could not be built.
 */
export default async function checkAppointment({
	trimDate,
	trimCycle,
	appBlock,
	projAppBlock,
	clientInfo = null,
	manageClient,
	manageUser
}) {
	try {
		// DOM Elements
		trimDate = getValidElement(trimDate);
		trimCycle = getValidElement(trimCycle); // Only used on the add/edit client, not trimming page
		appBlock = getValidElement(appBlock);
		projAppBlock = getValidElement(projAppBlock);

		const trimDateError = document.getElementById(`${trimDate.id}-error`);
		const dateTime = new Date(trimDate.value.replace(/-/g, '\/')).toDateString();

		const [scheduleOptions, dateTimeFormats, blockedDates] = await Promise.all([
			manageUser.getScheduleOptions(),
			manageUser.getDateTimeOptions(),
			manageUser.getUserBlockedDates() ?? []
		]);

		// Check if the user has schedule options or date time formats
		if (Object.keys(scheduleOptions).length === 0 || Object.keys(dateTimeFormats).length === 0) {
			throw new Error('User schedule options or date time formats are missing. Please update your settings.');
		}

		// Add the notice in the error block that this date has been blocked out by the user
		if (blockedDates?.includes(trimDate.value)) {
			safeDisplayMessage({
				elementOrId: trimDateError,
				message: 'You have blocked out this date.',
				targetId: trimDateError
			});
		} else {
			clearMsg({ container: trimDateError, hide: true, input: trimDateError });
		}

		// Get the booked appointments and the projected appointments concurrently
		const [bookedAppointments, projectedAppointments] = await Promise.all([
			getCurrentAppointments({ appointmentDate: trimDate.value, scheduleOptions, dateTimeFormats, manageClient }),
			getProjectedAppointments({ appointmentDate: trimDate, trimCycle, clientInfo, scheduleOptions, manageClient })
		]);

		// Build the booked appointments or no appointments blocks
		if (bookedAppointments?.length > 0) {
			await buildAppointmentBlock({
				appointmentContainer: appBlock,
				appointments: bookedAppointments,
				date: dateTime,
				manageClient,
				manageUser,
				componentId: COMPONENT_ID
			});
		} else {
			await buildNoAppointmentsBlock({ appointmentContainer: appBlock, date: dateTime });
		}

		// Build the projected blocks
		if (projectedAppointments?.length > 0) {
			await buildProjectedAppointmentBlock({ appointmentContainer: projAppBlock, data: projectedAppointments, date: dateTime });
		}
	}
	catch (err) {
		const { AppError } = await import("../../errors/models/AppError.js");
		AppError.handleError(err, {
			errorCode: AppError.Types.RENDER_ERROR,
			userMessage: 'Unable to check appointment availability.',
			displayTarget: appBlock
		});
	}
}