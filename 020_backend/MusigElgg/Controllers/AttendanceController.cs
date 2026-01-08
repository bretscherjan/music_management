using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using MusigElgg.Data;
using MusigElgg.Data.Entities;
using MusigElgg.Data.Enums;
using MusigElgg.DTOs.Attendance;
using MusigElgg.Services;


namespace MusigElgg.Controllers;

/// <summary>
/// Controller for event attendance and RSVP operations.
/// Includes register-based participant limit validation.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[Authorize]
public class AttendanceController : ControllerBase
{
    private readonly MusigElggDbContext _context;
    private readonly QrCodeService _qrCodeService;
    private readonly AttendanceStatisticsService _statsService;

    public AttendanceController(
        MusigElggDbContext context,
        QrCodeService qrCodeService,
        AttendanceStatisticsService statsService)
    {
        _context = context;
        _qrCodeService = qrCodeService;
        _statsService = statsService;
    }

    /// <summary>
    /// Gets attendance list for an event.
    /// </summary>
    [HttpGet("event/{eventId}")]
    [ProducesResponseType(typeof(IEnumerable<AttendanceResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IEnumerable<AttendanceResponseDto>>> GetEventAttendance(Guid eventId)
    {
        var evt = await _context.Events.FindAsync(eventId);
        if (evt == null) return NotFound();

        var participants = await _context.EventParticipants
            .Where(p => p.EventId == eventId)
            .Include(p => p.User)
                .ThenInclude(u => u.Register)
            .ToListAsync();

        return Ok(participants.Select(p => new AttendanceResponseDto
        {
            EventId = p.EventId,
            UserId = p.UserId,
            UserName = $"{p.User.FirstName} {p.User.LastName}",
            RegisterName = p.User.Register?.Name,
            Status = p.Status,
            RegisteredAt = p.RegisteredAt,
            ConfirmedAt = p.ConfirmedAt,
            Notes = p.Notes
        }));
    }

    /// <summary>
    /// Gets attendance summary for an event including register availability.
    /// </summary>
    [HttpGet("event/{eventId}/summary")]
    [ProducesResponseType(typeof(EventAttendanceSummaryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<EventAttendanceSummaryDto>> GetEventSummary(Guid eventId)
    {
        var evt = await _context.Events
            .Include(e => e.RegisterLimits)
                .ThenInclude(rl => rl.Register)
            .Include(e => e.Participants)
                .ThenInclude(p => p.User)
            .FirstOrDefaultAsync(e => e.Id == eventId);

        if (evt == null) return NotFound();

        var confirmedParticipants = evt.Participants
            .Where(p => p.Status == AttendanceStatus.Confirmed)
            .ToList();

        var registerAvailability = evt.RegisterLimits.Select(rl =>
        {
            var currentCount = confirmedParticipants
                .Count(p => p.User.RegisterId == rl.RegisterId);

            return new RegisterAvailabilityDto
            {
                RegisterId = rl.RegisterId,
                RegisterName = rl.Register.Name,
                MaxParticipants = rl.MaxParticipants,
                CurrentParticipants = currentCount
            };
        }).ToList();

        return Ok(new EventAttendanceSummaryDto
        {
            EventId = evt.Id,
            EventTitle = evt.Title,
            TotalConfirmed = evt.Participants.Count(p => p.Status == AttendanceStatus.Confirmed),
            TotalPresent = evt.Participants.Count(p => p.Status == AttendanceStatus.Present),
            TotalDeclined = evt.Participants.Count(p => p.Status == AttendanceStatus.Declined),
            TotalPending = evt.Participants.Count(p => p.Status == AttendanceStatus.Pending),
            TotalUnexcused = evt.Participants.Count(p => p.Status == AttendanceStatus.Unexcused),
            RegisterAvailability = registerAvailability
        });
    }

    /// <summary>
    /// Registers attendance (RSVP) for the current user.
    /// Validates against register limits if defined.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(AttendanceResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AttendanceResponseDto>> RegisterAttendance([FromBody] AttendanceRequestDto dto)
    {
        // Get current user
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
        {
            return Unauthorized();
        }

        var user = await _context.Users
            .Include(u => u.Register)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null) return Unauthorized();

        var evt = await _context.Events
            .Include(e => e.RegisterLimits)
            .Include(e => e.Participants)
                .ThenInclude(p => p.User)
            .FirstOrDefaultAsync(e => e.Id == dto.EventId);

        if (evt == null) return NotFound("Event not found.");

        // Check if event is in draft mode
        if (evt.IsDraft)
        {
            return BadRequest("Cannot register for a draft event.");
        }

        // Default to Confirmed if not specified (legacy behavior for self-registration)
        var status = dto.Status ?? AttendanceStatus.Confirmed;

        // Check overall participant limit
        if (status == AttendanceStatus.Confirmed && evt.MaxParticipants.HasValue)
        {
            var currentConfirmed = evt.Participants.Count(p => p.Status == AttendanceStatus.Confirmed || p.Status == AttendanceStatus.Present);
            if (currentConfirmed >= evt.MaxParticipants.Value)
            {
                return BadRequest("Event has reached maximum participant capacity.");
            }
        }

        // Check register-specific limit if user has a register and limit is defined
        if (status == AttendanceStatus.Confirmed && user.RegisterId.HasValue)
        {
            var registerLimit = evt.RegisterLimits
                .FirstOrDefault(rl => rl.RegisterId == user.RegisterId.Value);

            if (registerLimit != null)
            {
                var currentRegisterCount = evt.Participants
                    .Count(p => (p.Status == AttendanceStatus.Confirmed || p.Status == AttendanceStatus.Present) && p.User.RegisterId == user.RegisterId);

                if (currentRegisterCount >= registerLimit.MaxParticipants)
                {
                    return BadRequest($"Register '{user.Register?.Name}' has reached its maximum capacity ({registerLimit.MaxParticipants}) for this event.");
                }
            }
        }

        // Check if already registered
        var existing = await _context.EventParticipants
            .FirstOrDefaultAsync(p => p.EventId == dto.EventId && p.UserId == userId);

        if (existing != null)
        {
            // Update existing registration
            existing.Status = status;
            existing.Notes = dto.Notes;
            if (status == AttendanceStatus.Confirmed)
            {
                existing.ConfirmedAt = DateTime.UtcNow;
            }
        }
        else
        {
            // Create new registration
            existing = new EventParticipant
            {
                EventId = dto.EventId,
                UserId = userId,
                Status = status,
                Notes = dto.Notes,
                RegisteredAt = DateTime.UtcNow,
                ConfirmedAt = status == AttendanceStatus.Confirmed ? DateTime.UtcNow : null
            };
            _context.EventParticipants.Add(existing);
        }

        await _context.SaveChangesAsync();

        return Ok(new AttendanceResponseDto
        {
            EventId = existing.EventId,
            UserId = existing.UserId,
            UserName = $"{user.FirstName} {user.LastName}",
            RegisterName = user.Register?.Name,
            Status = existing.Status,
            RegisteredAt = existing.RegisteredAt,
            ConfirmedAt = existing.ConfirmedAt,
            Notes = existing.Notes
        });
    }

    /// <summary>
    /// Cancels attendance for the current user.
    /// </summary>
    [HttpDelete("event/{eventId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CancelAttendance(Guid eventId)
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
        {
            return Unauthorized();
        }

        var existing = await _context.EventParticipants
            .FirstOrDefaultAsync(p => p.EventId == eventId && p.UserId == userId);

        if (existing == null) return NotFound();

        _context.EventParticipants.Remove(existing);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    /// <summary>
    /// Gets my attendance status for an event.
    /// </summary>
    [HttpGet("event/{eventId}/my-status")]
    [ProducesResponseType(typeof(AttendanceResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AttendanceResponseDto>> GetMyStatus(Guid eventId)
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
        {
            return Unauthorized();
        }

        var participation = await _context.EventParticipants
            .Include(p => p.User)
                .ThenInclude(u => u.Register)
            .FirstOrDefaultAsync(p => p.EventId == eventId && p.UserId == userId);

        if (participation == null) return NotFound();

        return Ok(new AttendanceResponseDto
        {
            EventId = participation.EventId,
            UserId = participation.UserId,
            UserName = $"{participation.User.FirstName} {participation.User.LastName}",
            RegisterName = participation.User.Register?.Name,
            Status = participation.Status,
            RegisteredAt = participation.RegisteredAt,
            ConfirmedAt = participation.ConfirmedAt,
            Notes = participation.Notes
        });
    }

    /// <summary>
    /// Generates a QR code token for an event.
    /// </summary>
    /// <param name="eventId">Event ID</param>
    /// <param name="validityMinutes">Token validity (default 60)</param>
    [HttpPost("event/{eventId}/token")]
    [ProducesResponseType(typeof(QrTokenDto), StatusCodes.Status200OK)]
    public ActionResult<QrTokenDto> GenerateToken(Guid eventId, [FromQuery] int validityMinutes = 60)
    {
        // TODO: Validate admin rights
        var expiry = DateTime.UtcNow.AddMinutes(validityMinutes);
        var token = _qrCodeService.GenerateToken(eventId, TimeSpan.FromMinutes(validityMinutes));

        return Ok(new QrTokenDto
        {
            Token = token,
            ExpiresAt = expiry
        });
    }

    /// <summary>
    /// Checks in a user via QR code token.
    /// </summary>
    [HttpPost("checkin-qr")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CheckInQr([FromBody] CheckInQrRequestDto dto)
    {
        var eventId = _qrCodeService.ValidateToken(dto.Token);
        if (eventId == null)
        {
            return BadRequest("Invalid or expired token.");
        }

        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
        {
            return Unauthorized();
        }

        var participant = await _context.EventParticipants
            .FirstOrDefaultAsync(p => p.EventId == eventId.Value && p.UserId == userId);

        if (participant != null)
        {
            participant.Status = AttendanceStatus.Present;
            participant.ConfirmedAt = DateTime.UtcNow;
            _context.EventParticipants.Update(participant);
        }
        else
        {
            var newParticipant = new EventParticipant
            {
                EventId = eventId.Value,
                UserId = userId,
                Status = AttendanceStatus.Present,
                RegisteredAt = DateTime.UtcNow,
                ConfirmedAt = DateTime.UtcNow
            };
            _context.EventParticipants.Add(newParticipant);
        }

        await _context.SaveChangesAsync();
        return Ok(new { Message = "Check-in successful" });
    }

    /// <summary>
    /// Gets attendance statistics for a year.
    /// </summary>
    [HttpGet("statistics/{year}")]
    [ProducesResponseType(typeof(List<AttendanceStatisticsDto>), StatusCodes.Status200OK)]
    [EndpointName("GetStatistics")]
    public async Task<ActionResult<List<AttendanceStatisticsDto>>> GetStatistics(int year)
    {
        var stats = await _statsService.GetStatisticsAsync(year);
        return Ok(stats);
    }

    /// <summary>
    /// Exports attendance statistics as CSV.
    /// </summary>
    [HttpGet("statistics/{year}/export")]
    [Produces("text/csv")]
    [ProducesResponseType(typeof(FileResult), StatusCodes.Status200OK)]
    [EndpointName("ExportStatistics")]
    public async Task<IActionResult> ExportStatistics(int year)
    {
        var csvBytes = await _statsService.GenerateCsvExportAsync(year);
        return File(csvBytes, "text/csv", $"attendance_stats_{year}.csv");
    }
    /// <summary>
    /// Updates attendance status for a specific user (Admin only).
    /// </summary>
    [HttpPut("event/{eventId}/user/{userId}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(AttendanceResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [EndpointName("UpdateUserAttendance")]
    public async Task<ActionResult<AttendanceResponseDto>> UpdateUserAttendance(Guid eventId, Guid userId, [FromBody] AttendanceRequestDto dto)
    {
        var evt = await _context.Events.FindAsync(eventId);
        if (evt == null) return NotFound("Event not found.");

        var user = await _context.Users.Include(u => u.Register).FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return NotFound("User not found.");

        var existing = await _context.EventParticipants
            .FirstOrDefaultAsync(p => p.EventId == eventId && p.UserId == userId);

        if (existing != null)
        {
            existing.Status = dto.Status ?? existing.Status;
            existing.Notes = dto.Notes ?? existing.Notes;
            if (dto.Status == AttendanceStatus.Confirmed || dto.Status == AttendanceStatus.Present)
            {
                existing.ConfirmedAt = existing.ConfirmedAt ?? DateTime.UtcNow;
            }
        }
        else
        {
            existing = new EventParticipant
            {
                EventId = eventId,
                UserId = userId,
                Status = dto.Status ?? AttendanceStatus.Pending,
                Notes = dto.Notes,
                RegisteredAt = DateTime.UtcNow,
                ConfirmedAt = (dto.Status == AttendanceStatus.Confirmed || dto.Status == AttendanceStatus.Present) ? DateTime.UtcNow : null
            };
            _context.EventParticipants.Add(existing);
        }

        await _context.SaveChangesAsync();

        return Ok(new AttendanceResponseDto
        {
            EventId = existing.EventId,
            UserId = existing.UserId,
            UserName = $"{user.FirstName} {user.LastName}",
            RegisterName = user.Register?.Name,
            Status = existing.Status,
            RegisteredAt = existing.RegisteredAt,
            ConfirmedAt = existing.ConfirmedAt,
            Notes = existing.Notes
        });
    }
}
