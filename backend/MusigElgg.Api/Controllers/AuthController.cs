using Microsoft.AspNetCore.Mvc;
using MusigElgg.Domain.Dtos;
using MusigElgg.Domain;
using MusigElgg.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using MusigElgg.Infrastructure.Services;

namespace MusigElgg.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    [ProducesResponseType(typeof(TokenDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginDto login)
    {
        try
        {
            var user = await _authService.LoginAsync(login.Email, login.Password);

            if (user == null)
            {
                return Unauthorized("Invalid credentials");
            }

            // Mock Token generation
            return Ok(new TokenDto 
            { 
                AccessToken = "mock_access_token_" + user.Id, 
                RefreshToken = "mock_refresh_token_" + user.Id 
            });
        }
        catch (Exception ex)
        {
            return BadRequest($"Login Failed: {ex.Message} {ex.StackTrace}");
        }
    }

    [HttpGet("me")]
    [ProducesResponseType(typeof(UserDetailDto), StatusCodes.Status200OK)]
    public IActionResult GetMe()
    {
        // Mock implementation until proper JWT Middleware is active
        return Ok(new UserDetailDto 
        { 
            Id = 1, 
            Email = "admin@musigelgg.ch", 
            FirstName = "Admin", 
            LastName = "User", 
            Roles = new List<string> { "Admin", "Board" } 
        });
    }
}
