using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ZooPortal.Api.Data;
using ZooPortal.Api.DTOs;
using ZooPortal.Api.Models;
using ZooPortal.Api.Services;

namespace ZooPortal.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PetsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IWebHostEnvironment _environment;
    private readonly IConfiguration _configuration;
    private readonly IImageOptimizationService _imageOptimization;

    private static readonly string[] AllowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    private const long MaxFileSize = 10 * 1024 * 1024; // 10MB

    public PetsController(
        ApplicationDbContext context,
        IWebHostEnvironment environment,
        IConfiguration configuration,
        IImageOptimizationService imageOptimization)
    {
        _context = context;
        _environment = environment;
        _configuration = configuration;
        _imageOptimization = imageOptimization;
    }

    private Guid? GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(userIdClaim, out var userId) ? userId : null;
    }

    // GET: api/pets - Public catalog
    [HttpGet]
    public async Task<ActionResult<PetsPagedResponse>> GetPets(
        [FromQuery] AnimalType? animalType,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12)
    {
        var userId = GetUserId();
        var likeIds = userId.HasValue
            ? await _context.PetLikes
                .Where(l => l.UserId == userId.Value)
                .Select(l => l.PetId)
                .ToListAsync()
            : [];

        var query = _context.Pets
            .Include(p => p.User)
            .Include(p => p.Likes)
            .Where(p => p.IsPublic);

        if (animalType.HasValue)
            query = query.Where(p => p.AnimalType == animalType.Value);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(p =>
                p.Name.ToLower().Contains(searchLower) ||
                (p.Breed != null && p.Breed.ToLower().Contains(searchLower)) ||
                p.Description.ToLower().Contains(searchLower));
        }

        query = query.OrderByDescending(p => p.CreatedAt);

        var totalCount = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => MapToListDto(p, likeIds))
            .ToListAsync();

        return Ok(new PetsPagedResponse(items, totalCount, page, pageSize, totalPages));
    }

    // GET: api/pets/{id} - Pet details
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<PetDetailDto>> GetPet(Guid id)
    {
        var userId = GetUserId();
        var likeIds = userId.HasValue
            ? await _context.PetLikes
                .Where(l => l.UserId == userId.Value && l.PetId == id)
                .Select(l => l.PetId)
                .ToListAsync()
            : [];

        var pet = await _context.Pets
            .Include(p => p.User)
            .Include(p => p.Images.OrderBy(i => i.SortOrder))
            .Include(p => p.Likes)
            .Include(p => p.Comments)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (pet == null)
            return NotFound(new { message = "Питомец не найден" });

        // Public access only to public pets
        if (!pet.IsPublic && (!userId.HasValue || pet.UserId != userId.Value))
            return NotFound(new { message = "Питомец не найден" });

        return Ok(MapToDetailDto(pet, likeIds));
    }

    // GET: api/pets/my - User's pets
    [Authorize]
    [HttpGet("my")]
    public async Task<ActionResult<List<PetListDto>>> GetMyPets()
    {
        var userId = GetUserId();
        if (!userId.HasValue)
            return Unauthorized();

        var likeIds = await _context.PetLikes
            .Where(l => l.UserId == userId.Value)
            .Select(l => l.PetId)
            .ToListAsync();

        var pets = await _context.Pets
            .Include(p => p.User)
            .Include(p => p.Likes)
            .Where(p => p.UserId == userId.Value)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => MapToListDto(p, likeIds))
            .ToListAsync();

        return Ok(pets);
    }

    // GET: api/pets/my/simple - User's pets (simplified for forms)
    [Authorize]
    [HttpGet("my/simple")]
    public async Task<ActionResult<List<UserPetDto>>> GetMyPetsSimple()
    {
        var userId = GetUserId();
        if (!userId.HasValue)
            return Unauthorized();

        var pets = await _context.Pets
            .Where(p => p.UserId == userId.Value)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new UserPetDto(
                p.Id,
                p.Name,
                p.AnimalType,
                p.MainImageUrl))
            .ToListAsync();

        return Ok(pets);
    }

    // POST: api/pets - Create pet
    [Authorize]
    [HttpPost]
    public async Task<ActionResult<PetDetailDto>> CreatePet(
        [FromForm] CreatePetRequest request,
        [FromForm] IFormFile mainImage)
    {
        var userId = GetUserId();
        if (!userId.HasValue)
            return Unauthorized();

        if (mainImage == null)
            return BadRequest(new { message = "Основное фото обязательно" });

        // Validate file
        var extension = Path.GetExtension(mainImage.FileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(extension))
            return BadRequest(new { message = "Недопустимый формат файла" });

        if (mainImage.Length > MaxFileSize)
            return BadRequest(new { message = "Файл слишком большой (макс. 10MB)" });

        // Upload and optimize image
        var fileName = $"{Guid.NewGuid()}.jpg";

        // Optimize and save
        await using var inputStream = mainImage.OpenReadStream();
        await _imageOptimization.OptimizeAndSaveAsync(inputStream, fileName, "pets", maxWidth: 1920, quality: 85);

        // Build URL
        var baseUrl = _configuration["App:BaseUrl"] ?? $"{Request.Scheme}://{Request.Host}";
        var imageUrl = $"{baseUrl}/uploads/pets/{fileName}";

        // Create pet
        var pet = new Pet
        {
            Name = request.Name,
            Description = request.Description,
            AnimalType = request.AnimalType,
            Breed = request.Breed,
            Gender = request.Gender,
            BirthDate = request.BirthDate,
            AgeMonths = request.AgeMonths,
            MainImageUrl = imageUrl,
            IsPublic = request.IsPublic,
            UserId = userId.Value
        };

        _context.Pets.Add(pet);
        await _context.SaveChangesAsync();

        // Reload with includes
        pet = await _context.Pets
            .Include(p => p.User)
            .Include(p => p.Images)
            .Include(p => p.Likes)
            .Include(p => p.Comments)
            .FirstAsync(p => p.Id == pet.Id);

        return CreatedAtAction(nameof(GetPet), new { id = pet.Id }, MapToDetailDto(pet, []));
    }

    // PUT: api/pets/{id} - Update pet
    [Authorize]
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<PetDetailDto>> UpdatePet(Guid id, [FromBody] UpdatePetRequest request)
    {
        var userId = GetUserId();
        if (!userId.HasValue)
            return Unauthorized();

        var pet = await _context.Pets
            .Include(p => p.User)
            .Include(p => p.Images)
            .Include(p => p.Likes)
            .Include(p => p.Comments)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (pet == null)
            return NotFound(new { message = "Питомец не найден" });

        if (pet.UserId != userId.Value)
            return Forbid();

        // Update fields
        pet.Name = request.Name;
        pet.Description = request.Description;
        pet.AnimalType = request.AnimalType;
        pet.Breed = request.Breed;
        pet.Gender = request.Gender;
        pet.BirthDate = request.BirthDate;
        pet.AgeMonths = request.AgeMonths;
        pet.IsPublic = request.IsPublic;

        await _context.SaveChangesAsync();

        var likeIds = await _context.PetLikes
            .Where(l => l.UserId == userId.Value && l.PetId == id)
            .Select(l => l.PetId)
            .ToListAsync();

        return Ok(MapToDetailDto(pet, likeIds));
    }

    // DELETE: api/pets/{id} - Delete pet
    [Authorize]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeletePet(Guid id)
    {
        var userId = GetUserId();
        if (!userId.HasValue)
            return Unauthorized();

        var pet = await _context.Pets.FirstOrDefaultAsync(p => p.Id == id);

        if (pet == null)
            return NotFound(new { message = "Питомец не найден" });

        if (pet.UserId != userId.Value)
            return Forbid();

        // Delete main image
        var mainImageUri = new Uri(pet.MainImageUrl, UriKind.RelativeOrAbsolute);
        var mainImageRelativePath = mainImageUri.IsAbsoluteUri ? mainImageUri.AbsolutePath : pet.MainImageUrl;
        var mainImagePath = Path.Combine(_environment.ContentRootPath, mainImageRelativePath.TrimStart('/'));
        if (System.IO.File.Exists(mainImagePath))
            System.IO.File.Delete(mainImagePath);

        // Delete additional images
        var images = await _context.PetImages.Where(i => i.PetId == id).ToListAsync();
        foreach (var image in images)
        {
            var imageUri = new Uri(image.ImageUrl, UriKind.RelativeOrAbsolute);
            var imageRelativePath = imageUri.IsAbsoluteUri ? imageUri.AbsolutePath : image.ImageUrl;
            var imagePath = Path.Combine(_environment.ContentRootPath, imageRelativePath.TrimStart('/'));
            if (System.IO.File.Exists(imagePath))
                System.IO.File.Delete(imagePath);
        }

        _context.Pets.Remove(pet);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // POST: api/pets/{id}/images - Add image to pet
    [Authorize]
    [HttpPost("{id:guid}/images")]
    public async Task<ActionResult<PetImageDto>> AddPetImage(Guid id, [FromForm] IFormFile image)
    {
        var userId = GetUserId();
        if (!userId.HasValue)
            return Unauthorized();

        var pet = await _context.Pets.FirstOrDefaultAsync(p => p.Id == id);
        if (pet == null)
            return NotFound(new { message = "Питомец не найден" });

        if (pet.UserId != userId.Value)
            return Forbid();

        if (image == null)
            return BadRequest(new { message = "Файл обязателен" });

        // Validate file
        var extension = Path.GetExtension(image.FileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(extension))
            return BadRequest(new { message = "Недопустимый формат файла" });

        if (image.Length > MaxFileSize)
            return BadRequest(new { message = "Файл слишком большой (макс. 10MB)" });

        // Generate filename and optimize
        var fileName = $"{Guid.NewGuid()}.jpg";

        // Optimize and save
        await using var inputStream = image.OpenReadStream();
        await _imageOptimization.OptimizeAndSaveAsync(inputStream, fileName, "pets", maxWidth: 1920, quality: 85);

        // Build URL
        var baseUrl = _configuration["App:BaseUrl"] ?? $"{Request.Scheme}://{Request.Host}";
        var imageUrl = $"{baseUrl}/uploads/pets/{fileName}";

        // Get next sort order
        var maxOrder = await _context.PetImages
            .Where(i => i.PetId == id)
            .Select(i => (int?)i.SortOrder)
            .MaxAsync() ?? -1;

        var petImage = new PetImage
        {
            ImageUrl = imageUrl,
            FileName = fileName,
            PetId = id,
            IsMain = false,
            SortOrder = maxOrder + 1
        };

        _context.PetImages.Add(petImage);
        await _context.SaveChangesAsync();

        return Ok(new PetImageDto(petImage.Id, petImage.ImageUrl, petImage.IsMain, petImage.SortOrder));
    }

    // DELETE: api/pets/{id}/images/{imageId} - Delete image
    [Authorize]
    [HttpDelete("{id:guid}/images/{imageId:guid}")]
    public async Task<IActionResult> DeletePetImage(Guid id, Guid imageId)
    {
        var userId = GetUserId();
        if (!userId.HasValue)
            return Unauthorized();

        var pet = await _context.Pets.FirstOrDefaultAsync(p => p.Id == id);
        if (pet == null)
            return NotFound(new { message = "Питомец не найден" });

        if (pet.UserId != userId.Value)
            return Forbid();

        var image = await _context.PetImages.FirstOrDefaultAsync(i => i.Id == imageId && i.PetId == id);
        if (image == null)
            return NotFound(new { message = "Фото не найдено" });

        // Delete file
        var imageUri = new Uri(image.ImageUrl, UriKind.RelativeOrAbsolute);
        var imageRelativePath = imageUri.IsAbsoluteUri ? imageUri.AbsolutePath : image.ImageUrl;
        var imagePath = Path.Combine(_environment.ContentRootPath, imageRelativePath.TrimStart('/'));
        if (System.IO.File.Exists(imagePath))
            System.IO.File.Delete(imagePath);

        _context.PetImages.Remove(image);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // PUT: api/pets/{id}/images/{imageId}/main - Set as main image
    [Authorize]
    [HttpPut("{id:guid}/images/{imageId:guid}/main")]
    public async Task<IActionResult> SetMainImage(Guid id, Guid imageId)
    {
        var userId = GetUserId();
        if (!userId.HasValue)
            return Unauthorized();

        var pet = await _context.Pets
            .Include(p => p.Images)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (pet == null)
            return NotFound(new { message = "Питомец не найден" });

        if (pet.UserId != userId.Value)
            return Forbid();

        var image = pet.Images.FirstOrDefault(i => i.Id == imageId);
        if (image == null)
            return NotFound(new { message = "Фото не найдено" });

        // Update main image URL
        pet.MainImageUrl = image.ImageUrl;

        // Reset all IsMain flags
        foreach (var img in pet.Images)
            img.IsMain = false;

        // Set new main
        image.IsMain = true;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // POST: api/pets/{id}/like - Like pet
    [Authorize]
    [HttpPost("{id:guid}/like")]
    public async Task<IActionResult> LikePet(Guid id)
    {
        var userId = GetUserId();
        if (!userId.HasValue)
            return Unauthorized();

        var pet = await _context.Pets.FirstOrDefaultAsync(p => p.Id == id);
        if (pet == null)
            return NotFound(new { message = "Питомец не найден" });

        var existingLike = await _context.PetLikes
            .FirstOrDefaultAsync(l => l.PetId == id && l.UserId == userId.Value);

        if (existingLike != null)
            return BadRequest(new { message = "Вы уже лайкнули этого питомца" });

        var like = new PetLike
        {
            PetId = id,
            UserId = userId.Value
        };

        _context.PetLikes.Add(like);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Лайк добавлен" });
    }

    // DELETE: api/pets/{id}/like - Unlike pet
    [Authorize]
    [HttpDelete("{id:guid}/like")]
    public async Task<IActionResult> UnlikePet(Guid id)
    {
        var userId = GetUserId();
        if (!userId.HasValue)
            return Unauthorized();

        var like = await _context.PetLikes
            .FirstOrDefaultAsync(l => l.PetId == id && l.UserId == userId.Value);

        if (like == null)
            return NotFound(new { message = "Лайк не найден" });

        _context.PetLikes.Remove(like);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // GET: api/pets/{id}/comments - Get comments
    [HttpGet("{id:guid}/comments")]
    public async Task<ActionResult<List<PetCommentDto>>> GetComments(Guid id)
    {
        var pet = await _context.Pets.FirstOrDefaultAsync(p => p.Id == id);
        if (pet == null)
            return NotFound(new { message = "Питомец не найден" });

        var comments = await _context.PetComments
            .Include(c => c.User)
            .Where(c => c.PetId == id)
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new PetCommentDto(
                c.Id,
                c.Text,
                new PetOwnerDto(c.User.Id, c.User.Name, c.User.AvatarUrl),
                c.CreatedAt))
            .ToListAsync();

        return Ok(comments);
    }

    // POST: api/pets/{id}/comments - Add comment
    [Authorize]
    [HttpPost("{id:guid}/comments")]
    public async Task<ActionResult<PetCommentDto>> AddComment(Guid id, [FromBody] CreatePetCommentRequest request)
    {
        var userId = GetUserId();
        if (!userId.HasValue)
            return Unauthorized();

        var pet = await _context.Pets.FirstOrDefaultAsync(p => p.Id == id);
        if (pet == null)
            return NotFound(new { message = "Питомец не найден" });

        var comment = new PetComment
        {
            Text = request.Text,
            PetId = id,
            UserId = userId.Value
        };

        _context.PetComments.Add(comment);
        await _context.SaveChangesAsync();

        // Reload with user
        comment = await _context.PetComments
            .Include(c => c.User)
            .FirstAsync(c => c.Id == comment.Id);

        return Ok(new PetCommentDto(
            comment.Id,
            comment.Text,
            new PetOwnerDto(comment.User.Id, comment.User.Name, comment.User.AvatarUrl),
            comment.CreatedAt));
    }

    // DELETE: api/pets/{id}/comments/{commentId} - Delete comment
    [Authorize]
    [HttpDelete("{id:guid}/comments/{commentId:guid}")]
    public async Task<IActionResult> DeleteComment(Guid id, Guid commentId)
    {
        var userId = GetUserId();
        if (!userId.HasValue)
            return Unauthorized();

        var comment = await _context.PetComments
            .FirstOrDefaultAsync(c => c.Id == commentId && c.PetId == id);

        if (comment == null)
            return NotFound(new { message = "Комментарий не найден" });

        if (comment.UserId != userId.Value)
            return Forbid();

        _context.PetComments.Remove(comment);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // Helper methods for mapping
    private static PetListDto MapToListDto(Pet pet, List<Guid> likeIds)
    {
        return new PetListDto(
            pet.Id,
            pet.Name,
            pet.Description.Length > 150 ? pet.Description[..150] + "..." : pet.Description,
            pet.AnimalType,
            pet.Breed,
            pet.Gender,
            pet.AgeMonths,
            pet.MainImageUrl,
            new PetOwnerDto(pet.User.Id, pet.User.Name, pet.User.AvatarUrl),
            pet.Likes.Count,
            likeIds.Contains(pet.Id),
            pet.CreatedAt
        );
    }

    private static PetDetailDto MapToDetailDto(Pet pet, List<Guid> likeIds)
    {
        return new PetDetailDto(
            pet.Id,
            pet.Name,
            pet.Description,
            pet.AnimalType,
            pet.Breed,
            pet.Gender,
            pet.BirthDate,
            pet.AgeMonths,
            pet.MainImageUrl,
            pet.IsPublic,
            new PetOwnerDto(pet.User.Id, pet.User.Name, pet.User.AvatarUrl),
            pet.Images.Select(i => new PetImageDto(i.Id, i.ImageUrl, i.IsMain, i.SortOrder)).ToList(),
            pet.Likes.Count,
            likeIds.Contains(pet.Id),
            pet.Comments.Count,
            pet.CreatedAt,
            pet.UpdatedAt
        );
    }
}
