using System.ComponentModel.DataAnnotations;

namespace MusigElgg.Data.Entities;

/// <summary>
/// Represents a category for events with associated color for UI display.
/// Uses the Musig Elgg color scheme: Burgundy (#801010) and Gold (#C5A059).
/// </summary>
public class EventCategory
{
    /// <summary>
    /// Unique identifier for the category.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Name of the category (e.g., "Konzert", "Probe", "Vereinsanlass").
    /// </summary>
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Description of the category.
    /// </summary>
    [MaxLength(500)]
    public string? Description { get; set; }

    /// <summary>
    /// Hex color code for the category (e.g., "#801010" for Burgundy, "#C5A059" for Gold).
    /// </summary>
    [Required]
    [MaxLength(7)]
    public string ColorHex { get; set; } = "#801010"; // Default: Burgundy

    /// <summary>
    /// Events belonging to this category.
    /// </summary>
    public virtual ICollection<Event> Events { get; set; } = new List<Event>();
}
