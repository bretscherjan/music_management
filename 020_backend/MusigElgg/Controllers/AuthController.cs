using Microsoft.AspNetCore.Mvc;
using MusigElgg.DTOs.Auth;
using MusigElgg.Services;

namespace MusigElgg.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class AuthController : ControllerBase
{
    private readonly AuthService _authService;

    public AuthController(AuthService authService)
    {
        _authService = authService;
    }

    /// <summary>
    /// Logs in a user.
    /// </summary>
    [HttpPost("login")]
    [ProducesResponseType(typeof(LoginResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<LoginResponseDto>> Login([FromBody] LoginRequestDto dto)
    {
        var user = await _authService.ValidateUserAsync(dto.Email, dto.Password);
        if (user == null)
        {
            return Unauthorized("Invalid email or password.");
        }

        if (!user.IsActive)
        {
            return Unauthorized("Account is inactive.");
        }

        var token = _authService.GenerateJwtToken(user);
        
        return Ok(new LoginResponseDto
        {
            Token = token,
            User = new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Role = user.Role.ToString(),
                RegisterName = user.Register?.Name
            }
        });
    }

    /// <summary>
    /// Registers a new user (Pending approval).
    /// </summary>
    [HttpPost("register")]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<UserDto>> Register([FromBody] RegisterRequestDto dto)
    {
        try
        {
            var user = await _authService.RegisterUserAsync(dto.Email, dto.Password, dto.FirstName, dto.LastName, dto.Instrument);
            
            return CreatedAtAction(nameof(Login), new { }, new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Role = user.Role.ToString()
            });
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }
}
