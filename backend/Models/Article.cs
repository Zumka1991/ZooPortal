namespace ZooPortal.Api.Models;

public class Article : BaseEntity
{
    public required string Title { get; set; }
    public required string Slug { get; set; }
    public required string Content { get; set; }
    public string? Summary { get; set; }
    public string? ImageUrl { get; set; }
    public required ArticleCategory Category { get; set; }
    public AnimalType? AnimalType { get; set; }
    public bool IsPublished { get; set; } = false;
    public DateTime? PublishedAt { get; set; }
    public int ViewCount { get; set; } = 0;

    // Foreign keys
    public Guid AuthorId { get; set; }
    public User Author { get; set; } = null!;
}

public enum ArticleCategory
{
    Care,       // Уход
    Health,     // Здоровье
    Nutrition,  // Питание
    Training,   // Воспитание
    Breeds,     // Породы
    News        // Новости
}
