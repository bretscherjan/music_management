namespace MusigElgg.Data.Enums;

/// <summary>
/// Defines the attendance status for event participants.
/// </summary>
public enum AttendanceStatus
{
    /// <summary>
    /// Participation not yet confirmed.
    /// </summary>
    Pending = 0,

    /// <summary>
    /// Confirmed attendance.
    /// </summary>
    Confirmed = 1,

    /// <summary>
    /// Declined attendance.
    /// </summary>
    Declined = 2,

    /// <summary>
    /// Maybe attending.
    /// </summary>
    Tentative = 3,

    /// <summary>
    /// User was present (Checked In).
    /// </summary>
    Present = 4,

    /// <summary>
    /// User was absent without excuse.
    /// </summary>
    Unexcused = 5
}
