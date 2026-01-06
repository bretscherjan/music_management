using MusigElgg.Domain.Dtos;
using MusigElgg.Domain;

namespace MusigElgg.Infrastructure.Services;

public interface IPollService
{
    Task<IEnumerable<Poll>> GetActivePollsAsync();
    Task<Poll> CreatePollAsync(string title, string description, DateTime dueDate, List<string> options);
    Task VoteAsync(int pollId, int optionId, int userId);
    Task<Poll?> GetPollByIdAsync(int id);
}
