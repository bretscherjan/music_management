using Microsoft.EntityFrameworkCore;
using MusigElgg.Data.Entities;

namespace MusigElgg.Data;

/// <summary>
/// Database context for the Musig Elgg application.
/// </summary>
public class MusigElggDbContext : DbContext
{
    public MusigElggDbContext(DbContextOptions<MusigElggDbContext> options)
        : base(options)
    {
    }

    // DbSets
    public DbSet<User> Users => Set<User>();
    public DbSet<Event> Events => Set<Event>();
    public DbSet<EventCategory> EventCategories => Set<EventCategory>();
    public DbSet<EventSeries> EventSeries => Set<EventSeries>();
    public DbSet<EventParticipant> EventParticipants => Set<EventParticipant>();
    public DbSet<MusicPiece> MusicPieces => Set<MusicPiece>();
    public DbSet<AssignedTask> AssignedTasks => Set<AssignedTask>();
    public DbSet<EventPost> EventPosts => Set<EventPost>();
    public DbSet<Survey> Surveys => Set<Survey>();
    public DbSet<SurveyOption> SurveyOptions => Set<SurveyOption>();
    public DbSet<SurveyVote> SurveyVotes => Set<SurveyVote>();
    public DbSet<Register> Registers => Set<Register>();
    public DbSet<RegisterLimit> RegisterLimits => Set<RegisterLimit>();
    public DbSet<TaskChecklistItem> TaskChecklistItems => Set<TaskChecklistItem>();
    public DbSet<TaskComment> TaskComments => Set<TaskComment>();
    public DbSet<MusicAttachment> MusicAttachments => Set<MusicAttachment>();
    public DbSet<NewsEntry> NewsEntries => Set<NewsEntry>();
    public DbSet<AssociationHistory> AssociationHistory => Set<AssociationHistory>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(u => u.Id);
            entity.HasIndex(u => u.Email).IsUnique();
            entity.Property(u => u.Role).HasConversion<string>();

            entity.HasOne(u => u.Register)
                .WithMany(r => r.Users)
                .HasForeignKey(u => u.RegisterId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // EventCategory configuration
        modelBuilder.Entity<EventCategory>(entity =>
        {
            entity.HasKey(c => c.Id);
        });

        // EventSeries configuration
        modelBuilder.Entity<EventSeries>(entity =>
        {
            entity.HasKey(s => s.Id);
        });

        // Event configuration
        modelBuilder.Entity<Event>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.HasOne(e => e.Category)
                .WithMany(c => c.Events)
                .HasForeignKey(e => e.CategoryId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.Series)
                .WithMany(s => s.Events)
                .HasForeignKey(e => e.SeriesId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // EventParticipant configuration (many-to-many)
        modelBuilder.Entity<EventParticipant>(entity =>
        {
            entity.HasKey(ep => new { ep.EventId, ep.UserId });

            entity.HasOne(ep => ep.Event)
                .WithMany(e => e.Participants)
                .HasForeignKey(ep => ep.EventId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(ep => ep.User)
                .WithMany(u => u.EventParticipations)
                .HasForeignKey(ep => ep.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.Property(ep => ep.Status).HasConversion<string>();
        });

        // MusicPiece configuration
        modelBuilder.Entity<MusicPiece>(entity =>
        {
            entity.HasKey(m => m.Id);

            entity.HasMany(m => m.Attachments)
                .WithOne(a => a.MusicPiece)
                .HasForeignKey(a => a.MusicPieceId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // MusicAttachment configuration
        modelBuilder.Entity<MusicAttachment>(entity =>
        {
            entity.HasKey(a => a.Id);
            entity.Property(a => a.Type).HasConversion<string>();
        });

        // AssignedTask configuration
        modelBuilder.Entity<AssignedTask>(entity =>
        {
            entity.HasKey(t => t.Id);

            entity.HasOne(t => t.CreatedBy)
                .WithMany()
                .HasForeignKey(t => t.CreatedById)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(t => t.Assignee)
                .WithMany(u => u.AssignedTasks)
                .HasForeignKey(t => t.AssigneeId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(t => t.AssignedRegister)
                .WithMany()
                .HasForeignKey(t => t.AssignedRegisterId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(t => t.Event)
                .WithMany(e => e.Tasks)
                .HasForeignKey(t => t.EventId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasMany(t => t.ChecklistItems)
                .WithOne(c => c.Task)
                .HasForeignKey(c => c.TaskId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(t => t.Comments)
                .WithOne(c => c.Task)
                .HasForeignKey(c => c.TaskId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.Property(t => t.Status).HasConversion<string>();
            entity.Property(t => t.Recurrence).HasConversion<string>();
        });

        // TaskChecklistItem configuration
        modelBuilder.Entity<TaskChecklistItem>(entity =>
        {
            entity.HasKey(c => c.Id);
        });

        // TaskComment configuration
        modelBuilder.Entity<TaskComment>(entity =>
        {
            entity.HasKey(c => c.Id);

            entity.HasOne(c => c.Author)
                .WithMany()
                .HasForeignKey(c => c.AuthorId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // EventPost configuration
        modelBuilder.Entity<EventPost>(entity =>
        {
            entity.HasOne(p => p.Event)
                .WithMany() // Uni-directional unless I add to Event
                .HasForeignKey(p => p.EventId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Survey configuration
        modelBuilder.Entity<Survey>(entity =>
        {
            entity.HasMany(s => s.Options)
                .WithOne(o => o.Survey)
                .HasForeignKey(o => o.SurveyId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(s => s.Votes)
                .WithOne(v => v.Survey)
                .HasForeignKey(v => v.SurveyId)
                .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasOne(s => s.Event)
                .WithMany()
                .HasForeignKey(s => s.EventId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(s => s.CreatedBy)
                .WithMany()
                .HasForeignKey(s => s.CreatedById)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(s => s.TargetGroup)
                .WithMany()
                .HasForeignKey(s => s.TargetGroupId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // Register configuration
        modelBuilder.Entity<Register>(entity =>
        {
            entity.HasKey(r => r.Id);
        });

        // RegisterLimit configuration
        modelBuilder.Entity<RegisterLimit>(entity =>
        {
            entity.HasKey(rl => rl.Id);

            entity.HasIndex(rl => new { rl.EventId, rl.RegisterId }).IsUnique();

            entity.HasOne(rl => rl.Event)
                .WithMany(e => e.RegisterLimits)
                .HasForeignKey(rl => rl.EventId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(rl => rl.Register)
                .WithMany(r => r.Limits)
                .HasForeignKey(rl => rl.RegisterId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Seed default event categories with Musig Elgg colors
        modelBuilder.Entity<EventCategory>().HasData(
            new EventCategory
            {
                Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                Name = "Konzert",
                Description = "Öffentliche Konzerte und Auftritte",
                ColorHex = "#801010" // Burgundy
            },
            new EventCategory
            {
                Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                Name = "Probe",
                Description = "Reguläre Proben",
                ColorHex = "#C5A059" // Gold
            },
            new EventCategory
            {
                Id = Guid.Parse("33333333-3333-3333-3333-333333333333"),
                Name = "Vereinsanlass",
                Description = "Interne Vereinsanlässe",
                ColorHex = "#801010" // Burgundy
            }
        );
    }
}
