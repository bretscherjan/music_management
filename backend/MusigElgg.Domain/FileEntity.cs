using System.Text.Json.Serialization;

namespace MusigElgg.Domain;

public class FileEntity
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Path { get; set; } = string.Empty; // Cloud path or local relative path
    public string ContentType { get; set; } = string.Empty;
    public long Size { get; set; }
    
    public int? ParentId { get; set; }
    [JsonIgnore]
    public FileEntity? Parent { get; set; }
    [JsonIgnore]
    public ICollection<FileEntity> Children { get; set; } = new List<FileEntity>();

    public bool IsFolder { get; set; }
    
    // BoardOnly, Member, Public
    public string AccessLevel { get; set; } = "Member"; 

    public int UploadedByUserId { get; set; }
    public User UploadedByUser { get; set; } = null!;
    
    public DateTime CreatedAt { get; set; }
}
