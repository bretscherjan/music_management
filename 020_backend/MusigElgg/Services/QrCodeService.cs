using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace MusigElgg.Services;

/// <summary>
/// Service for generating and validating secure QR code tokens.
/// </summary>
public class QrCodeService
{
    private readonly string _secretKey;

    public QrCodeService(IConfiguration configuration)
    {
        // In production, this should be a secure key from Key Vault or similar
        _secretKey = configuration["QrCodeSettings:SecretKey"] ?? "dev-secret-key-must-be-very-long-and-secure-1234567890";
    }

    /// <summary>
    /// Generates a time-limited token for an event.
    /// Token format: Base64(Encrypted(EventId|ExpiryTicks))
    /// </summary>
    public string GenerateToken(Guid eventId, TimeSpan validity)
    {
        var expiry = DateTime.UtcNow.Add(validity).Ticks;
        var payload = $"{eventId}|{expiry}";
        
        return Encrypt(payload);
    }

    /// <summary>
    /// Validates a token and returns the EventId if valid.
    /// </summary>
    public Guid? ValidateToken(string token)
    {
        try
        {
            var payload = Decrypt(token);
            var parts = payload.Split('|');
            
            if (parts.Length != 2) return null;

            if (!Guid.TryParse(parts[0], out var eventId)) return null;
            if (!long.TryParse(parts[1], out var expiryTicks)) return null;

            var expiryDate = new DateTime(expiryTicks, DateTimeKind.Utc);
            
            if (DateTime.UtcNow > expiryDate) return null; // Expired

            return eventId;
        }
        catch
        {
            return null; // Invalid token format or decryption failed
        }
    }

    private string Encrypt(string plainText)
    {
        using var aes = Aes.Create();
        var key = SHA256.HashData(Encoding.UTF8.GetBytes(_secretKey)); // Generate 256-bit key from secret
        aes.Key = key;
        aes.GenerateIV();

        var iv = aes.IV;
        using var encryptor = aes.CreateEncryptor(aes.Key, iv);
        using var ms = new MemoryStream();
        using (var cs = new CryptoStream(ms, encryptor, CryptoStreamMode.Write))
        using (var sw = new StreamWriter(cs))
        {
            sw.Write(plainText);
        }

        var encrypted = ms.ToArray();
        
        // Combine IV and encrypted data
        var result = new byte[iv.Length + encrypted.Length];
        Buffer.BlockCopy(iv, 0, result, 0, iv.Length);
        Buffer.BlockCopy(encrypted, 0, result, iv.Length, encrypted.Length);

        return Convert.ToBase64String(result);
    }

    private string Decrypt(string cipherText)
    {
        var fullCipher = Convert.FromBase64String(cipherText);

        using var aes = Aes.Create();
        var key = SHA256.HashData(Encoding.UTF8.GetBytes(_secretKey));
        aes.Key = key;

        // Extract IV
        var iv = new byte[aes.BlockSize / 8];
        var cipher = new byte[fullCipher.Length - iv.Length];

        Buffer.BlockCopy(fullCipher, 0, iv, 0, iv.Length);
        Buffer.BlockCopy(fullCipher, iv.Length, cipher, 0, cipher.Length);

        aes.IV = iv;

        using var decryptor = aes.CreateDecryptor(aes.Key, aes.IV);
        using var ms = new MemoryStream(cipher);
        using var cs = new CryptoStream(ms, decryptor, CryptoStreamMode.Read);
        using var sr = new StreamReader(cs);

        return sr.ReadToEnd();
    }
}
