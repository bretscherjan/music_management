using MusigElgg.Data.Entities;
using MusigElgg.DTOs.Events;
using MusigElgg.Repositories;

namespace MusigElgg.Services;

/// <summary>
/// Service for generating event series from templates.
/// </summary>
public interface IEventSeriesService
{
    /// <summary>
    /// Generates events from a series template.
    /// </summary>
    Task<(EventSeries Series, IEnumerable<Event> Events)> GenerateSeriesAsync(
        string seriesName,
        string? seriesDescription,
        CreateEventRequestDto templateEvent,
        SeriesFrequency frequency,
        int occurrences);
}

/// <summary>
/// Implementation of event series generation service.
/// </summary>
public class EventSeriesService : IEventSeriesService
{
    private readonly IEventRepository _eventRepository;

    public EventSeriesService(IEventRepository eventRepository)
    {
        _eventRepository = eventRepository;
    }

    /// <inheritdoc/>
    public async Task<(EventSeries Series, IEnumerable<Event> Events)> GenerateSeriesAsync(
        string seriesName,
        string? seriesDescription,
        CreateEventRequestDto templateEvent,
        SeriesFrequency frequency,
        int occurrences)
    {
        if (occurrences < 1 || occurrences > 52)
        {
            throw new ArgumentException("Occurrences must be between 1 and 52.");
        }

        var series = new EventSeries
        {
            Id = Guid.NewGuid(),
            Name = seriesName,
            Description = seriesDescription,
            CreatedAt = DateTime.UtcNow
        };

        var events = new List<Event>();
        for (int i = 0; i < occurrences; i++)
        {
            var offset = CalculateOffset(frequency, i);
            events.Add(new Event
            {
                Id = Guid.NewGuid(),
                Title = $"{templateEvent.Title} #{i + 1}",
                Description = templateEvent.Description,
                StartTime = templateEvent.StartTime.Add(offset),
                EndTime = templateEvent.EndTime.Add(offset),
                Location = templateEvent.Location,
                MaxParticipants = templateEvent.MaxParticipants,
                IsPublic = templateEvent.IsPublic,
                IsDraft = templateEvent.IsDraft,
                CategoryId = templateEvent.CategoryId,
                SeriesId = series.Id,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });
        }

        await _eventRepository.AddSeriesAsync(series, events);

        return (series, events);
    }

    private static TimeSpan CalculateOffset(SeriesFrequency frequency, int index)
    {
        return frequency switch
        {
            SeriesFrequency.Daily => TimeSpan.FromDays(index),
            SeriesFrequency.Weekly => TimeSpan.FromDays(index * 7),
            SeriesFrequency.Monthly => TimeSpan.FromDays(index * 30), // Approximate
            _ => TimeSpan.Zero
        };
    }
}
