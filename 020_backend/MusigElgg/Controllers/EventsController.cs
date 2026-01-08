using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using MusigElgg.Data.Entities;
using MusigElgg.DTOs.Events;
using MusigElgg.Repositories;

using Microsoft.AspNetCore.Authorization;

namespace MusigElgg.Controllers;

/// <summary>
/// Controller for event management operations.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[Authorize]
public class EventsController : ControllerBase
{
    private readonly IEventRepository _eventRepository;

    public EventsController(IEventRepository eventRepository)
    {
        _eventRepository = eventRepository;
    }

    /// <summary>
    /// Gets all events with optional filtering.
    /// </summary>
    /// <param name="includeDrafts">Include draft events (default: false, admin only).</param>
    /// <param name="includeCancelled">Include cancelled events (default: false).</param>
    /// <returns>List of events.</returns>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<EventResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<EventResponseDto>>> GetAll(
        [FromQuery] bool includeDrafts = false,
        [FromQuery] bool includeCancelled = false)
    {
        var events = await _eventRepository.GetAllAsync();
        
        // Filter drafts (normally only admins should see drafts)
        if (!includeDrafts)
        {
            events = events.Where(e => !e.IsDraft);
        }
        
        // Filter cancelled
        if (!includeCancelled)
        {
            events = events.Where(e => !e.IsCancelled);
        }
        
        return Ok(events.Select(MapToDto));
    }

    /// <summary>
    /// Gets a specific event by ID.
    /// </summary>
    /// <param name="id">The event ID.</param>
    /// <returns>The event if found.</returns>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(EventResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<EventResponseDto>> GetById(Guid id)
    {
        var evt = await _eventRepository.GetByIdAsync(id);
        if (evt == null)
            return NotFound();

        return Ok(MapToDto(evt));
    }

    /// <summary>
    /// Gets upcoming events.
    /// </summary>
    /// <param name="count">Number of events to return (default: 10).</param>
    /// <returns>List of upcoming events.</returns>
    [HttpGet("upcoming")]
    [ProducesResponseType(typeof(IEnumerable<EventResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<EventResponseDto>>> GetUpcoming([FromQuery] int count = 10)
    {
        var events = await _eventRepository.GetUpcomingEventsAsync(count);
        return Ok(events.Select(MapToDto));
    }

    /// <summary>
    /// Gets events within a date range.
    /// </summary>
    /// <param name="startDate">Start of the date range.</param>
    /// <param name="endDate">End of the date range.</param>
    /// <returns>List of events within the range.</returns>
    [HttpGet("by-date-range")]
    [ProducesResponseType(typeof(IEnumerable<EventResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<EventResponseDto>>> GetByDateRange(
        [FromQuery] DateTime startDate,
        [FromQuery] DateTime endDate)
    {
        var events = await _eventRepository.GetByDateRangeAsync(startDate, endDate);
        return Ok(events.Select(MapToDto));
    }

    /// <summary>
    /// Gets events by series.
    /// </summary>
    /// <param name="seriesId">The series ID.</param>
    /// <returns>List of events in the series.</returns>
    [HttpGet("by-series/{seriesId}")]
    [ProducesResponseType(typeof(IEnumerable<EventResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<EventResponseDto>>> GetBySeries(Guid seriesId)
    {
        var events = await _eventRepository.GetBySeriesAsync(seriesId);
        return Ok(events.Select(MapToDto));
    }

    /// <summary>
    /// Gets an event with its participants.
    /// </summary>
    /// <param name="id">The event ID.</param>
    /// <returns>The event with participant list.</returns>
    [HttpGet("{id}/with-participants")]
    [ProducesResponseType(typeof(EventResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<EventResponseDto>> GetWithParticipants(Guid id)
    {
        var evt = await _eventRepository.GetWithParticipantsAsync(id);
        if (evt == null)
            return NotFound();

        return Ok(MapToDto(evt));
    }

    /// <summary>
    /// Creates a new event.
    /// </summary>
    /// <param name="dto">The event data.</param>
    /// <returns>The created event.</returns>
    [HttpPost]
    [ProducesResponseType(typeof(EventResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<EventResponseDto>> Create([FromBody] CreateEventRequestDto dto)
    {
        if (dto.EndTime <= dto.StartTime)
            return BadRequest("End time must be after start time.");

        if (dto.SeriesCreation != null)
        {
            // Create Series Logic
            var series = new EventSeries
            {
                Id = Guid.NewGuid(),
                Name = dto.SeriesCreation.Name,
                Description = dto.SeriesCreation.Description,
                CreatedAt = DateTime.UtcNow
            };

            var events = new List<Event>();
            for (int i = 0; i < dto.SeriesCreation.Occurrences; i++)
            {
                var offset = CalculateOffset(dto.SeriesCreation.Frequency, i);
                events.Add(new Event
                {
                    Id = Guid.NewGuid(),
                    Title = dto.Title, // Or append " #i"?
                    Description = dto.Description,
                    StartTime = dto.StartTime.Add(offset),
                    EndTime = dto.EndTime.Add(offset),
                    Location = dto.Location,
                    MaxParticipants = dto.MaxParticipants,
                    IsPublic = dto.IsPublic,
                    IsDraft = dto.IsDraft,
                    CategoryId = dto.CategoryId,
                    SeriesId = series.Id,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
            }

            // Validate constraints if needed?
            
            await _eventRepository.AddSeriesAsync(series, events);
            
            // Return the first event or the series?
            // Returning the first created event for now.
            var firstEvent = events.First();
            return CreatedAtAction(nameof(GetById), new { id = firstEvent.Id }, MapToDto(firstEvent));
        }

        // Single Event Creation
        var evt = new Event
        {
            Id = Guid.NewGuid(),
            Title = dto.Title,
            Description = dto.Description,
            StartTime = dto.StartTime,
            EndTime = dto.EndTime,
            Location = dto.Location,
            MaxParticipants = dto.MaxParticipants,
            IsPublic = dto.IsPublic,
            IsDraft = dto.IsDraft,
            CategoryId = dto.CategoryId,
            SeriesId = dto.SeriesId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _eventRepository.AddAsync(evt);
        
        // Reload to include navigation properties
        var created = await _eventRepository.GetByIdAsync(evt.Id);
        return CreatedAtAction(nameof(GetById), new { id = evt.Id }, MapToDto(created!));
    }

    /// <summary>
    /// Checks in a user to an event using a QR code.
    /// </summary>
    [HttpPost("{id}/checkin")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CheckIn(Guid id, [FromBody] CheckInRequestDto dto)
    {
        var evt = await _eventRepository.GetByIdAsync(id);
        if (evt == null) return NotFound();

        if (string.IsNullOrEmpty(evt.AttendanceQrCode) || evt.AttendanceQrCode != dto.QrCode)
        {
            return BadRequest("Invalid QR Code.");
        }

        // TODO: Use real user ID from Claims when Auth is fully integrated
        // For now, if no user, we can't check in.
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
        {
             // Fallback for dev/testing if needed, or return Unauthorized
             return Unauthorized();
        }

        var result = await _eventRepository.CheckInParticipantAsync(id, userId);
        return result ? Ok() : BadRequest("Check-in failed.");
    }

    private TimeSpan CalculateOffset(SeriesFrequency frequency, int index)
    {
        return frequency switch
        {
            SeriesFrequency.Daily => TimeSpan.FromDays(index),
            SeriesFrequency.Weekly => TimeSpan.FromDays(index * 7),
            SeriesFrequency.Monthly => TimeSpan.FromDays(index * 30), // Approx
            _ => TimeSpan.Zero
        };
    }

    /// <summary>
    /// Updates an existing event.
    /// </summary>
    /// <param name="id">The event ID.</param>
    /// <param name="dto">The updated event data.</param>
    /// <returns>The updated event.</returns>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(EventResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<EventResponseDto>> Update(Guid id, [FromBody] UpdateEventRequestDto dto)
    {
        var evt = await _eventRepository.GetByIdAsync(id);
        if (evt == null)
            return NotFound();

        if (dto.Title != null) evt.Title = dto.Title;
        if (dto.Description != null) evt.Description = dto.Description;
        if (dto.StartTime.HasValue) evt.StartTime = dto.StartTime.Value;
        if (dto.EndTime.HasValue) evt.EndTime = dto.EndTime.Value;
        if (dto.Location != null) evt.Location = dto.Location;
        if (dto.MaxParticipants.HasValue) evt.MaxParticipants = dto.MaxParticipants;
        if (dto.IsPublic.HasValue) evt.IsPublic = dto.IsPublic.Value;
        if (dto.IsDraft.HasValue) evt.IsDraft = dto.IsDraft.Value;
        if (dto.IsCancelled.HasValue) evt.IsCancelled = dto.IsCancelled.Value;
        if (dto.CategoryId.HasValue) evt.CategoryId = dto.CategoryId;
        if (dto.SeriesId.HasValue) evt.SeriesId = dto.SeriesId;
        evt.UpdatedAt = DateTime.UtcNow;

        await _eventRepository.UpdateAsync(evt);
        
        var updated = await _eventRepository.GetByIdAsync(id);
        return Ok(MapToDto(updated!));
    }

    /// <summary>
    /// Partially updates an event (e.g., publish draft, cancel).
    /// </summary>
    /// <param name="id">The event ID.</param>
    /// <param name="dto">The patch data.</param>
    /// <returns>The updated event.</returns>
    [HttpPatch("{id}")]
    [ProducesResponseType(typeof(EventResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<EventResponseDto>> Patch(Guid id, [FromBody] UpdateEventRequestDto dto)
    {
        var evt = await _eventRepository.GetByIdAsync(id);
        if (evt == null)
            return NotFound();

        // Only apply non-null values (patch semantics)
        if (dto.IsDraft.HasValue) evt.IsDraft = dto.IsDraft.Value;
        if (dto.IsCancelled.HasValue) evt.IsCancelled = dto.IsCancelled.Value;
        if (dto.IsPublic.HasValue) evt.IsPublic = dto.IsPublic.Value;
        if (dto.Title != null) evt.Title = dto.Title;
        if (dto.Description != null) evt.Description = dto.Description;
        if (dto.StartTime.HasValue) evt.StartTime = dto.StartTime.Value;
        if (dto.EndTime.HasValue) evt.EndTime = dto.EndTime.Value;
        if (dto.Location != null) evt.Location = dto.Location;
        if (dto.MaxParticipants.HasValue) evt.MaxParticipants = dto.MaxParticipants;
        if (dto.CategoryId.HasValue) evt.CategoryId = dto.CategoryId;
        if (dto.SeriesId.HasValue) evt.SeriesId = dto.SeriesId;
        evt.UpdatedAt = DateTime.UtcNow;

        await _eventRepository.UpdateAsync(evt);
        
        var updated = await _eventRepository.GetByIdAsync(id);
        return Ok(MapToDto(updated!));
    }

    /// <summary>
    /// Deletes an event.
    /// </summary>
    /// <param name="id">The event ID.</param>
    /// <returns>No content if successful.</returns>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var evt = await _eventRepository.GetByIdAsync(id);
        if (evt == null)
            return NotFound();

        await _eventRepository.DeleteAsync(id);
        return NoContent();
    }

    private static EventResponseDto MapToDto(Event evt) => new()
    {
        Id = evt.Id,
        Title = evt.Title,
        Description = evt.Description,
        StartTime = evt.StartTime,
        EndTime = evt.EndTime,
        Location = evt.Location,
        MaxParticipants = evt.MaxParticipants,
        CurrentParticipants = evt.Participants?.Count ?? 0,
        IsPublic = evt.IsPublic,
        IsDraft = evt.IsDraft,
        IsCancelled = evt.IsCancelled,
        AttendanceQrCode = evt.AttendanceQrCode,
        CreatedAt = evt.CreatedAt,
        Category = evt.Category != null ? new EventCategoryDto
        {
            Id = evt.Category.Id,
            Name = evt.Category.Name,
            Description = evt.Category.Description,
            ColorHex = evt.Category.ColorHex
        } : null,
        Series = evt.Series != null ? new EventSeriesDto
        {
            Id = evt.Series.Id,
            Name = evt.Series.Name,
            Description = evt.Series.Description
        } : null
    };
}
