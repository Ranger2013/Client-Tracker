import { formatDate, getWeeksAndDaysSinceLastTrim, sortByDateOnly } from "../../../../../../date/dateUtils.js";
import { buildEle } from "../../../../../../dom/domUtils.js";
import { cleanUserOutput, ucwords, underscoreToSpaces } from "../../../../../../string/stringUtils.js";

/**
 * Builds the trimming list.
 * 
 * @param {Array} trimInfo - Array of trimming information.
 * @param {Object} userInfo - User information including date and time format.
 * @returns {Promise<DocumentFragment>} - A document fragment containing the trimming list.
 */
export default async function buildTrimmingList(trimInfo, userInfo) {
	try {
		 if (trimInfo.length === 0) return await noCurrentTrimmings();

		 const { dateFormat } = userInfo;
		 const fragment = document.createDocumentFragment();
		 
		 // Sort trimInfo by date_trimmed from newest to oldest
		 trimInfo.sort((a, b) => sortByDateOnly(a.date_trimmed, b.date_trimmed, false));

		 for (const trim of trimInfo) {
			  const { weeks, days } = getWeeksAndDaysSinceLastTrim(trim.date_trimmed);

			  const trimData = {
					dateTrimmed: formatDate(trim.date_trimmed, dateFormat),
					weeks,
					days,
					horses: trim.horses,
					mileageCost: trim.mileage_cost,
					totalPayment: trim.payment_amount,
					sessionNotes: cleanUserOutput(trim.session_notes),
			  };

			  const trimBlock = await buildTrimmingBlock(trim, trimData);
			  fragment.appendChild(trimBlock);
		 }

		 return fragment;
	} catch (err) {
		 const { handleError } = await import("../../../../../../error-messages/handleError.js");
		 await handleError('buildTrimmingListError', 'Error building trimming list: ', err);
		 throw err;
	}
}

/**
* Handles the case when there are no current trimmings.
* @returns {Promise<HTMLElement>} - An element indicating no current trimmings.
*/
async function noCurrentTrimmings() {
	// Implementation for no current trimmings
}

/**
 * Creates a single block to display the trimming information.
 * 
 * @param {Object} trim - The trimming information.
 * @param {Object} trimData - The formatted trimming data.
 * @returns {Promise<HTMLElement>} - The trimming block element.
 * @throws Will throw an error if there is an issue creating the trimming block.
 */
async function buildTrimmingBlock(trim, trimData) {
	try {
		 const { dateTrimmed, weeks, days, horses, mileageCost, totalPayment, sessionNotes } = trimData;

		 const row = buildEle({
			  type: 'div',
			  myClass: ['w3-row', 'w3-border-bottom', 'w3-padding-small'],
		 });

		 const colOne = buildColumnOne(dateTrimmed, weeks, days);
		 const colTwo = buildColumnTwo(horses);
		 const colThree = buildColumnThree(mileageCost, totalPayment);
		 const notesRow = buildNotesRow(sessionNotes);

		 row.appendChild(colOne);
		 row.appendChild(colTwo);
		 row.appendChild(colThree);
		 if (notesRow) {
			  row.appendChild(notesRow);
		 }

		 return row;
	} catch (err) {
		 const { handleError } = await import("../../../../../../error-messages/handleError.js");
		 await handleError('buildTrimmingBlockError', 'Error building trimming block: ', err);
		 throw err;
	}
}

/**
 * Builds the first column with date information.
 * 
 * @param {string} dateTrimmed - The date the trim was performed.
 * @param {number} weeks - Number of weeks since the last trim.
 * @param {number} days - Number of days since the last trim.
 * @returns {HTMLElement} - The first column element.
 * @throws Will throw an error if there is an issue creating the column.
 */
function buildColumnOne(dateTrimmed, weeks, days) {
	try {
		 const colOne = buildEle({
			  type: 'div',
			  myClass: ['w3-col', 's4'],
		 });

		 const colOneDatesLarge = buildEle({
			  type: 'div',
			  myClass: ['w3-hide-small', 'w3-center'],
			  text: `${dateTrimmed}<br><span class="w3-small">${weeks} weeks and ${days} day(s) ago</span>`,
		 });

		 const colOneDatesSmall = buildEle({
			  type: 'div',
			  myClass: ['w3-hide-medium', 'w3-hide-large', 'w3-center'],
			  text: dateTrimmed,
		 });

		 colOne.appendChild(colOneDatesLarge);
		 colOne.appendChild(colOneDatesSmall);

		 return colOne;
	} catch (err) {
		 throw new Error(`Error building column one: ${err.message}`);
	}
}

/**
 * Builds the second column with horse information.
 * 
 * @param {Array} horses - Array of horse information.
 * @returns {HTMLElement} - The second column element.
 * @throws Will throw an error if there is an issue creating the column.
 */
function buildColumnTwo(horses) {
	try {
		 const colTwo = buildEle({
			  type: 'div',
			  myClass: ['w3-col', 's4'],
		 });

		 const secondColLarge = buildEle({
			  type: 'div',
			  myClass: ['w3-hide-small', 'w3-center'],
		 });

		 const secondColSmall = buildEle({
			  type: 'div',
			  myClass: ['w3-hide-medium', 'w3-hide-large', 'w3-center'],
			  text: `${horses.length}`,
		 });

		 horses.forEach(horse => {
			  const divEle = buildEle({
					type: 'div',
			  });

			  const horseName = buildEle({
					type: 'div',
					myClass: ['w3-bold', 'w3-underline'],
					text: `${horse.horse_name}<br>`,
			  });

			  const [typeTrim, cost] = horse.type_trim.split(':');

			  const horseService = buildEle({
					type: 'div',
					myClass: ['w3-small'],
					text: `${ucwords(underscoreToSpaces(typeTrim))}: $${cost}`,
			  });

			  divEle.appendChild(horseName);
			  divEle.appendChild(horseService);

			  // Handle accessories if any
			  const accessories = buildAccessories(horse.acc);
			  if (accessories) {
				 divEle.appendChild(accessories);
			  }

			  secondColLarge.appendChild(divEle);
		 });

		 colTwo.appendChild(secondColLarge);
		 colTwo.appendChild(secondColSmall);

		 return colTwo;
	} catch (err) {
		 throw new Error(`Error building column two: ${err.message}`);
	}
}

/**
 * Builds the third column with mileage and total payment information.
 * 
 * @param {number} mileageCost - The mileage cost.
 * @param {number} totalPayment - The total payment amount.
 * @returns {HTMLElement} - The third column element.
 * @throws Will throw an error if there is an issue creating the column.
 */
function buildColumnThree(mileageCost, totalPayment) {
	try {
		 const colThree = buildEle({
			  type: 'div',
			  myClass: ['w3-col', 's4'],
		 });

		 const colThreeMileage = buildEle({
			  type: 'div',
			  myClass: ['w3-center'],
			  text: `Mileage: $${mileageCost}`,
		 });

		 const colThreeTotal = buildEle({
			  type: 'div',
			  myClass: ['w3-center'],
			  text: `Total: $${totalPayment}`,
		 });

		 colThree.appendChild(colThreeMileage);
		 colThree.appendChild(colThreeTotal);

		 return colThree;
	} catch (err) {
		 throw new Error(`Error building column three: ${err.message}`);
	}
}

/**
 * Builds the notes row with session notes.
 * 
 * @param {string} sessionNotes - The session notes.
 * @returns {HTMLElement|null} - The notes row element or null if sessionNotes is empty.
 * @throws Will throw an error if there is an issue creating the notes row.
 */
function buildNotesRow(sessionNotes) {
	if (!sessionNotes) return null;

	try {
		 const notesRow = buildEle({
			  type: 'div',
			  myClass: ['w3-row'],
		 });

		 const notesContent = buildEle({
			  type: 'div',
			  myClass: ['w3-padding-small'],
			  text: sessionNotes,
		 });

		 const notesFieldset = buildEle({
			  type: 'fieldset',
			  children: [
					buildEle({ type: 'legend', text: 'Session Notes' }),
					notesContent,
			  ],
		 });

		 notesRow.appendChild(notesFieldset);

		 return notesRow;
	} catch (err) {
		 throw new Error(`Error building notes row: ${err.message}`);
	}
}

/**
 * Builds the accessories list for a horse.
 * 
 * @param {Array} accessories - Array of accessories.
 * @returns {HTMLElement|null} - The accessories list element or null if no accessories.
 */
function buildAccessories(accessories) {
	if (!accessories || accessories.length === 0) return null;

	const accList = buildEle({
		 type: 'div',
		 myClass: ['w3-small'],
	});

	accessories.forEach(accessory => {
		const [type, name, cost] = accessory.split(':');

		 const accItem = buildEle({
			  type: 'div',
			  text: `${ucwords(type)}: ${ucwords(underscoreToSpaces(name))}: $${cost}`,
		 });
		 accList.appendChild(accItem);
	});

	return accList;
}