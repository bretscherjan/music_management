using System.ComponentModel.DataAnnotations;

namespace MusigElgg.Data.Entities;

/// <summary>
/// Represents a checklist item within a task.
/// </summary>
public class TaskChecklistItem
{
    /// <summary>
    /// Unique identifier for the checklist item.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Foreign key to the parent task.
    /// </summary>
    public Guid TaskId { get; set; }

    /// <summary>
    /// Description of the checklist item.
    /// </summary>
    [Required]
    [MaxLength(500)]
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Whether the item is checked/completed.
    /// </summary>
    public bool IsChecked { get; set; } = false;

    /// <summary>
    /// Sort order for display.
    /// </summary>
    public int SortOrder { get; set; } = 0;

    /// <summary>
    /// Date and time when the item was created.
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Date and time when the item was checked.
    /// </summary>
    public DateTime? CheckedAt { get; set; }

    // Navigation properties
    /// <summary>
    /// The parent task.
    /// </summary>
    public virtual AssignedTask Task { get; set; } = null!;
}
