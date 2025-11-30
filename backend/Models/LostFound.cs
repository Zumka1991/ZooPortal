namespace ZooPortal.Api.Models;

public class LostFound : BaseEntity
{
    public required string Title { get; set; }
    public required string Description { get; set; }
    public required LostFoundType Type { get; set; }
    public required AnimalType AnimalType { get; set; }
    public string? Breed { get; set; }
    public string? Color { get; set; }
    public required string City { get; set; }
    public string? Address { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public DateTime EventDate { get; set; }
    public string? ContactPhone { get; set; }
    public LostFoundStatus Status { get; set; } = LostFoundStatus.Active;

    // Foreign keys
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    // Navigation
    public ICollection<LostFoundImage> Images { get; set; } = [];
}

public class LostFoundImage : BaseEntity
{
    public required string Url { get; set; }
    public int Order { get; set; }

    public Guid LostFoundId { get; set; }
    public LostFound LostFound { get; set; } = null!;
}

public enum LostFoundType
{
    Lost,   // Потерял
    Found   // Нашёл
}

public enum LostFoundStatus
{
    Active,
    Resolved,
    Closed
}
