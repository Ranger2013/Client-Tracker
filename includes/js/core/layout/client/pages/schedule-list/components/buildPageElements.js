import { buildEle } from '../../../../../utils/dom/elements.js';
import buildPersonalNotesSection from './buildPersonaNotesSection.js';
import buildAppointmentTitleSection from './buildAppointmentTitleSection.js';
import buildAppointmentList from './buildAppointmentList.js';
import buildSearchBlockSection from '../../../../components/buildSearchBlockSection.js';

/**
 * Configuration for schedule list page elements
 * @typedef {Object} PageConfig
 * @property {Array<{value: string, text: string}>} filterOptions - Search filter dropdown options
 * @property {Object} container - Main container element configuration
 * @property {string} container.type - Element type ('div')
 * @property {string[]} container.class - CSS classes for container
 * @property {Object} wrapper - Schedule list wrapper configuration
 * @property {string} wrapper.type - Element type ('div')
 * @property {Object} wrapper.attributes - Element attributes
 * @property {string} wrapper.attributes.id - Element ID ('schedule-list')
 * @property {Object} formMsg - Form message container configuration
 * @property {string} formMsg.type - Element type ('div')
 * @property {string[]} formMsg.class - CSS classes for message container
 * @property {Object} counter - Client counter element configuration
 * @property {string} counter.type - Element type ('div')
 * @property {string[]} counter.class - CSS classes for counter
 */
const PAGE_CONFIG = {
	filterOptions: {
		list: [
			{ value: 'client-name', text: 'Search By Client Name' },
			{ value: 'phone', text: 'Search By Phone' },
			{ value: 'address', text: 'Search By Address' },
			{ value: 'app-time', text: 'Search By Appointment Time' },
			// { value: 'app-date', text: 'Search By Appointment Date' },
		],
		value: opt => opt.value,
		text: opt => opt.text,
	},
	container: {
		type: 'div',
		myClass: ['w3-container'],
	},
	wrapper: {
		type: 'div',
		attributes: { id: 'appointment-list'},
	},
	counter: {
		type: 'div',
		myClass: ['w3-small'],
	},
};

export default async function buildPageElements({ active, cID = null, primaryKey = null, manageClient, manageUser }) {
	 try {
		  const container = buildEle(PAGE_CONFIG.container);
		  const appointmentWrapper = buildEle(PAGE_CONFIG.wrapper);
		  const [
			personalNotesContainer,
			searchBlockContainer,
			appointmentTitleContainer,
			appointmentList,
		  ] = await Promise.all([
			buildPersonalNotesSection({ manageUser }),
			buildSearchBlockSection(PAGE_CONFIG.filterOptions),
			buildAppointmentTitleSection(),
			buildAppointmentList({ active, clientId: cID, primaryKey, manageClient, manageUser }),
		  ]);
		  
		  container.append(personalNotesContainer, searchBlockContainer, appointmentTitleContainer, appointmentWrapper);
		  appointmentWrapper.append(appointmentList);
		  
		  return container;
	 }
	 catch (err) {
		throw err;
	 }
}