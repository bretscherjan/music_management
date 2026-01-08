namespace MusigElgg.Data.Enums;

/// <summary>
/// Defines the roles a user can have in the system.
/// </summary>
public enum UserRole
{
    /// <summary>
    /// Regular member of the music association.
    /// </summary>
    Member = 0,

    /// <summary>
    /// Administrator with full access to all features.
    /// </summary>
    Admin = 1,

    /// <summary>
    /// Public user (limited access, e.g. guest or pending).
    /// </summary>
    Public = 2
}
