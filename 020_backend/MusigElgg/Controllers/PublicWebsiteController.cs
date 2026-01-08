using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MusigElgg.Data;
using MusigElgg.Data.Entities;
using MusigElgg.DTOs.Events;

namespace MusigElgg.Controllers;

/// <summary>
/// Public API for the website (no authentication required).
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class PublicWebsiteController : ControllerBase
{
    private readonly MusigElggDbContext _context;

    public PublicWebsiteController(MusigElggDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Gets latest public news.
    /// </summary>
    [HttpGet("news")]
    [ProducesResponseType(typeof(IEnumerable<NewsEntry>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<NewsEntry>>> GetNews()
    {
        var news = await _context.NewsEntries
            .Include(n => n.Author)
            .Where(n => n.IsPublic)
            .OrderByDescending(n => n.PublishedAt)
            .Take(10)
            .ToListAsync();

        return Ok(news);
    }

    /// <summary>
    /// Gets upcoming public events (minimal info).
    /// </summary>
    [HttpGet("events")]
    [ProducesResponseType(typeof(IEnumerable<object>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<object>>> GetPublicEvents()
    {
        var events = await _context.Events
            .Where(e => e.IsPublic && !e.IsCancelled && !e.IsDraft && e.EndTime > DateTime.UtcNow)
            .OrderBy(e => e.StartTime)
            .Take(5)
            .Select(e => new
            {
                e.Id,
                e.Title,
                e.StartTime,
                e.Location,
                e.Description // Assuming public description is safe
            })
            .ToListAsync();

        return Ok(events);
    }

    /// <summary>
    /// Gets association history/chronicle.
    /// </summary>
    [HttpGet("history")]
    [ProducesResponseType(typeof(IEnumerable<AssociationHistory>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<AssociationHistory>>> GetHistory()
    {
        var history = await _context.AssociationHistory
            .OrderByDescending(h => h.Year)
            .ToListAsync();

        return Ok(history);
    }
}
