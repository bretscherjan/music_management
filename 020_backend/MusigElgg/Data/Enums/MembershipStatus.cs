namespace MusigElgg.Data.Enums;

/// <summary>
/// Defines the status of a member within the association.
/// </summary>
public enum MembershipStatus
{
    /// <summary>
    /// Pending approval (new registration).
    /// </summary>
    Pending = 0,

    /// <summary>
    /// Active member participating in rehearsals/concerts.
    /// </summary>
    Active = 1,

    /// <summary>
    /// Passive member (financially supporting or on break).
    /// </summary>
    Passive = 2,

    /// <summary>
    /// Honorary member (Ehrenmitglied).
    /// </summary>
    Honorary = 3
}
