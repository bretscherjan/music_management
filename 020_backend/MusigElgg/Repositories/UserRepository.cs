using Microsoft.EntityFrameworkCore;
using MusigElgg.Data;
using MusigElgg.Data.Entities;
using MusigElgg.Data.Enums;

namespace MusigElgg.Repositories;

/// <summary>
/// Repository implementation for User entities.
/// </summary>
public class UserRepository : Repository<User>, IUserRepository
{
    public UserRepository(MusigElggDbContext context) : base(context)
    {
    }

    /// <inheritdoc/>
    public async Task<User?> GetByEmailAsync(string email)
    {
        return await _dbSet.FirstOrDefaultAsync(u => u.Email == email);
    }

    /// <inheritdoc/>
    public async Task<IEnumerable<User>> GetByRoleAsync(UserRole role)
    {
        return await _dbSet.Where(u => u.Role == role).ToListAsync();
    }

    /// <inheritdoc/>
    public async Task<IEnumerable<User>> GetActiveUsersAsync()
    {
        return await _dbSet.Where(u => u.IsActive).ToListAsync();
    }
}
