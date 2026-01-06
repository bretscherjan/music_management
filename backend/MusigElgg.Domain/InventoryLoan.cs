namespace MusigElgg.Domain;

public class InventoryLoan
{
    public int Id { get; set; }
    
    public int InventoryItemId { get; set; }
    public InventoryItem InventoryItem { get; set; } = null!;
    
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    
    public DateTime LoanedAt { get; set; }
    public DateTime? ReturnedAt { get; set; }
}
