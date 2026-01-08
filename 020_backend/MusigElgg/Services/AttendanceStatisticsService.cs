using System.Text;
using Microsoft.EntityFrameworkCore;
using MusigElgg.Data;
using MusigElgg.Data.Enums;
using MusigElgg.DTOs.Attendance;

namespace MusigElgg.Services;

/// <summary>
/// Service for calculating attendance statistics and generating reports.
/// </summary>
public class AttendanceStatisticsService
{
    private readonly MusigElggDbContext _context;

    public AttendanceStatisticsService(MusigElggDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Calculates attendance statistics for all users for a given year.
    /// </summary>
    public async Task<List<AttendanceStatisticsDto>> GetStatisticsAsync(int year)
    {
        var startDate = new DateTime(year, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var endDate = new DateTime(year, 12, 31, 23, 59, 59, DateTimeKind.Utc);

        // Get all past events for the year excluding cancelled ones
        var events = await _context.Events
            .Where(e => e.StartTime >= startDate && 
                        e.StartTime <= endDate && 
                        !e.IsCancelled && 
                        !e.IsDraft &&
                        e.StartTime < DateTime.UtcNow) // Only count past events
            .Select(e => e.Id)
            .ToListAsync();

        var users = await _context.Users
            .Include(u => u.Register)
            .Where(u => u.IsActive && u.Role == UserRole.Member)
            .ToListAsync();

        var participations = await _context.EventParticipants
            .Where(p => events.Contains(p.EventId))
            .ToListAsync();

        var stats = new List<AttendanceStatisticsDto>();

        foreach (var user in users)
        {
            var userParticipations = participations.Where(p => p.UserId == user.Id).ToList();
            
            var presentCount = userParticipations.Count(p => p.Status == AttendanceStatus.Present || p.Status == AttendanceStatus.Confirmed);
            var excusedCount = userParticipations.Count(p => p.Status == AttendanceStatus.Declined);
            var unexcusedCount = userParticipations.Count(p => p.Status == AttendanceStatus.Unexcused);
            
            // Pending/Missing participations count as Unexcused for past events? 
            // Or we just count explicit statuses. User Story implies we want percentages.
            // Let's assume TotalEvents is the number of events the user was *expected* to attend.
            // For simplicity, we assume all members are expected at all main events unless we have more complex logic.
            // Here we use the total number of events found as the base.
            
            var totalCount = events.Count; 
            
            // Calculate percentage
            double rate = totalCount > 0 ? (double)presentCount / totalCount * 100 : 0;

            stats.Add(new AttendanceStatisticsDto
            {
                UserId = user.Id,
                UserName = $"{user.FirstName} {user.LastName}",
                RegisterName = user.Register?.Name ?? "N/A",
                TotalEvents = totalCount,
                PresentCount = presentCount,
                ExcusedCount = excusedCount,
                UnexcusedCount = unexcusedCount, // Note: This doesn't auto-count missing entries as unexcused yet
                ParticipationRate = Math.Round(rate, 2)
            });
        }

        return stats.OrderByDescending(s => s.ParticipationRate).ThenBy(s => s.UserName).ToList();
    }

    /// <summary>
    /// Generates a CSV file byte array for the statistics.
    /// </summary>
    public async Task<byte[]> GenerateCsvExportAsync(int year)
    {
        var stats = await GetStatisticsAsync(year);
        var csv = new StringBuilder();

        // Header
        csv.AppendLine("Name;Register;Total Events;Present;Excused;Unexcused;Rate %");

        // Rows
        foreach (var stat in stats)
        {
            csv.AppendLine($"{EscapeCsv(stat.UserName)};{EscapeCsv(stat.RegisterName)};{stat.TotalEvents};{stat.PresentCount};{stat.ExcusedCount};{stat.UnexcusedCount};{stat.ParticipationRate}");
        }

        // Add BOM for Excel compatibility
        return Encoding.UTF8.GetPreamble().Concat(Encoding.UTF8.GetBytes(csv.ToString())).ToArray();
    }

    private static string EscapeCsv(string value)
    {
        if (string.IsNullOrEmpty(value)) return "";
        if (value.Contains(';') || value.Contains('"') || value.Contains('\n'))
        {
            return $"\"{value.Replace("\"", "\"\"")}\"";
        }
        return value;
    }
}
