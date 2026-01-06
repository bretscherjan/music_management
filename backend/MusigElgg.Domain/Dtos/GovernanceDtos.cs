namespace MusigElgg.Domain.Dtos;

public class RoleChangeRequestDto
{
    public int Id { get; set; }
    public int TargetUserId { get; set; }
    public string TargetUserName { get; set; } = string.Empty;
    public int NewRoleId { get; set; }
    public string NewRoleName { get; set; } = string.Empty;
    public int RequestedByUserId { get; set; }
    public string RequestedByName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class CreateRoleRequestDto
{
    public int TargetUserId { get; set; }
    public int NewRoleId { get; set; }
}
