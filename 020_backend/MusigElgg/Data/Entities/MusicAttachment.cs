using System.ComponentModel.DataAnnotations;
using MusigElgg.Data.Enums;

namespace MusigElgg.Data.Entities;

/// <summary>
/// Represents an attachment (PDF, audio file) for a music piece.
/// </summary>
public class MusicAttachment
{
    /// <summary>
    /// Unique identifier for the attachment.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Foreign key to the parent music piece.
    /// </summary>
    public Guid MusicPieceId { get; set; }

    /// <summary>
    /// Type of attachment (PDF, Audio, Image, Other).
    /// </summary>
    public MusicAttachmentType Type { get; set; }

    /// <summary>
    /// Original filename.
    /// </summary>
    [Required]
    [MaxLength(255)]
    public string FileName { get; set; } = string.Empty;

    /// <summary>
    /// Path to the stored file (relative to wwwroot).
    /// </summary>
    [Required]
    [MaxLength(500)]
    public string FilePath { get; set; } = string.Empty;

    /// <summary>
    /// MIME type of the file.
    /// </summary>
    [MaxLength(100)]
    public string? ContentType { get; set; }

    /// <summary>
    /// File size in bytes.
    /// </summary>
    public long FileSize { get; set; }

    /// <summary>
    /// Description of the attachment (e.g., "Partitur", "Stimmensatz", "Referenzaufnahme").
    /// </summary>
    [MaxLength(200)]
    public string? Description { get; set; }

    /// <summary>
    /// For audio files: which instrument/part is this recording (e.g., "Solo Trompete").
    /// </summary>
    [MaxLength(100)]
    public string? InstrumentPart { get; set; }

    /// <summary>
    /// Sort order for display.
    /// </summary>
    public int SortOrder { get; set; } = 0;

    /// <summary>
    /// Date and time when the attachment was uploaded.
    /// </summary>
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    /// <summary>
    /// The parent music piece.
    /// </summary>
    public virtual MusicPiece MusicPiece { get; set; } = null!;
}
