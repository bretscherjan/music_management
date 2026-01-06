using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MusigElgg.Domain;
using MusigElgg.Infrastructure.Services;
using System.Security.Claims;

namespace MusigElgg.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PollsController : ControllerBase
{
    private readonly IPollService _pollService;

    public PollsController(IPollService pollService)
    {
        _pollService = pollService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Poll>>> GetAll()
    {
        var polls = await _pollService.GetActivePollsAsync();
        return Ok(polls);
    }

    [HttpPost]
    [Authorize(Roles = "Board,Admin")]
    public async Task<ActionResult<Poll>> Create([FromBody] CreatePollDto dto)
    {
        var poll = await _pollService.CreatePollAsync(dto.Title, dto.Description, dto.DueDate, dto.Options);
        return CreatedAtAction(nameof(GetAll), new { id = poll.Id }, poll);
    }

    [HttpPost("{id}/vote")]
    public async Task<IActionResult> Vote(int id, [FromBody] VoteDto dto)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        await _pollService.VoteAsync(id, dto.OptionId, userId);
        return Ok();
    }
}

public class CreatePollDto
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime DueDate { get; set; }
    public List<string> Options { get; set; } = new List<string>();
}

public class VoteDto
{
    public int OptionId { get; set; }
}
