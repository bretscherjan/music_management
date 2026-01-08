using System.ComponentModel.DataAnnotations;

namespace MusigElgg.Data.Entities;

/// <summary>
/// Represents a comment on a task (Pinnwand).
/// </summary>
public class TaskComment
{
    /// <summary>
    /// Unique identifier for the comment.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Foreign key to the parent task.
    /// </summary>
    public Guid TaskId { get; set; }

    /// <summary>
    /// Foreign key to the user who wrote the comment.
    /// </summary>
    public Guid AuthorId { get; set; }

    /// <summary>
    /// The comment text.
    /// </summary>
    [Required]
    [MaxLength(2000)]
    public string Content { get; set; } = string.Empty;

    /// <summary>
    /// Date and time when the comment was created.
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Date and time when the comment was last edited.
    /// </summary>
    public DateTime? EditedAt { get; set; }

    /// <summary>
    /// Whether the comment has been deleted (soft delete).
    /// </summary>
    public bool IsDeleted { get; set; } = false;

    // Navigation properties
    /// <summary>
    /// The parent task.
    /// </summary>
    public virtual AssignedTask Task { get; set; } = null!;

    /// <summary>
    /// The user who wrote the comment.
    /// </summary>
    public virtual User Author { get; set; } = null!;
}
