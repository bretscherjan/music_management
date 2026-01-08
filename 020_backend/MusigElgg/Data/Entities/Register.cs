using System.ComponentModel.DataAnnotations;

namespace MusigElgg.Data.Entities;

/// <summary>
/// Represents an instrument register/section in the music association (e.g., Trompete, Klarinette, Schlagzeug).
/// </summary>
public class Register
{
    /// <summary>
    /// Unique identifier for the register.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Name of the register (e.g., "Trompete", "Klarinette", "Schlagzeug").
    /// </summary>
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Description or notes about this register.
    /// </summary>
    [MaxLength(500)]
    public string? Description { get; set; }

    /// <summary>
    /// Sort order for display purposes.
    /// </summary>
    public int SortOrder { get; set; } = 0;

    /// <summary>
    /// Users belonging to this register.
    /// </summary>
    public virtual ICollection<User> Users { get; set; } = new List<User>();

    /// <summary>
    /// Limits defined for this register on specific events.
    /// </summary>
    public virtual ICollection<RegisterLimit> Limits { get; set; } = new List<RegisterLimit>();
}
