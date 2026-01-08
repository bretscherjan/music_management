using System.ComponentModel.DataAnnotations;

namespace MusigElgg.Data.Entities;

/// <summary>
/// Represents an event organized by the music association.
/// </summary>
public class Event
{
    /// <summary>
    /// Unique identifier for the event.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Title of the event.
    /// </summary>
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Detailed description of the event.
    /// </summary>
    [MaxLength(2000)]
    public string? Description { get; set; }

    /// <summary>
    /// Start date and time of the event.
    /// </summary>
    public DateTime StartTime { get; set; }

    /// <summary>
    /// End date and time of the event.
    /// </summary>
    public DateTime EndTime { get; set; }

    /// <summary>
    /// Location where the event takes place.
    /// </summary>
    [MaxLength(300)]
    public string? Location { get; set; }

    /// <summary>
    /// Maximum number of participants allowed. Null means unlimited.
    /// </summary>
    public int? MaxParticipants { get; set; }

    /// <summary>
    /// Whether the event is publicly visible.
    /// </summary>
    public bool IsPublic { get; set; } = false;

    /// <summary>
    /// Whether the event has been cancelled.
    /// </summary>
    public bool IsCancelled { get; set; } = false;

    /// <summary>
    /// Whether the event is in draft mode (not yet published to members).
    /// </summary>
    public bool IsDraft { get; set; } = true;

    /// <summary>
    /// QR code for attendance tracking (stored as base64 or URL).
    /// </summary>
    [MaxLength(500)]
    public string? AttendanceQrCode { get; set; }

    /// <summary>
    /// Date and time when the event was created.
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Date and time when the event was last updated.
    /// </summary>
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Foreign keys
    /// <summary>
    /// Foreign key to the event category.
    /// </summary>
    public Guid? CategoryId { get; set; }

    /// <summary>
    /// Foreign key to the event series.
    /// </summary>
    public Guid? SeriesId { get; set; }

    // Navigation properties
    /// <summary>
    /// The category of this event.
    /// </summary>
    public virtual EventCategory? Category { get; set; }

    /// <summary>
    /// The series this event belongs to.
    /// </summary>
    public virtual EventSeries? Series { get; set; }

    /// <summary>
    /// Participants of this event.
    /// </summary>
    public virtual ICollection<EventParticipant> Participants { get; set; } = new List<EventParticipant>();

    /// <summary>
    /// Tasks associated with this event.
    /// </summary>
    public virtual ICollection<AssignedTask> Tasks { get; set; } = new List<AssignedTask>();

    /// <summary>
    /// Register-specific participation limits for this event.
    /// </summary>
    public virtual ICollection<RegisterLimit> RegisterLimits { get; set; } = new List<RegisterLimit>();
}
