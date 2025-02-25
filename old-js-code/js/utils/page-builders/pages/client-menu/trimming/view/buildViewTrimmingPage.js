import ManageClient from "../../../../../../classes/ManageClient.js";
import ManageUser from "../../../../../../classes/ManageUser.js";
import { buildEle, clearMsg } from "../../../../../dom/domUtils.js";
import { addListener, removeAllListeners } from "../../../../../event-listeners/listeners.js";
import selectClientMenuPage from "../../../../../navigation/selectClientMenuPage.js";
import buildPageContainer from "../../../../helpers/buildPageContainer.js";
import buildTrimmingHeader from "./helpers/buildTrimmingHeader.js";
import buildTrimmingList from "./helpers/buildTrimmingList.js";

/**
 * Builds the view trimming page.
 * 
 * @param {Object} params - Parameters for building the page.
 * @param {string} params.cID - Client ID.
 * @param {string} params.primaryKey - Primary key.
 * @param {HTMLElement} params.mainContainer - Main container element.
 * @returns {Promise<Function>} - Function to remove all event listeners.
 */
export default async function buildViewTrimmingPage({ cID, primaryKey, mainContainer }) {
	try {
		// Clear any page msgs
		clearMsg({ container: 'page-msg' });

		if (!cID || !primaryKey) throw new Error('No cID or primary key provided.');

		const { clientName, trimInfo } = await getClientInfo({ cID, primaryKey });
		const userInfo = await getUserSettings();

		const [[container, card], displayContainer, buildTrimList] = await Promise.all([
			buildPageContainer({
				pageTitle: 'View Past Trimmings for ',
				clientName: clientName,
				cID,
				primaryKey,
			}),
			buildTrimmingHeader(),
			buildTrimmingList(trimInfo, userInfo),
		]);

		const formMsg = buildEle({
			type: 'div',
			myClass: ['w3-center'],
			attributes: { id: 'form-msg' },
		});

		const trimmingFooter = buildEle({
			type: 'div',
			myClass: ['w3-padding-small', 'w3-center'],
		});

		const trimFooterAnchor = buildEle({
			type: 'a',
			attributes: { href: `/tracker/trimming/view/?cID=${cID}&primaryKey=${primaryKey}&view_all=true` },
			text: 'View All Trimming History',
		});

		addListener(trimFooterAnchor, 'click', (evt) => selectClientMenuPage(evt, 'view-all-trim-dates', cID, primaryKey));

		mainContainer.innerHTML = '';

		container.appendChild(card);
		card.appendChild(formMsg);
		card.appendChild(displayContainer);
		displayContainer.appendChild(buildTrimList);
		displayContainer.appendChild(trimmingFooter);
		trimmingFooter.appendChild(trimFooterAnchor);
		mainContainer.appendChild(container);

		return removeAllListeners;
	} catch (err) {
		const { handleError } = await import("../../../../../error-messages/handleError.js");
		await handleError(
			'buildViewTrimmingPageError',
			'Error building the view trimming page:',
			err,
			'Unable to display the view trimming page. Please try again later.',
			'page-msg'
		);
	}
}

/**
 * Retrieves client information.
 * 
 * @param {Object} params - Parameters for retrieving client information.
 * @param {string} params.cID - Client ID.
 * @param {string} params.primaryKey - Primary key.
 * @returns {Promise<Object>} - Client name and trimming information.
 */
async function getClientInfo({ cID, primaryKey }) {
	try {
		const manageClient = new ManageClient();
		const trimming = await manageClient.getClientTrimmingInfo(cID);
		const clientInfo = await manageClient.getClientInfo({ primaryKey });
		const clientName = clientInfo?.client_name || 'Unable to get client name.';

		return { clientName, trimInfo: trimming.slice(-3) };
	} catch (err) {
		const { handleError } = await import("../../../../../error-messages/handleError.js");
		await handleError('getClientTrimInfoError', 'Get client trimming info error: ', err);

		return { trimming_status: 'error', trimming_msg: 'Unable to get client trimming information.' };
	}
}

/**
 * Retrieves user settings.
 * 
 * @returns {Promise<Object>} - User settings containing date and time format.
 */
async function getUserSettings() {
	try {
		const manageUser = new ManageUser();
		const userInfo = await manageUser.getDateTimeOptions();
		return { dateFormat: userInfo.date_format, timeFormat: userInfo.time_format };
	} catch (err) {
		const { handleError } = await import("../../../../../error-messages/handleError.js");
		await handleError('getUserSettingsError', 'Get user settings error: ', err);
	}
}