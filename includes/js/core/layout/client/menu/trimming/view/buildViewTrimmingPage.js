import { formatDate, getWeeksAndDaysSinceLastTrim, sortByDateOnly } from '../../../../../utils/date/dateUtils';
import { buildEle } from '../../../../../utils/dom/elements';
import { cleanUserOutput, ucwords, underscoreToSpaces } from '../../../../../utils/string/stringUtils';
import buildPageContainer from '../../../../components/buildPageContainer';

// Set up logging.
const COMPONENT = 'Build View Trimming Page';
const DEBUG = false;

const debugLog = (...args) => {
	if (DEBUG) {
		console.log(`${COMPONENT}`, ...args);
	}
};

export default async function buildViewTrimmingPage({ cID, primaryKey, mainContainer, manageClient, manageUser }) {
	try {
		// Make sure we have a cID and a primaryKey
		if (!cID || !primaryKey) throw new Error('Unable to build the View Trim/Shoeing Dates. Not all data was provided.');

		const { date_format: dateFormat, time_format: timeFormat } = await manageUser.getDateTimeOptions;

		// Get the clients trimming information
		const { client_name: clientName } = await manageClient.getClientInfo({ primaryKey });
		const clientTrimInfo = await manageClient.getClientTrimmingInfo(cID);
		const lastThreeTrims = clientTrimInfo.slice(-3);

		// Build DOM tree recursively - add this before the TITLEBLOCK_LAYOUT
		const buildElementTree = (config) => {
			const element = buildEle({
				type: config.type,
				myClass: config.myClass,
				text: config.text
			});

			if (config.children) {
				Object.values(config.children).forEach(childConfig => {
					element.appendChild(buildElementTree(childConfig));
				});
			}

			return element;
		};

		// Restructure the layout object to reflect DOM hierarchy
		const TITLEBLOCK_LAYOUT = {
			root: {
				type: 'div',
				myClass: ['w3-row', 'w3-light-grey', 'w3-border-bottom', 'w3-border-top'],
				children: {
					colOne: {
						type: 'div',
						myClass: ['w3-col', 's4', 'w3-padding-small'],
						children: {
							large: {
								type: 'div',
								myClass: ['w3-hide-small', 'w3-center', 'w3-bold'],
								text: 'Trim Dates'
							},
							small: {
								type: 'div',
								myClass: ['w3-hide-medium', 'w3-hide-large', 'w3-center', 'w3-bold'],
								text: 'Dates'
							}
						}
					},
					colTwo: {
						type: 'div',
						myClass: ['w3-col', 's4', 'w3-padding-small'],
						children: {
							large: {
								type: 'div',
								myClass: ['w3-hide-small', 'w3-center'],
								text: 'Type Service/Cost'
							},
							small: {
								type: 'div',
								myClass: ['w3-hide-medium', 'w3-hide-large', 'w3-center'],
								text: '# Horses'
							}
						}
					},
					colThree: {
						type: 'div',
						myClass: ['w3-col', 's4', 'w3-padding-small'],
						children: {
							large: {
								type: 'div',
								myClass: ['w3-center', 'w3-bold'],
								text: 'Payments'
							}
						}
					}
				}
			}
		};

		// Get container and card first
		const [container, card] = await buildPageContainer({
			pageTitle: 'View Trimming Dates for ',
			clientName,
			cID,
			primaryKey,
		});

		const FOOTER_LAYOUT = {
			root: {
				type: 'div',
				myClass: ['w3-margin-top', 'w3-padding-small', 'w3-center'],
				children: {
					anchor: {
						type: 'a',
						myClass: ['w3-underline'],
						attributes: { href: '/tracker/trimming/view/?all=true' },
						text: 'View All Trimming Dates',
					},
				},
			},
		};

		const fragment = document.createDocumentFragment();

		// Change ascending to false to sort newest to oldest
		lastThreeTrims.sort((a,b) => sortByDateOnly(a.date_trimmed, b.date_trimmed, false)).forEach(trim => {
			const {
				cID,
				date_trimmed: dateTrimmed,
				horses,
				mileage_cost: mileageCost,
				paid,
				payment_amount: totalPaid,
				session_notes: sessionNotes,
			} = trim;

			const { weeks, days } = getWeeksAndDaysSinceLastTrim(dateTrimmed);

			const TRIMBLOCK_LAYOUT = {
				root: {
					type: 'div',
					myClass: ['w3-row', 'w3-border-bottom', 'w3-padding-small'],
					children: {
						colOne: {
							type: 'div',
							myClass: ['w3-col', 's4'],
							children: {
								large: {
									type: 'div',
									myClass: ['w3-hide-small', 'w3-center'],
									children: {
										date: {
											type: 'div',
											text: formatDate(dateTrimmed, dateFormat)
										},
										timeAgo: {
											type: 'span',
											myClass: ['w3-small'],
											text: `${weeks} weeks and ${days} day(s) ago`
										}
									}
								},
								small: {
									type: 'div',
									myClass: ['w3-hide-medium', 'w3-hide-large', 'w3-center'],
									text: formatDate(dateTrimmed, dateFormat)
								}
							}
						},
						colTwo: {
							type: 'div',
							myClass: ['w3-col', 's4'],
							children: {
								large: {
									type: 'div',
									myClass: ['w3-hide-small', 'w3-center'],
									children: horses.reduce((acc, horse) => {
										// Split the type and cost
										const [type, cost] = horse.type_trim.split(':');
										const horseName = cleanUserOutput(horse.horse_name);
										const serviceType = ucwords(underscoreToSpaces(type));

										return {
											...acc,
											[`horse_${horse.hID}`]: {
												type: 'div',
												children: {
													name: {
														type: 'span',
														myClass: ['w3-bold', 'w3-underline'],
														text: horseName
													},
													lineBreak: { type: 'br' },
													service: {
														type: 'span',
														myClass: ['w3-small', 'indent'],
														text: `${serviceType}: $${cost}`
													},
													...(horse.acc?.length && horse.acc.map((acc, index) => {
														const [accType, accName, accCost] = acc.split(':');
														return {
															[`accBreak_${index}`]: { type: 'br' },
															[`acc_${index}`]: {
																type: 'span',
																myClass: ['w3-small', 'indent'],
																text: `${ucwords(underscoreToSpaces(accName))}: $${accCost}`
															}
														};
													}).reduce((a, b) => ({ ...a, ...b }), {}))
												}
											}
										};
									}, {})
								},
								small: {
									type: 'div',
									myClass: ['w3-hide-medium', 'w3-hide-large', 'w3-center'],
									text: horses.length
								}
							}
						},
						colThree: {
							type: 'div',
							myClass: ['w3-col', 's4'],
							children: {
								large: {
									type: 'div',
									myClass: ['w3-center'],
									children: {
										mileage: {
											type: 'div',
											text: `Mileage: $${mileageCost || '0.00'}`
										},
										total: {
											type: 'div',
											text: `Total: $${totalPaid}`
										},
										status: {
											type: 'div',
											myClass: [paid === 'yes' ? 'w3-text-green' : 'w3-text-red'],
											text: paid === 'yes' ? 'Paid' : 'Unpaid'
										}
									}
								}
							}
						}
					}
				}
			};

			// Build the trim block and append to fragment
			const trimBlock = buildElementTree(TRIMBLOCK_LAYOUT.root);
			fragment.appendChild(trimBlock);
		});



		// Build and append the title block first
		const titleBlock = buildElementTree(TITLEBLOCK_LAYOUT.root);
		const footerBlock = buildElementTree(FOOTER_LAYOUT.root);

		card.appendChild(titleBlock);
		// Then append all the trim blocks
		card.append(fragment, footerBlock);
		container.appendChild(card);

		// Clear the main container
		mainContainer.innerHTML = '';
		mainContainer.appendChild(container);
	} catch (err) {
		throw err;		// Let the selectClientMenuPage handle the error.
	}
}