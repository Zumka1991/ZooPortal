namespace ZooPortal.Api.Models;

public class Pet : BaseEntity
{
    public required string Name { get; set; }
    public required string Description { get; set; }
    public AnimalType? AnimalType { get; set; }
    public string? Breed { get; set; }
    public Gender? Gender { get; set; }
    public DateTime? BirthDate { get; set; }
    public int? AgeMonths { get; set; }

    // Основное фото (обязательное)
    public required string MainImageUrl { get; set; }

    // Видимость в общем каталоге
    public bool IsPublic { get; set; } = true;

    // Владелец
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    // Navigation
    public ICollection<PetImage> Images { get; set; } = [];
    public ICollection<PetLike> Likes { get; set; } = [];
    public ICollection<PetComment> Comments { get; set; } = [];
    public ICollection<Listing> Listings { get; set; } = [];
    public ICollection<GalleryImage> GalleryImages { get; set; } = [];
}
