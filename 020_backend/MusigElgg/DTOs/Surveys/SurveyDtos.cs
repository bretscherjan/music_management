namespace MusigElgg.DTOs.Surveys;

/// <summary>
/// Response DTO for a survey.
/// </summary>
public class SurveyResponseDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsBlindVote { get; set; }
    public bool IsActive { get; set; }
    public bool AllowMultipleOptions { get; set; }
    public DateTime? EndDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? CreatedByName { get; set; }
    public string? TargetGroupName { get; set; }
    public Guid? EventId { get; set; }
    public string? EventTitle { get; set; }
    public bool HasEnded { get; set; }
    public bool UserHasVoted { get; set; }
    public int TotalVotes { get; set; }
    public List<SurveyOptionResponseDto> Options { get; set; } = new();
}

/// <summary>
/// Response DTO for a survey option.
/// </summary>
public class SurveyOptionResponseDto
{
    public Guid Id { get; set; }
    public string Text { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int SortOrder { get; set; }

    /// <summary>
    /// Vote count (hidden if blind vote and not ended).
    /// </summary>
    public int? VoteCount { get; set; }

    /// <summary>
    /// Percentage (hidden if blind vote and not ended).
    /// </summary>
    public double? Percentage { get; set; }

    /// <summary>
    /// Whether current user voted for this option.
    /// </summary>
    public bool IsSelectedByUser { get; set; }
}

/// <summary>
/// Request DTO for creating a survey.
/// </summary>
public class CreateSurveyRequestDto
{
    public required string Title { get; set; }
    public string? Description { get; set; }
    public bool IsBlindVote { get; set; } = false;
    public bool AllowMultipleOptions { get; set; } = false;
    public DateTime? EndDate { get; set; }
    public Guid? TargetGroupId { get; set; }
    public Guid? EventId { get; set; }
    public List<CreateSurveyOptionDto> Options { get; set; } = new();
}

/// <summary>
/// Request DTO for creating a survey option.
/// </summary>
public class CreateSurveyOptionDto
{
    public required string Text { get; set; }
    public string? Description { get; set; }
    public int SortOrder { get; set; } = 0;
}

/// <summary>
/// Request DTO for casting a vote.
/// </summary>
public class CastVoteRequestDto
{
    public required Guid SurveyId { get; set; }

    /// <summary>
    /// Option IDs to vote for (multiple if AllowMultipleOptions).
    /// </summary>
    public List<Guid> OptionIds { get; set; } = new();

    /// <summary>
    /// Optional comment explaining the vote.
    /// </summary>
    public string? Comment { get; set; }
}

/// <summary>
/// Response DTO for votes (for results view).
/// </summary>
public class VoteResultDto
{
    public Guid OptionId { get; set; }
    public string OptionText { get; set; } = string.Empty;
    public int VoteCount { get; set; }
    public double Percentage { get; set; }
    public List<VoteCommentDto> Comments { get; set; } = new();
}

/// <summary>
/// DTO for vote comments.
/// </summary>
public class VoteCommentDto
{
    public string? Comment { get; set; }
    public string VoterName { get; set; } = string.Empty;
    public DateTime VotedAt { get; set; }
}
