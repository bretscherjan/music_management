-- Add indexes on lastSeenAt for engagement analytics queries
-- This ensures efficient queries for finding recently active users

CREATE INDEX `idx_user_lastSeenAt` ON `User`(`lastSeenAt` DESC);

-- Add index on status for filtering active users
CREATE INDEX `idx_user_status` ON `User`(`status`);

-- Composite index for common queries (active users with recent activity)
CREATE INDEX `idx_user_status_lastSeenAt` ON `User`(`status`, `lastSeenAt` DESC);
