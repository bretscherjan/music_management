using System.ComponentModel.DataAnnotations;

namespace MusigElgg.Data.Entities;

/// <summary>
/// Represents a survey (Umfrage) with optional blind voting and multi-select.
/// </summary>
public class Survey
{
    public Guid Id { get; set; }

    /// <summary>
    /// Title of the survey.
    /// </summary>
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Description of the survey.
    /// </summary>
    [MaxLength(2000)]
    public string? Description { get; set; }

    /// <summary>
    /// Whether votes are hidden until EndDate (Blind Vote).
    /// </summary>
    public bool IsBlindVote { get; set; } = false;

    /// <summary>
    /// Whether the survey is active.
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Whether users can select multiple options.
    /// </summary>
    public bool AllowMultipleOptions { get; set; } = false;

    /// <summary>
    /// End date for the survey (votes hidden until then for blind votes).
    /// </summary>
    public DateTime? EndDate { get; set; }

    /// <summary>
    /// Date and time when the survey was created.
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// FK to the user who created the survey.
    /// </summary>
    public Guid? CreatedById { get; set; }

    /// <summary>
    /// FK to the target group (Register). Null = all users.
    /// </summary>
    public Guid? TargetGroupId { get; set; }

    /// <summary>
    /// Optional link to an event.
    /// </summary>
    public Guid? EventId { get; set; }

    // Navigation properties
    public virtual User? CreatedBy { get; set; }
    public virtual Register? TargetGroup { get; set; }
    public virtual Event? Event { get; set; }
    public virtual ICollection<SurveyOption> Options { get; set; } = new List<SurveyOption>();
    public virtual ICollection<SurveyVote> Votes { get; set; } = new List<SurveyVote>();
}
