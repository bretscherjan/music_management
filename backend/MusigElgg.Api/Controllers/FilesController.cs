using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MusigElgg.Domain;
using MusigElgg.Infrastructure.Services;
using System.Security.Claims;

namespace MusigElgg.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FilesController : ControllerBase
{
    private readonly IFileService _fileService;

    public FilesController(IFileService fileService)
    {
        _fileService = fileService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<FileEntity>>> GetFiles([FromQuery] int? parentId)
    {
        var role = User.FindFirst(ClaimTypes.Role)?.Value ?? "Member";
        var files = await _fileService.GetFilesAsync(parentId, role);
        return Ok(files);
    }

    [HttpPost("folders")]
    public async Task<ActionResult<FileEntity>> CreateFolder([FromBody] CreateFolderDto dto)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        var role = User.FindFirst(ClaimTypes.Role)?.Value ?? "Member";

        // Only Board can create specific internal folders? Or anyone?
        // Requirement: "Zwei Verzeichnisse: Intern Vorstand und Allgemein"
        // Let's assume root folders are fixed or only Admin can create roots.
        // For simplicity: If Role is Board, can set AccessLevel "Board", else "Member".
        
        string accessLevel = (dto.AccessLevel == "Board" && role == "Board") ? "Board" : "Member";

        var folder = await _fileService.CreateFolderAsync(dto.Name, dto.ParentId, accessLevel, userId);
        return CreatedAtAction(nameof(GetFiles), new { parentId = folder.ParentId }, folder);
    }

    [HttpPost("upload")]
    public async Task<ActionResult<FileEntity>> UploadFile([FromForm] UploadFileDto dto)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        var role = User.FindFirst(ClaimTypes.Role)?.Value ?? "Member";
        
        string accessLevel = (dto.AccessLevel == "Board" && role == "Board") ? "Board" : "Member";

        if (dto.File == null || dto.File.Length == 0) return BadRequest("No file uploaded.");

        var file = await _fileService.UploadFileAsync(dto.File, dto.ParentId, accessLevel, userId);
        return CreatedAtAction(nameof(GetFiles), new { parentId = file.ParentId }, file);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteFile(int id)
    {
        var role = User.FindFirst(ClaimTypes.Role)?.Value ?? "Member";
        try
        {
            await _fileService.DeleteFileAsync(id, role);
            return NoContent();
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }
}

public class CreateFolderDto
{
    public string Name { get; set; } = string.Empty;
    public int? ParentId { get; set; }
    public string AccessLevel { get; set; } = "Member";
}

public class UploadFileDto
{
    public IFormFile File { get; set; } = null!;
    public int? ParentId { get; set; }
    public string AccessLevel { get; set; } = "Member";
}
