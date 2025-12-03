namespace ZooPortal.Api.Models;

public class ShelterImage : BaseEntity
{
    public required string ImageUrl { get; set; }
    public string? FileName { get; set; }
    public bool IsMain { get; set; } = false;
    public int SortOrder { get; set; } = 0;

    // Navigation
    public Guid ShelterId { get; set; }
    public Shelter Shelter { get; set; } = null!;
}
