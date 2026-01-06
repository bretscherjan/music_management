using MusigElgg.Domain;

namespace MusigElgg.Infrastructure.Services
{
    public interface IAuthService
    {
        Task<User?> LoginAsync(string email, string password);
        Task<User?> GetUserByIdAsync(int id);
        Task<IEnumerable<User>> GetAllUsersAsync();
    }
    
    // Minimal implementation if it doesn't exist, though I suspect it does, just need to find it. 
    // But since find was called in parallel, I will handle replacement if found.
    // Wait, I shouldn't overwrite if it exists.
    // I will write this to a temporary location or wait for finding results.
    // Better strategy: Just define the interface first as it seems missing from Program.cs context.
}
