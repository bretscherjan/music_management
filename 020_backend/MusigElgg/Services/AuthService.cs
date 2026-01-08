using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Cryptography.KeyDerivation;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MusigElgg.Data;
using MusigElgg.Data.Entities;
using MusigElgg.Data.Enums;

namespace MusigElgg.Services;

public class AuthService
{
    private readonly MusigElggDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthService(MusigElggDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<User?> ValidateUserAsync(string email, string password)
    {
        var user = await _context.Users
            .Include(u => u.Register)
            .FirstOrDefaultAsync(u => u.Email == email);

        if (user == null) return null;

        // Verify password
        if (VerifyPassword(password, user.PasswordHash))
        {
            return user;
        }

        return null;
    }

    public async Task<User> RegisterUserAsync(string email, string password, string firstName, string lastName, string instrument)
    {
        // Check if user exists
        if (await _context.Users.AnyAsync(u => u.Email == email))
        {
            throw new Exception("User with this email already exists.");
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = email,
            FirstName = firstName,
            LastName = lastName,
            Instrument = instrument,
            PasswordHash = HashPassword(password),
            Role = UserRole.Public, // Default role for new signups
            Status = MembershipStatus.Pending,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return user;
    }

    public string GenerateJwtToken(User user)
    {
        var jwtSettings = _configuration.GetSection("JwtSettings");
        var key = Encoding.ASCII.GetBytes(jwtSettings["SecretKey"] ?? "dev-secret-key-CHANGE_IN_PRODUCTION_AND_MAKE_IT_LONG");
        
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.GivenName, user.FirstName),
            new(ClaimTypes.Surname, user.LastName),
            new(ClaimTypes.Role, user.Role.ToString())
        };

        if (user.RegisterId.HasValue)
        {
            claims.Add(new Claim("RegisterId", user.RegisterId.Value.ToString()));
            if (user.Register != null)
            {
                claims.Add(new Claim("RegisterName", user.Register.Name));
            }
        }

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddDays(7),
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature),
            Issuer = jwtSettings["Issuer"],
            Audience = jwtSettings["Audience"]
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    // Simple hashing using PBKDF2 (via RFC2898)
    private static string HashPassword(string password)
    {
        // Create salt
        byte[] salt = new byte[128 / 8];
        using (var rng = RandomNumberGenerator.Create())
        {
            rng.GetBytes(salt);
        }

        // Hash
        string hashed = Convert.ToBase64String(KeyDerivation.Pbkdf2(
            password: password,
            salt: salt,
            prf: KeyDerivationPrf.HMACSHA256,
            iterationCount: 100000,
            numBytesRequested: 256 / 8));

        // Format: salt.hash
        return $"{Convert.ToBase64String(salt)}.{hashed}";
    }

    private static bool VerifyPassword(string inputPassword, string storedHash)
    {
        var parts = storedHash.Split('.');
        if (parts.Length != 2) return false;

        var salt = Convert.FromBase64String(parts[0]);
        var originalHash = parts[1];

        string hashed = Convert.ToBase64String(KeyDerivation.Pbkdf2(
            password: inputPassword,
            salt: salt,
            prf: KeyDerivationPrf.HMACSHA256,
            iterationCount: 100000,
            numBytesRequested: 256 / 8));

        return originalHash == hashed;
    }
}
