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
public class SheltersController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IWebHostEnvironment _environment;
    private readonly IConfiguration _configuration;
    private readonly IImageOptimizationService _imageOptimization;

    private static readonly string[] AllowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    private const long MaxFileSize = 10 * 1024 * 1024; // 10MB (до оптимизации)

    public SheltersController(
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

    /// <summary>
    /// Получить каталог приютов (только одобренные)
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<SheltersPagedResponse>> GetShelters(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12,
        [FromQuery] Guid? cityId = null,
        [FromQuery] string? search = null,
        [FromQuery] bool? isVerified = null)
    {
        pageSize = Math.Clamp(pageSize, 1, 50);
        page = Math.Max(1, page);

        var query = _context.Shelters
            .Include(s => s.City)
            .Where(s => s.IsActive && s.ModerationStatus == ModerationStatus.Approved);

        if (cityId.HasValue)
        {
            query = query.Where(s => s.CityId == cityId.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(s =>
                s.Name.ToLower().Contains(searchLower) ||
                s.Address.ToLower().Contains(searchLower) ||
                (s.ShortDescription != null && s.ShortDescription.ToLower().Contains(searchLower)) ||
                s.City.Name.ToLower().Contains(searchLower));
        }

        if (isVerified.HasValue)
        {
            query = query.Where(s => s.IsVerified == isVerified.Value);
        }

        query = query.OrderByDescending(s => s.IsVerified).ThenByDescending(s => s.CreatedAt);

        var totalCount = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(s => new ShelterListDto(
                s.Id,
                s.Name,
                s.ShortDescription,
                s.LogoUrl,
                new CityDto(s.City.Id, s.City.Name, s.City.Region),
                s.Address,
                s.Phone,
                s.DogsCount + s.CatsCount + s.OtherAnimalsCount,
                s.DogsCount,
                s.CatsCount,
                s.IsVerified,
                s.ModerationStatus,
                s.CreatedAt
            ))
            .ToListAsync();

        return Ok(new SheltersPagedResponse(items, totalCount, page, pageSize, totalPages));
    }

    /// <summary>
    /// Получить приют по ID
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ShelterDetailDto>> GetShelter(Guid id)
    {
        var shelter = await _context.Shelters
            .Include(s => s.City)
            .Include(s => s.Owner)
            .Include(s => s.Images.OrderBy(i => i.SortOrder))
            .FirstOrDefaultAsync(s => s.Id == id);

        if (shelter == null)
        {
            return NotFound(new { message = "Приют не найден" });
        }

        // Only show approved shelters to public, or own shelter to owner
        var userId = GetUserId();
        if (shelter.ModerationStatus != ModerationStatus.Approved &&
            shelter.OwnerId != userId &&
            !User.IsInRole("Admin") && !User.IsInRole("Moderator"))
        {
            return NotFound(new { message = "Приют не найден" });
        }

        return Ok(MapToDetailDto(shelter));
    }

    /// <summary>
    /// Добавить приют (авторизованный пользователь)
    /// </summary>
    [HttpPost]
    [Authorize]
    public async Task<ActionResult<ShelterDetailDto>> CreateShelter([FromBody] CreateShelterRequest request)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        // Check if city exists
        var cityExists = await _context.Cities.AnyAsync(c => c.Id == request.CityId);
        if (!cityExists)
        {
            return BadRequest(new { message = "Город не найден" });
        }

        var shelter = new Shelter
        {
            Name = request.Name.Trim(),
            Description = request.Description,
            ShortDescription = request.ShortDescription?.Trim(),
            CityId = request.CityId,
            Address = request.Address.Trim(),
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            Phone = request.Phone?.Trim(),
            Phone2 = request.Phone2?.Trim(),
            Email = request.Email?.Trim(),
            Website = request.Website?.Trim(),
            VkUrl = request.VkUrl?.Trim(),
            TelegramUrl = request.TelegramUrl?.Trim(),
            InstagramUrl = request.InstagramUrl?.Trim(),
            DogsCount = request.DogsCount,
            CatsCount = request.CatsCount,
            OtherAnimalsCount = request.OtherAnimalsCount,
            FoundedYear = request.FoundedYear,
            VolunteersCount = request.VolunteersCount,
            WorkingHours = request.WorkingHours?.Trim(),
            AcceptsVolunteers = request.AcceptsVolunteers,
            Needs = request.Needs,
            DonationCardNumber = request.DonationCardNumber?.Trim(),
            DonationCardHolder = request.DonationCardHolder?.Trim(),
            DonationPhone = request.DonationPhone?.Trim(),
            DonationDetails = request.DonationDetails,
            OwnerId = userId.Value,
            ModerationStatus = ModerationStatus.Pending
        };

        _context.Shelters.Add(shelter);
        await _context.SaveChangesAsync();

        // Reload with includes
        shelter = await _context.Shelters
            .Include(s => s.City)
            .Include(s => s.Owner)
            .Include(s => s.Images)
            .FirstAsync(s => s.Id == shelter.Id);

        return Ok(MapToDetailDto(shelter));
    }

    /// <summary>
    /// Обновить приют (владелец или админ)
    /// </summary>
    [HttpPut("{id:guid}")]
    [Authorize]
    public async Task<ActionResult<ShelterDetailDto>> UpdateShelter(Guid id, [FromBody] UpdateShelterRequest request)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var shelter = await _context.Shelters
            .Include(s => s.City)
            .Include(s => s.Owner)
            .Include(s => s.Images)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (shelter == null)
        {
            return NotFound(new { message = "Приют не найден" });
        }

        // Only owner or admin can update
        if (shelter.OwnerId != userId && !User.IsInRole("Admin") && !User.IsInRole("Moderator"))
        {
            return Forbid();
        }

        // Check if city exists
        var cityExists = await _context.Cities.AnyAsync(c => c.Id == request.CityId);
        if (!cityExists)
        {
            return BadRequest(new { message = "Город не найден" });
        }

        shelter.Name = request.Name.Trim();
        shelter.Description = request.Description;
        shelter.ShortDescription = request.ShortDescription?.Trim();
        shelter.CityId = request.CityId;
        shelter.Address = request.Address.Trim();
        shelter.Latitude = request.Latitude;
        shelter.Longitude = request.Longitude;
        shelter.Phone = request.Phone?.Trim();
        shelter.Phone2 = request.Phone2?.Trim();
        shelter.Email = request.Email?.Trim();
        shelter.Website = request.Website?.Trim();
        shelter.VkUrl = request.VkUrl?.Trim();
        shelter.TelegramUrl = request.TelegramUrl?.Trim();
        shelter.InstagramUrl = request.InstagramUrl?.Trim();
        shelter.DogsCount = request.DogsCount;
        shelter.CatsCount = request.CatsCount;
        shelter.OtherAnimalsCount = request.OtherAnimalsCount;
        shelter.FoundedYear = request.FoundedYear;
        shelter.VolunteersCount = request.VolunteersCount;
        shelter.WorkingHours = request.WorkingHours?.Trim();
        shelter.AcceptsVolunteers = request.AcceptsVolunteers;
        shelter.Needs = request.Needs;
        shelter.DonationCardNumber = request.DonationCardNumber?.Trim();
        shelter.DonationCardHolder = request.DonationCardHolder?.Trim();
        shelter.DonationPhone = request.DonationPhone?.Trim();
        shelter.DonationDetails = request.DonationDetails;

        await _context.SaveChangesAsync();

        return Ok(MapToDetailDto(shelter));
    }

    /// <summary>
    /// Загрузить логотип приюта
    /// </summary>
    [HttpPost("{id:guid}/logo")]
    [Authorize]
    public async Task<ActionResult<ShelterDetailDto>> UploadLogo(Guid id, IFormFile file)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var shelter = await _context.Shelters
            .Include(s => s.City)
            .Include(s => s.Owner)
            .Include(s => s.Images)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (shelter == null)
        {
            return NotFound(new { message = "Приют не найден" });
        }

        if (shelter.OwnerId != userId && !User.IsInRole("Admin") && !User.IsInRole("Moderator"))
        {
            return Forbid();
        }

        var imageUrl = await SaveImage(file, "shelters/logos", preserveTransparency: true);
        if (imageUrl == null)
        {
            return BadRequest(new { message = "Ошибка загрузки изображения" });
        }

        shelter.LogoUrl = imageUrl;
        await _context.SaveChangesAsync();

        return Ok(MapToDetailDto(shelter));
    }

    /// <summary>
    /// Добавить фото в галерею приюта
    /// </summary>
    [HttpPost("{id:guid}/images")]
    [Authorize]
    public async Task<ActionResult<ShelterDetailDto>> AddImage(Guid id, IFormFile file, [FromForm] bool isMain = false)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var shelter = await _context.Shelters
            .Include(s => s.City)
            .Include(s => s.Owner)
            .Include(s => s.Images)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (shelter == null)
        {
            return NotFound(new { message = "Приют не найден" });
        }

        if (shelter.OwnerId != userId && !User.IsInRole("Admin") && !User.IsInRole("Moderator"))
        {
            return Forbid();
        }

        var imageUrl = await SaveImage(file, "shelters/images");
        if (imageUrl == null)
        {
            return BadRequest(new { message = "Ошибка загрузки изображения" });
        }

        // If this is main, unset others
        if (isMain)
        {
            foreach (var img in shelter.Images)
            {
                img.IsMain = false;
            }
        }

        var maxOrder = shelter.Images.Any() ? shelter.Images.Max(i => i.SortOrder) : 0;

        var shelterImage = new ShelterImage
        {
            ImageUrl = imageUrl,
            FileName = Path.GetFileName(new Uri(imageUrl).LocalPath),
            IsMain = isMain,
            SortOrder = maxOrder + 1,
            ShelterId = shelter.Id
        };

        _context.ShelterImages.Add(shelterImage);
        await _context.SaveChangesAsync();

        // Reload images
        shelter.Images = await _context.ShelterImages
            .Where(i => i.ShelterId == shelter.Id)
            .OrderBy(i => i.SortOrder)
            .ToListAsync();

        return Ok(MapToDetailDto(shelter));
    }

    /// <summary>
    /// Удалить фото из галереи
    /// </summary>
    [HttpDelete("{id:guid}/images/{imageId:guid}")]
    [Authorize]
    public async Task<ActionResult> DeleteImage(Guid id, Guid imageId)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var shelter = await _context.Shelters.FindAsync(id);
        if (shelter == null)
        {
            return NotFound(new { message = "Приют не найден" });
        }

        if (shelter.OwnerId != userId && !User.IsInRole("Admin") && !User.IsInRole("Moderator"))
        {
            return Forbid();
        }

        var image = await _context.ShelterImages.FirstOrDefaultAsync(i => i.Id == imageId && i.ShelterId == id);
        if (image == null)
        {
            return NotFound(new { message = "Изображение не найдено" });
        }

        // Delete file
        if (!string.IsNullOrEmpty(image.FileName))
        {
            var filePath = Path.Combine(_environment.ContentRootPath, "uploads", "shelters", "images", image.FileName);
            if (System.IO.File.Exists(filePath))
            {
                System.IO.File.Delete(filePath);
            }
        }

        _context.ShelterImages.Remove(image);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Изображение удалено" });
    }

    /// <summary>
    /// Мои приюты
    /// </summary>
    [HttpGet("my")]
    [Authorize]
    public async Task<ActionResult<List<ShelterListDto>>> GetMyShelters()
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var shelters = await _context.Shelters
            .Include(s => s.City)
            .Where(s => s.OwnerId == userId)
            .OrderByDescending(s => s.CreatedAt)
            .Select(s => new ShelterListDto(
                s.Id,
                s.Name,
                s.ShortDescription,
                s.LogoUrl,
                new CityDto(s.City.Id, s.City.Name, s.City.Region),
                s.Address,
                s.Phone,
                s.DogsCount + s.CatsCount + s.OtherAnimalsCount,
                s.DogsCount,
                s.CatsCount,
                s.IsVerified,
                s.ModerationStatus,
                s.CreatedAt
            ))
            .ToListAsync();

        return Ok(shelters);
    }

    private async Task<string?> SaveImage(IFormFile file, string subPath, bool preserveTransparency = false)
    {
        if (file == null || file.Length == 0)
        {
            return null;
        }

        if (file.Length > MaxFileSize)
        {
            return null;
        }

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(extension))
        {
            return null;
        }

        // Определяем расширение файла на основе preserveTransparency и исходного формата
        string fileExtension;
        if (preserveTransparency && (extension == ".png" || extension == ".webp"))
        {
            // Для логотипов сохраняем как PNG если исходник PNG/WebP (может быть с прозрачностью)
            fileExtension = ".png";
        }
        else
        {
            // Для остальных сохраняем как JPG
            fileExtension = ".jpg";
        }

        var fileName = $"{Guid.NewGuid()}{fileExtension}";

        // Optimize and save
        await using var inputStream = file.OpenReadStream();
        await _imageOptimization.OptimizeAndSaveAsync(inputStream, fileName, subPath, maxWidth: 1920, quality: 85, preserveTransparency);

        var baseUrl = _configuration["App:BaseUrl"] ?? $"{Request.Scheme}://{Request.Host}";
        return $"{baseUrl}/uploads/{subPath}/{fileName}";
    }

    private static ShelterDetailDto MapToDetailDto(Shelter s)
    {
        return new ShelterDetailDto(
            s.Id,
            s.Name,
            s.Description,
            s.ShortDescription,
            s.LogoUrl,
            new CityDto(s.City.Id, s.City.Name, s.City.Region),
            s.Address,
            s.Latitude,
            s.Longitude,
            s.Phone,
            s.Phone2,
            s.Email,
            s.Website,
            s.VkUrl,
            s.TelegramUrl,
            s.InstagramUrl,
            s.DogsCount,
            s.CatsCount,
            s.OtherAnimalsCount,
            s.DogsCount + s.CatsCount + s.OtherAnimalsCount,
            s.FoundedYear,
            s.VolunteersCount,
            s.WorkingHours,
            s.AcceptsVolunteers,
            s.Needs,
            s.DonationCardNumber,
            s.DonationCardHolder,
            s.DonationPhone,
            s.DonationDetails,
            s.IsVerified,
            s.IsActive,
            s.ModerationStatus,
            s.ModerationComment,
            s.ModeratedAt,
            s.Owner != null ? new ShelterOwnerDto(s.Owner.Id, s.Owner.Name) : null,
            s.Images.Select(i => new ShelterImageDto(i.Id, i.ImageUrl, i.IsMain, i.SortOrder)).ToList(),
            s.CreatedAt,
            s.UpdatedAt
        );
    }

    private Guid? GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(userIdClaim, out var userId) ? userId : null;
    }
}
