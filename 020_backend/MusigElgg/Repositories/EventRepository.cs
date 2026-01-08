using Microsoft.EntityFrameworkCore;
using MusigElgg.Data;
using MusigElgg.Data.Entities;

namespace MusigElgg.Repositories;

/// <summary>
/// Repository implementation for Event entities.
/// </summary>
public class EventRepository : Repository<Event>, IEventRepository
{
    public EventRepository(MusigElggDbContext context) : base(context)
    {
    }

    /// <inheritdoc/>
    public async Task<IEnumerable<Event>> GetByDateRangeAsync(DateTime startDate, DateTime endDate)
    {
        return await _dbSet
            .Where(e => e.StartTime >= startDate && e.StartTime <= endDate)
            .OrderBy(e => e.StartTime)
            .Include(e => e.Category)
            .ToListAsync();
    }

    /// <inheritdoc/>
    public async Task<IEnumerable<Event>> GetByCategoryAsync(Guid categoryId)
    {
        return await _dbSet
            .Where(e => e.CategoryId == categoryId)
            .OrderBy(e => e.StartTime)
            .ToListAsync();
    }

    /// <inheritdoc/>
    public async Task<IEnumerable<Event>> GetBySeriesAsync(Guid seriesId)
    {
        return await _dbSet
            .Where(e => e.SeriesId == seriesId)
            .OrderBy(e => e.StartTime)
            .Include(e => e.Series)
            .ToListAsync();
    }

    /// <inheritdoc/>
    public async Task<IEnumerable<Event>> GetUpcomingEventsAsync(int count = 10)
    {
        return await _dbSet
            .Where(e => e.StartTime >= DateTime.UtcNow && !e.IsCancelled)
            .OrderBy(e => e.StartTime)
            .Take(count)
            .Include(e => e.Category)
            .ToListAsync();
    }

    /// <inheritdoc/>
    public async Task<Event?> GetWithParticipantsAsync(Guid id)
    {
        return await _dbSet
            .Include(e => e.Participants)
                .ThenInclude(p => p.User)
            .Include(e => e.Category)
            .FirstOrDefaultAsync(e => e.Id == id);
    }

    /// <inheritdoc/>
    public override async Task<Event?> GetByIdAsync(Guid id)
    {
        return await _dbSet
            .Include(e => e.Category)
            .Include(e => e.Series)
            .FirstOrDefaultAsync(e => e.Id == id);
    }

    /// <inheritdoc/>
    public async Task AddSeriesAsync(EventSeries series, IEnumerable<Event> events)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            await _context.Set<EventSeries>().AddAsync(series);
            await _context.Set<Event>().AddRangeAsync(events);
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    /// <inheritdoc/>
    public async Task<bool> CheckInParticipantAsync(Guid eventId, Guid userId)
    {
        var participant = await _context.Set<EventParticipant>()
            .FirstOrDefaultAsync(p => p.EventId == eventId && p.UserId == userId);

        if (participant == null)
        {
            participant = new EventParticipant 
            { 
                EventId = eventId, 
                UserId = userId, 
                RegisteredAt = DateTime.UtcNow,
                Status = Data.Enums.AttendanceStatus.Confirmed,
                ConfirmedAt = DateTime.UtcNow
            };
            await _context.Set<EventParticipant>().AddAsync(participant);
        }
        else
        {
            participant.Status = Data.Enums.AttendanceStatus.Confirmed;
            participant.ConfirmedAt = DateTime.UtcNow;
            _context.Set<EventParticipant>().Update(participant);
        }

        await _context.SaveChangesAsync();
        return true;
    }
}
