using System.ComponentModel.DataAnnotations;

namespace MusigElgg.Data.Entities;

/// <summary>
/// Represents a series of recurring events (e.g., weekly rehearsals).
/// </summary>
public class EventSeries
{
    /// <summary>
    /// Unique identifier for the series.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Name of the event series (e.g., "Wöchentliche Proben 2024").
    /// </summary>
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Description of the event series.
    /// </summary>
    [MaxLength(1000)]
    public string? Description { get; set; }

    /// <summary>
    /// Date and time when the series was created.
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Events that belong to this series.
    /// </summary>
    public virtual ICollection<Event> Events { get; set; } = new List<Event>();
}
