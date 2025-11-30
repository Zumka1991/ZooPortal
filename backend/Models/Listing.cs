namespace ZooPortal.Api.Models;

public class Listing : BaseEntity
{
    public required string Title { get; set; }
    public required string Description { get; set; }
    public required AnimalType AnimalType { get; set; }
    public string? Breed { get; set; }
    public int? Age { get; set; } // в месяцах
    public Gender? Gender { get; set; }
    public required ListingType Type { get; set; }
    public decimal? Price { get; set; }
    public required string City { get; set; }
    public string? ContactPhone { get; set; }
    public ListingStatus Status { get; set; } = ListingStatus.Active;

    // Foreign keys
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public Guid? ShelterId { get; set; }
    public Shelter? Shelter { get; set; }

    // Navigation
    public ICollection<ListingImage> Images { get; set; } = [];
}

public class ListingImage : BaseEntity
{
    public required string Url { get; set; }
    public int Order { get; set; }

    public Guid ListingId { get; set; }
    public Listing Listing { get; set; } = null!;
}

public enum AnimalType
{
    Dog,
    Cat,
    Bird,
    Fish,
    Rodent,
    Reptile,
    Other
}

public enum Gender
{
    Male,
    Female
}

public enum ListingType
{
    Sale,       // Продажа
    Buy,        // Покупка
    GiveAway,   // Отдам в добрые руки
    Adoption    // Из приюта
}

public enum ListingStatus
{
    Active,
    Closed,
    Moderation
}
