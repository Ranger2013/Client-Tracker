// Set up debugging
const COMPONENT = 'Predict Next Session Number Horses';
const DEBUG = false;

const debugLog = (...args) => {
    if (DEBUG) {
        // Use console.dir for objects to show full structure
        args.forEach(arg => {
            if (typeof arg === 'object' && arg !== null) {
                console.dir(arg, { depth: null });
            } else {
                console.log(`[${COMPONENT}]`, arg);
            }
        });
    }
};

/**
 * Predicts the horses for next session and calculates time needed
 * @returns {Promise<Object>} Object containing predicted horses and time block
 */
export default async function predictNextSessionNumberHorses({ clientData, manageClient }) {
    try {
        debugLog('Starting prediction with client data:', clientData);
        const { cID, horses: currentHorses, trim_date: appointmentDate } = clientData;
        const clientTrimmingInfo = await manageClient.getClientTrimmingInfo(cID);
        debugLog('Retrieved trimming info:', clientTrimmingInfo);

        // Get All future appointments for this client
        const futureAppointments = await manageClient.getAllDuplicateClients();
        const earlierFutureAppointments = futureAppointments.filter(client => client.cID === parseInt(cID, 10))
            .filter(appt =>
                appt.primaryKey !== clientData.primaryKey &&
                new Date(appt.trim_date) < new Date(appointmentDate) &&
                new Date(appt.trim_date) > new Date() // Only future dates
            ).sort((a, b) => new Date(a.trim_date) - new Date(b.trim_date));

        debugLog('Earlier appointments that may affect prediction: ', earlierFutureAppointments);

        // If no future appointments affect this one, use existing code
        if (earlierFutureAppointments.length === 0) {
            // Original prediction
            const predictedHorses = await predictHorsesAndServices(clientTrimmingInfo, currentHorses, appointmentDate);
            return calculateTimeFromPrediction(predictedHorses, clientData.scheduleOptions);
        }

        // Create a simulated trimming history including predicted future appointments
        let workingTrimmings = Array.isArray(clientTrimmingInfo) ? [...clientTrimmingInfo] : [];

        // For each earlier appointment, simulate what will happen
        for (const appt of earlierFutureAppointments) {
            debugLog(`Simulating appointment on ${appt.trim_date}`);

            // Predict horses for this earlier appointment
            const prediction = await predictHorsesAndServices(workingTrimmings, currentHorses, appt.trim_date);

            // Add this prediction to our simulated trimmings
            workingTrimmings.push({
                date_trimmed: appt.trim_date,
                horses: prediction.map(h => ({
                    hID: h.hID,
                    horse_name: h.horse_name,
                    type_trim: mapServiceToType({ serviceType: h.predictedService || h.service_type, horseId: h.hID, trimmings: workingTrimmings }),
                })),
            });
        }

        // Now make prediction with augmented history
        const predictedHorses = await predictHorsesAndServices(workingTrimmings, currentHorses, appointmentDate);
        return calculateTimeFromPrediction(predictedHorses, clientData.scheduleOptions);
    }
    catch (err) {
        debugLog('Error in prediction:', err);
        throw err;
    }
}

/**
 * Maps service type back to type_trim format using historical patterns
 * @param {string} serviceType - Basic service type (trim, half_set, full_set)
 * @param {string} horseId - Horse ID to check history for
 * @param {Array} trimmings - Historical trimming data
 * @returns {string} Properly formatted type_trim
 */
function mapServiceToType({ serviceType, horseId, trimmings }) {
    // First, look for this horse's own history with this service type
    for (let i = trimmings.length - 1; i >= 0; i--) {
        const session = trimmings[i];
        const horseRecord = session.horses.find(h => String(h.hID) === String(horseId));

        if (horseRecord && getServiceType(horseRecord.type_trim) === serviceType) {
            // Found a match - use exact same format from history
            return horseRecord.type_trim;
        }
    }

    // If no history for this horse with this service, use generic pattern
    switch (serviceType) {
        case 'trim': return 'trim:0';
        case 'half_set': return 'front_shoes:0';
        case 'full_set': return 'full_shoes:0';
        default: return `${serviceType}:0`;
    }
}

/**
 * Calculates time for new clients or those without history
 */
function calculateTimeFromHorses(horses, scheduleOptions) {
    const { avg_trim, half_set, full_set, drive_time } = scheduleOptions;

    const result = {
        horses,
        totalTime: parseInt(drive_time),
        serviceBreakdown: {
            trims: 0,
            halfSets: 0,
            fullSets: 0
        }
    };

    horses.forEach(horse => {
        debugLog('Type Service:', horse.service_type);
        switch (horse.service_type) {
            case 'trim':
                result.totalTime += parseInt(avg_trim);
                result.serviceBreakdown.trims++;
                break;
            case 'half_set':
                result.totalTime += parseInt(half_set);
                result.serviceBreakdown.halfSets++;
                break;
            case 'full_set':
                result.totalTime += parseInt(full_set);
                result.serviceBreakdown.fullSets++;
                break;
        }
    });

    debugLog('Calculated time from horses:', result);
    return result;
}

/**
 * Predicts which horses will need service and what type
 */
export async function predictHorsesAndServices(trimmings, currentHorses, appointmentDate) {
    debugLog('Enter predictHorsesAndServices');
    console.log('[Predicted Horses And Services]: trimmings:', trimmings);
    const sortedTrimmings = trimmings.sort((a, b) =>
        new Date(a.date_trimmed) - new Date(b.date_trimmed)
    );

    // Identify service groups
    const groups = identifyServiceGroups(sortedTrimmings);
    debugLog('Service groups identified:', groups);

    // Find next due group
    const nextGroup = findNextDueGroup(groups, currentHorses, appointmentDate, sortedTrimmings);
    debugLog('Next due group determined:', nextGroup);

    // If no group is found, fall back to checking individual horses
    if (!nextGroup && currentHorses.length <= 4) {
        return checkIndividualHorses(sortedTrimmings, currentHorses, appointmentDate);
    }

    // For larger herds (like Misty's), prioritize established group patterns
    if (!nextGroup && currentHorses.length > 4) {
        const mostFrequentSize = findMostFrequentGroupSize(sortedTrimmings);
        return predictLargeHerdGroup(sortedTrimmings, currentHorses, appointmentDate, mostFrequentSize);
    }

    const predictedHorses = nextGroup.horses.map(horseId => {
        const horse = currentHorses.find(h => h.hID === horseId);
        const service = determineNextService(horseId, sortedTrimmings);
        return { ...horse, predictedService: service };
    });

    return predictedHorses;
}

function findMostFrequentGroupSize(trimmings) {
    const sizes = trimmings.map(session => session.horses.length);
    const sizeCount = sizes.reduce((acc, size) => {
        acc[size] = (acc[size] || 0) + 1;
        return acc;
    }, {});
    return parseInt(Object.entries(sizeCount)
        .sort((a, b) => b[1] - a[1])[0][0]);
}

// function predictLargeHerdGroup(trimmings, currentHorses, appointmentDate, groupSize) {
//     // For large herds, find horses that haven't been serviced recently
//     const now = new Date(appointmentDate);
//     const horsesWithLastService = currentHorses.map(horse => {
//         const lastService = [...trimmings]
//             .reverse()
//             .find(session => session.horses.some(h => h.hID === horse.hID));

//         return {
//             horse,
//             daysSinceService: lastService ?
//                 (now - new Date(lastService.date_trimmed)) / (1000 * 60 * 60 * 24) :
//                 Number.MAX_VALUE
//         };
//     });

//     // Sort by days since last service and take the most overdue horses
//     const dueHorses = horsesWithLastService
//         .sort((a, b) => b.daysSinceService - a.daysSinceService)
//         .slice(0, groupSize)
//         .map(({ horse }) => ({
//             ...horse,
//             predictedService: horse.service_type || 'trim'
//         }));

//     return dueHorses;
// }

function predictLargeHerdGroup(trimmings, currentHorses, appointmentDate, groupSize) {
    // For large herds, find horses that haven't been serviced recently
    const now = new Date(appointmentDate);
    const horsesWithLastService = currentHorses.map(horse => {
        const lastService = [...trimmings]
            .reverse()
            .find(session => session.horses.some(h => String(h.hID) === String(horse.hID)));

        // Calculate due score based on trim cycle
        const trimCycle = parseInt(horse.trim_cycle) || 42;
        const lastServiceDate = lastService ? new Date(lastService.date_trimmed) : null;
        const daysSinceService = lastServiceDate ?
            (now - lastServiceDate) / (1000 * 60 * 60 * 24) : 
            Number.MAX_VALUE;
        const dueScore = lastServiceDate ? daysSinceService / trimCycle : 2.0;
            
        return {
            horse,
            daysSinceService,
            dueScore,
            predictedService: determineNextService(String(horse.hID), trimmings)
        };
    });
    
    // NEW CODE - Filter by due threshold FIRST, regardless of herd size
    const dueThreshold = currentHorses.length >= 10 ? 0.85 : 0.60; // 60% through cycle
    let dueHorses = horsesWithLastService
        .filter(h => h.dueScore >= dueThreshold)
        .sort((a, b) => b.dueScore - a.dueScore);
        
    // Debug what horses are actually due
    debugLog('Horses past due threshold:', dueHorses.map(h => 
        `${h.horse.horse_name}: ${Math.round(h.dueScore*100)}%`));
    
    // SPECIAL CASE: Genuine large herds (10+ animals) like Courtney
    if (currentHorses.length >= 10) {
        // If we have more due horses than typical group size, limit to most overdue
        if (dueHorses.length > groupSize) {
            dueHorses = dueHorses.slice(0, groupSize);
        }
        // If we have fewer due horses but at least one, use those
        else if (dueHorses.length > 0) {
            // Keep as is - use only horses that are actually due
        }
        // If no horses are due, take just one most overdue horse
        else {
            dueHorses = [horsesWithLastService.sort((a, b) => b.dueScore - a.dueScore)[0]];
        }
    }
    
    // Map filtered horses to result format
    return dueHorses.map(({ horse, predictedService }) => ({
        ...horse,
        predictedService: predictedService || horse.service_type || 'trim'
    }));
}

/**
 * Analyzes each horse individually to determine which ones need service
 * Used for small herds where no clear group pattern is found
 */
function checkIndividualHorses(trimmings, currentHorses, appointmentDate) {
    debugLog('Enter checkIndividualHorses');
    const now = new Date(appointmentDate);

    // Process each horse's service history and analyze due status
    const horsesAnalysis = currentHorses.map(horse => {
        debugLog(`Analyzing horse: ${horse.horse_name} (ID: ${horse.hID})`);

        // Find all sessions where this horse was serviced
        // BUGFIX: Convert horse.hID to string for consistent comparison
        const horseId = String(horse.hID);

        // Debug the sessions we're checking
        debugLog(`Looking for horse ID ${horseId} in ${trimmings.length} trimming sessions`);

        // Track which horses are in each session
        trimmings.forEach((session, idx) => {
            const horseIds = session.horses.map(h => h.hID);
            debugLog(`Session ${idx} (${session.date_trimmed}) horses: ${horseIds.join(', ')}`);
        });

        const horseTrimmings = trimmings.filter(session =>
            session.horses && session.horses.some(h => String(h.hID) === horseId)
        );

        debugLog(`Found ${horseTrimmings.length} trimming sessions for ${horse.horse_name}`);

        if (horseTrimmings.length === 0) {
            debugLog(`No history for horse ${horse.horse_name}, marking as due`);
            // No history, assume horse needs service
            return {
                horse,
                daysSinceService: Number.MAX_VALUE,
                dueScore: 2.0, // High score to ensure inclusion
                predictedService: horse.service_type || 'trim'
            };
        }

        // Sort sessions by date
        const sortedHorseTrimmings = [...horseTrimmings].sort(
            (a, b) => new Date(a.date_trimmed) - new Date(b.date_trimmed)
        );

        // Last service date
        const lastService = sortedHorseTrimmings[sortedHorseTrimmings.length - 1];
        const lastServiceDate = new Date(lastService.date_trimmed);
        const daysSinceService = (now - lastServiceDate) / (1000 * 60 * 60 * 24);

        // Calculate due score (>1.0 means overdue)
        const trimCycle = parseInt(horse.trim_cycle) || 42; // Default to 6 weeks if not specified
        const dueScore = daysSinceService / trimCycle;

        // Determine next service type based on history
        const predictedService = determineNextService(horseId, trimmings);

        debugLog(`Horse ${horse.horse_name} analysis:`, {
            daysSinceService,
            trimCycle,
            dueScore,
            predictedService,
            lastServiceDate: lastServiceDate.toISOString().split('T')[0]
        });

        return {
            horse,
            daysSinceService,
            dueScore,
            predictedService
        };
    });

    // Select horses that are at least 60% through their cycle
    const dueHorses = horsesAnalysis.filter(analysis => analysis.dueScore >= 0.60);
    debugLog(`Found ${dueHorses.length} horses that are at least 85% through their cycle:`,
        dueHorses.map(h => `${h.horse.horse_name} (${Math.round(h.dueScore * 100)}%)`));

    // If we have due horses, return them
    if (dueHorses.length > 0) {
        return dueHorses.map(analysis => ({
            ...analysis.horse,
            predictedService: analysis.predictedService
        }));
    }

    // If no horses are due soon (60% threshold), only select the most overdue one
    const mostOverdueHorse = horsesAnalysis.sort((a, b) => b.dueScore - a.dueScore)[0];
    debugLog(`No horses 60% through cycle, selecting only most due: ${mostOverdueHorse.horse.horse_name} (${Math.round(mostOverdueHorse.dueScore * 100)}%)`);

    return [{
        ...mostOverdueHorse.horse,
        predictedService: mostOverdueHorse.predictedService
    }];
}

function identifyServiceGroups(trimmings) {
    debugLog('Enter identifyServiceGroups');
    const groups = new Map();

    trimmings.forEach((session, index) => {
        debugLog(`Processing session ${index}:`, session);
        const key = session.horses.map(h => h.hID).sort().join(',');
        if (!groups.has(key)) {
            groups.set(key, {
                horses: session.horses.map(h => h.hID),
                dates: [],
                interval: 0
            });
        }
        groups.get(key).dates.push(new Date(session.date_trimmed));
    });

    const result = Array.from(groups.entries()).map(([key, group]) => {
        debugLog(`Processing group ${key}:`, group);
        const sortedDates = group.dates.sort((a, b) => a - b);
        const intervals = [];

        for (let i = 1; i < sortedDates.length; i++) {
            const days = (sortedDates[i] - sortedDates[i - 1]) / (1000 * 60 * 60 * 24);
            intervals.push(days);
        }

        const groupResult = {
            horses: group.horses,
            lastDate: sortedDates[sortedDates.length - 1],
            interval: intervals.length > 0 ?
                Math.round(intervals.reduce((a, b) => a + b) / intervals.length) :
                42,
            frequency: sortedDates.length
        };
        debugLog('Group result:', groupResult);
        return groupResult;
    });

    debugLog('All service groups:', result);
    return result;
}

function findNextDueGroup(groups, currentHorses, appointmentDate, sortedTrimmings) {
    debugLog('Enter findNextDueGroup');

    if (!groups.length) return null;

    const now = new Date(appointmentDate);
    const dueScores = groups.map(group => {
        // Check if all horses still exist
        const allHorsesExist = group.horses.every(hID =>
            currentHorses.some(h => h.hID === hID)
        );
        if (!allHorsesExist) return { score: -1, group };

        // Get most recent service date for EACH horse in the group
        const horsesLastDates = group.horses.map(horseId => {
            // Find most recent session containing this horse
            const lastSession = [...sortedTrimmings]  // Use passed in sortedTrimmings
                .reverse()
                .find(session => session.horses.some(h => h.hID === horseId));
            return lastSession ? new Date(lastSession.date_trimmed) : null;
        }).filter(date => date !== null);

        // Use the most RECENT date among the group's horses
        const mostRecentService = new Date(Math.max(...horsesLastDates));
        const daysSinceLastService = (now - mostRecentService) / (1000 * 60 * 60 * 24);

        // Get actual cycle from horses rather than defaulting
        const cycleSum = group.horses
            .map(hID => currentHorses.find(h => h.hID === hID)?.trim_cycle || 42)
            .reduce((a, b) => a + b, 0);
        const expectedDaysBetweenServices = Math.round(cycleSum / group.horses.length);

        const dueScore = daysSinceLastService / expectedDaysBetweenServices;

        // Adjusted scoring weights for donkey patterns
        const groupSizeBonus = group.horses.length === 4 ? 3 : // Heavy bonus for 4-donkey groups
            group.horses.length / currentHorses.length;

        const frequencyBonus = (group.frequency / Math.max(...groups.map(g => g.frequency))) * 2;
        const consistencyBonus = group.frequency >= 2 ? 2 : 0;

        // Final weighted score calculation
        const weightedScore = (
            (dueScore * 2.0) +           // Base due score
            (groupSizeBonus * 3.0) +     // Heavily favor proper group size
            (frequencyBonus * 2.0) +     // Reward frequent patterns
            (consistencyBonus * 1.5)     // Bonus for established patterns
        );

        debugLog('Detailed group scoring:', {
            group,
            mostRecentService,
            daysSinceLastService,
            expectedDaysBetweenServices,
            dueScore,
            groupSizeBonus,
            frequencyBonus,
            consistencyBonus,
            weightedScore
        });

        return { score: weightedScore, group };
    });

    // Sort by weighted score and filter out negative scores
    const nextDue = dueScores
        .filter(g => g.score > 0)
        .sort((a, b) => b.score - a.score)[0];

    debugLog('Selected next due group:', nextDue);
    return nextDue ? nextDue.group : null;
}

function determineNextService(horseId, trimmings) {
    // Get service history for this horse
    const serviceHistory = trimmings
        .filter(session => session.horses.some(h => h.hID === horseId))
        .map(session => {
            const horse = session.horses.find(h => h.hID === horseId);
            return getServiceType(horse.type_trim);
        });

    // Return most recent service type, or 'trim' as default
    return serviceHistory.length > 0 ? serviceHistory[serviceHistory.length - 1] : 'trim';
}

/**
 * Calculates total time based on predicted services
 */
function calculateTimeFromPrediction(predictedHorses, scheduleOptions) {
    const { avg_trim, half_set, full_set, drive_time } = scheduleOptions;

    const result = {
        horses: predictedHorses,
        totalTime: parseInt(drive_time),
        serviceBreakdown: {
            trims: 0,
            halfSets: 0,
            fullSets: 0
        }
    };

    predictedHorses.forEach(horse => {
        const service = horse.predictedService || horse.service_type;

        switch (service) {
            case 'trim':
                result.totalTime += parseInt(avg_trim);
                result.serviceBreakdown.trims++;
                break;
            case 'half_set':
                result.totalTime += parseInt(half_set);
                result.serviceBreakdown.halfSets++;
                break;
            case 'full_set':
                result.totalTime += parseInt(full_set);
                result.serviceBreakdown.fullSets++;
                break;
        }
    });

    return result;
}

/**
 * Maps type_trim to service type
 */
function getServiceType(typeTrim) {
    if (typeTrim.includes('front_')) return 'half_set';
    if (typeTrim.includes('full_')) return 'full_set';
    return 'trim';
}

