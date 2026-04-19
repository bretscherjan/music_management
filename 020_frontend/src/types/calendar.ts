import type { EventCategory } from './event';

export interface CalendarPreferences {
    onlyConfirmed: boolean;
    categories: EventCategory[]; // empty array = all categories
    reminderMinutes: number;      // 0 = no reminder
}

export const DEFAULT_CALENDAR_PREFS: CalendarPreferences = {
    onlyConfirmed: false,
    categories: [],
    reminderMinutes: 0,
};
