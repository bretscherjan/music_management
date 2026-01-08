using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using MusigElgg.Data;

namespace MusigElgg.Repositories;

/// <summary>
/// Generic repository implementation using Entity Framework Core.
/// </summary>
/// <typeparam name="T">The entity type.</typeparam>
public class Repository<T> : IRepository<T> where T : class
{
    protected readonly MusigElggDbContext _context;
    protected readonly DbSet<T> _dbSet;

    public Repository(MusigElggDbContext context)
    {
        _context = context;
        _dbSet = context.Set<T>();
    }

    /// <inheritdoc/>
    public virtual async Task<IEnumerable<T>> GetAllAsync()
    {
        return await _dbSet.ToListAsync();
    }

    /// <inheritdoc/>
    public virtual async Task<T?> GetByIdAsync(Guid id)
    {
        return await _dbSet.FindAsync(id);
    }

    /// <inheritdoc/>
    public virtual async Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate)
    {
        return await _dbSet.Where(predicate).ToListAsync();
    }

    /// <inheritdoc/>
    public virtual async Task<T> AddAsync(T entity)
    {
        await _dbSet.AddAsync(entity);
        await _context.SaveChangesAsync();
        return entity;
    }

    /// <inheritdoc/>
    public virtual async Task UpdateAsync(T entity)
    {
        _dbSet.Update(entity);
        await _context.SaveChangesAsync();
    }

    /// <inheritdoc/>
    public virtual async Task DeleteAsync(Guid id)
    {
        var entity = await GetByIdAsync(id);
        if (entity != null)
        {
            _dbSet.Remove(entity);
            await _context.SaveChangesAsync();
        }
    }

    /// <inheritdoc/>
    public virtual async Task<bool> ExistsAsync(Expression<Func<T, bool>> predicate)
    {
        return await _dbSet.AnyAsync(predicate);
    }

    /// <inheritdoc/>
    public virtual async Task<int> CountAsync(Expression<Func<T, bool>>? predicate = null)
    {
        return predicate == null
            ? await _dbSet.CountAsync()
            : await _dbSet.CountAsync(predicate);
    }
}
