using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MusigElgg.Data;
using MusigElgg.Data.Entities;
using MusigElgg.Data.Enums;
using MusigElgg.DTOs.MusicPieces;
using MusigElgg.Services;

using Microsoft.AspNetCore.Authorization;

namespace MusigElgg.Controllers;

/// <summary>
/// Controller for music piece management (Noteninventar).
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[Authorize]
public class MusicPiecesController : ControllerBase
{
    private readonly MusigElggDbContext _context;
    private readonly IWebHostEnvironment _environment;
    private readonly IMusicPieceImportService _importService;

    public MusicPiecesController(
        MusigElggDbContext context,
        IWebHostEnvironment environment,
        IMusicPieceImportService importService)
    {
        _context = context;
        _environment = environment;
        _importService = importService;
    }

    /// <summary>
    /// Gets all music pieces with optional filtering.
    /// </summary>
    /// <param name="search">Search term for title, composer, or arranger.</param>
    /// <param name="genre">Filter by genre.</param>
    /// <param name="instrumentationCode">Filter by instrumentation code (Besetzungscode).</param>
    /// <param name="storageCabinet">Filter by storage cabinet.</param>
    /// <param name="onlyAvailable">Only show available pieces.</param>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<MusicPieceResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<MusicPieceResponseDto>>> GetAll(
        [FromQuery] string? search = null,
        [FromQuery] string? genre = null,
        [FromQuery] string? instrumentationCode = null,
        [FromQuery] string? storageCabinet = null,
        [FromQuery] bool onlyAvailable = false)
    {
        var query = _context.MusicPieces.Include(m => m.Attachments).AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.ToLower();
            query = query.Where(m =>
                m.Title.ToLower().Contains(term) ||
                (m.Composer != null && m.Composer.ToLower().Contains(term)) ||
                (m.Arranger != null && m.Arranger.ToLower().Contains(term)) ||
                (m.CatalogNumber != null && m.CatalogNumber.ToLower().Contains(term)));
        }

        if (!string.IsNullOrWhiteSpace(genre))
            query = query.Where(m => m.Genre == genre);

        if (!string.IsNullOrWhiteSpace(instrumentationCode))
            query = query.Where(m => m.InstrumentationCode == instrumentationCode);

        if (!string.IsNullOrWhiteSpace(storageCabinet))
            query = query.Where(m => m.StorageCabinet == storageCabinet);

        if (onlyAvailable)
            query = query.Where(m => m.IsAvailable);

        var pieces = await query.OrderBy(m => m.Title).ToListAsync();
        return Ok(pieces.Select(MapToDto));
    }

    /// <summary>
    /// Gets a specific music piece by ID.
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(MusicPieceResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<MusicPieceResponseDto>> GetById(Guid id)
    {
        var piece = await _context.MusicPieces
            .Include(m => m.Attachments)
            .FirstOrDefaultAsync(m => m.Id == id);
        
        if (piece == null)
            return NotFound();

        return Ok(MapToDto(piece));
    }

    /// <summary>
    /// Gets all distinct genres for filtering.
    /// </summary>
    [HttpGet("genres")]
    [ProducesResponseType(typeof(IEnumerable<string>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<string>>> GetGenres()
    {
        var genres = await _context.MusicPieces
            .Where(m => m.Genre != null)
            .Select(m => m.Genre!)
            .Distinct()
            .OrderBy(g => g)
            .ToListAsync();

        return Ok(genres);
    }

    /// <summary>
    /// Gets all distinct instrumentation codes for filtering.
    /// </summary>
    [HttpGet("instrumentation-codes")]
    [ProducesResponseType(typeof(IEnumerable<string>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<string>>> GetInstrumentationCodes()
    {
        var codes = await _context.MusicPieces
            .Where(m => m.InstrumentationCode != null)
            .Select(m => m.InstrumentationCode!)
            .Distinct()
            .OrderBy(c => c)
            .ToListAsync();

        return Ok(codes);
    }

    /// <summary>
    /// Creates a new music piece.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(MusicPieceResponseDto), StatusCodes.Status201Created)]
    public async Task<ActionResult<MusicPieceResponseDto>> Create([FromBody] CreateMusicPieceRequestDto dto)
    {
        var piece = new MusicPiece
        {
            Id = Guid.NewGuid(),
            CatalogNumber = dto.CatalogNumber,
            Title = dto.Title,
            Composer = dto.Composer,
            Arranger = dto.Arranger,
            Publisher = dto.Publisher,
            Genre = dto.Genre,
            StorageLocation = dto.StorageLocation,
            StorageCabinet = dto.StorageCabinet,
            StorageShelf = dto.StorageShelf,
            InstrumentationCode = dto.InstrumentationCode,
            Instrumentation = dto.Instrumentation,
            DifficultyLevel = dto.DifficultyLevel,
            DifficultyDescription = dto.DifficultyDescription,
            DurationSeconds = dto.DurationSeconds,
            Year = dto.Year,
            CopiesCount = dto.CopiesCount,
            PdfPath = dto.PdfPath,
            AudioPath = dto.AudioPath,
            Notes = dto.Notes,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.MusicPieces.Add(piece);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = piece.Id }, MapToDto(piece));
    }

    /// <summary>
    /// Updates a music piece.
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(MusicPieceResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<MusicPieceResponseDto>> Update(Guid id, [FromBody] UpdateMusicPieceRequestDto dto)
    {
        var piece = await _context.MusicPieces.FindAsync(id);
        if (piece == null)
            return NotFound();

        if (dto.Title != null) piece.Title = dto.Title;
        if (dto.CatalogNumber != null) piece.CatalogNumber = dto.CatalogNumber;
        if (dto.Composer != null) piece.Composer = dto.Composer;
        if (dto.Arranger != null) piece.Arranger = dto.Arranger;
        if (dto.Publisher != null) piece.Publisher = dto.Publisher;
        if (dto.Genre != null) piece.Genre = dto.Genre;
        if (dto.StorageLocation != null) piece.StorageLocation = dto.StorageLocation;
        if (dto.StorageCabinet != null) piece.StorageCabinet = dto.StorageCabinet;
        if (dto.StorageShelf != null) piece.StorageShelf = dto.StorageShelf;
        if (dto.InstrumentationCode != null) piece.InstrumentationCode = dto.InstrumentationCode;
        if (dto.Instrumentation != null) piece.Instrumentation = dto.Instrumentation;
        if (dto.DifficultyLevel.HasValue) piece.DifficultyLevel = dto.DifficultyLevel;
        if (dto.DifficultyDescription != null) piece.DifficultyDescription = dto.DifficultyDescription;
        if (dto.DurationSeconds.HasValue) piece.DurationSeconds = dto.DurationSeconds;
        if (dto.Year.HasValue) piece.Year = dto.Year;
        if (dto.CopiesCount.HasValue) piece.CopiesCount = dto.CopiesCount.Value;
        if (dto.IsAvailable.HasValue) piece.IsAvailable = dto.IsAvailable.Value;
        if (dto.PdfPath != null) piece.PdfPath = dto.PdfPath;
        if (dto.AudioPath != null) piece.AudioPath = dto.AudioPath;
        if (dto.Notes != null) piece.Notes = dto.Notes;
        piece.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(MapToDto(piece));
    }

    /// <summary>
    /// Deletes a music piece.
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var piece = await _context.MusicPieces.FindAsync(id);
        if (piece == null)
            return NotFound();

        _context.MusicPieces.Remove(piece);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    /// <summary>
    /// Uploads an attachment (PDF or Audio) for a music piece.
    /// </summary>
    /// <param name="id">The music piece ID.</param>
    /// <param name="file">The file to upload.</param>
    /// <param name="type">Attachment type: Pdf, Audio, Image, Other.</param>
    /// <param name="description">Optional description (e.g., "Partitur", "Stimmen").</param>
    /// <param name="instrumentPart">For audio: which instrument/part.</param>
    [HttpPost("{id}/attachments")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(MusicAttachmentDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<MusicAttachmentDto>> UploadAttachment(
        Guid id,
        IFormFile file,
        [FromQuery] MusicAttachmentType type = MusicAttachmentType.Pdf,
        [FromQuery] string? description = null,
        [FromQuery] string? instrumentPart = null)
    {
        var piece = await _context.MusicPieces.FindAsync(id);
        if (piece == null) return NotFound();

        if (file == null || file.Length == 0)
            return BadRequest("No file uploaded.");

        // Validate file type
        var ext = Path.GetExtension(file.FileName).ToLower();
        var validExtensions = type switch
        {
            MusicAttachmentType.Pdf => new[] { ".pdf" },
            MusicAttachmentType.Audio => new[] { ".mp3", ".wav", ".m4a", ".ogg", ".flac" },
            MusicAttachmentType.Image => new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" },
            _ => Array.Empty<string>()
        };

        if (validExtensions.Length > 0 && !validExtensions.Contains(ext))
        {
            return BadRequest($"Invalid file type for {type}. Allowed: {string.Join(", ", validExtensions)}");
        }

        // Ensure directory exists
        var uploadsFolder = Path.Combine(
            _environment.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"),
            "uploads", "music", id.ToString());
        Directory.CreateDirectory(uploadsFolder);

        var fileName = $"{Guid.NewGuid()}{ext}";
        var filePath = Path.Combine(uploadsFolder, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var attachment = new MusicAttachment
        {
            Id = Guid.NewGuid(),
            MusicPieceId = id,
            Type = type,
            FileName = file.FileName,
            FilePath = $"/uploads/music/{id}/{fileName}",
            ContentType = file.ContentType,
            FileSize = file.Length,
            Description = description,
            InstrumentPart = instrumentPart,
            UploadedAt = DateTime.UtcNow
        };

        _context.MusicAttachments.Add(attachment);
        await _context.SaveChangesAsync();

        return Created($"/api/musicpieces/{id}/attachments/{attachment.Id}", new MusicAttachmentDto
        {
            Id = attachment.Id,
            Type = attachment.Type,
            FileName = attachment.FileName,
            FilePath = attachment.FilePath,
            ContentType = attachment.ContentType,
            FileSize = attachment.FileSize,
            Description = attachment.Description,
            InstrumentPart = attachment.InstrumentPart,
            UploadedAt = attachment.UploadedAt
        });
    }

    /// <summary>
    /// Deletes an attachment.
    /// </summary>
    [HttpDelete("{musicPieceId}/attachments/{attachmentId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteAttachment(Guid musicPieceId, Guid attachmentId)
    {
        var attachment = await _context.MusicAttachments
            .FirstOrDefaultAsync(a => a.Id == attachmentId && a.MusicPieceId == musicPieceId);

        if (attachment == null)
            return NotFound();

        // Delete physical file
        var fullPath = Path.Combine(
            _environment.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"),
            attachment.FilePath.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));

        if (System.IO.File.Exists(fullPath))
        {
            System.IO.File.Delete(fullPath);
        }

        _context.MusicAttachments.Remove(attachment);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    /// <summary>
    /// Imports music pieces from a CSV file.
    /// Supports German and English column headers.
    /// </summary>
    /// <param name="file">CSV file with semicolon or comma delimiter.</param>
    /// <param name="delimiter">Column delimiter (default: semicolon for European CSV).</param>
    [HttpPost("import-csv")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(CsvImportResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<CsvImportResultDto>> ImportCsv(
        IFormFile file,
        [FromQuery] char delimiter = ';')
    {
        if (file == null || file.Length == 0)
            return BadRequest("No file uploaded.");

        var ext = Path.GetExtension(file.FileName).ToLower();
        if (ext != ".csv" && ext != ".txt")
            return BadRequest("File must be a CSV or TXT file.");

        using var stream = file.OpenReadStream();
        var result = await _importService.ImportFromCsvAsync(stream, delimiter);

        return Ok(new CsvImportResultDto
        {
            TotalRows = result.TotalRows,
            SuccessCount = result.SuccessCount,
            ErrorCount = result.ErrorCount,
            Errors = result.Errors.Select(e => new ImportErrorDto
            {
                LineNumber = e.LineNumber,
                Column = e.Column,
                Message = e.Message
            }).ToList()
        });
    }

    private static MusicPieceResponseDto MapToDto(MusicPiece piece) => new()
    {
        Id = piece.Id,
        CatalogNumber = piece.CatalogNumber,
        Title = piece.Title,
        Composer = piece.Composer,
        Arranger = piece.Arranger,
        Publisher = piece.Publisher,
        Genre = piece.Genre,
        StorageLocation = piece.StorageLocation,
        StorageCabinet = piece.StorageCabinet,
        StorageShelf = piece.StorageShelf,
        InstrumentationCode = piece.InstrumentationCode,
        Instrumentation = piece.Instrumentation,
        DifficultyLevel = piece.DifficultyLevel,
        DifficultyDescription = piece.DifficultyDescription,
        DurationSeconds = piece.DurationSeconds,
        Year = piece.Year,
        CopiesCount = piece.CopiesCount,
        IsAvailable = piece.IsAvailable,
        PdfPath = piece.PdfPath,
        AudioPath = piece.AudioPath,
        Notes = piece.Notes,
        CreatedAt = piece.CreatedAt,
        UpdatedAt = piece.UpdatedAt,
        Attachments = piece.Attachments.Select(a => new MusicAttachmentDto
        {
            Id = a.Id,
            Type = a.Type,
            FileName = a.FileName,
            FilePath = a.FilePath,
            ContentType = a.ContentType,
            FileSize = a.FileSize,
            Description = a.Description,
            InstrumentPart = a.InstrumentPart,
            UploadedAt = a.UploadedAt
        }).ToList()
    };
}
