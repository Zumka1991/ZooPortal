namespace ZooPortal.Api.Models;

public class StaticPage : BaseEntity
{
    public required string Slug { get; set; }           // 'about', 'contacts'
    public required string Title { get; set; }          // "О проекте"
    public required string Content { get; set; }        // Markdown контент
    public string? MetaDescription { get; set; }        // SEO
    public bool IsPublished { get; set; } = true;

    public Guid? LastEditedById { get; set; }
    public User? LastEditedBy { get; set; }
}
