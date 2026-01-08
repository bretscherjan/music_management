using System.ComponentModel.DataAnnotations;

namespace MusigElgg.Data.Entities;

/// <summary>
/// Represents an option in a survey.
/// </summary>
public class SurveyOption
{
    public Guid Id { get; set; }

    /// <summary>
    /// Text of the option.
    /// </summary>
    [Required]
    [MaxLength(500)]
    public string Text { get; set; } = string.Empty;

    /// <summary>
    /// Optional description for the option.
    /// </summary>
    [MaxLength(1000)]
    public string? Description { get; set; }

    /// <summary>
    /// Sort order for display.
    /// </summary>
    public int SortOrder { get; set; } = 0;

    public Guid SurveyId { get; set; }
    public virtual Survey Survey { get; set; } = null!;

    public virtual ICollection<SurveyVote> Votes { get; set; } = new List<SurveyVote>();
}
