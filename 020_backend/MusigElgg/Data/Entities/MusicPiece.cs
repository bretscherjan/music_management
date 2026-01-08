using System.ComponentModel.DataAnnotations;

namespace MusigElgg.Data.Entities;

/// <summary>
/// Represents a piece of music in the association's library (Noteninventar).
/// </summary>
public class MusicPiece
{
    /// <summary>
    /// Unique identifier for the music piece.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Inventory number/catalog number (e.g., "NR-001").
    /// </summary>
    [MaxLength(50)]
    public string? CatalogNumber { get; set; }

    /// <summary>
    /// Title of the music piece.
    /// </summary>
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Composer of the music piece.
    /// </summary>
    [MaxLength(150)]
    public string? Composer { get; set; }

    /// <summary>
    /// Arranger of the music piece.
    /// </summary>
    [MaxLength(150)]
    public string? Arranger { get; set; }

    /// <summary>
    /// Publisher of the music piece.
    /// </summary>
    [MaxLength(150)]
    public string? Publisher { get; set; }

    /// <summary>
    /// Genre or style of the music (e.g., "Marsch", "Polka", "Walzer").
    /// </summary>
    [MaxLength(100)]
    public string? Genre { get; set; }

    /// <summary>
    /// Physical storage location (e.g., "Schrank A, Fach 3").
    /// </summary>
    [MaxLength(200)]
    public string? StorageLocation { get; set; }

    /// <summary>
    /// Storage cabinet/shelf (e.g., "A").
    /// </summary>
    [MaxLength(50)]
    public string? StorageCabinet { get; set; }

    /// <summary>
    /// Storage compartment/shelf (e.g., "3").
    /// </summary>
    [MaxLength(50)]
    public string? StorageShelf { get; set; }

    /// <summary>
    /// Instrumentation/orchestration code (Besetzungscode).
    /// Examples: "BL" (Blasmusik), "BL-KL" (Kleine Blasmusik), "BB" (Brass Band)
    /// </summary>
    [MaxLength(50)]
    public string? InstrumentationCode { get; set; }

    /// <summary>
    /// Detailed instrumentation description.
    /// </summary>
    [MaxLength(500)]
    public string? Instrumentation { get; set; }

    /// <summary>
    /// Difficulty level (1-5 scale, where 1=beginner, 5=professional).
    /// </summary>
    public int? DifficultyLevel { get; set; }

    /// <summary>
    /// Difficulty description text (e.g., "Mittelschwer", "Grade 3").
    /// </summary>
    [MaxLength(50)]
    public string? DifficultyDescription { get; set; }

    /// <summary>
    /// Duration in seconds.
    /// </summary>
    public int? DurationSeconds { get; set; }

    /// <summary>
    /// Year the piece was published or acquired.
    /// </summary>
    public int? Year { get; set; }

    /// <summary>
    /// Number of copies/sets available.
    /// </summary>
    public int CopiesCount { get; set; } = 1;

    /// <summary>
    /// Whether the piece is available for use or currently in use/lent.
    /// </summary>
    public bool IsAvailable { get; set; } = true;

    /// <summary>
    /// Path to the PDF file of the sheet music (legacy, use Attachments).
    /// </summary>
    [MaxLength(500)]
    public string? PdfPath { get; set; }

    /// <summary>
    /// Path to the audio file (legacy, use Attachments).
    /// </summary>
    [MaxLength(500)]
    public string? AudioPath { get; set; }

    /// <summary>
    /// Additional notes about the music piece.
    /// </summary>
    [MaxLength(2000)]
    public string? Notes { get; set; }

    /// <summary>
    /// Date and time when the record was created.
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Date and time when the record was last updated.
    /// </summary>
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    /// <summary>
    /// Attachments (PDFs, audio files) for this music piece.
    /// </summary>
    public virtual ICollection<MusicAttachment> Attachments { get; set; } = new List<MusicAttachment>();
}
