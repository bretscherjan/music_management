const { RRule, RRuleSet, rrulestr } = require('rrule');

/**
 * Recurrence Service
 * Handles recurring event expansion and date calculations
 */

/**
 * Parse a recurrence rule string into an RRule object
 * @param {string} ruleString - RRule string (e.g., "FREQ=WEEKLY;INTERVAL=2;BYDAY=MO")
 * @param {Date} startDate - Start date for the rule
 * @returns {RRule} RRule object
 */
const parseRecurrenceRule = (ruleString, startDate) => {
    try {
        // If it's a full RRULE string (starts with RRULE:), parse directly
        if (ruleString.startsWith('RRULE:') || ruleString.startsWith('FREQ=')) {
            const fullRule = ruleString.startsWith('RRULE:')
                ? ruleString
                : `RRULE:${ruleString}`;

            return rrulestr(fullRule, { dtstart: startDate });
        }

        // Try to parse as RRule options
        return new RRule({
            ...RRule.parseString(ruleString),
            dtstart: startDate
        });
    } catch (error) {
        console.error('Error parsing recurrence rule:', error);
        throw new Error(`Invalid recurrence rule: ${ruleString}`);
    }
};

/**
 * Get all occurrences of a recurring event within a date range
 * @param {Object} event - Event object with isRecurring, recurrenceRule, date, excludedDates
 * @param {Date} rangeStart - Start of the date range
 * @param {Date} rangeEnd - End of the date range
 * @returns {Array<Date>} Array of occurrence dates
 */
const getEventOccurrences = (event, rangeStart, rangeEnd) => {
    if (!event.isRecurring || !event.recurrenceRule) {
        // Non-recurring event: return the event date if within range
        const eventDate = new Date(event.date);
        if (eventDate >= rangeStart && eventDate <= rangeEnd) {
            return [eventDate];
        }
        return [];
    }

    const startDate = new Date(event.date);
    const rule = parseRecurrenceRule(event.recurrenceRule, startDate);

    // Get all occurrences within the range
    let occurrences = rule.between(rangeStart, rangeEnd, true);

    // Filter out excluded dates
    if (event.excludedDates && Array.isArray(event.excludedDates)) {
        const excludedSet = new Set(
            event.excludedDates.map(d => new Date(d).toDateString())
        );
        occurrences = occurrences.filter(
            date => !excludedSet.has(date.toDateString())
        );
    }

    return occurrences;
};

/**
 * Expand recurring events into individual event instances
 * @param {Array<Object>} events - Array of event objects
 * @param {Date} rangeStart - Start of the date range
 * @param {Date} rangeEnd - End of the date range
 * @returns {Array<Object>} Array of expanded event instances
 */
const expandRecurringEvents = (events, rangeStart, rangeEnd) => {
    const expandedEvents = [];

    for (const event of events) {
        const occurrences = getEventOccurrences(event, rangeStart, rangeEnd);

        for (const occurrenceDate of occurrences) {
            expandedEvents.push({
                ...event,
                // Keep original ID for reference
                originalEventId: event.id,
                // Generate unique ID for this occurrence
                occurrenceId: `${event.id}-${occurrenceDate.toISOString().split('T')[0]}`,
                // Set the occurrence date
                date: occurrenceDate,
                // Mark as occurrence if it's not the original date
                isOccurrence: occurrenceDate.getTime() !== new Date(event.date).getTime()
            });
        }
    }

    // Sort by date
    expandedEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

    return expandedEvents;
};

/**
 * Add an excluded date to an event's recurrence
 * @param {Array|null} currentExcludedDates - Current excluded dates array
 * @param {Date|string} dateToExclude - Date to add to exclusions
 * @returns {Array<string>} Updated excluded dates array
 */
const addExcludedDate = (currentExcludedDates, dateToExclude) => {
    const excluded = currentExcludedDates || [];
    const dateString = new Date(dateToExclude).toISOString().split('T')[0];

    if (!excluded.includes(dateString)) {
        excluded.push(dateString);
    }

    return excluded;
};

/**
 * Remove an excluded date from an event's recurrence
 * @param {Array|null} currentExcludedDates - Current excluded dates array
 * @param {Date|string} dateToRemove - Date to remove from exclusions
 * @returns {Array<string>} Updated excluded dates array
 */
const removeExcludedDate = (currentExcludedDates, dateToRemove) => {
    if (!currentExcludedDates) return [];

    const dateString = new Date(dateToRemove).toISOString().split('T')[0];
    return currentExcludedDates.filter(d => d !== dateString);
};

/**
 * Create common recurrence rule strings
 */
const RecurrencePatterns = {
    // Weekly on the same day
    weekly: () => 'FREQ=WEEKLY',

    // Every 2 weeks on the same day
    biweekly: () => 'FREQ=WEEKLY;INTERVAL=2',

    // Monthly on the same date
    monthly: () => 'FREQ=MONTHLY',

    // Monthly on a specific weekday (e.g., "every 2nd Monday")
    monthlyByWeekday: (weekday, position) => {
        const days = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
        return `FREQ=MONTHLY;BYDAY=${position}${days[weekday]}`;
    },

    // Weekly on specific days
    weeklyOnDays: (days) => {
        const dayNames = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
        const byDay = days.map(d => dayNames[d]).join(',');
        return `FREQ=WEEKLY;BYDAY=${byDay}`;
    },
};

/**
 * Validate a recurrence rule string
 * @param {string} ruleString - RRule string to validate
 * @returns {boolean} True if valid, false otherwise
 */
const isValidRecurrenceRule = (ruleString) => {
    try {
        parseRecurrenceRule(ruleString, new Date());
        return true;
    } catch {
        return false;
    }
};

/**
 * Get a human-readable description of a recurrence rule
 * @param {string} ruleString - RRule string
 * @param {string} locale - Locale for the description (default: 'de')
 * @returns {string} Human-readable description
 */
const getRecurrenceDescription = (ruleString, locale = 'de') => {
    try {
        const rule = parseRecurrenceRule(ruleString, new Date());
        return rule.toText();
    } catch {
        return ruleString;
    }
};

module.exports = {
    parseRecurrenceRule,
    getEventOccurrences,
    expandRecurringEvents,
    addExcludedDate,
    removeExcludedDate,
    RecurrencePatterns,
    isValidRecurrenceRule,
    getRecurrenceDescription,
};
