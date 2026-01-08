namespace MusigElgg.DTOs.Events;

/// <summary>
/// Response DTO for Event entity.
/// </summary>
public class EventResponseDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string? Location { get; set; }
    public int? MaxParticipants { get; set; }
    public int CurrentParticipants { get; set; }
    public bool IsPublic { get; set; }
    public bool IsDraft { get; set; }
    public bool IsCancelled { get; set; }
    public string? AttendanceQrCode { get; set; }
    public DateTime CreatedAt { get; set; }
    public EventCategoryDto? Category { get; set; }
    public EventSeriesDto? Series { get; set; }
}

/// <summary>
/// Response DTO for EventCategory.
/// </summary>
public class EventCategoryDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string ColorHex { get; set; } = string.Empty;
}

/// <summary>
/// Response DTO for EventSeries.
/// </summary>
public class EventSeriesDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
}

/// <summary>
/// Request DTO for creating an event.
/// </summary>
public class CreateEventRequestDto
{
    public required string Title { get; set; }
    public string? Description { get; set; }
    public required DateTime StartTime { get; set; }
    public required DateTime EndTime { get; set; }
    public string? Location { get; set; }
    public int? MaxParticipants { get; set; }
    public bool IsPublic { get; set; } = false;
    public bool IsDraft { get; set; } = true;
    public Guid? CategoryId { get; set; }
    public Guid? SeriesId { get; set; }
    public CreateSeriesOptionsDto? SeriesCreation { get; set; }
}

/// <summary>
/// Request DTO for updating an event.
/// </summary>
public class UpdateEventRequestDto
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public DateTime? StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public string? Location { get; set; }
    public int? MaxParticipants { get; set; }
    public bool? IsPublic { get; set; }
    public bool? IsDraft { get; set; }
    public bool? IsCancelled { get; set; }
    public Guid? CategoryId { get; set; }
    public Guid? SeriesId { get; set; }
}

/// <summary>
/// Request DTO for creating an event category.
/// </summary>
public class CreateEventCategoryRequestDto
{
    public required string Name { get; set; }
    public string? Description { get; set; }
    public required string ColorHex { get; set; }
}

/// <summary>
/// Request DTO for creating an event series.
/// </summary>
public class CreateEventSeriesRequestDto
{
    public required string Name { get; set; }
    public string? Description { get; set; }
}

/// <summary>
/// Request DTO for creating a check-in.
/// </summary>
public class CheckInRequestDto
{
    public required string QrCode { get; set; }
}

/// <summary>
/// Options for creating a series of events.
/// </summary>
public class CreateSeriesOptionsDto
{
    public required string Name { get; set; }
    public string? Description { get; set; }
    public SeriesFrequency Frequency { get; set; }
    public int Occurrences { get; set; }
}

public enum SeriesFrequency
{
    Daily,
    Weekly,
    Monthly
}
