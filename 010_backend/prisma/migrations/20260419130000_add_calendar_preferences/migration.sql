-- AddColumn calendarPreferences to User
-- This field stores the user's personal calendar sync preferences as JSON.
-- Shape: { onlyConfirmed: boolean, categories: string[], reminderMinutes: number }

ALTER TABLE `User` ADD COLUMN `calendarPreferences` JSON NULL;
