using System.ComponentModel.DataAnnotations;

namespace MusigElgg.Data.Entities;

/// <summary>
/// Represents a post on an event's board (Pinnwand).
/// </summary>
public class EventPost
{
    public Guid Id { get; set; }

    [Required]
    [MaxLength(2000)]
    public string Content { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Guid AuthorId { get; set; }
    public virtual User Author { get; set; } = null!;

    public Guid EventId { get; set; }
    public virtual Event Event { get; set; } = null!;
}
