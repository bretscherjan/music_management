using System.Linq.Expressions;

namespace MusigElgg.Repositories;

/// <summary>
/// Generic repository interface for CRUD operations.
/// </summary>
/// <typeparam name="T">The entity type.</typeparam>
public interface IRepository<T> where T : class
{
    /// <summary>
    /// Gets all entities.
    /// </summary>
    Task<IEnumerable<T>> GetAllAsync();

    /// <summary>
    /// Gets an entity by its ID.
    /// </summary>
    Task<T?> GetByIdAsync(Guid id);

    /// <summary>
    /// Finds entities matching the specified predicate.
    /// </summary>
    Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate);

    /// <summary>
    /// Adds a new entity.
    /// </summary>
    Task<T> AddAsync(T entity);

    /// <summary>
    /// Updates an existing entity.
    /// </summary>
    Task UpdateAsync(T entity);

    /// <summary>
    /// Deletes an entity by its ID.
    /// </summary>
    Task DeleteAsync(Guid id);

    /// <summary>
    /// Checks if an entity exists with the given predicate.
    /// </summary>
    Task<bool> ExistsAsync(Expression<Func<T, bool>> predicate);

    /// <summary>
    /// Gets the count of entities matching the predicate.
    /// </summary>
    Task<int> CountAsync(Expression<Func<T, bool>>? predicate = null);
}
