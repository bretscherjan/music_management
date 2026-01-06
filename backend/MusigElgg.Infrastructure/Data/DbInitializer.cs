using MusigElgg.Domain;
using MusigElgg.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace MusigElgg.Infrastructure.Data
{
    public static class DbInitializer
    {
        public static async Task InitializeAsync(AppDbContext context)
        {
            // Ensure database is created
            await context.Database.EnsureCreatedAsync();

            // Check if data already exists
            if (context.Users.Any())
            {
                return; // DB has been seeded
            }

            // 1. Seed Roles (If not already seeded by ModelBuilder, but let's ensure consistency)
            // ModelBuilder already seeds roles with specific IDs. We can just fetch them.
            var roles = await context.Roles.ToListAsync();
            
            // If for some reason empty (ensure created might have run before seeding in migration scenario?)
            // But EnsureCreated should trigger ModelData.
            // Let's rely on finding them.
            
            var adminRole = roles.FirstOrDefault(r => r.Name == "Admin");
            var boardRole = roles.FirstOrDefault(r => r.Name == "Board");
            var memberRole = roles.FirstOrDefault(r => r.Name == "Member");
            var conductorRole = roles.FirstOrDefault(r => r.Name == "Conductor") ?? new Role { Name = "Conductor", Level = 50 };
            
            // Ensure conductor exists if not seeded
            if (conductorRole.Id == 0) { context.Roles.Add(conductorRole); await context.SaveChangesAsync(); }

            // 2. Seed Users
            // Helper to create UserRole list
            List<UserRole> CreateRoles(params Role[] roles)
            {
                return roles.Where(r => r != null).Select(r => new UserRole { Role = r }).ToList();
            }

            var users = new List<User>
            {
                new User 
                { 
                    Email = "admin@musigelgg.ch", 
                    PasswordHash = "demo1234", 
                    FirstName = "System", 
                    LastName = "Admin",
                    UserRoles = CreateRoles(adminRole, boardRole, memberRole)
                },
                new User 
                { 
                    Email = "praesi@musigelgg.ch", 
                    PasswordHash = "demo1234", 
                    FirstName = "Hans", 
                    LastName = "Musterpräsident",
                    UserRoles = CreateRoles(boardRole, memberRole)
                },
                new User 
                { 
                    Email = "dirigent@musigelgg.ch", 
                    PasswordHash = "demo1234", 
                    FirstName = "Simon", 
                    LastName = "Taktstock",
                    UserRoles = CreateRoles(conductorRole, memberRole)
                },
                new User 
                { 
                    Email = "mitglied@musigelgg.ch", 
                    PasswordHash = "demo1234", 
                    FirstName = "Fritz", 
                    LastName = "Posaune",
                    UserRoles = CreateRoles(memberRole)
                }
            };

            context.Users.AddRange(users);
            await context.SaveChangesAsync();

            // 3. Seed Events
            var events = new List<Event>
            {
                new Event 
                { 
                    Title = "Musikprobe (Gesamt)", 
                    Description = "Vorbereitung Jahreskonzert - Fokus: Polka & Marsch. Bitte pünktlich!", 
                    Location = "Werkgebäude Elgg", 
                    StartTime = DateTime.Now.AddDays(2).AddHours(20), 
                    EndTime = DateTime.Now.AddDays(2).AddHours(22), 
                    Type = "Rehearsal" 
                },
                new Event 
                { 
                    Title = "Registerprobe (Holz)", 
                    Description = "Details folgen.", 
                    Location = "Singsaal Sekundarschule", 
                    StartTime = DateTime.Now.AddDays(5).AddHours(19).AddMinutes(30), 
                    EndTime = DateTime.Now.AddDays(5).AddHours(21), 
                    Type = "Rehearsal" 
                },
                new Event 
                { 
                    Title = "Jahreskonzert 2026", 
                    Description = "Unser Highlight des Jahres! Motto: 'Reise um die Welt'.", 
                    Location = "Gemeindesaal Elgg", 
                    StartTime = DateTime.Now.AddDays(30).AddHours(19).AddMinutes(30), 
                    EndTime = DateTime.Now.AddDays(30).AddHours(23), 
                    Type = "Concert" 
                },
                 new Event 
                { 
                    Title = "Vorstandssitzung", 
                    Description = "Budget 2027 und Traktanden GV.", 
                    Location = "Restaurant Löwen", 
                    StartTime = DateTime.Now.AddDays(10).AddHours(19), 
                    EndTime = DateTime.Now.AddDays(10).AddHours(22), 
                    Type = "Meeting" 
                }
            };

            context.Events.AddRange(events);
            await context.SaveChangesAsync();

            // 4. Seed Role Change Requests
            // Need to get IDs after save
            var requester = await context.Users.FirstAsync(u => u.Email == "mitglied@musigelgg.ch");
            var boardMember = await context.Users.FirstAsync(u => u.Email == "praesi@musigelgg.ch");
            
            var requests = new List<RoleChangeRequest>
            {
                new RoleChangeRequest
                {
                    TargetUserId = requester.Id,
                    NewRoleId = boardRole.Id,
                    RequestedByUserId = requester.Id, 
                    Status = RequestStatus.Pending,
                    CreatedAt = DateTime.Now.AddDays(-1)
                },
                 new RoleChangeRequest
                {
                    TargetUserId = requester.Id,
                    NewRoleId = conductorRole.Id,
                    RequestedByUserId = boardMember.Id, 
                    Status = RequestStatus.Pending,
                    CreatedAt = DateTime.Now.AddHours(-5)
                }
            };
            
            context.RoleChangeRequests.AddRange(requests);
            await context.SaveChangesAsync();
        }
    }
}
