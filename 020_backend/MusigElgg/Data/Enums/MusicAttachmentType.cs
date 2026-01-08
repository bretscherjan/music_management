namespace MusigElgg.Data.Enums;

/// <summary>
/// Type of music attachment.
/// </summary>
public enum MusicAttachmentType
{
    /// <summary>
    /// PDF sheet music (Notenblatt).
    /// </summary>
    Pdf = 0,

    /// <summary>
    /// Audio reference recording (Referenzaufnahme).
    /// </summary>
    Audio = 1,

    /// <summary>
    /// Image (e.g., cover, handwritten notes).
    /// </summary>
    Image = 2,

    /// <summary>
    /// Other file type.
    /// </summary>
    Other = 3
}
