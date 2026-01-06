namespace MusigElgg.Domain;

public class Attendance
{
    public int Id { get; set; }
    public int EventId { get; set; }
    public Event Event { get; set; } = null!;
    
    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public AttendanceStatus Status { get; set; } = AttendanceStatus.Unanswered;
    public string Comment { get; set; } = string.Empty;
    public DateTime UpdatedAt { get; set; }
}

public enum AttendanceStatus
{
    Unanswered,
    Present,
    Absent,
    Excused,
    Maybe
}
