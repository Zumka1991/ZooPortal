namespace ZooPortal.Api.Models;

public class Conversation : BaseEntity
{
    // Участники диалога
    public Guid User1Id { get; set; }
    public User User1 { get; set; } = null!;

    public Guid User2Id { get; set; }
    public User User2 { get; set; } = null!;

    // Опциональная привязка к объявлению или потеряшке
    public Guid? ListingId { get; set; }
    public Listing? Listing { get; set; }

    public Guid? LostFoundId { get; set; }
    public LostFound? LostFound { get; set; }

    // Последнее сообщение (для сортировки и превью)
    public DateTime? LastMessageAt { get; set; }
    public string? LastMessageText { get; set; }

    // Сообщения
    public ICollection<Message> Messages { get; set; } = [];
}
