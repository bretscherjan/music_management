using MusigElgg.Data.Enums;

namespace MusigElgg.Data.Entities;

/// <summary>
/// Represents the many-to-many relationship between events and users (participants).
/// </summary>
public class EventParticipant
{
    /// <summary>
    /// Foreign key to the event.
    /// </summary>
    public Guid EventId { get; set; }

    /// <summary>
    /// Foreign key to the user.
    /// </summary>
    public Guid UserId { get; set; }

    /// <summary>
    /// The attendance status of the participant.
    /// </summary>
    public AttendanceStatus Status { get; set; } = AttendanceStatus.Pending;

    /// <summary>
    /// Date and time when the registration was made.
    /// </summary>
    public DateTime RegisteredAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Date and time when attendance was confirmed (e.g., via QR code scan).
    /// </summary>
    public DateTime? ConfirmedAt { get; set; }

    /// <summary>
    /// Optional notes from the participant.
    /// </summary>
    public string? Notes { get; set; }

    // Navigation properties
    /// <summary>
    /// The event being participated in.
    /// </summary>
    public virtual Event Event { get; set; } = null!;

    /// <summary>
    /// The user participating.
    /// </summary>
    public virtual User User { get; set; } = null!;
}
