namespace MusigElgg.Data.Enums;

/// <summary>
/// Defines the status of an assigned task in the "Assign it!" module.
/// </summary>
public enum AssignedTaskStatus
{
    /// <summary>
    /// Task is open and waiting to be started.
    /// </summary>
    Open = 0,

    /// <summary>
    /// Task is currently being worked on.
    /// </summary>
    InProgress = 1,

    /// <summary>
    /// Task has been completed successfully.
    /// </summary>
    Completed = 2,

    /// <summary>
    /// Task has been cancelled.
    /// </summary>
    Cancelled = 3,

    /// <summary>
    /// Task has been archived (completed tasks after X days).
    /// </summary>
    Archived = 4
}
