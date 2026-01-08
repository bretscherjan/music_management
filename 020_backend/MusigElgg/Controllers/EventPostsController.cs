using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MusigElgg.Data;
using MusigElgg.Data.Entities;
using MusigElgg.DTOs.Communication;
using System.Security.Claims;

namespace MusigElgg.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EventPostsController : ControllerBase
{
    private readonly MusigElggDbContext _context;

    public EventPostsController(MusigElggDbContext context)
    {
        _context = context;
    }

    [HttpGet("by-event/{eventId}")]
    public async Task<ActionResult<IEnumerable<EventPostDto>>> GetByEvent(Guid eventId)
    {
        var posts = await _context.EventPosts
            .Where(p => p.EventId == eventId)
            .Include(p => p.Author)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        return Ok(posts.Select(p => new EventPostDto
        {
            Id = p.Id,
            Content = p.Content,
            CreatedAt = p.CreatedAt,
            AuthorId = p.AuthorId,
            AuthorName = $"{p.Author.FirstName} {p.Author.LastName}",
            EventId = p.EventId
        }));
    }

    [HttpPost]
    public async Task<ActionResult<EventPostDto>> Create([FromBody] CreateEventPostDto dto)
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
            // For testing, fallback or error.
            return Unauthorized();

        var post = new EventPost
        {
            Id = Guid.NewGuid(),
            Content = dto.Content,
            EventId = dto.EventId,
            AuthorId = userId,
            CreatedAt = DateTime.UtcNow
        };

        _context.EventPosts.Add(post);
        await _context.SaveChangesAsync();

        // Load author for DTO
        var author = await _context.Users.FindAsync(userId);
        
        return CreatedAtAction(nameof(GetByEvent), new { eventId = dto.EventId }, new EventPostDto
        {
            Id = post.Id,
            Content = post.Content,
            CreatedAt = post.CreatedAt,
            AuthorId = post.AuthorId,
            AuthorName = author != null ? $"{author.FirstName} {author.LastName}" : "Unknown",
            EventId = post.EventId
        });
    }
}
