namespace MusigElgg.Domain.Dtos
{
    public class EventDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Location { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public string Type { get; set; } = "Rehearsal"; // Rehearsal, Concert, Meeting
        public string Clothing { get; set; } = string.Empty;
        public DateTime RegistrationDeadline { get; set; }
    }

    public class CreateEventDto
    {
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Location { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public string Type { get; set; } = "Rehearsal";
        public string Clothing { get; set; } = string.Empty;
        public DateTime RegistrationDeadline { get; set; }
    }

    public class SetAttendanceDto
    {
        public string Status { get; set; } = "Unknown"; // Accept, Decline, Maybe
        public string Comment { get; set; } = string.Empty;
    }

    public class AttendanceDto
    {
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string Instrument { get; set; } = string.Empty;
        public string Status { get; set; } = "Unknown";
        public string Comment { get; set; } = string.Empty;
    }
}
