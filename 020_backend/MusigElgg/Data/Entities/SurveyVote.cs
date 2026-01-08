using System.ComponentModel.DataAnnotations;

namespace MusigElgg.Data.Entities;

/// <summary>
/// Represents a vote cast by a user in a survey.
/// </summary>
public class SurveyVote
{
    public Guid Id { get; set; }

    public Guid SurveyId { get; set; }
    public virtual Survey Survey { get; set; } = null!;

    public Guid UserId { get; set; }
    public virtual User User { get; set; } = null!;

    public Guid OptionId { get; set; }
    public virtual SurveyOption Option { get; set; } = null!;

    /// <summary>
    /// Optional comment explaining the vote (qualitative feedback).
    /// </summary>
    [MaxLength(1000)]
    public string? Comment { get; set; }

    public DateTime VotedAt { get; set; } = DateTime.UtcNow;
}
