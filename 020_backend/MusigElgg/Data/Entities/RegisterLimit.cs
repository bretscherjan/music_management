namespace MusigElgg.Data.Entities;

/// <summary>
/// Defines participation limits for a specific register at an event.
/// For example: Max 3 trumpet players can attend a concert.
/// </summary>
public class RegisterLimit
{
    /// <summary>
    /// Unique identifier.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Foreign key to the event this limit applies to.
    /// </summary>
    public Guid EventId { get; set; }

    /// <summary>
    /// Foreign key to the register this limit applies to.
    /// </summary>
    public Guid RegisterId { get; set; }

    /// <summary>
    /// Maximum number of participants allowed from this register.
    /// </summary>
    public int MaxParticipants { get; set; }

    /// <summary>
    /// Minimum number of participants needed from this register (optional).
    /// </summary>
    public int? MinParticipants { get; set; }

    // Navigation properties
    /// <summary>
    /// The event this limit applies to.
    /// </summary>
    public virtual Event Event { get; set; } = null!;

    /// <summary>
    /// The register this limit applies to.
    /// </summary>
    public virtual Register Register { get; set; } = null!;
}
