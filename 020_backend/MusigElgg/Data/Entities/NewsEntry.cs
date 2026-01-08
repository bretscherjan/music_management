using System.ComponentModel.DataAnnotations;

namespace MusigElgg.Data.Entities;

/// <summary>
/// Represents a news entry for the public website.
/// </summary>
public class NewsEntry
{
    public Guid Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    public string Content { get; set; } = string.Empty;

    public DateTime PublishedAt { get; set; } = DateTime.UtcNow;

    public Guid AuthorId { get; set; }
    public virtual User Author { get; set; } = null!;

    public bool IsPublic { get; set; } = true;
}
