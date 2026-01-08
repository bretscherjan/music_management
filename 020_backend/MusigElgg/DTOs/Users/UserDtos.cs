using MusigElgg.Data.Enums;

namespace MusigElgg.DTOs.Users;

/// <summary>
/// Response DTO for User entity.
/// </summary>
public class UserResponseDto
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName => $"{FirstName} {LastName}";
    public UserRole Role { get; set; }
    public bool IsActive { get; set; }
    public string? PhoneNumber { get; set; }
    public Guid? RegisterId { get; set; }
    public string? RegisterName { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

/// <summary>
/// Request DTO for creating a user.
/// </summary>
public class CreateUserRequestDto
{
    public required string Email { get; set; }
    public required string FirstName { get; set; }
    public required string LastName { get; set; }
    public UserRole Role { get; set; } = UserRole.Member;
    public string? PhoneNumber { get; set; }
    public Guid? RegisterId { get; set; }
}

/// <summary>
/// Request DTO for updating a user.
/// </summary>
public class UpdateUserRequestDto
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public UserRole? Role { get; set; }
    public bool? IsActive { get; set; }
    public string? PhoneNumber { get; set; }
    public Guid? RegisterId { get; set; }
}
