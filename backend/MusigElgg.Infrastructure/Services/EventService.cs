using MusigElgg.Domain.Dtos;
using MusigElgg.Domain;
using MusigElgg.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace MusigElgg.Infrastructure.Services
{
    public interface IEventService
    {
        Task<IEnumerable<EventDto>> GetAllAsync(bool futureOnly);
        Task<EventDto?> GetByIdAsync(int id);
        Task<EventDto> CreateAsync(CreateEventDto dto);
        Task SetAttendanceAsync(int eventId, int userId, string status, string comment);
        Task<IEnumerable<AttendanceDto>> GetAttendanceAsync(int eventId);
    }

    public class EventService : IEventService
    {
        private readonly AppDbContext _context;

        public EventService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<EventDto>> GetAllAsync(bool futureOnly)
        {
            var query = _context.Events.AsQueryable();
            
            if (futureOnly)
            {
                query = query.Where(e => e.StartTime >= DateTime.Now);
            }
            
            query = query.OrderBy(e => e.StartTime);

            return await query.Select(e => new EventDto
            {
                Id = e.Id,
                Title = e.Title, 
                Description = e.Description,
                Location = e.Location,
                StartTime = e.StartTime,
                EndTime = e.EndTime,
                Type = e.Type,
                Clothing = e.Clothing,
                RegistrationDeadline = e.RegistrationDeadline
            }).ToListAsync();
        }

        public async Task<EventDto?> GetByIdAsync(int id)
        {
            var e = await _context.Events.FindAsync(id);
            if (e == null) return null;

            return new EventDto
            {
                Id = e.Id,
                Title = e.Title,
                Description = e.Description,
                Location = e.Location,
                StartTime = e.StartTime,
                EndTime = e.EndTime,
                Type = e.Type,
                Clothing = e.Clothing,
                RegistrationDeadline = e.RegistrationDeadline
            };
        }

        public async Task<EventDto> CreateAsync(CreateEventDto dto)
        {
            var entity = new Event
            {
                Title = dto.Title,
                Description = dto.Description,
                Location = dto.Location,
                StartTime = dto.StartTime,
                EndTime = dto.EndTime ?? dto.StartTime.AddHours(2), // Default duration if null
                Type = dto.Type,
                Clothing = dto.Clothing,
                RegistrationDeadline = dto.RegistrationDeadline
            };

            _context.Events.Add(entity);
            await _context.SaveChangesAsync();

            return new EventDto
            {
                Id = entity.Id,
                Title = entity.Title,
                Description = entity.Description,
                Location = entity.Location,
                StartTime = entity.StartTime,
                EndTime = entity.EndTime,
                Type = entity.Type,
                Clothing = entity.Clothing,
                RegistrationDeadline = entity.RegistrationDeadline
            };
        }

        public async Task SetAttendanceAsync(int eventId, int userId, string status, string comment)
        {
            if (!Enum.TryParse<AttendanceStatus>(status, true, out var attendanceStatus))
            {
                // Fallback or throw? For now default to Unknown or handle error.
                // Let's assume frontend sends valid strings.
                attendanceStatus = AttendanceStatus.Unanswered;
            }

            var attendance = await _context.Attendances
                .FirstOrDefaultAsync(a => a.EventId == eventId && a.UserId == userId);

            if (attendance == null)
            {
                attendance = new Attendance
                {
                    EventId = eventId,
                    UserId = userId,
                    Status = attendanceStatus,
                    Comment = comment,
                    UpdatedAt = DateTime.Now
                };
                _context.Attendances.Add(attendance);
            }
            else
            {
                attendance.Status = attendanceStatus;
                attendance.Comment = comment;
                attendance.UpdatedAt = DateTime.Now;
            }

            await _context.SaveChangesAsync();
        }

        public async Task<IEnumerable<AttendanceDto>> GetAttendanceAsync(int eventId)
        {
            return await _context.Attendances
                .Where(a => a.EventId == eventId)
                .Include(a => a.User)
                .Select(a => new AttendanceDto
                {
                    UserId = a.UserId,
                    UserName = a.User.FirstName + " " + a.User.LastName,
                    Instrument = a.User.Instrument,
                    Status = a.Status.ToString(),
                    Comment = a.Comment
                })
                .ToListAsync();
        }
    }
}
