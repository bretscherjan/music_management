using MusigElgg.Data.Entities;

namespace MusigElgg.Services;

/// <summary>
/// Service for importing music pieces from CSV files.
/// </summary>
public interface IMusicPieceImportService
{
    /// <summary>
    /// Imports music pieces from a CSV stream.
    /// </summary>
    Task<MusicPieceImportResult> ImportFromCsvAsync(Stream csvStream, char delimiter = ';');

    /// <summary>
    /// Validates CSV headers against expected columns.
    /// </summary>
    CsvValidationResult ValidateHeaders(string[] headers);
}

/// <summary>
/// Result of a music piece import operation.
/// </summary>
public class MusicPieceImportResult
{
    public int TotalRows { get; set; }
    public int SuccessCount { get; set; }
    public int ErrorCount { get; set; }
    public List<MusicPieceImportError> Errors { get; set; } = new();
    public List<Guid> ImportedIds { get; set; } = new();
}

/// <summary>
/// Error from import.
/// </summary>
public class MusicPieceImportError
{
    public int LineNumber { get; set; }
    public string Column { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? Value { get; set; }
}

/// <summary>
/// Result of header validation.
/// </summary>
public class CsvValidationResult
{
    public bool IsValid { get; set; }
    public List<string> MissingRequired { get; set; } = new();
    public List<string> UnknownColumns { get; set; } = new();
    public Dictionary<string, int> ColumnMapping { get; set; } = new();
}

/// <summary>
/// Implementation of music piece import service.
/// </summary>
public class MusicPieceImportService : IMusicPieceImportService
{
    private readonly Data.MusigElggDbContext _context;

    // Expected CSV columns (German names for Swiss users)
    private static readonly Dictionary<string, string> ColumnAliases = new(StringComparer.OrdinalIgnoreCase)
    {
        { "Titel", "Title" },
        { "Title", "Title" },
        { "Komponist", "Composer" },
        { "Composer", "Composer" },
        { "Arrangeur", "Arranger" },
        { "Arranger", "Arranger" },
        { "Verlag", "Publisher" },
        { "Publisher", "Publisher" },
        { "Genre", "Genre" },
        { "Stil", "Genre" },
        { "Lagerort", "StorageLocation" },
        { "StorageLocation", "StorageLocation" },
        { "Schrank", "StorageCabinet" },
        { "Cabinet", "StorageCabinet" },
        { "Fach", "StorageShelf" },
        { "Shelf", "StorageShelf" },
        { "Besetzung", "InstrumentationCode" },
        { "Besetzungscode", "InstrumentationCode" },
        { "InstrumentationCode", "InstrumentationCode" },
        { "Schwierigkeit", "DifficultyLevel" },
        { "DifficultyLevel", "DifficultyLevel" },
        { "Schwierigkeitsgrad", "DifficultyDescription" },
        { "Jahr", "Year" },
        { "Year", "Year" },
        { "Dauer", "DurationSeconds" },
        { "Duration", "DurationSeconds" },
        { "Katalognummer", "CatalogNumber" },
        { "CatalogNumber", "CatalogNumber" },
        { "Nr", "CatalogNumber" },
        { "Bemerkungen", "Notes" },
        { "Notes", "Notes" },
        { "Notizen", "Notes" }
    };

    private static readonly HashSet<string> RequiredColumns = new(StringComparer.OrdinalIgnoreCase)
    {
        "Title", "Titel"
    };

    public MusicPieceImportService(Data.MusigElggDbContext context)
    {
        _context = context;
    }

    /// <inheritdoc/>
    public CsvValidationResult ValidateHeaders(string[] headers)
    {
        var result = new CsvValidationResult { IsValid = true };
        var foundRequired = false;

        for (int i = 0; i < headers.Length; i++)
        {
            var header = headers[i].Trim();
            if (ColumnAliases.TryGetValue(header, out var mapped))
            {
                result.ColumnMapping[mapped] = i;
                if (RequiredColumns.Contains(header))
                    foundRequired = true;
            }
            else if (!string.IsNullOrWhiteSpace(header))
            {
                result.UnknownColumns.Add(header);
            }
        }

        if (!foundRequired)
        {
            result.IsValid = false;
            result.MissingRequired.Add("Titel/Title");
        }

        return result;
    }

    /// <inheritdoc/>
    public async Task<MusicPieceImportResult> ImportFromCsvAsync(Stream csvStream, char delimiter = ';')
    {
        var result = new MusicPieceImportResult();
        using var reader = new StreamReader(csvStream);

        // Read header
        var headerLine = await reader.ReadLineAsync();
        if (string.IsNullOrWhiteSpace(headerLine))
        {
            result.Errors.Add(new MusicPieceImportError
            {
                LineNumber = 1,
                Message = "CSV file is empty or has no header row."
            });
            return result;
        }

        var headers = headerLine.Split(delimiter);
        var validation = ValidateHeaders(headers);

        if (!validation.IsValid)
        {
            foreach (var missing in validation.MissingRequired)
            {
                result.Errors.Add(new MusicPieceImportError
                {
                    LineNumber = 1,
                    Column = missing,
                    Message = $"Required column '{missing}' is missing."
                });
            }
            return result;
        }

        var mapping = validation.ColumnMapping;
        int lineNumber = 1;

        while (!reader.EndOfStream)
        {
            lineNumber++;
            var line = await reader.ReadLineAsync();
            
            if (string.IsNullOrWhiteSpace(line)) continue;

            result.TotalRows++;
            var values = ParseCsvLine(line, delimiter);

            try
            {
                var piece = new MusicPiece
                {
                    Id = Guid.NewGuid(),
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                // Required field: Title
                if (mapping.TryGetValue("Title", out int titleIdx) && titleIdx < values.Length)
                {
                    var title = values[titleIdx].Trim();
                    if (string.IsNullOrWhiteSpace(title))
                    {
                        result.Errors.Add(new MusicPieceImportError
                        {
                            LineNumber = lineNumber,
                            Column = "Title",
                            Message = "Title cannot be empty."
                        });
                        result.ErrorCount++;
                        continue;
                    }
                    piece.Title = title;
                }

                // Optional fields
                if (mapping.TryGetValue("Composer", out int composerIdx) && composerIdx < values.Length)
                    piece.Composer = GetValueOrNull(values[composerIdx]);

                if (mapping.TryGetValue("Arranger", out int arrangerIdx) && arrangerIdx < values.Length)
                    piece.Arranger = GetValueOrNull(values[arrangerIdx]);

                if (mapping.TryGetValue("Publisher", out int publisherIdx) && publisherIdx < values.Length)
                    piece.Publisher = GetValueOrNull(values[publisherIdx]);

                if (mapping.TryGetValue("Genre", out int genreIdx) && genreIdx < values.Length)
                    piece.Genre = GetValueOrNull(values[genreIdx]);

                if (mapping.TryGetValue("StorageLocation", out int locIdx) && locIdx < values.Length)
                    piece.StorageLocation = GetValueOrNull(values[locIdx]);

                if (mapping.TryGetValue("StorageCabinet", out int cabIdx) && cabIdx < values.Length)
                    piece.StorageCabinet = GetValueOrNull(values[cabIdx]);

                if (mapping.TryGetValue("StorageShelf", out int shelfIdx) && shelfIdx < values.Length)
                    piece.StorageShelf = GetValueOrNull(values[shelfIdx]);

                if (mapping.TryGetValue("InstrumentationCode", out int instIdx) && instIdx < values.Length)
                    piece.InstrumentationCode = GetValueOrNull(values[instIdx]);

                if (mapping.TryGetValue("CatalogNumber", out int catIdx) && catIdx < values.Length)
                    piece.CatalogNumber = GetValueOrNull(values[catIdx]);

                if (mapping.TryGetValue("DifficultyLevel", out int diffIdx) && diffIdx < values.Length)
                {
                    if (int.TryParse(values[diffIdx].Trim(), out int diff))
                        piece.DifficultyLevel = diff;
                }

                if (mapping.TryGetValue("DifficultyDescription", out int diffDescIdx) && diffDescIdx < values.Length)
                    piece.DifficultyDescription = GetValueOrNull(values[diffDescIdx]);

                if (mapping.TryGetValue("Year", out int yearIdx) && yearIdx < values.Length)
                {
                    if (int.TryParse(values[yearIdx].Trim(), out int year))
                        piece.Year = year;
                }

                if (mapping.TryGetValue("DurationSeconds", out int durIdx) && durIdx < values.Length)
                {
                    if (int.TryParse(values[durIdx].Trim(), out int dur))
                        piece.DurationSeconds = dur;
                }

                if (mapping.TryGetValue("Notes", out int notesIdx) && notesIdx < values.Length)
                    piece.Notes = GetValueOrNull(values[notesIdx]);

                _context.MusicPieces.Add(piece);
                await _context.SaveChangesAsync();
                
                result.ImportedIds.Add(piece.Id);
                result.SuccessCount++;
            }
            catch (Exception ex)
            {
                result.Errors.Add(new MusicPieceImportError
                {
                    LineNumber = lineNumber,
                    Message = ex.Message
                });
                result.ErrorCount++;
            }
        }

        return result;
    }

    private static string? GetValueOrNull(string value)
    {
        var trimmed = value.Trim();
        return string.IsNullOrWhiteSpace(trimmed) ? null : trimmed;
    }

    private static string[] ParseCsvLine(string line, char delimiter)
    {
        // Simple CSV parsing supporting quoted values
        var result = new List<string>();
        var current = "";
        var inQuotes = false;

        for (int i = 0; i < line.Length; i++)
        {
            var c = line[i];
            if (c == '"')
            {
                if (inQuotes && i + 1 < line.Length && line[i + 1] == '"')
                {
                    current += '"';
                    i++;
                }
                else
                {
                    inQuotes = !inQuotes;
                }
            }
            else if (c == delimiter && !inQuotes)
            {
                result.Add(current);
                current = "";
            }
            else
            {
                current += c;
            }
        }
        result.Add(current);

        return result.ToArray();
    }
}
