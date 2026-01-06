using Microsoft.EntityFrameworkCore;
using MusigElgg.Domain;

namespace MusigElgg.Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; } = null!;
    public DbSet<Role> Roles { get; set; } = null!;
    public DbSet<UserRole> UserRoles { get; set; } = null!;
    public DbSet<RoleChangeRequest> RoleChangeRequests { get; set; } = null!;
    public DbSet<Event> Events { get; set; } = null!;
    public DbSet<Attendance> Attendances { get; set; } = null!;
    public DbSet<InventoryItem> InventoryItems { get; set; } = null!;
    public DbSet<InventoryLoan> InventoryLoans { get; set; } = null!;
    public DbSet<Poll> Polls { get; set; } = null!;
    public DbSet<PollOption> PollOptions { get; set; } = null!;
    public DbSet<PollVote> PollVotes { get; set; } = null!;
    public DbSet<FileEntity> Files { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // UserRole (Many-to-Many)
        modelBuilder.Entity<UserRole>()
            .HasKey(ur => new { ur.UserId, ur.RoleId });
        modelBuilder.Entity<UserRole>()
            .HasOne(ur => ur.User)
            .WithMany(u => u.UserRoles)
            .HasForeignKey(ur => ur.UserId);
        modelBuilder.Entity<UserRole>()
            .HasOne(ur => ur.Role)
            .WithMany(r => r.UserRoles)
            .HasForeignKey(ur => ur.RoleId);

        // Attendance (User-Event)
        modelBuilder.Entity<Attendance>()
            .HasIndex(a => new { a.EventId, a.UserId }).IsUnique();

        // RoleChangeRequest (Relationships)
        modelBuilder.Entity<RoleChangeRequest>()
            .HasOne(r => r.TargetUser)
            .WithMany()
            .HasForeignKey(r => r.TargetUserId)
            .OnDelete(DeleteBehavior.Restrict); // Prevent cascade
        
        modelBuilder.Entity<RoleChangeRequest>()
            .HasOne(r => r.RequestedByUser)
            .WithMany()
            .HasForeignKey(r => r.RequestedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<RoleChangeRequest>()
            .HasOne(r => r.ApprovedByUser)
            .WithMany()
            .HasForeignKey(r => r.ApprovedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // InventoryLoan
        modelBuilder.Entity<InventoryLoan>()
            .HasOne(l => l.InventoryItem)
            .WithMany(i => i.Loans)
            .HasForeignKey(l => l.InventoryItemId);

        // PollVote
        modelBuilder.Entity<PollVote>()
            .HasOne(v => v.PollOption)
            .WithMany(o => o.Votes)
            .HasForeignKey(v => v.PollOptionId);
        
        // Ensure One Vote Per Poll Per User
        // Complex unique constraint would depend on PollOption->Poll relationship.
        // For simplicity enforcing in logic + unique on Vote(User, Option) is not enough.
        // Ideally: Unique Index on PollId + UserId (Requires PollId on Vote or join).
        // Leaving purely Unique Constraint on Option+User for now.
        modelBuilder.Entity<PollVote>()
             .HasIndex(v => new { v.PollOptionId, v.UserId }).IsUnique();

        // FileEntity (Self-Referencing)
        modelBuilder.Entity<FileEntity>()
            .HasOne(f => f.Parent)
            .WithMany(f => f.Children)
            .HasForeignKey(f => f.ParentId)
            .OnDelete(DeleteBehavior.Cascade);
            
        // Seeding Basic Roles
        modelBuilder.Entity<Role>().HasData(
            new Role { Id = 1, Name = "Admin", Level = 100 },
            new Role { Id = 2, Name = "Board", Level = 50 },
            new Role { Id = 3, Name = "Member", Level = 10 },
            new Role { Id = 4, Name = "Candidate", Level = 5 },
            new Role { Id = 5, Name = "Passenger", Level = 1 }
        );
    }
}
