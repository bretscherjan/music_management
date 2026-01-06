using Microsoft.AspNetCore.Mvc;
using MusigElgg.Domain.Dtos;
using MusigElgg.Infrastructure.Services;
using MusigElgg.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace MusigElgg.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GovernanceController : ControllerBase
{
    private readonly RoleChangeRequestService _service;
    private readonly AppDbContext _context;

    public GovernanceController(RoleChangeRequestService service, AppDbContext context)
    {
        _service = service;
        _context = context;
    }

    [HttpGet("requests")]
    [ProducesResponseType(typeof(List<RoleChangeRequestDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRequests()
    {
        var requests = await _context.RoleChangeRequests
            .Include(r => r.TargetUser)
            .Include(r => r.NewRole)
            .Include(r => r.RequestedByUser)
            .Select(r => new RoleChangeRequestDto
            {
                Id = r.Id,
                TargetUserId = r.TargetUserId,
                TargetUserName = $"{r.TargetUser.FirstName} {r.TargetUser.LastName}",
                NewRoleId = r.NewRoleId,
                NewRoleName = r.NewRole.Name,
                RequestedByUserId = r.RequestedByUserId,
                RequestedByName = $"{r.RequestedByUser.FirstName} {r.RequestedByUser.LastName}",
                Status = r.Status.ToString(),
                CreatedAt = r.CreatedAt
            })
            .ToListAsync();

        return Ok(requests);
    }

    [HttpPost("requests")]
    [ProducesResponseType(typeof(RoleChangeRequestDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateRequest([FromBody] CreateRoleRequestDto dto)
    {
        // Mock current user ID (Requester)
        int currentUserId = 1; 

        var request = await _service.CreateRequestAsync(currentUserId, dto.TargetUserId, dto.NewRoleId);
        
        return CreatedAtAction(nameof(GetRequests), new { id = request.Id }, request);
    }

    [HttpPost("requests/{id}/approve")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ApproveRequest(int id)
    {
        // Mock current user ID (Approver)
        int currentUserId = 2; 

        try 
        {
            await _service.ApproveRequestAsync(id, currentUserId);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message }); // 400 for Four-Eyes violation
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }
}
