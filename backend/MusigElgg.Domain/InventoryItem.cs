namespace MusigElgg.Domain;

public class InventoryItem
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty; // Instrument, Uniform, Stand
    public string SerialNumber { get; set; } = string.Empty;
    public string Condition { get; set; } = string.Empty;
    
    public ICollection<InventoryLoan> Loans { get; set; } = new List<InventoryLoan>();
}
