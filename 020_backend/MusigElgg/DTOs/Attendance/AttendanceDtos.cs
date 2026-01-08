using MusigElgg.Data.Enums;

namespace MusigElgg.DTOs.Attendance;

/// <summary>
/// Response DTO for attendance status.
/// </summary>
public class AttendanceResponseDto
{
    public Guid EventId { get; set; }
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string? RegisterName { get; set; }
    public AttendanceStatus Status { get; set; }
    public DateTime RegisteredAt { get; set; }
    public DateTime? ConfirmedAt { get; set; }
    public string? Notes { get; set; }
}

/// <summary>
/// Request DTO for registering attendance (RSVP).
/// </summary>
public class AttendanceRequestDto
{
    public required Guid EventId { get; set; }
    public AttendanceStatus? Status { get; set; }
    public string? Notes { get; set; }
}

/// <summary>
/// DTO for QR code token generation.
/// </summary>
public class QrTokenDto
{
    /// <summary>
    /// The generated secure token.
    /// </summary>
    public string Token { get; set; } = string.Empty;

    /// <summary>
    /// When the token expires.
    /// </summary>
    public DateTime ExpiresAt { get; set; }
}

/// <summary>
/// Request DTO for validating a QR code token.
/// </summary>
public class CheckInQrRequestDto
{
    /// <summary>
    /// The scanned token.
    /// </summary>
    public required string Token { get; set; }
}

/// <summary>
/// DTO for attendance statistics.
/// </summary>
public class AttendanceStatisticsDto
{
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string RegisterName { get; set; } = string.Empty;
    
    /// <summary>
    /// Total events user was expected to attend.
    /// </summary>
    public int TotalEvents { get; set; }

    /// <summary>
    /// Count of confirmed attendances (Present + Confirmed).
    /// </summary>
    public int PresentCount { get; set; }

    /// <summary>
    /// Count of excused absences (Declined).
    /// </summary>
    public int ExcusedCount { get; set; }

    /// <summary>
    /// Count of unexcused absences.
    /// </summary>
    public int UnexcusedCount { get; set; }

    /// <summary>
    /// Participation percentage (Present / Total).
    /// </summary>
    public double ParticipationRate { get; set; }
}

/// <summary>
/// Response DTO for register availability check.
/// </summary>
public class RegisterAvailabilityDto
{
    public Guid RegisterId { get; set; }
    public string RegisterName { get; set; } = string.Empty;
    public int MaxParticipants { get; set; }
    public int CurrentParticipants { get; set; }
    public int AvailableSlots => MaxParticipants - CurrentParticipants;
    public bool IsAvailable => AvailableSlots > 0;
}

/// <summary>
/// Response DTO for event attendance summary.
/// </summary>
public class EventAttendanceSummaryDto
{
    public Guid EventId { get; set; }
    public string EventTitle { get; set; } = string.Empty;
    public int TotalConfirmed { get; set; }
    public int TotalPresent { get; set; }
    public int TotalDeclined { get; set; }
    public int TotalPending { get; set; }
    public int TotalUnexcused { get; set; }
    public List<RegisterAvailabilityDto> RegisterAvailability { get; set; } = new();
}
