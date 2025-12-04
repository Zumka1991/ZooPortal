namespace ZooPortal.Api.Models;

public class PetComment : BaseEntity
{
    public required string Text { get; set; }

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public Guid PetId { get; set; }
    public Pet Pet { get; set; } = null!;
}
