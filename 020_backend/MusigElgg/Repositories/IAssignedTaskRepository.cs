using MusigElgg.Data.Entities;
using MusigElgg.Data.Enums;

namespace MusigElgg.Repositories;

/// <summary>
/// Repository interface for AssignedTask entities with additional methods.
/// </summary>
public interface IAssignedTaskRepository : IRepository<AssignedTask>
{
    /// <summary>
    /// Gets tasks assigned to a specific user.
    /// </summary>
    Task<IEnumerable<AssignedTask>> GetByAssigneeAsync(Guid userId);

    /// <summary>
    /// Gets tasks by status.
    /// </summary>
    Task<IEnumerable<AssignedTask>> GetByStatusAsync(AssignedTaskStatus status);

    /// <summary>
    /// Gets tasks related to a specific event.
    /// </summary>
    Task<IEnumerable<AssignedTask>> GetByEventAsync(Guid eventId);

    /// <summary>
    /// Gets overdue tasks.
    /// </summary>
    Task<IEnumerable<AssignedTask>> GetOverdueTasksAsync();

    /// <summary>
    /// Gets pending tasks (open or in progress).
    /// </summary>
    Task<IEnumerable<AssignedTask>> GetPendingTasksAsync();
}
