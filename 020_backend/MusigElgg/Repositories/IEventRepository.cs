using MusigElgg.Data.Entities;

namespace MusigElgg.Repositories;

/// <summary>
/// Repository interface for Event entities with additional methods.
/// </summary>
public interface IEventRepository : IRepository<Event>
{
    /// <summary>
    /// Gets events within a date range.
    /// </summary>
    Task<IEnumerable<Event>> GetByDateRangeAsync(DateTime startDate, DateTime endDate);

    /// <summary>
    /// Gets events by category.
    /// </summary>
    Task<IEnumerable<Event>> GetByCategoryAsync(Guid categoryId);

    /// <summary>
    /// Gets events by series.
    /// </summary>
    Task<IEnumerable<Event>> GetBySeriesAsync(Guid seriesId);

    /// <summary>
    /// Gets upcoming events.
    /// </summary>
    Task<IEnumerable<Event>> GetUpcomingEventsAsync(int count = 10);

    /// <summary>
    /// Gets an event with its participants.
    /// </summary>
    Task<Event?> GetWithParticipantsAsync(Guid id);

    /// <summary>
    /// Adds a series and its events transactionally.
    /// </summary>
    Task AddSeriesAsync(EventSeries series, IEnumerable<Event> events);

    /// <summary>
    /// Checks in a participant. Returns true if successful, false if user not registered (optional: could auto-register).
    /// </summary>
    Task<bool> CheckInParticipantAsync(Guid eventId, Guid userId);
}
