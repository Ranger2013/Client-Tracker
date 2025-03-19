// Set up debugging
const COMPONENT = 'Predict Next Session Number Horses';
const DEBUG = true;

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
        
        // Fix the condition - we were checking the wrong property path
        if (!clientTrimmingInfo || !Array.isArray(clientTrimmingInfo) || clientTrimmingInfo.length === 0) {
            debugLog('No trimming history found, using current horses');
            return calculateTimeFromHorses(currentHorses, clientData.scheduleOptions);
        }

        debugLog('Calling predictHorsesAndServices with trimmings:', clientTrimmingInfo);
        const predictedHorses = await predictHorsesAndServices(clientTrimmingInfo, currentHorses, appointmentDate);
        debugLog('Received predicted horses:', predictedHorses);
        
        const result = calculateTimeFromPrediction(predictedHorses, clientData.scheduleOptions);
        debugLog('Final prediction result:', result);
        return result;
    }
    catch (err) {
        debugLog('Error in prediction:', err);
        throw err;
    }
}

/**
 * Calculates time for new clients or those without history
 */
function calculateTimeFromHorses(horses, scheduleOptions) {
    const { avg_trim, half_set, full_set, avg_drive_time } = scheduleOptions;
    
    const result = {
        horses,
        totalTime: parseInt(avg_drive_time),
        serviceBreakdown: {
            trims: 0,
            halfSets: 0,
            fullSets: 0
        }
    };

    horses.forEach(horse => {
        switch(horse.service_type) {
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
 * Predicts which horses will need service and what type
 */
async function predictHorsesAndServices(trimmings, currentHorses, appointmentDate) {
    debugLog('Enter predictHorsesAndServices');
    
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

function predictLargeHerdGroup(trimmings, currentHorses, appointmentDate, groupSize) {
    // For large herds, find horses that haven't been serviced recently
    const now = new Date(appointmentDate);
    const horsesWithLastService = currentHorses.map(horse => {
        const lastService = [...trimmings]
            .reverse()
            .find(session => session.horses.some(h => h.hID === horse.hID));
        
        return {
            horse,
            daysSinceService: lastService ? 
                (now - new Date(lastService.date_trimmed)) / (1000 * 60 * 60 * 24) : 
                Number.MAX_VALUE
        };
    });

    // Sort by days since last service and take the most overdue horses
    const dueHorses = horsesWithLastService
        .sort((a, b) => b.daysSinceService - a.daysSinceService)
        .slice(0, groupSize)
        .map(({ horse }) => ({
            ...horse,
            predictedService: horse.service_type || 'trim'
        }));

    return dueHorses;
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
            const days = (sortedDates[i] - sortedDates[i-1]) / (1000 * 60 * 60 * 24);
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
    const { avg_trim, half_set, full_set, avg_drive_time } = scheduleOptions;
    
    const result = {
        horses: predictedHorses,
        totalTime: parseInt(avg_drive_time),
        serviceBreakdown: {
            trims: 0,
            halfSets: 0,
            fullSets: 0
        }
    };

    predictedHorses.forEach(horse => {
        const service = horse.predictedService || horse.service_type;
        
        switch(service) {
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

