using MusigElgg.Domain.Dtos;
using MusigElgg.Domain;

namespace MusigElgg.Infrastructure.Services;

public interface IMemberService
{
    Task<IEnumerable<UserDetailDto>> GetAllMembersAsync();
    Task<UserDetailDto?> GetMemberByIdAsync(int id);
}
