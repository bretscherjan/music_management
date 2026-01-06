using MusigElgg.Domain;

namespace MusigElgg.Infrastructure.Services
{
    public interface IRoleChangeRequestService
    {
        Task<RoleChangeRequest> CreateRequestAsync(int requesterId, int targetUserId, int newRoleId);
        Task ApproveRequestAsync(int requestId, int approverId);
    }
}
