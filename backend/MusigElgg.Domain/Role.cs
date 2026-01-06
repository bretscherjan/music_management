using System.Text.Json.Serialization;

namespace MusigElgg.Domain;

public class Role
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Level { get; set; }

    public const string Admin = "Admin";
    public const string Board = "Board";
    public const string Member = "Member";
    public const string Candidate = "Candidate";

    [JsonIgnore]
    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
}
