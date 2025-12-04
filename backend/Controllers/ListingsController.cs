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
public class ListingsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IWebHostEnvironment _environment;
    private readonly IConfiguration _configuration;
    private readonly IImageOptimizationService _imageOptimization;

    private static readonly string[] AllowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    private const long MaxFileSize = 10 * 1024 * 1024; // 10MB (до оптимизации)

    public ListingsController(
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

    // GET: api/listings
    [HttpGet]
    public async Task<ActionResult<ListingsPagedResponse>> GetListings(
        [FromQuery] ListingType? type,
        [FromQuery] AnimalType? animalType,
        [FromQuery] Guid? cityId,
        [FromQuery] decimal? minPrice,
        [FromQuery] decimal? maxPrice,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12)
    {
        var userId = GetUserId();
        var favoriteIds = userId.HasValue
            ? await _context.Favorites
                .Where(f => f.UserId == userId.Value)
                .Select(f => f.ListingId)
                .ToListAsync()
            : [];

        var likeIds = userId.HasValue
            ? await _context.ListingLikes
                .Where(l => l.UserId == userId.Value)
                .Select(l => l.ListingId)
                .ToListAsync()
            : [];

        var query = _context.Listings
            .Include(l => l.City)
            .Include(l => l.Images)
            .Include(l => l.Shelter)
            .Include(l => l.Likes)
            .Where(l => l.ModerationStatus == ModerationStatus.Approved
                     && l.Status == ListingStatus.Active
                     && l.ExpiresAt > DateTime.UtcNow);

        if (type.HasValue)
            query = query.Where(l => l.Type == type.Value);

        if (animalType.HasValue)
            query = query.Where(l => l.AnimalType == animalType.Value);

        if (cityId.HasValue)
            query = query.Where(l => l.CityId == cityId.Value);

        if (minPrice.HasValue)
            query = query.Where(l => l.Price >= minPrice.Value);

        if (maxPrice.HasValue)
            query = query.Where(l => l.Price <= maxPrice.Value);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(l =>
                l.Title.ToLower().Contains(searchLower) ||
                (l.Breed != null && l.Breed.ToLower().Contains(searchLower)) ||
                l.Description.ToLower().Contains(searchLower));
        }

        query = query.OrderByDescending(l => l.CreatedAt);

        var totalCount = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(l => MapToListDto(l, favoriteIds, likeIds))
            .ToListAsync();

        return Ok(new ListingsPagedResponse(items, totalCount, page, pageSize, totalPages));
    }

    // GET: api/listings/{id}
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ListingDetailDto>> GetListing(Guid id)
    {
        var userId = GetUserId();
        var favoriteIds = userId.HasValue
            ? await _context.Favorites
                .Where(f => f.UserId == userId.Value && f.ListingId == id)
                .Select(f => f.ListingId)
                .ToListAsync()
            : [];

        var likeIds = userId.HasValue
            ? await _context.ListingLikes
                .Where(l => l.UserId == userId.Value && l.ListingId == id)
                .Select(l => l.ListingId)
                .ToListAsync()
            : [];

        var listing = await _context.Listings
            .Include(l => l.City)
            .Include(l => l.User)
            .Include(l => l.Shelter)
            .Include(l => l.Images)
            .Include(l => l.Likes)
            .FirstOrDefaultAsync(l => l.Id == id);

        if (listing == null)
            return NotFound(new { message = "Объявление не найдено" });

        // Публичный доступ только к одобренным и активным
        if (listing.ModerationStatus != ModerationStatus.Approved ||
            listing.Status != ListingStatus.Active)
        {
            // Но владелец может видеть свои объявления
            if (userId != listing.UserId)
                return NotFound(new { message = "Объявление не найдено" });
        }

        return Ok(MapToDetailDto(listing, favoriteIds, likeIds));
    }

    // GET: api/listings/{id}/contact
    [HttpGet("{id:guid}/contact")]
    public async Task<ActionResult<ShowContactResponse>> GetContact(Guid id)
    {
        var listing = await _context.Listings
            .Where(l => l.Id == id
                     && l.ModerationStatus == ModerationStatus.Approved
                     && l.Status == ListingStatus.Active)
            .Select(l => new { l.ContactPhone })
            .FirstOrDefaultAsync();

        if (listing == null)
            return NotFound(new { message = "Объявление не найдено" });

        return Ok(new ShowContactResponse(listing.ContactPhone));
    }

    // GET: api/listings/my
    [HttpGet("my")]
    [Authorize]
    public async Task<ActionResult<ListingsPagedResponse>> GetMyListings(
        [FromQuery] ListingStatus? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12)
    {
        var userId = GetUserId();
        if (!userId.HasValue)
            return Unauthorized();

        var favoriteIds = await _context.Favorites
            .Where(f => f.UserId == userId.Value)
            .Select(f => f.ListingId)
            .ToListAsync();

        var likeIds = await _context.ListingLikes
            .Where(l => l.UserId == userId.Value)
            .Select(l => l.ListingId)
            .ToListAsync();

        var query = _context.Listings
            .Include(l => l.City)
            .Include(l => l.Images)
            .Include(l => l.Shelter)
            .Include(l => l.Likes)
            .Where(l => l.UserId == userId.Value);

        if (status.HasValue)
            query = query.Where(l => l.Status == status.Value);

        query = query.OrderByDescending(l => l.CreatedAt);

        var totalCount = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(l => MapToListDto(l, favoriteIds, likeIds))
            .ToListAsync();

        return Ok(new ListingsPagedResponse(items, totalCount, page, pageSize, totalPages));
    }

    // POST: api/listings
    [HttpPost]
    [Authorize]
    public async Task<ActionResult<ListingDetailDto>> CreateListing([FromBody] CreateListingRequest request)
    {
        var userId = GetUserId();
        if (!userId.HasValue)
            return Unauthorized();

        // Валидация города
        var city = await _context.Cities.FindAsync(request.CityId);
        if (city == null)
            return BadRequest(new { message = "Город не найден" });

        // Если тип Adoption, проверяем приют
        Shelter? shelter = null;
        if (request.Type == ListingType.Adoption)
        {
            if (!request.ShelterId.HasValue)
                return BadRequest(new { message = "Для объявления из приюта необходимо указать приют" });

            shelter = await _context.Shelters
                .FirstOrDefaultAsync(s => s.Id == request.ShelterId.Value && s.OwnerId == userId.Value);

            if (shelter == null)
                return BadRequest(new { message = "Приют не найден или вы не являетесь его владельцем" });
        }

        // Validate pet ownership if provided
        if (request.PetId.HasValue)
        {
            var pet = await _context.Pets.FindAsync(request.PetId.Value);
            if (pet == null || pet.UserId != userId.Value)
                return BadRequest(new { message = "Питомец не найден или вы не являетесь его владельцем" });
        }

        var listing = new Listing
        {
            Title = request.Title,
            Description = request.Description,
            AnimalType = request.AnimalType,
            Breed = request.Breed,
            Age = request.Age,
            Gender = request.Gender,
            Type = request.Type,
            Price = request.Price,
            CityId = request.CityId,
            ContactPhone = request.ContactPhone,
            UserId = userId.Value,
            ShelterId = shelter?.Id,
            PetId = request.PetId,
            Status = ListingStatus.Moderation,
            ModerationStatus = ModerationStatus.Pending,
            ExpiresAt = DateTime.UtcNow.AddDays(30)
        };

        _context.Listings.Add(listing);
        await _context.SaveChangesAsync();

        // Загружаем связанные данные для ответа
        await _context.Entry(listing).Reference(l => l.City).LoadAsync();
        await _context.Entry(listing).Reference(l => l.User).LoadAsync();
        await _context.Entry(listing).Collection(l => l.Images).LoadAsync();
        if (shelter != null)
            await _context.Entry(listing).Reference(l => l.Shelter).LoadAsync();

        return CreatedAtAction(nameof(GetListing), new { id = listing.Id }, MapToDetailDto(listing, [], []));
    }

    // PUT: api/listings/{id}
    [HttpPut("{id:guid}")]
    [Authorize]
    public async Task<ActionResult<ListingDetailDto>> UpdateListing(Guid id, [FromBody] UpdateListingRequest request)
    {
        var userId = GetUserId();
        if (!userId.HasValue)
            return Unauthorized();

        var listing = await _context.Listings
            .Include(l => l.City)
            .Include(l => l.User)
            .Include(l => l.Shelter)
            .Include(l => l.Images)
            .Include(l => l.Likes)
            .FirstOrDefaultAsync(l => l.Id == id);

        if (listing == null)
            return NotFound(new { message = "Объявление не найдено" });

        if (listing.UserId != userId.Value && !User.IsInRole("Admin"))
            return Forbid();

        // Валидация города
        var city = await _context.Cities.FindAsync(request.CityId);
        if (city == null)
            return BadRequest(new { message = "Город не найден" });

        // Validate pet ownership if provided
        if (request.PetId.HasValue)
        {
            var pet = await _context.Pets.FindAsync(request.PetId.Value);
            if (pet == null || pet.UserId != userId.Value)
                return BadRequest(new { message = "Питомец не найден или вы не являетесь его владельцем" });
        }

        listing.Title = request.Title;
        listing.Description = request.Description;
        listing.AnimalType = request.AnimalType;
        listing.Breed = request.Breed;
        listing.Age = request.Age;
        listing.Gender = request.Gender;
        listing.Type = request.Type;
        listing.Price = request.Price;
        listing.CityId = request.CityId;
        listing.ContactPhone = request.ContactPhone;
        listing.PetId = request.PetId;

        await _context.SaveChangesAsync();

        var favoriteIds = await _context.Favorites
            .Where(f => f.UserId == userId.Value && f.ListingId == id)
            .Select(f => f.ListingId)
            .ToListAsync();

        var likeIds = await _context.ListingLikes
            .Where(l => l.UserId == userId.Value && l.ListingId == id)
            .Select(l => l.ListingId)
            .ToListAsync();

        return Ok(MapToDetailDto(listing, favoriteIds, likeIds));
    }

    // POST: api/listings/{id}/images
    [HttpPost("{id:guid}/images")]
    [Authorize]
    public async Task<ActionResult<ListingDetailDto>> AddImage(Guid id, IFormFile file)
    {
        var userId = GetUserId();
        if (!userId.HasValue)
            return Unauthorized();

        var listing = await _context.Listings
            .Include(l => l.City)
            .Include(l => l.User)
            .Include(l => l.Shelter)
            .Include(l => l.Images)
            .Include(l => l.Likes)
            .FirstOrDefaultAsync(l => l.Id == id);

        if (listing == null)
            return NotFound(new { message = "Объявление не найдено" });

        if (listing.UserId != userId.Value && !User.IsInRole("Admin"))
            return Forbid();

        var imageUrl = await SaveImage(file, "listings");
        if (imageUrl == null)
            return BadRequest(new { message = "Ошибка загрузки изображения. Проверьте формат и размер файла." });

        var maxOrder = listing.Images.Any() ? listing.Images.Max(i => i.Order) : 0;

        var image = new ListingImage
        {
            Url = imageUrl,
            Order = maxOrder + 1,
            ListingId = listing.Id
        };

        _context.ListingImages.Add(image);
        await _context.SaveChangesAsync();

        await _context.Entry(listing).Collection(l => l.Images).LoadAsync();

        var favoriteIds = await _context.Favorites
            .Where(f => f.UserId == userId.Value && f.ListingId == id)
            .Select(f => f.ListingId)
            .ToListAsync();

        var likeIds = await _context.ListingLikes
            .Where(l => l.UserId == userId.Value && l.ListingId == id)
            .Select(l => l.ListingId)
            .ToListAsync();

        return Ok(MapToDetailDto(listing, favoriteIds, likeIds));
    }

    // DELETE: api/listings/{id}/images/{imageId}
    [HttpDelete("{id:guid}/images/{imageId:guid}")]
    [Authorize]
    public async Task<ActionResult> DeleteImage(Guid id, Guid imageId)
    {
        var userId = GetUserId();
        if (!userId.HasValue)
            return Unauthorized();

        var listing = await _context.Listings
            .Include(l => l.Images)
            .FirstOrDefaultAsync(l => l.Id == id);

        if (listing == null)
            return NotFound(new { message = "Объявление не найдено" });

        if (listing.UserId != userId.Value && !User.IsInRole("Admin"))
            return Forbid();

        var image = listing.Images.FirstOrDefault(i => i.Id == imageId);
        if (image == null)
            return NotFound(new { message = "Изображение не найдено" });

        // Удаляем файл
        DeleteImageFile(image.Url);

        _context.ListingImages.Remove(image);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // POST: api/listings/{id}/close
    [HttpPost("{id:guid}/close")]
    [Authorize]
    public async Task<ActionResult<ListingDetailDto>> CloseListing(Guid id)
    {
        var userId = GetUserId();
        if (!userId.HasValue)
            return Unauthorized();

        var listing = await _context.Listings
            .Include(l => l.City)
            .Include(l => l.User)
            .Include(l => l.Shelter)
            .Include(l => l.Images)
            .Include(l => l.Likes)
            .FirstOrDefaultAsync(l => l.Id == id);

        if (listing == null)
            return NotFound(new { message = "Объявление не найдено" });

        if (listing.UserId != userId.Value && !User.IsInRole("Admin"))
            return Forbid();

        listing.Status = ListingStatus.Closed;
        await _context.SaveChangesAsync();

        var favoriteIds = await _context.Favorites
            .Where(f => f.UserId == userId.Value && f.ListingId == id)
            .Select(f => f.ListingId)
            .ToListAsync();

        var likeIds = await _context.ListingLikes
            .Where(l => l.UserId == userId.Value && l.ListingId == id)
            .Select(l => l.ListingId)
            .ToListAsync();

        return Ok(MapToDetailDto(listing, favoriteIds, likeIds));
    }

    // POST: api/listings/{id}/renew
    [HttpPost("{id:guid}/renew")]
    [Authorize]
    public async Task<ActionResult<ListingDetailDto>> RenewListing(Guid id)
    {
        var userId = GetUserId();
        if (!userId.HasValue)
            return Unauthorized();

        var listing = await _context.Listings
            .Include(l => l.City)
            .Include(l => l.User)
            .Include(l => l.Shelter)
            .Include(l => l.Images)
            .Include(l => l.Likes)
            .FirstOrDefaultAsync(l => l.Id == id);

        if (listing == null)
            return NotFound(new { message = "Объявление не найдено" });

        if (listing.UserId != userId.Value && !User.IsInRole("Admin"))
            return Forbid();

        // Продлеваем на 30 дней от текущего момента
        listing.ExpiresAt = DateTime.UtcNow.AddDays(30);

        // Если объявление было закрыто или истекло, возвращаем на модерацию
        if (listing.Status == ListingStatus.Closed || listing.Status == ListingStatus.Expired)
        {
            listing.Status = ListingStatus.Moderation;
            listing.ModerationStatus = ModerationStatus.Pending;
        }

        await _context.SaveChangesAsync();

        var favoriteIds = await _context.Favorites
            .Where(f => f.UserId == userId.Value && f.ListingId == id)
            .Select(f => f.ListingId)
            .ToListAsync();

        var likeIds = await _context.ListingLikes
            .Where(l => l.UserId == userId.Value && l.ListingId == id)
            .Select(l => l.ListingId)
            .ToListAsync();

        return Ok(MapToDetailDto(listing, favoriteIds, likeIds));
    }

    // DELETE: api/listings/{id}
    [HttpDelete("{id:guid}")]
    [Authorize]
    public async Task<ActionResult> DeleteListing(Guid id)
    {
        var userId = GetUserId();
        if (!userId.HasValue)
            return Unauthorized();

        var listing = await _context.Listings
            .Include(l => l.Images)
            .FirstOrDefaultAsync(l => l.Id == id);

        if (listing == null)
            return NotFound(new { message = "Объявление не найдено" });

        if (listing.UserId != userId.Value && !User.IsInRole("Admin"))
            return Forbid();

        // Удаляем файлы изображений
        foreach (var image in listing.Images)
        {
            DeleteImageFile(image.Url);
        }

        _context.Listings.Remove(listing);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // === Helper Methods ===

    private async Task<string?> SaveImage(IFormFile file, string subPath)
    {
        if (file.Length > MaxFileSize)
            return null;

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(extension))
            return null;

        // Generate unique filename (always save as .jpg after optimization)
        var fileName = $"{Guid.NewGuid()}.jpg";

        // Optimize and save
        await using var inputStream = file.OpenReadStream();
        await _imageOptimization.OptimizeAndSaveAsync(inputStream, fileName, subPath, maxWidth: 1920, quality: 85);

        var baseUrl = _configuration["App:BaseUrl"] ?? $"{Request.Scheme}://{Request.Host}";
        return $"{baseUrl}/uploads/{subPath}/{fileName}";
    }

    private void DeleteImageFile(string imageUrl)
    {
        try
        {
            var uri = new Uri(imageUrl);
            var relativePath = uri.AbsolutePath.TrimStart('/');
            var filePath = Path.Combine(_environment.ContentRootPath, relativePath);

            if (System.IO.File.Exists(filePath))
                System.IO.File.Delete(filePath);
        }
        catch
        {
            // Игнорируем ошибки удаления файла
        }
    }

    // POST: api/listings/{id}/like (idempotent)
    [HttpPost("{id:guid}/like")]
    [Authorize]
    public async Task<ActionResult> LikeListing(Guid id)
    {
        var userId = GetUserId();
        if (!userId.HasValue)
            return Unauthorized();

        var listing = await _context.Listings.FindAsync(id);
        if (listing == null)
            return NotFound(new { message = "Объявление не найдено" });

        var existingLike = await _context.ListingLikes
            .FirstOrDefaultAsync(l => l.UserId == userId.Value && l.ListingId == id);

        if (existingLike == null)
        {
            var like = new ListingLike
            {
                UserId = userId.Value,
                ListingId = id
            };
            _context.ListingLikes.Add(like);
            await _context.SaveChangesAsync();
        }

        var likesCount = await _context.ListingLikes.CountAsync(l => l.ListingId == id);
        return Ok(new { likesCount, isLiked = true });
    }

    // DELETE: api/listings/{id}/like (idempotent)
    [HttpDelete("{id:guid}/like")]
    [Authorize]
    public async Task<ActionResult> UnlikeListing(Guid id)
    {
        var userId = GetUserId();
        if (!userId.HasValue)
            return Unauthorized();

        var like = await _context.ListingLikes
            .FirstOrDefaultAsync(l => l.UserId == userId.Value && l.ListingId == id);

        if (like != null)
        {
            _context.ListingLikes.Remove(like);
            await _context.SaveChangesAsync();
        }

        var likesCount = await _context.ListingLikes.CountAsync(l => l.ListingId == id);
        return Ok(new { likesCount, isLiked = false });
    }

    private static ListingListDto MapToListDto(Listing listing, List<Guid> favoriteIds, List<Guid> likeIds)
    {
        return new ListingListDto(
            listing.Id,
            listing.Title,
            listing.AnimalType,
            listing.Breed,
            listing.Age,
            listing.Gender,
            listing.Type,
            listing.Price,
            new ListingCityDto(listing.City.Id, listing.City.Name, listing.City.Region),
            listing.Images.OrderBy(i => i.Order).FirstOrDefault()?.Url,
            listing.Status,
            listing.ModerationStatus,
            favoriteIds.Contains(listing.Id),
            listing.Likes.Count,
            likeIds.Contains(listing.Id),
            listing.Shelter != null
                ? new ListingShelterDto(listing.Shelter.Id, listing.Shelter.Name, listing.Shelter.LogoUrl, listing.Shelter.IsVerified)
                : null,
            listing.CreatedAt,
            listing.ExpiresAt
        );
    }

    private static ListingDetailDto MapToDetailDto(Listing listing, List<Guid> favoriteIds, List<Guid> likeIds)
    {
        return new ListingDetailDto(
            listing.Id,
            listing.Title,
            listing.Description,
            listing.AnimalType,
            listing.Breed,
            listing.Age,
            listing.Gender,
            listing.Type,
            listing.Price,
            new ListingCityDto(listing.City.Id, listing.City.Name, listing.City.Region),
            listing.Status,
            listing.ModerationStatus,
            listing.ModerationComment,
            listing.ModeratedAt,
            favoriteIds.Contains(listing.Id),
            listing.Likes.Count,
            likeIds.Contains(listing.Id),
            new ListingOwnerDto(listing.User.Id, listing.User.Name),
            listing.Shelter != null
                ? new ListingShelterDto(listing.Shelter.Id, listing.Shelter.Name, listing.Shelter.LogoUrl, listing.Shelter.IsVerified)
                : null,
            listing.Images.OrderBy(i => i.Order).Select(i => new ListingImageDto(i.Id, i.Url, i.Order)).ToList(),
            listing.CreatedAt,
            listing.ExpiresAt,
            listing.UpdatedAt,
            listing.ContactPhone
        );
    }
}
