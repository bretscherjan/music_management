using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using MusigElgg.Data;
using MusigElgg.Data.Entities;
using MusigElgg.Data.Enums;
using MusigElgg.DTOs.Tasks;
using Microsoft.AspNetCore.Authorization;

namespace MusigElgg.Controllers;

/// <summary>
/// Controller for task management ("Assign it!" module).
/// </summary>
[Route("api/[controller]")]
[Produces("application/json")]
[Authorize]
public class TasksController : ControllerBase
{
    private readonly MusigElggDbContext _context;

    public TasksController(MusigElggDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Gets all tasks with optional filtering.
    /// </summary>
    /// <param name="includeArchived">Include archived tasks (default: false).</param>
    /// <param name="status">Filter by status.</param>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<AssignedTaskResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<AssignedTaskResponseDto>>> GetAll(
        [FromQuery] bool includeArchived = false,
        [FromQuery] AssignedTaskStatus? status = null)
    {
        var query = _context.AssignedTasks
            .Include(t => t.CreatedBy)
            .Include(t => t.Assignee)
            .Include(t => t.AssignedRegister)
            .Include(t => t.Event)
            .Include(t => t.ChecklistItems)
            .Include(t => t.Comments)
            .AsQueryable();

        if (!includeArchived)
        {
            query = query.Where(t => t.Status != AssignedTaskStatus.Archived);
        }

        if (status.HasValue)
        {
            query = query.Where(t => t.Status == status.Value);
        }

        var tasks = await query.OrderByDescending(t => t.Priority).ThenBy(t => t.DueDate).ToListAsync();
        return Ok(tasks.Select(MapToDto));
    }

    /// <summary>
    /// Gets tasks assigned to the current user.
    /// </summary>
    [HttpGet("my-tasks")]
    [ProducesResponseType(typeof(IEnumerable<AssignedTaskResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<IEnumerable<AssignedTaskResponseDto>>> GetMyTasks()
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
        {
            return Unauthorized();
        }

        var user = await _context.Users.Include(u => u.Register).FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return Unauthorized();

        var tasks = await _context.AssignedTasks
            .Include(t => t.CreatedBy)
            .Include(t => t.Assignee)
            .Include(t => t.AssignedRegister)
            .Include(t => t.Event)
            .Include(t => t.ChecklistItems)
            .Include(t => t.Comments)
            .Where(t => t.Status != AssignedTaskStatus.Archived &&
                        (t.AssigneeId == userId || t.AssignedRegisterId == user.RegisterId))
            .OrderByDescending(t => t.Priority)
            .ThenBy(t => t.DueDate)
            .ToListAsync();

        return Ok(tasks.Select(MapToDto));
    }

    /// <summary>
    /// Gets a specific task by ID.
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(AssignedTaskResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AssignedTaskResponseDto>> GetById(Guid id)
    {
        var task = await GetTaskWithIncludesAsync(id);
        if (task == null) return NotFound();

        return Ok(MapToDto(task));
    }

    /// <summary>
    /// Creates a new task.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(AssignedTaskResponseDto), StatusCodes.Status201Created)]
    public async Task<ActionResult<AssignedTaskResponseDto>> Create([FromBody] CreateAssignedTaskRequestDto dto)
    {
        // Get current user as creator
        Guid? createdById = null;
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrEmpty(userIdString) && Guid.TryParse(userIdString, out var userId))
        {
            createdById = userId;
        }

        var task = new AssignedTask
        {
            Id = Guid.NewGuid(),
            Title = dto.Title,
            Description = dto.Description,
            DueDate = dto.DueDate,
            Priority = dto.Priority,
            Recurrence = dto.Recurrence,
            Status = AssignedTaskStatus.Open,
            CreatedById = createdById,
            AssigneeId = dto.AssigneeId,
            AssignedRegisterId = dto.AssignedRegisterId,
            EventId = dto.EventId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Calculate next occurrence if recurring
        if (dto.Recurrence != TaskRecurrence.None && dto.DueDate.HasValue)
        {
            task.NextOccurrence = CalculateNextOccurrence(dto.DueDate.Value, dto.Recurrence);
        }

        // Add checklist items if provided
        if (dto.ChecklistItems != null)
        {
            foreach (var item in dto.ChecklistItems)
            {
                task.ChecklistItems.Add(new TaskChecklistItem
                {
                    Id = Guid.NewGuid(),
                    TaskId = task.Id,
                    Description = item.Description,
                    SortOrder = item.SortOrder,
                    CreatedAt = DateTime.UtcNow
                });
            }
        }

        _context.AssignedTasks.Add(task);
        await _context.SaveChangesAsync();

        var created = await GetTaskWithIncludesAsync(task.Id);
        return CreatedAtAction(nameof(GetById), new { id = task.Id }, MapToDto(created!));
    }

    /// <summary>
    /// Updates a task's status.
    /// </summary>
    [HttpPatch("{id}/status")]
    [ProducesResponseType(typeof(AssignedTaskResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AssignedTaskResponseDto>> UpdateStatus(Guid id, [FromBody] UpdateAssignedTaskRequestDto dto)
    {
        var task = await _context.AssignedTasks.FindAsync(id);
        if (task == null) return NotFound();

        if (dto.Status.HasValue)
        {
            task.Status = dto.Status.Value;

            if (dto.Status.Value == AssignedTaskStatus.Completed)
            {
                task.CompletedAt = DateTime.UtcNow;

                // Handle recurring tasks
                if (task.Recurrence != TaskRecurrence.None && task.DueDate.HasValue)
                {
                    CreateNextRecurrence(task);
                }
            }
            else if (dto.Status.Value == AssignedTaskStatus.Archived)
            {
                task.ArchivedAt = DateTime.UtcNow;
            }
        }

        task.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        var updated = await GetTaskWithIncludesAsync(id);
        return Ok(MapToDto(updated!));
    }

    /// <summary>
    /// Updates a task.
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(AssignedTaskResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AssignedTaskResponseDto>> Update(Guid id, [FromBody] UpdateAssignedTaskRequestDto dto)
    {
        var task = await _context.AssignedTasks.FindAsync(id);
        if (task == null) return NotFound();

        if (dto.Title != null) task.Title = dto.Title;
        if (dto.Description != null) task.Description = dto.Description;
        if (dto.DueDate.HasValue) task.DueDate = dto.DueDate;
        if (dto.Priority.HasValue) task.Priority = dto.Priority.Value;
        if (dto.Recurrence.HasValue) task.Recurrence = dto.Recurrence.Value;
        if (dto.AssigneeId.HasValue) task.AssigneeId = dto.AssigneeId;
        if (dto.AssignedRegisterId.HasValue) task.AssignedRegisterId = dto.AssignedRegisterId;
        if (dto.EventId.HasValue) task.EventId = dto.EventId;

        if (dto.Status.HasValue)
        {
            task.Status = dto.Status.Value;
            if (dto.Status.Value == AssignedTaskStatus.Completed)
            {
                task.CompletedAt = DateTime.UtcNow;
            }
        }

        task.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        var updated = await GetTaskWithIncludesAsync(id);
        return Ok(MapToDto(updated!));
    }

    /// <summary>
    /// Adds a comment to a task.
    /// </summary>
    [HttpPost("{id}/comments")]
    [ProducesResponseType(typeof(TaskCommentDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TaskCommentDto>> AddComment(Guid id, [FromBody] AddCommentRequestDto dto)
    {
        var task = await _context.AssignedTasks.FindAsync(id);
        if (task == null) return NotFound();

        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
        {
            return Unauthorized();
        }

        var user = await _context.Users.FindAsync(userId);
        if (user == null) return Unauthorized();

        var comment = new TaskComment
        {
            Id = Guid.NewGuid(),
            TaskId = id,
            AuthorId = userId,
            Content = dto.Content,
            CreatedAt = DateTime.UtcNow
        };

        _context.TaskComments.Add(comment);
        await _context.SaveChangesAsync();

        return Created($"/api/tasks/{id}/comments/{comment.Id}", new TaskCommentDto
        {
            Id = comment.Id,
            Content = comment.Content,
            Author = new TaskUserDto
            {
                Id = user.Id,
                FullName = $"{user.FirstName} {user.LastName}",
                Email = user.Email
            },
            CreatedAt = comment.CreatedAt
        });
    }

    /// <summary>
    /// Gets comments for a task.
    /// </summary>
    [HttpGet("{id}/comments")]
    [ProducesResponseType(typeof(IEnumerable<TaskCommentDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IEnumerable<TaskCommentDto>>> GetComments(Guid id)
    {
        var task = await _context.AssignedTasks.FindAsync(id);
        if (task == null) return NotFound();

        var comments = await _context.TaskComments
            .Where(c => c.TaskId == id && !c.IsDeleted)
            .Include(c => c.Author)
            .OrderBy(c => c.CreatedAt)
            .ToListAsync();

        return Ok(comments.Select(c => new TaskCommentDto
        {
            Id = c.Id,
            Content = c.Content,
            Author = new TaskUserDto
            {
                Id = c.Author.Id,
                FullName = $"{c.Author.FirstName} {c.Author.LastName}",
                Email = c.Author.Email
            },
            CreatedAt = c.CreatedAt,
            EditedAt = c.EditedAt
        }));
    }

    /// <summary>
    /// Toggles a checklist item.
    /// </summary>
    [HttpPatch("{taskId}/checklist/{itemId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ToggleChecklistItem(Guid taskId, Guid itemId, [FromBody] ToggleChecklistItemDto dto)
    {
        var item = await _context.TaskChecklistItems
            .FirstOrDefaultAsync(i => i.Id == itemId && i.TaskId == taskId);

        if (item == null) return NotFound();

        item.IsChecked = dto.IsChecked;
        item.CheckedAt = dto.IsChecked ? DateTime.UtcNow : null;
        await _context.SaveChangesAsync();

        return Ok();
    }

    /// <summary>
    /// Archives completed tasks older than specified days.
    /// </summary>
    [HttpPost("archive-old")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> ArchiveOldTasks([FromQuery] int daysOld = 30)
    {
        var cutoffDate = DateTime.UtcNow.AddDays(-daysOld);

        var tasksToArchive = await _context.AssignedTasks
            .Where(t => t.Status == AssignedTaskStatus.Completed &&
                        t.CompletedAt.HasValue &&
                        t.CompletedAt.Value < cutoffDate)
            .ToListAsync();

        foreach (var task in tasksToArchive)
        {
            task.Status = AssignedTaskStatus.Archived;
            task.ArchivedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        return Ok(new { ArchivedCount = tasksToArchive.Count });
    }

    /// <summary>
    /// Deletes a task.
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var task = await _context.AssignedTasks.FindAsync(id);
        if (task == null) return NotFound();

        _context.AssignedTasks.Remove(task);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private async Task<AssignedTask?> GetTaskWithIncludesAsync(Guid id)
    {
        return await _context.AssignedTasks
            .Include(t => t.CreatedBy)
            .Include(t => t.Assignee)
            .Include(t => t.AssignedRegister)
            .Include(t => t.Event)
            .Include(t => t.ChecklistItems.OrderBy(c => c.SortOrder))
            .Include(t => t.Comments)
            .FirstOrDefaultAsync(t => t.Id == id);
    }

    private void CreateNextRecurrence(AssignedTask completedTask)
    {
        var nextDueDate = CalculateNextOccurrence(completedTask.DueDate!.Value, completedTask.Recurrence);

        var newTask = new AssignedTask
        {
            Id = Guid.NewGuid(),
            Title = completedTask.Title,
            Description = completedTask.Description,
            DueDate = nextDueDate,
            Priority = completedTask.Priority,
            Recurrence = completedTask.Recurrence,
            NextOccurrence = CalculateNextOccurrence(nextDueDate, completedTask.Recurrence),
            Status = AssignedTaskStatus.Open,
            CreatedById = completedTask.CreatedById,
            AssigneeId = completedTask.AssigneeId,
            AssignedRegisterId = completedTask.AssignedRegisterId,
            EventId = completedTask.EventId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.AssignedTasks.Add(newTask);
    }

    private static DateTime CalculateNextOccurrence(DateTime current, TaskRecurrence recurrence)
    {
        return recurrence switch
        {
            TaskRecurrence.Daily => current.AddDays(1),
            TaskRecurrence.Weekly => current.AddDays(7),
            TaskRecurrence.Monthly => current.AddMonths(1),
            TaskRecurrence.Yearly => current.AddYears(1),
            _ => current
        };
    }

    private static AssignedTaskResponseDto MapToDto(AssignedTask task) => new()
    {
        Id = task.Id,
        Title = task.Title,
        Description = task.Description,
        DueDate = task.DueDate,
        Status = task.Status,
        Priority = task.Priority,
        Recurrence = task.Recurrence,
        NextOccurrence = task.NextOccurrence,
        CreatedAt = task.CreatedAt,
        UpdatedAt = task.UpdatedAt,
        CompletedAt = task.CompletedAt,
        ArchivedAt = task.ArchivedAt,
        CreatedBy = task.CreatedBy != null ? new TaskUserDto
        {
            Id = task.CreatedBy.Id,
            FullName = $"{task.CreatedBy.FirstName} {task.CreatedBy.LastName}",
            Email = task.CreatedBy.Email
        } : null,
        Assignee = task.Assignee != null ? new TaskUserDto
        {
            Id = task.Assignee.Id,
            FullName = $"{task.Assignee.FirstName} {task.Assignee.LastName}",
            Email = task.Assignee.Email
        } : null,
        AssignedRegister = task.AssignedRegister != null ? new TaskRegisterDto
        {
            Id = task.AssignedRegister.Id,
            Name = task.AssignedRegister.Name
        } : null,
        Event = task.Event != null ? new TaskEventDto
        {
            Id = task.Event.Id,
            Title = task.Event.Title,
            StartTime = task.Event.StartTime
        } : null,
        ChecklistItems = task.ChecklistItems.Select(c => new TaskChecklistItemDto
        {
            Id = c.Id,
            Description = c.Description,
            IsChecked = c.IsChecked,
            SortOrder = c.SortOrder
        }).ToList(),
        CommentCount = task.Comments.Count(c => !c.IsDeleted)
    };
}
