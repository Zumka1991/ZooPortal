namespace ZooPortal.Api.Models;

public class City : BaseEntity
{
    public required string Name { get; set; }
    public string? Region { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation
    public ICollection<Shelter> Shelters { get; set; } = [];
}
