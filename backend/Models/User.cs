namespace ZooPortal.Api.Models;

public class User : BaseEntity
{
    public required string Email { get; set; }
    public required string PasswordHash { get; set; }
    public required string Name { get; set; }
    public string? Phone { get; set; }
    public string? AvatarUrl { get; set; }
    public UserRole Role { get; set; } = UserRole.User;
    public bool IsActive { get; set; } = true;

    // Refresh token
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiresAt { get; set; }

    // Navigation
    public ICollection<Listing> Listings { get; set; } = [];
    public ICollection<LostFound> LostFoundPosts { get; set; } = [];
    public ICollection<GalleryImage> GalleryImages { get; set; } = [];
    public ICollection<Favorite> Favorites { get; set; } = [];
    public ICollection<ListingLike> ListingLikes { get; set; } = [];
    public ICollection<Pet> Pets { get; set; } = [];
    public ICollection<PetLike> PetLikes { get; set; } = [];
    public ICollection<PetComment> PetComments { get; set; } = [];
}

public enum UserRole
{
    User,
    Moderator,
    Admin
}
