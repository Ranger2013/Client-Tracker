
import { buildEle } from "../../dom/domUtils.js";
import buildButtonContainer from "./buildButtonContainer.js";

export default async function setupCalendarElements(datesArray, fm) {
	try {
		const calendarContainer = buildEle({
			type: 'div',
			attributes: {
				id: 'calendar-container',
			}
		});

		const calendarTitle = buildEle({
			type: 'div',
			myClass: ['w3-padding-small', 'w3-margin-top', 'w3-small'],
			text: 'Select dates that you wish to be notified to not set bookings on. This will show a reminder on the \'Add Trimming/Shoeing\' Page.',
		})

		const calendarHeader = buildEle({
			type: 'div',
			attributes: {
				id: 'calendar-header'
			},
			myClass: ['w3-margin-bottom', 'w3-center', 'w3-margin-top'],
		});

		const prevButton = buildEle({
			type: 'button',
			attributes: {
				id: 'prev-button',
				style: 'margin-right: 10px'
			},
			text: '&lt;'
		});

		const monthTitle = buildEle({
			type: 'span',
			attributes: {
				id: 'month-name',
			},
		});

		const nextButton = buildEle({
			type: 'button',
			attributes: {
				id: 'next-button',
				style: 'margin-left: 10px'
			},
			text: '&gt;'
		});

		const calendarTable = buildEle({
			type: 'table',
			attributes: {
				id: 'calendar-table',
				width: '100%',
				border: '1px'
			},
		});

		const thead = buildEle({
			type: 'thead'
		});

		const tr = buildEle({
			type: 'tr',
		});

		const headerObj = [
			'S', 'M', 'T', 'W', 'T', 'F', 'S'
		];

		for (const day of headerObj) {
			const th = buildEle({
				type: 'th',
				text: day,
			});

			tr.appendChild(th);
		}

		const tbody = buildEle({
			type: 'tbody',
			attributes: {
				id: 'calendar-body',
			}
		});

		const tableDiv = buildEle({
			type: 'div',
		});

		calendarContainer.appendChild(calendarTitle);
		calendarContainer.appendChild(calendarHeader);
		calendarHeader.appendChild(prevButton);
		calendarHeader.appendChild(monthTitle);
		calendarHeader.appendChild(nextButton);
		calendarContainer.appendChild(tableDiv);
		calendarContainer.appendChild(await buildButtonContainer(datesArray, fm));
		tableDiv.appendChild(calendarTable);
		calendarTable.appendChild(thead);
		thead.appendChild(tr);
		calendarTable.appendChild(tbody);

		return calendarContainer;
	}
	catch (err) {
		const { default: errorLogs } = await import("../../../utils/error-messages/errorLogs.js");
		await errorLogs('setupCalendarElementsError', 'Setup Calendar Elements Error: ', err);
		throw err;
	}
}