using System.Text.Json.Serialization;

namespace MusigElgg.Domain;

public class Event
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty; // Rehearsal, Concert
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string Location { get; set; } = string.Empty;
    public string Clothing { get; set; } = string.Empty;
    public DateTime RegistrationDeadline { get; set; }

    [JsonIgnore]
    public ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();
}
