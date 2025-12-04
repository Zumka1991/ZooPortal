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
    public string? ContactPhone { get; set; }
    public ListingStatus Status { get; set; } = ListingStatus.Moderation;

    // Город (связь со справочником)
    public Guid CityId { get; set; }
    public City City { get; set; } = null!;

    // Модерация
    public ModerationStatus ModerationStatus { get; set; } = ModerationStatus.Pending;
    public string? ModerationComment { get; set; }
    public DateTime? ModeratedAt { get; set; }
    public Guid? ModeratedById { get; set; }
    public User? ModeratedBy { get; set; }

    // Срок жизни объявления (30 дней по умолчанию)
    public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddDays(30);

    // Foreign keys
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public Guid? ShelterId { get; set; }
    public Shelter? Shelter { get; set; }

    public Guid? PetId { get; set; }
    public Pet? Pet { get; set; }

    // Navigation
    public ICollection<ListingImage> Images { get; set; } = [];
    public ICollection<ListingLike> Likes { get; set; } = [];
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
    Active,      // Активно (после одобрения модерации)
    Closed,      // Закрыто владельцем
    Expired,     // Истёк срок (30 дней)
    Moderation   // На модерации (начальный статус)
}
