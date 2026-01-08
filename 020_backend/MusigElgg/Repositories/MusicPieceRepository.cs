using Microsoft.EntityFrameworkCore;
using MusigElgg.Data;
using MusigElgg.Data.Entities;

namespace MusigElgg.Repositories;

/// <summary>
/// Repository implementation for MusicPiece entities.
/// </summary>
public class MusicPieceRepository : Repository<MusicPiece>, IMusicPieceRepository
{
    public MusicPieceRepository(MusigElggDbContext context) : base(context)
    {
    }

    /// <inheritdoc/>
    public async Task<IEnumerable<MusicPiece>> GetByGenreAsync(string genre)
    {
        return await _dbSet
            .Where(m => m.Genre != null && m.Genre.Contains(genre))
            .OrderBy(m => m.Title)
            .ToListAsync();
    }

    /// <inheritdoc/>
    public async Task<IEnumerable<MusicPiece>> GetByComposerAsync(string composer)
    {
        return await _dbSet
            .Where(m => m.Composer != null && m.Composer.Contains(composer))
            .OrderBy(m => m.Title)
            .ToListAsync();
    }

    /// <inheritdoc/>
    public async Task<IEnumerable<MusicPiece>> SearchByTitleAsync(string searchTerm)
    {
        return await _dbSet
            .Where(m => m.Title.Contains(searchTerm))
            .OrderBy(m => m.Title)
            .ToListAsync();
    }

    /// <inheritdoc/>
    public async Task<IEnumerable<MusicPiece>> GetByStorageLocationAsync(string storageLocation)
    {
        return await _dbSet
            .Where(m => m.StorageLocation != null && m.StorageLocation.Contains(storageLocation))
            .OrderBy(m => m.Title)
            .ToListAsync();
    }
}
