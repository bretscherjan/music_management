using Microsoft.EntityFrameworkCore;
using MusigElgg.Data;
using MusigElgg.Data.Entities;
using MusigElgg.Data.Enums;

namespace MusigElgg.Repositories;

/// <summary>
/// Repository implementation for AssignedTask entities.
/// </summary>
public class AssignedTaskRepository : Repository<AssignedTask>, IAssignedTaskRepository
{
    public AssignedTaskRepository(MusigElggDbContext context) : base(context)
    {
    }

    /// <inheritdoc/>
    public async Task<IEnumerable<AssignedTask>> GetByAssigneeAsync(Guid userId)
    {
        return await _dbSet
            .Where(t => t.AssigneeId == userId)
            .OrderByDescending(t => t.Priority)
            .ThenBy(t => t.DueDate)
            .Include(t => t.Event)
            .ToListAsync();
    }

    /// <inheritdoc/>
    public async Task<IEnumerable<AssignedTask>> GetByStatusAsync(AssignedTaskStatus status)
    {
        return await _dbSet
            .Where(t => t.Status == status)
            .OrderByDescending(t => t.Priority)
            .ThenBy(t => t.DueDate)
            .Include(t => t.Assignee)
            .ToListAsync();
    }

    /// <inheritdoc/>
    public async Task<IEnumerable<AssignedTask>> GetByEventAsync(Guid eventId)
    {
        return await _dbSet
            .Where(t => t.EventId == eventId)
            .OrderByDescending(t => t.Priority)
            .Include(t => t.Assignee)
            .ToListAsync();
    }

    /// <inheritdoc/>
    public async Task<IEnumerable<AssignedTask>> GetOverdueTasksAsync()
    {
        return await _dbSet
            .Where(t => t.DueDate < DateTime.UtcNow
                     && t.Status != AssignedTaskStatus.Completed
                     && t.Status != AssignedTaskStatus.Cancelled)
            .OrderBy(t => t.DueDate)
            .Include(t => t.Assignee)
            .ToListAsync();
    }

    /// <inheritdoc/>
    public async Task<IEnumerable<AssignedTask>> GetPendingTasksAsync()
    {
        return await _dbSet
            .Where(t => t.Status == AssignedTaskStatus.Open
                     || t.Status == AssignedTaskStatus.InProgress)
            .OrderByDescending(t => t.Priority)
            .ThenBy(t => t.DueDate)
            .Include(t => t.Assignee)
            .Include(t => t.Event)
            .ToListAsync();
    }

    /// <inheritdoc/>
    public override async Task<AssignedTask?> GetByIdAsync(Guid id)
    {
        return await _dbSet
            .Include(t => t.Assignee)
            .Include(t => t.Event)
            .FirstOrDefaultAsync(t => t.Id == id);
    }
}
