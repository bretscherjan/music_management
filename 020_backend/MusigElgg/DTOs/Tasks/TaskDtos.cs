using MusigElgg.Data.Enums;

namespace MusigElgg.DTOs.Tasks;

/// <summary>
/// Response DTO for AssignedTask entity.
/// </summary>
public class AssignedTaskResponseDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime? DueDate { get; set; }
    public AssignedTaskStatus Status { get; set; }
    public int Priority { get; set; }
    public TaskRecurrence Recurrence { get; set; }
    public DateTime? NextOccurrence { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? ArchivedAt { get; set; }
    public TaskUserDto? CreatedBy { get; set; }
    public TaskUserDto? Assignee { get; set; }
    public TaskRegisterDto? AssignedRegister { get; set; }
    public TaskEventDto? Event { get; set; }
    public List<TaskChecklistItemDto> ChecklistItems { get; set; } = new();
    public int CommentCount { get; set; }
}

/// <summary>
/// DTO for user information in task context.
/// </summary>
public class TaskUserDto
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
}

/// <summary>
/// DTO for register information in task context.
/// </summary>
public class TaskRegisterDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
}

/// <summary>
/// DTO for minimal event information in task context.
/// </summary>
public class TaskEventDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
}

/// <summary>
/// DTO for checklist item.
/// </summary>
public class TaskChecklistItemDto
{
    public Guid Id { get; set; }
    public string Description { get; set; } = string.Empty;
    public bool IsChecked { get; set; }
    public int SortOrder { get; set; }
}

/// <summary>
/// DTO for task comment.
/// </summary>
public class TaskCommentDto
{
    public Guid Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public TaskUserDto Author { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
    public DateTime? EditedAt { get; set; }
}

/// <summary>
/// Request DTO for creating a task.
/// </summary>
public class CreateAssignedTaskRequestDto
{
    public required string Title { get; set; }
    public string? Description { get; set; }
    public DateTime? DueDate { get; set; }
    public int Priority { get; set; } = 3;
    public TaskRecurrence Recurrence { get; set; } = TaskRecurrence.None;
    public Guid? AssigneeId { get; set; }
    public Guid? AssignedRegisterId { get; set; }
    public Guid? EventId { get; set; }
    public List<CreateChecklistItemDto>? ChecklistItems { get; set; }
}

/// <summary>
/// Request DTO for creating a checklist item.
/// </summary>
public class CreateChecklistItemDto
{
    public required string Description { get; set; }
    public int SortOrder { get; set; } = 0;
}

/// <summary>
/// Request DTO for updating a task.
/// </summary>
public class UpdateAssignedTaskRequestDto
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public DateTime? DueDate { get; set; }
    public AssignedTaskStatus? Status { get; set; }
    public int? Priority { get; set; }
    public TaskRecurrence? Recurrence { get; set; }
    public Guid? AssigneeId { get; set; }
    public Guid? AssignedRegisterId { get; set; }
    public Guid? EventId { get; set; }
}

/// <summary>
/// Request DTO for adding a comment.
/// </summary>
public class AddCommentRequestDto
{
    public required string Content { get; set; }
}

/// <summary>
/// Request DTO for toggling checklist item.
/// </summary>
public class ToggleChecklistItemDto
{
    public bool IsChecked { get; set; }
}
