using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using MusigElgg.Domain;
using MusigElgg.Infrastructure.Persistence;

namespace MusigElgg.Infrastructure.Services;

public class FileService : IFileService
{
    private readonly AppDbContext _context;
    private readonly IWebHostEnvironment _env;

    public FileService(AppDbContext context, IWebHostEnvironment env)
    {
        _context = context;
        _env = env;
    }

    public async Task<IEnumerable<FileEntity>> GetFilesAsync(int? parentId, string userRole)
    {
        var query = _context.Files
            .Where(f => f.ParentId == parentId);

        // Access Control
        if (userRole != "Admin" && userRole != "Board")
        {
            // Members only see "Member" and "Public". Candidates/Passengers might be restricted more?
            // Assuming "Member" can see Public + Member.
            // If AccessLevel is "Board", omit.
            query = query.Where(f => f.AccessLevel != "Board");
        }
        // Public/Anonymous? Not handling here, assuming Controller uses [Authorize]

        return await query.ToListAsync();
    }

    public async Task<FileEntity> CreateFolderAsync(string name, int? parentId, string accessLevel, int uploaderId)
    {
        var folder = new FileEntity
        {
            Name = name,
            IsFolder = true,
            ParentId = parentId,
            AccessLevel = accessLevel,
            UploadedByUserId = uploaderId,
            CreatedAt = DateTime.UtcNow,
            Path = "", // Folder has no physical path
            ContentType = "folder",
            Size = 0
        };

        _context.Files.Add(folder);
        await _context.SaveChangesAsync();
        return folder;
    }

    public async Task<FileEntity> UploadFileAsync(IFormFile file, int? parentId, string accessLevel, int uploaderId)
    {
        // Save to disk
        var uploadsFolder = Path.Combine(_env.ContentRootPath, "Uploads");
        if (!Directory.Exists(uploadsFolder)) Directory.CreateDirectory(uploadsFolder);

        var uniqueFileName = Guid.NewGuid().ToString() + "_" + file.FileName;
        var filePath = Path.Combine(uploadsFolder, uniqueFileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var fileEntity = new FileEntity
        {
            Name = file.FileName,
            IsFolder = false,
            ParentId = parentId,
            AccessLevel = accessLevel,
            UploadedByUserId = uploaderId,
            CreatedAt = DateTime.UtcNow,
            Path = uniqueFileName, // Store relative filename
            ContentType = file.ContentType,
            Size = file.Length
        };

        _context.Files.Add(fileEntity);
        await _context.SaveChangesAsync();
        return fileEntity;
    }

    public async Task DeleteFileAsync(int id, string userRole)
    {
         if (userRole != "Admin" && userRole != "Board") 
         {
             throw new UnauthorizedAccessException("Only Board can delete files.");
         }

         var file = await _context.Files.FindAsync(id);
         if (file == null) return;

         // Recursive delete if folder? 
         // EF Core Cascade Delete should handle children DB entries if configured.
         // But physical files need to be deleted manually if we want clean up.
         // For now, simple implementation.

         _context.Files.Remove(file);
         await _context.SaveChangesAsync();
    }
}
