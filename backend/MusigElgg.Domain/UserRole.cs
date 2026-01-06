using System.Text.Json.Serialization;

namespace MusigElgg.Domain;

public class UserRole
{
    public int UserId { get; set; }
    [JsonIgnore]
    public User User { get; set; } = null!;

    public int RoleId { get; set; }
    public Role Role { get; set; } = null!;
}
