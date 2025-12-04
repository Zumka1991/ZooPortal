namespace ZooPortal.Api.Models;

public class PetImage : BaseEntity
{
    public required string ImageUrl { get; set; }
    public required string FileName { get; set; }
    public bool IsMain { get; set; } = false;
    public int SortOrder { get; set; }

    public Guid PetId { get; set; }
    public Pet Pet { get; set; } = null!;
}
