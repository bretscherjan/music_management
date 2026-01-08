using MusigElgg.Data.Entities;
using MusigElgg.Data.Enums;

namespace MusigElgg.Repositories;

/// <summary>
/// Repository interface for User entities with additional methods.
/// </summary>
public interface IUserRepository : IRepository<User>
{
    /// <summary>
    /// Gets a user by email address.
    /// </summary>
    Task<User?> GetByEmailAsync(string email);

    /// <summary>
    /// Gets all users with a specific role.
    /// </summary>
    Task<IEnumerable<User>> GetByRoleAsync(UserRole role);

    /// <summary>
    /// Gets all active users.
    /// </summary>
    Task<IEnumerable<User>> GetActiveUsersAsync();
}
