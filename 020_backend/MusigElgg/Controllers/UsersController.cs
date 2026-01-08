using Microsoft.AspNetCore.Mvc;
using MusigElgg.Data.Entities;
using MusigElgg.Data.Enums;
using MusigElgg.DTOs.Users;
using MusigElgg.Repositories;

using Microsoft.AspNetCore.Authorization;

namespace MusigElgg.Controllers;

/// <summary>
/// Controller for user management operations.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IUserRepository _userRepository;

    public UsersController(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    /// <summary>
    /// Gets all users.
    /// </summary>
    /// <returns>List of all users.</returns>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<UserResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<UserResponseDto>>> GetAll()
    {
        var users = await _userRepository.GetAllAsync();
        return Ok(users.Select(MapToDto));
    }

    /// <summary>
    /// Gets a specific user by ID.
    /// </summary>
    /// <param name="id">The user ID.</param>
    /// <returns>The user if found.</returns>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(UserResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UserResponseDto>> GetById(Guid id)
    {
        var user = await _userRepository.GetByIdAsync(id);
        if (user == null)
            return NotFound();

        return Ok(MapToDto(user));
    }

    /// <summary>
    /// Gets users by role.
    /// </summary>
    /// <param name="role">The role to filter by.</param>
    /// <returns>List of users with the specified role.</returns>
    [HttpGet("by-role/{role}")]
    [ProducesResponseType(typeof(IEnumerable<UserResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<UserResponseDto>>> GetByRole(UserRole role)
    {
        var users = await _userRepository.GetByRoleAsync(role);
        return Ok(users.Select(MapToDto));
    }

    /// <summary>
    /// Creates a new user.
    /// </summary>
    /// <param name="dto">The user data.</param>
    /// <returns>The created user.</returns>
    [HttpPost]
    [ProducesResponseType(typeof(UserResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<UserResponseDto>> Create([FromBody] CreateUserRequestDto dto)
    {
        if (await _userRepository.ExistsAsync(u => u.Email == dto.Email))
            return BadRequest("A user with this email already exists.");

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = dto.Email,
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            Role = dto.Role,
            PhoneNumber = dto.PhoneNumber,
            RegisterId = dto.RegisterId,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _userRepository.AddAsync(user);
        return CreatedAtAction(nameof(GetById), new { id = user.Id }, MapToDto(user));
    }

    /// <summary>
    /// Updates an existing user.
    /// </summary>
    /// <param name="id">The user ID.</param>
    /// <param name="dto">The updated user data.</param>
    /// <returns>The updated user.</returns>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(UserResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UserResponseDto>> Update(Guid id, [FromBody] UpdateUserRequestDto dto)
    {
        var user = await _userRepository.GetByIdAsync(id);
        if (user == null)
            return NotFound();

        if (dto.FirstName != null) user.FirstName = dto.FirstName;
        if (dto.LastName != null) user.LastName = dto.LastName;
        if (dto.Role.HasValue) user.Role = dto.Role.Value;
        if (dto.IsActive.HasValue) user.IsActive = dto.IsActive.Value;
        if (dto.PhoneNumber != null) user.PhoneNumber = dto.PhoneNumber;
        if (dto.RegisterId.HasValue) user.RegisterId = dto.RegisterId;
        user.UpdatedAt = DateTime.UtcNow;

        await _userRepository.UpdateAsync(user);
        return Ok(MapToDto(user));
    }

    /// <summary>
    /// Deletes a user.
    /// </summary>
    /// <param name="id">The user ID.</param>
    /// <returns>No content if successful.</returns>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var user = await _userRepository.GetByIdAsync(id);
        if (user == null)
            return NotFound();

        await _userRepository.DeleteAsync(id);
        return NoContent();
    }

    private static UserResponseDto MapToDto(User user) => new()
    {
        Id = user.Id,
        Email = user.Email,
        FirstName = user.FirstName,
        LastName = user.LastName,
        Role = user.Role,
        IsActive = user.IsActive,
        PhoneNumber = user.PhoneNumber,
        RegisterId = user.RegisterId,
        RegisterName = user.Register?.Name,
        CreatedAt = user.CreatedAt,
        UpdatedAt = user.UpdatedAt
    };
}
