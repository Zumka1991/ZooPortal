namespace ZooPortal.Api.Models;

public class PetLike : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public Guid PetId { get; set; }
    public Pet Pet { get; set; } = null!;
}
