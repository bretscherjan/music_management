using MusigElgg.Data.Entities;

namespace MusigElgg.Repositories;

/// <summary>
/// Repository interface for MusicPiece entities with additional methods.
/// </summary>
public interface IMusicPieceRepository : IRepository<MusicPiece>
{
    /// <summary>
    /// Gets music pieces by genre.
    /// </summary>
    Task<IEnumerable<MusicPiece>> GetByGenreAsync(string genre);

    /// <summary>
    /// Gets music pieces by composer.
    /// </summary>
    Task<IEnumerable<MusicPiece>> GetByComposerAsync(string composer);

    /// <summary>
    /// Searches music pieces by title.
    /// </summary>
    Task<IEnumerable<MusicPiece>> SearchByTitleAsync(string searchTerm);

    /// <summary>
    /// Gets music pieces by storage location.
    /// </summary>
    Task<IEnumerable<MusicPiece>> GetByStorageLocationAsync(string storageLocation);
}
