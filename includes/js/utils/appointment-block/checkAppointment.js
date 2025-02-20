import ManageClient from "../../classes/ManageClient.js";
import ManageUser from "../../classes/ManageUser.js";
import { clearMsg, myError } from "../dom/domUtils.js";
import { helpDeskTicket } from "../error-messages/errorMessages.js";
import buildAppointmentBlock from "./helpers/buildAppointmentBlock.js";
import buildNoAppointmentsBlock from "./helpers/buildNoAppointmentsBlock.js";
import buildProjectedAppointmentBlock from "./helpers/buildProjectedAppointmentBlock.js";
import getCurrentAppointments from "./helpers/getCurrentAppointments.js";
import getProjectedAppointments from "./helpers/getProjectedAppointments.js";

/**
 * Asynchronously checks and builds the appointment blocks.
 *
 * @param {Object} params - The parameters for checking appointments.
 * @param {HTMLElement|string} params.trimDate - The trim date element or Element Id.
 * @param {string} params.trimCycle - The trim cycle.
 * @param {HTMLElement|string} params.appBlock - The appointment block element or element id.
 * @param {HTMLElement|string} params.projAppBlock - The projected appointment block element or elment id.
 * @param {string|null} [params.clientInfo=null] - The client Information.
 * @returns {Promise<void>} - A Promise that resolves when the appointment blocks have been built.
 * @throws {Error} - Throws an error if the appointment blocks could not be built.
 */
export default async function checkAppointment({
	trimDate,
	trimCycle,
	appBlock,
	projAppBlock,
	clientInfo = null
}) {
	try {
		// DOM Elements
		trimDate = resolveElement(trimDate);
		trimCycle = resolveElement(trimCycle); // Only used on the add/edit client, not trimming page
 
		appBlock = resolveElement(appBlock);
		projAppBlock = resolveElement(projAppBlock);
		const trimDateError = document.getElementById(`${trimDate.id}-error`);
		const dateTime = new Date(trimDate.value.replace(/-/g, '\/')).toDateString();

		const manageClient = new ManageClient();

		// Get the user's information concurrently
		const manageUser = new ManageUser();
		const [scheduleOptions, dateTimeFormats, blockedDates] = await Promise.all([
			manageUser.getScheduleOptions(),
			manageUser.getDateTimeOptions(),
			manageUser.getUserBlockedDates() ?? []
		]);

		// Check if the user has schedule options or date time formats
		if(Object.keys(scheduleOptions).length === 0 || Object.keys(dateTimeFormats).length === 0) {
			throw new Error('User schedule options or date time formats are missing. Please update your settings.');
		}

		// Add the notice in the error block that this date has been blocked out by the user
		if (blockedDates?.includes(trimDate.value)) {
			myError(trimDateError, 'You have blocked out this date.', trimDateError);
		} else {
			clearMsg({ container: trimDateError, hide: true, input: trimDateError });
		}

		// Get the booked appointments and the projected appointments concurrently
		const [bookedAppointments, projectedAppointments] = await Promise.all([
			getCurrentAppointments(trimDate, scheduleOptions, dateTimeFormats, manageClient),
			getProjectedAppointments(trimDate, trimCycle, clientInfo, scheduleOptions)
		]);

		// Build the booked appointments or no appointments blocks
		if (bookedAppointments?.length > 0) {
			await buildAppointmentBlock(appBlock, bookedAppointments, dateTime);
		} else {
			await buildNoAppointmentsBlock(appBlock, dateTime);
		}

		// Build the projected blocks
		if (projectedAppointments?.length > 0) {
			await buildProjectedAppointmentBlock(projAppBlock, projectedAppointments, dateTime);
		}
	}
	catch (err) {
		const { handleError } = await import("../error-messages/handleError.js");
		await handleError({
			filename: 'checkAppointmentError',
			consoleMsg: 'Check appointment error: ',
			err,
			userMsg: `Unable to check appointment availability.<br>${err.message}`,
			errorEle: appBlock  // Use appBlock for error display
		});
	}
}

/**
 * Takes a string or HTMLElement and resolves it to an HTMLElement.
 * 
 * @param {HTMLElement|string} elementOrId - The element or element ID.
 * @returns {HTMLElement} - The resolved element.
 * @throws {Error} - Throws an error if the element could not be resolved.
 */
function resolveElement(elementOrId) {
	if (typeof elementOrId === 'string') {
		return document.getElementById(elementOrId);
	}
	else if (elementOrId instanceof HTMLElement) {
		return elementOrId;
	}
}