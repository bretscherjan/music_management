using System.ComponentModel.DataAnnotations;

namespace MusigElgg.Data.Entities;

/// <summary>
/// Represents a historical event or chronicle entry for the association.
/// </summary>
public class AssociationHistory
{
    public Guid Id { get; set; }

    [Required]
    public int Year { get; set; }

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string? ImageUrl { get; set; }
}
