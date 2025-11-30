namespace ZooPortal.Api.Models;

public class Shelter : BaseEntity
{
    public required string Name { get; set; }
    public required string Description { get; set; }
    public required string City { get; set; }
    public required string Address { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Website { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public string? ImageUrl { get; set; }
    public bool IsVerified { get; set; } = false;
    public bool IsActive { get; set; } = true;

    // Navigation
    public ICollection<Listing> Listings { get; set; } = [];
}
