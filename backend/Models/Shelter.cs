namespace ZooPortal.Api.Models;

public class Shelter : BaseEntity
{
    // Основная информация
    public required string Name { get; set; }
    public required string Description { get; set; }
    public string? ShortDescription { get; set; }
    public string? LogoUrl { get; set; }

    // Локация
    public Guid CityId { get; set; }
    public City City { get; set; } = null!;
    public required string Address { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }

    // Контакты
    public string? Phone { get; set; }
    public string? Phone2 { get; set; }
    public string? Email { get; set; }
    public string? Website { get; set; }
    public string? VkUrl { get; set; }
    public string? TelegramUrl { get; set; }
    public string? InstagramUrl { get; set; }

    // Статистика
    public int DogsCount { get; set; } = 0;
    public int CatsCount { get; set; } = 0;
    public int OtherAnimalsCount { get; set; } = 0;
    public int? FoundedYear { get; set; }
    public int? VolunteersCount { get; set; }

    // Дополнительно
    public string? WorkingHours { get; set; }
    public bool AcceptsVolunteers { get; set; } = true;
    public string? Needs { get; set; }

    // Реквизиты для пожертвований
    public string? DonationCardNumber { get; set; }
    public string? DonationCardHolder { get; set; }
    public string? DonationPhone { get; set; }
    public string? DonationDetails { get; set; }

    // Статусы
    public bool IsVerified { get; set; } = false;
    public bool IsActive { get; set; } = true;
    public ModerationStatus ModerationStatus { get; set; } = ModerationStatus.Pending;
    public string? ModerationComment { get; set; }
    public DateTime? ModeratedAt { get; set; }
    public Guid? ModeratedById { get; set; }
    public User? ModeratedBy { get; set; }

    // Владелец (кто добавил приют)
    public Guid? OwnerId { get; set; }
    public User? Owner { get; set; }

    // Navigation
    public ICollection<Listing> Listings { get; set; } = [];
    public ICollection<ShelterImage> Images { get; set; } = [];
}
