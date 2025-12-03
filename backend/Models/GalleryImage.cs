namespace ZooPortal.Api.Models;

public class GalleryImage : BaseEntity
{
    public required string Title { get; set; }
    public required string ImageUrl { get; set; }
    public string? FileName { get; set; }

    public ModerationStatus Status { get; set; } = ModerationStatus.Pending;
    public string? ModerationComment { get; set; }
    public DateTime? ModeratedAt { get; set; }
    public Guid? ModeratedById { get; set; }
    public User? ModeratedBy { get; set; }

    // Owner
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
}

public enum ModerationStatus
{
    Pending,
    Approved,
    Rejected
}
