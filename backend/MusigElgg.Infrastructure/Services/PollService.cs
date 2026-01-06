using Microsoft.EntityFrameworkCore;
using MusigElgg.Domain;
using MusigElgg.Infrastructure.Persistence;

namespace MusigElgg.Infrastructure.Services;

public class PollService : IPollService
{
    private readonly AppDbContext _context;

    public PollService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Poll>> GetActivePollsAsync()
    {
        return await _context.Polls
            .Include(p => p.Options)
            .ThenInclude(o => o.Votes)
            .Where(p => p.IsActive)
            .ToListAsync();
    }

    public async Task<Poll> CreatePollAsync(string title, string description, DateTime dueDate, List<string> options)
    {
        var poll = new Poll
        {
            Title = title,
            Description = description,
            DueDate = dueDate,
            IsActive = true
        };

        foreach (var optText in options)
        {
            poll.Options.Add(new PollOption { Text = optText });
        }

        _context.Polls.Add(poll);
        await _context.SaveChangesAsync();
        return poll;
    }

    public async Task VoteAsync(int pollId, int optionId, int userId)
    {
        // Check if user already voted in this poll?
        // Need to load poll options to check existing votes for this user in this poll.
        // Assuming database constraint handles unique poll_opt+user, but we want unique poll+user.
        // Current DB context comment said: "Leaving purely Unique Constraint on Option+User for now."
        // We should enforce one vote per poll manually here if possible.

        var existingVote = await _context.PollVotes
            .Include(v => v.PollOption)
            .FirstOrDefaultAsync(v => v.PollOption.PollId == pollId && v.UserId == userId);

        if (existingVote != null)
        {
            // Update vote? Or throw? Let's allow changing vote.
            _context.PollVotes.Remove(existingVote);
        }

        var vote = new PollVote
        {
            PollOptionId = optionId,
            UserId = userId,
            VotedAt = DateTime.UtcNow
        };

        _context.PollVotes.Add(vote);
        await _context.SaveChangesAsync();
    }
    
    public async Task<Poll?> GetPollByIdAsync(int id)
    {
        return await _context.Polls
            .Include(p => p.Options)
            .ThenInclude(o => o.Votes)
            .FirstOrDefaultAsync(p => p.Id == id);
    }
}
