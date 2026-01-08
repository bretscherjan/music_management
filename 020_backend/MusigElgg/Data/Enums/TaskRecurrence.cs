namespace MusigElgg.Data.Enums;

/// <summary>
/// Defines the recurrence pattern for recurring tasks.
/// </summary>
public enum TaskRecurrence
{
    /// <summary>
    /// No recurrence, one-time task.
    /// </summary>
    None = 0,

    /// <summary>
    /// Task repeats daily.
    /// </summary>
    Daily = 1,

    /// <summary>
    /// Task repeats weekly.
    /// </summary>
    Weekly = 2,

    /// <summary>
    /// Task repeats monthly.
    /// </summary>
    Monthly = 3,

    /// <summary>
    /// Task repeats yearly.
    /// </summary>
    Yearly = 4
}
