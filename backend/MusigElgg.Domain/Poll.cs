using System.Text.Json.Serialization;

namespace MusigElgg.Domain;

public class Poll
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime DueDate { get; set; }
    public bool IsActive { get; set; }

    public ICollection<PollOption> Options { get; set; } = new List<PollOption>();
}

public class PollOption
{
    public int Id { get; set; }
    public int PollId { get; set; }
    [JsonIgnore]
    public Poll Poll { get; set; } = null!;
    public string Text { get; set; } = string.Empty;

    public ICollection<PollVote> Votes { get; set; } = new List<PollVote>();
}

public class PollVote
{
    public int Id { get; set; }
    public int PollOptionId { get; set; }
    [JsonIgnore]
    public PollOption PollOption { get; set; } = null!;
    
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    
    public DateTime VotedAt { get; set; }
}
