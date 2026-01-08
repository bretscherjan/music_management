using System.ComponentModel.DataAnnotations;
using MusigElgg.Data.Enums;

namespace MusigElgg.Data.Entities;

/// <summary>
/// Represents a task in the "Assign it!" module.
/// Tasks can be assigned to users or registers and optionally linked to events.
/// </summary>
public class AssignedTask
{
    /// <summary>
    /// Unique identifier for the task.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Title of the task.
    /// </summary>
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Detailed description of the task.
    /// </summary>
    [MaxLength(2000)]
    public string? Description { get; set; }

    /// <summary>
    /// Due date for the task.
    /// </summary>
    public DateTime? DueDate { get; set; }

    /// <summary>
    /// Current status of the task.
    /// </summary>
    public AssignedTaskStatus Status { get; set; } = AssignedTaskStatus.Open;

    /// <summary>
    /// Priority level (1 = lowest, 5 = highest).
    /// </summary>
    public int Priority { get; set; } = 3;

    /// <summary>
    /// Recurrence pattern for repeating tasks (e.g., monthly instrument maintenance).
    /// </summary>
    public TaskRecurrence Recurrence { get; set; } = TaskRecurrence.None;

    /// <summary>
    /// If recurring, the next occurrence date.
    /// </summary>
    public DateTime? NextOccurrence { get; set; }

    /// <summary>
    /// Date and time when the task was created.
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Date and time when the task was last updated.
    /// </summary>
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Date and time when the task was completed.
    /// </summary>
    public DateTime? CompletedAt { get; set; }

    /// <summary>
    /// Date and time when the task was archived.
    /// </summary>
    public DateTime? ArchivedAt { get; set; }

    // Foreign keys
    /// <summary>
    /// Foreign key to the user who created the task.
    /// </summary>
    public Guid? CreatedById { get; set; }

    /// <summary>
    /// Foreign key to the assigned user (individual assignment).
    /// </summary>
    public Guid? AssigneeId { get; set; }

    /// <summary>
    /// Foreign key to the assigned register/group (group assignment, e.g., "Trompete").
    /// </summary>
    public Guid? AssignedRegisterId { get; set; }

    /// <summary>
    /// Foreign key to the related event.
    /// </summary>
    public Guid? EventId { get; set; }

    // Navigation properties
    /// <summary>
    /// The user who created this task.
    /// </summary>
    public virtual User? CreatedBy { get; set; }

    /// <summary>
    /// The user assigned to this task.
    /// </summary>
    public virtual User? Assignee { get; set; }

    /// <summary>
    /// The register/group assigned to this task.
    /// </summary>
    public virtual Register? AssignedRegister { get; set; }

    /// <summary>
    /// The event this task is related to.
    /// </summary>
    public virtual Event? Event { get; set; }

    /// <summary>
    /// Checklist items for this task.
    /// </summary>
    public virtual ICollection<TaskChecklistItem> ChecklistItems { get; set; } = new List<TaskChecklistItem>();

    /// <summary>
    /// Comments/discussion on this task (Pinnwand).
    /// </summary>
    public virtual ICollection<TaskComment> Comments { get; set; } = new List<TaskComment>();
}
