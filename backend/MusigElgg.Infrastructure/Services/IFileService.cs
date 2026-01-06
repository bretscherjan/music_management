using MusigElgg.Domain.Dtos;
using MusigElgg.Domain;
using Microsoft.AspNetCore.Http;

namespace MusigElgg.Infrastructure.Services;

public interface IFileService
{
    Task<IEnumerable<FileEntity>> GetFilesAsync(int? parentId, string userRole);
    Task<FileEntity> CreateFolderAsync(string name, int? parentId, string accessLevel, int uploaderId);
    Task<FileEntity> UploadFileAsync(IFormFile file, int? parentId, string accessLevel, int uploaderId);
    Task DeleteFileAsync(int id, string userRole);
}
