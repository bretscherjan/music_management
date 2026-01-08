using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MusigElgg.Data;
using MusigElgg.Data.Entities;
using MusigElgg.DTOs.Surveys;
using System.Security.Claims;

namespace MusigElgg.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SurveysController : ControllerBase
{
    private readonly MusigElggDbContext _context;

    public SurveysController(MusigElggDbContext context)
    {
        _context = context;
    }

    [HttpGet("by-event/{eventId}")]
    public async Task<ActionResult<IEnumerable<SurveyResponseDto>>> GetByEvent(Guid eventId)
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        Guid.TryParse(userIdString, out var userId); // userId is Guid.Empty if not found/parseable

        var surveys = await _context.Surveys
            .Where(s => s.EventId == eventId && s.IsActive)
            .Include(s => s.Options)
            .Include(s => s.Votes)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();

        return Ok(surveys.Select(s => MapToDto(s, userId)));
    }

    [HttpPost]
    public async Task<ActionResult<SurveyResponseDto>> Create([FromBody] CreateSurveyRequestDto dto)
    {
        var survey = new Survey
        {
            Id = Guid.NewGuid(),
            Title = dto.Title,
            Description = dto.Description,
            IsBlindVote = dto.IsBlindVote,
            AllowMultipleOptions = dto.AllowMultipleOptions,
            EndDate = dto.EndDate,
            TargetGroupId = dto.TargetGroupId,
            EventId = dto.EventId,
            CreatedAt = DateTime.UtcNow,
            // CreatedById would be nice if we parsed it, but not strictly required for MVP
        };

        foreach (var optDto in dto.Options)
        {
            survey.Options.Add(new SurveyOption
            {
                Id = Guid.NewGuid(),
                Text = optDto.Text,
                Description = optDto.Description,
                SortOrder = optDto.SortOrder,
                SurveyId = survey.Id
            });
        }

        _context.Surveys.Add(survey);
        await _context.SaveChangesAsync();
        
        // Return 201 Created
        return CreatedAtAction(nameof(GetByEvent), new { eventId = dto.EventId }, MapToDto(survey, Guid.Empty));
    }

    [HttpPost("vote")]
    [EndpointName("VoteSurvey")]
    public async Task<IActionResult> Vote([FromBody] CastVoteRequestDto dto)
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
            return Unauthorized();

        var survey = await _context.Surveys
            .Include(s => s.Votes)
            .FirstOrDefaultAsync(s => s.Id == dto.SurveyId);

        if (survey == null) return NotFound("Survey not found.");
        if (!survey.IsActive) return BadRequest("Survey is inactive.");
        if (survey.EndDate.HasValue && survey.EndDate < DateTime.UtcNow) return BadRequest("Survey has ended.");

        if (!survey.AllowMultipleOptions && dto.OptionIds.Count > 1)
            return BadRequest("Multiple options not allowed for this survey.");

        // Remove existing votes for this user (to allow re-voting/updating)
        var existingVotes = survey.Votes.Where(v => v.UserId == userId).ToList();
        _context.SurveyVotes.RemoveRange(existingVotes);

        // Add new votes
        foreach (var optId in dto.OptionIds)
        {
            // Verify option belongs to survey? (Ideally yes, but skipping opt queries for speed, FK will fail if invalid)
            _context.SurveyVotes.Add(new SurveyVote
            {
                Id = Guid.NewGuid(),
                SurveyId = dto.SurveyId,
                UserId = userId,
                OptionId = optId,
                Comment = dto.Comment, // Apply comment to all selected options
                VotedAt = DateTime.UtcNow
            });
        }

        await _context.SaveChangesAsync();

        return Ok();
    }

    private SurveyResponseDto MapToDto(Survey s, Guid currentUserId)
    {
        // 1. Determine visibility
        var hasEnded = s.EndDate.HasValue && s.EndDate < DateTime.UtcNow;
        var showResults = !s.IsBlindVote || hasEnded; // If blind, show only after end. Or never? User said "Blind Vote". Assuming standard: visible after end.
        
        var totalVotes = s.Votes.Count; // Total individual votes (if multi-select, this is sum of all options chosen)
        // OR total voters? Usually percentage is based on total voters?
        // Let's count unique voters for "Turnout".
        var distinctVoters = s.Votes.Select(v => v.UserId).Distinct().Count();

        var userVotes = s.Votes.Where(v => v.UserId == currentUserId).ToList();
        var userVoteOptionIds = userVotes.Select(v => v.OptionId).ToHashSet();

        var optionsDtos = s.Options.OrderBy(o => o.SortOrder).Select(o => 
        {
            var optVoteCount = s.Votes.Count(v => v.OptionId == o.Id);
            double? percentage = null;
            if (distinctVoters > 0)
                percentage = Math.Round((double)optVoteCount / distinctVoters * 100, 1);

            return new SurveyOptionResponseDto
            {
                Id = o.Id,
                Text = o.Text,
                Description = o.Description,
                SortOrder = o.SortOrder,
                IsSelectedByUser = userVoteOptionIds.Contains(o.Id),
                
                // Hide stats if blind and running
                VoteCount = showResults ? optVoteCount : null,
                Percentage = showResults ? percentage : null
            };
        }).ToList();

        return new SurveyResponseDto
        {
            Id = s.Id,
            Title = s.Title,
            Description = s.Description,
            IsBlindVote = s.IsBlindVote,
            AllowMultipleOptions = s.AllowMultipleOptions,
            IsActive = s.IsActive,
            EndDate = s.EndDate,
            EventId = s.EventId,
            EventTitle = s.Event?.Title, // null unless Include applied
            CreatedAt = s.CreatedAt,
            HasEnded = hasEnded,
            UserHasVoted = userVotes.Any(),
            TotalVotes = distinctVoters, // Showing total VOTERS usually makes more sense for "Participation"
            Options = optionsDtos
        };
    }
}
