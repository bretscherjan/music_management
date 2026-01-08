namespace MusigElgg.DTOs.Communication;

public class EventPostDto
{
    public Guid Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public Guid AuthorId { get; set; }
    public string AuthorName { get; set; } = string.Empty; // Simplified
    public Guid EventId { get; set; }
}

public class CreateEventPostDto
{
    public required string Content { get; set; }
    public Guid EventId { get; set; }
}

public class SurveyDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsBlindVote { get; set; }
    public bool IsActive { get; set; }
    public Guid? EventId { get; set; }
    public List<SurveyOptionDto> Options { get; set; } = new();
    public bool HasVoted { get; set; } // Current user
    public Dictionary<Guid, int>? Results { get; set; } // Only if not blind or if user is admin/voted?
}

public class SurveyOptionDto
{
    public Guid Id { get; set; }
    public string Text { get; set; } = string.Empty;
}

public class CreateSurveyDto
{
    public required string Title { get; set; }
    public string? Description { get; set; }
    public bool IsBlindVote { get; set; }
    public Guid? EventId { get; set; }
    public List<string> Options { get; set; } = new();
}

public class VoteSurveyDto
{
    public Guid OptionId { get; set; }
}
