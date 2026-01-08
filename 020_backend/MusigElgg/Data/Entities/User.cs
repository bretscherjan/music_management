using System.ComponentModel.DataAnnotations;
using MusigElgg.Data.Enums;

namespace MusigElgg.Data.Entities;

/// <summary>
/// Represents a user (member) of the music association.
/// </summary>
public class User
{
    /// <summary>
    /// Unique identifier for the user.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// User's email address (unique).
    /// </summary>
    [Required]
    [MaxLength(255)]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// User's first name.
    /// </summary>
    [Required]
    [MaxLength(100)]
    public string FirstName { get; set; } = string.Empty;

    /// <summary>
    /// User's last name.
    /// </summary>
    [Required]
    [MaxLength(100)]
    public string LastName { get; set; } = string.Empty;

    /// <summary>
    /// The role of the user in the system.
    /// </summary>
    public UserRole Role { get; set; } = UserRole.Member;

    /// <summary>
    /// Whether the user account is active.
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Phone number of the user.
    /// </summary>
    [MaxLength(50)]
    public string? PhoneNumber { get; set; }

    /// <summary>
    /// Foreign key to the user's instrument register.
    /// </summary>
    public Guid? RegisterId { get; set; }

    /// <summary>
    /// Hashed password.
    /// </summary>
    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    /// <summary>
    /// Membership status (Active, Passive, etc.).
    /// </summary>
    public MembershipStatus Status { get; set; } = MembershipStatus.Pending;

    /// <summary>
    /// User's main instrument (text field).
    /// </summary>
    [MaxLength(100)]
    public string? Instrument { get; set; }

    /// <summary>
    /// Date when the user joined the association.
    /// </summary>
    public DateTime? EntryDate { get; set; }

    /// <summary>
    /// Date and time when the user was created.
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Date and time when the user was last updated.
    /// </summary>
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    /// <summary>
    /// The user's instrument register (e.g., Trompete, Klarinette).
    /// </summary>
    public virtual Register? Register { get; set; }

    /// <summary>
    /// Events the user is participating in.
    /// </summary>
    public virtual ICollection<EventParticipant> EventParticipations { get; set; } = new List<EventParticipant>();

    /// <summary>
    /// Tasks assigned to the user.
    /// </summary>
    public virtual ICollection<AssignedTask> AssignedTasks { get; set; } = new List<AssignedTask>();
}
