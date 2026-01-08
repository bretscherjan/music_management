using MusigElgg.Data.Enums;

namespace MusigElgg.DTOs.MusicPieces;

/// <summary>
/// Response DTO for MusicPiece entity.
/// </summary>
public class MusicPieceResponseDto
{
    public Guid Id { get; set; }
    public string? CatalogNumber { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Composer { get; set; }
    public string? Arranger { get; set; }
    public string? Publisher { get; set; }
    public string? Genre { get; set; }
    public string? StorageLocation { get; set; }
    public string? StorageCabinet { get; set; }
    public string? StorageShelf { get; set; }
    public string? InstrumentationCode { get; set; }
    public string? Instrumentation { get; set; }
    public int? DifficultyLevel { get; set; }
    public string? DifficultyDescription { get; set; }
    public int? DurationSeconds { get; set; }
    public int? Year { get; set; }
    public int CopiesCount { get; set; }
    public bool IsAvailable { get; set; }
    public string? PdfPath { get; set; }
    public string? AudioPath { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<MusicAttachmentDto> Attachments { get; set; } = new();
}

/// <summary>
/// Response DTO for MusicAttachment.
/// </summary>
public class MusicAttachmentDto
{
    public Guid Id { get; set; }
    public MusicAttachmentType Type { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public string? ContentType { get; set; }
    public long FileSize { get; set; }
    public string? Description { get; set; }
    public string? InstrumentPart { get; set; }
    public DateTime UploadedAt { get; set; }
}

/// <summary>
/// Request DTO for creating a music piece.
/// </summary>
public class CreateMusicPieceRequestDto
{
    public required string Title { get; set; }
    public string? CatalogNumber { get; set; }
    public string? Composer { get; set; }
    public string? Arranger { get; set; }
    public string? Publisher { get; set; }
    public string? Genre { get; set; }
    public string? StorageLocation { get; set; }
    public string? StorageCabinet { get; set; }
    public string? StorageShelf { get; set; }
    public string? InstrumentationCode { get; set; }
    public string? Instrumentation { get; set; }
    public int? DifficultyLevel { get; set; }
    public string? DifficultyDescription { get; set; }
    public int? DurationSeconds { get; set; }
    public int? Year { get; set; }
    public int CopiesCount { get; set; } = 1;
    public string? PdfPath { get; set; }
    public string? AudioPath { get; set; }
    public string? Notes { get; set; }
}

/// <summary>
/// Request DTO for updating a music piece.
/// </summary>
public class UpdateMusicPieceRequestDto
{
    public string? Title { get; set; }
    public string? CatalogNumber { get; set; }
    public string? Composer { get; set; }
    public string? Arranger { get; set; }
    public string? Publisher { get; set; }
    public string? Genre { get; set; }
    public string? StorageLocation { get; set; }
    public string? StorageCabinet { get; set; }
    public string? StorageShelf { get; set; }
    public string? InstrumentationCode { get; set; }
    public string? Instrumentation { get; set; }
    public int? DifficultyLevel { get; set; }
    public string? DifficultyDescription { get; set; }
    public int? DurationSeconds { get; set; }
    public int? Year { get; set; }
    public int? CopiesCount { get; set; }
    public bool? IsAvailable { get; set; }
    public string? PdfPath { get; set; }
    public string? AudioPath { get; set; }
    public string? Notes { get; set; }
}

/// <summary>
/// Request DTO for uploading an attachment.
/// </summary>
public class UploadAttachmentRequestDto
{
    /// <summary>
    /// Type of attachment: pdf, audio, image, other.
    /// </summary>
    public MusicAttachmentType Type { get; set; }

    /// <summary>
    /// Optional description.
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// For audio files: which instrument/part.
    /// </summary>
    public string? InstrumentPart { get; set; }
}

/// <summary>
/// Response DTO for CSV import result.
/// </summary>
public class CsvImportResultDto
{
    public int TotalRows { get; set; }
    public int SuccessCount { get; set; }
    public int ErrorCount { get; set; }
    public List<ImportErrorDto> Errors { get; set; } = new();
}

/// <summary>
/// Error from import.
/// </summary>
public class ImportErrorDto
{
    public int LineNumber { get; set; }
    public string Column { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}
