namespace MusigElgg.Domain;

public class RoleChangeRequest
{
    public int Id { get; set; }
    
    public int TargetUserId { get; set; }
    public User TargetUser { get; set; } = null!;
    
    public int NewRoleId { get; set; }
    public Role NewRole { get; set; } = null!;
    
    public int RequestedByUserId { get; set; }
    public User RequestedByUser { get; set; } = null!;
    
    public int? ApprovedByUserId { get; set; }
    public User? ApprovedByUser { get; set; }

    public RequestStatus Status { get; set; } = RequestStatus.Pending;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ProcessedAt { get; set; }
}

public enum RequestStatus
{
    Pending,
    Approved,
    Rejected
}
