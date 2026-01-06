using MusigElgg.Domain;
using MusigElgg.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace MusigElgg.Infrastructure.Services;

public class RoleChangeRequestService : IRoleChangeRequestService
{
    private readonly AppDbContext _context;

    public RoleChangeRequestService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<RoleChangeRequest> CreateRequestAsync(int requesterId, int targetUserId, int newRoleId)
    {
        var request = new RoleChangeRequest
        {
            RequestedByUserId = requesterId,
            TargetUserId = targetUserId,
            NewRoleId = newRoleId,
            Status = RequestStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        _context.RoleChangeRequests.Add(request);
        await _context.SaveChangesAsync();
        return request;
    }

    public async Task ApproveRequestAsync(int requestId, int approverId)
    {
        var request = await _context.RoleChangeRequests
            .Include(r => r.TargetUser)
            .FirstOrDefaultAsync(r => r.Id == requestId);

        if (request == null) throw new Exception("Request not found");

        // FOUR-EYES PRINCIPLE CHECK
        if (request.RequestedByUserId == approverId)
        {
            throw new InvalidOperationException("Violation of Four-Eyes Principle: Approver cannot be the same as Requester.");
        }

        request.ApprovedByUserId = approverId;
        request.Status = RequestStatus.Approved;
        request.ProcessedAt = DateTime.UtcNow;

        // Execute the Role Change
        var userRole = new UserRole { UserId = request.TargetUserId, RoleId = request.NewRoleId };
        // Check if exists? For simplicity, assuming add. Real app would handle replacement/check.
        if (!await _context.UserRoles.AnyAsync(ur => ur.UserId == request.TargetUserId && ur.RoleId == request.NewRoleId))
        {
             _context.UserRoles.Add(userRole);
        }

        await _context.SaveChangesAsync();
    }
}
