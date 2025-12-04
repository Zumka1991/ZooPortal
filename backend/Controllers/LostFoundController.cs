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
[Route("api/lost-found")]
public class LostFoundController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IWebHostEnvironment _environment;
    private readonly IConfiguration _configuration;
    private readonly IImageOptimizationService _imageOptimization;

    private static readonly string[] AllowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    private const long MaxFileSize = 10 * 1024 * 1024; // 10MB (до оптимизации)

    public LostFoundController(
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

    // GET: api/lost-found
    [HttpGet]
    public async Task<ActionResult<LostFoundPagedResponse>> GetAll(
        [FromQuery] LostFoundType? type,
        [FromQuery] AnimalType? animalType,
        [FromQuery] Guid? cityId,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12)
    {
        var query = _context.LostFoundPosts
            .Include(l => l.City)
            .Include(l => l.Images)
            .Where(l => l.ModerationStatus == ModerationStatus.Approved && l.Status == LostFoundStatus.Active)
            .AsQueryable();

        if (type.HasValue)
            query = query.Where(l => l.Type == type.Value);

        if (animalType.HasValue)
            query = query.Where(l => l.AnimalType == animalType.Value);

        if (cityId.HasValue)
            query = query.Where(l => l.CityId == cityId.Value);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(l =>
                l.Title.ToLower().Contains(searchLower) ||
                l.Description.ToLower().Contains(searchLower) ||
                (l.Breed != null && l.Breed.ToLower().Contains(searchLower)) ||
                (l.Color != null && l.Color.ToLower().Contains(searchLower)));
        }

        query = query.OrderByDescending(l => l.CreatedAt);

        var totalCount = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(l => new LostFoundListDto(
                l.Id,
                l.Title,
                l.Type,
                l.AnimalType,
                l.Breed,
                l.Color,
                new CityDto(l.City.Id, l.City.Name, l.City.Region),
                l.Address,
                l.Latitude,
                l.Longitude,
                l.EventDate,
                l.Status,
                l.Images.OrderBy(i => i.Order).Select(i => i.Url).FirstOrDefault(),
                l.CreatedAt
            ))
            .ToListAsync();

        return Ok(new LostFoundPagedResponse(items, totalCount, page, pageSize, totalPages));
    }

    // GET: api/lost-found/map
    [HttpGet("map")]
    public async Task<ActionResult<List<LostFoundListDto>>> GetForMap(
        [FromQuery] LostFoundType? type,
        [FromQuery] AnimalType? animalType,
        [FromQuery] Guid? cityId)
    {
        var query = _context.LostFoundPosts
            .Include(l => l.City)
            .Include(l => l.Images)
            .Where(l => l.ModerationStatus == ModerationStatus.Approved &&
                       l.Status == LostFoundStatus.Active &&
                       l.Latitude != null && l.Longitude != null)
            .AsQueryable();

        if (type.HasValue)
            query = query.Where(l => l.Type == type.Value);

        if (animalType.HasValue)
            query = query.Where(l => l.AnimalType == animalType.Value);

        if (cityId.HasValue)
            query = query.Where(l => l.CityId == cityId.Value);

        var items = await query
            .OrderByDescending(l => l.CreatedAt)
            .Take(100) // Лимит для карты
            .Select(l => new LostFoundListDto(
                l.Id,
                l.Title,
                l.Type,
                l.AnimalType,
                l.Breed,
                l.Color,
                new CityDto(l.City.Id, l.City.Name, l.City.Region),
                l.Address,
                l.Latitude,
                l.Longitude,
                l.EventDate,
                l.Status,
                l.Images.OrderBy(i => i.Order).Select(i => i.Url).FirstOrDefault(),
                l.CreatedAt
            ))
            .ToListAsync();

        return Ok(items);
    }

    // GET: api/lost-found/{id}
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<LostFoundDetailDto>> GetById(Guid id)
    {
        var item = await _context.LostFoundPosts
            .Include(l => l.City)
            .Include(l => l.User)
            .Include(l => l.Images)
            .Where(l => l.Id == id)
            .FirstOrDefaultAsync();

        if (item == null)
            return NotFound(new { message = "Запись не найдена" });

        // Проверяем доступ: либо одобрено, либо это владелец
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var isOwner = userId != null && item.UserId.ToString() == userId;

        if (item.ModerationStatus != ModerationStatus.Approved && !isOwner)
            return NotFound(new { message = "Запись не найдена" });

        return Ok(new LostFoundDetailDto(
            item.Id,
            item.Title,
            item.Description,
            item.Type,
            item.AnimalType,
            item.Breed,
            item.Color,
            item.DistinctiveFeatures,
            new CityDto(item.City.Id, item.City.Name, item.City.Region),
            item.Address,
            item.Latitude,
            item.Longitude,
            item.EventDate,
            item.ContactPhone,
            item.Status,
            item.ModerationStatus,
            item.ModerationComment,
            new LostFoundUserDto(item.User.Id, item.User.Name),
            item.Images.OrderBy(i => i.Order).Select(i => new LostFoundImageDto(i.Id, i.Url, i.Order)).ToList(),
            item.CreatedAt
        ));
    }

    // GET: api/lost-found/my
    [HttpGet("my")]
    [Authorize]
    public async Task<ActionResult<List<MyLostFoundDto>>> GetMy()
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        var items = await _context.LostFoundPosts
            .Include(l => l.City)
            .Include(l => l.Images)
            .Where(l => l.UserId == userId)
            .OrderByDescending(l => l.CreatedAt)
            .Select(l => new MyLostFoundDto(
                l.Id,
                l.Title,
                l.Type,
                l.AnimalType,
                new CityDto(l.City.Id, l.City.Name, l.City.Region),
                l.EventDate,
                l.Status,
                l.ModerationStatus,
                l.ModerationComment,
                l.Images.OrderBy(i => i.Order).Select(i => i.Url).FirstOrDefault(),
                l.CreatedAt
            ))
            .ToListAsync();

        return Ok(items);
    }

    // POST: api/lost-found
    [HttpPost]
    [Authorize]
    public async Task<ActionResult<LostFoundDetailDto>> Create([FromBody] CreateLostFoundRequest request)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        // Проверяем город
        var city = await _context.Cities.FindAsync(request.CityId);
        if (city == null || !city.IsActive)
            return BadRequest(new { message = "Город не найден" });

        var item = new LostFound
        {
            Title = request.Title,
            Description = request.Description,
            Type = request.Type,
            AnimalType = request.AnimalType,
            Breed = request.Breed,
            Color = request.Color,
            DistinctiveFeatures = request.DistinctiveFeatures,
            CityId = request.CityId,
            Address = request.Address,
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            EventDate = request.EventDate,
            ContactPhone = request.ContactPhone,
            UserId = userId,
            ModerationStatus = ModerationStatus.Pending
        };

        _context.LostFoundPosts.Add(item);
        await _context.SaveChangesAsync();

        // Загружаем связанные данные
        await _context.Entry(item).Reference(l => l.City).LoadAsync();
        await _context.Entry(item).Reference(l => l.User).LoadAsync();

        return CreatedAtAction(nameof(GetById), new { id = item.Id }, new LostFoundDetailDto(
            item.Id,
            item.Title,
            item.Description,
            item.Type,
            item.AnimalType,
            item.Breed,
            item.Color,
            item.DistinctiveFeatures,
            new CityDto(item.City.Id, item.City.Name, item.City.Region),
            item.Address,
            item.Latitude,
            item.Longitude,
            item.EventDate,
            item.ContactPhone,
            item.Status,
            item.ModerationStatus,
            item.ModerationComment,
            new LostFoundUserDto(item.User.Id, item.User.Name),
            [],
            item.CreatedAt
        ));
    }

    // PUT: api/lost-found/{id}
    [HttpPut("{id:guid}")]
    [Authorize]
    public async Task<ActionResult<LostFoundDetailDto>> Update(Guid id, [FromBody] UpdateLostFoundRequest request)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        var item = await _context.LostFoundPosts
            .Include(l => l.City)
            .Include(l => l.User)
            .Include(l => l.Images)
            .FirstOrDefaultAsync(l => l.Id == id);

        if (item == null)
            return NotFound(new { message = "Запись не найдена" });

        if (item.UserId != userId)
            return Forbid();

        // Проверяем город
        var city = await _context.Cities.FindAsync(request.CityId);
        if (city == null || !city.IsActive)
            return BadRequest(new { message = "Город не найден" });

        item.Title = request.Title;
        item.Description = request.Description;
        item.AnimalType = request.AnimalType;
        item.Breed = request.Breed;
        item.Color = request.Color;
        item.DistinctiveFeatures = request.DistinctiveFeatures;
        item.CityId = request.CityId;
        item.Address = request.Address;
        item.Latitude = request.Latitude;
        item.Longitude = request.Longitude;
        item.EventDate = request.EventDate;
        item.ContactPhone = request.ContactPhone;

        // После редактирования возвращаем на модерацию
        if (item.ModerationStatus == ModerationStatus.Rejected)
        {
            item.ModerationStatus = ModerationStatus.Pending;
            item.ModerationComment = null;
        }

        await _context.SaveChangesAsync();

        // Перезагружаем город если изменился
        await _context.Entry(item).Reference(l => l.City).LoadAsync();

        return Ok(new LostFoundDetailDto(
            item.Id,
            item.Title,
            item.Description,
            item.Type,
            item.AnimalType,
            item.Breed,
            item.Color,
            item.DistinctiveFeatures,
            new CityDto(item.City.Id, item.City.Name, item.City.Region),
            item.Address,
            item.Latitude,
            item.Longitude,
            item.EventDate,
            item.ContactPhone,
            item.Status,
            item.ModerationStatus,
            item.ModerationComment,
            new LostFoundUserDto(item.User.Id, item.User.Name),
            item.Images.OrderBy(i => i.Order).Select(i => new LostFoundImageDto(i.Id, i.Url, i.Order)).ToList(),
            item.CreatedAt
        ));
    }

    // POST: api/lost-found/{id}/resolve
    [HttpPost("{id:guid}/resolve")]
    [Authorize]
    public async Task<ActionResult> Resolve(Guid id)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        var item = await _context.LostFoundPosts.FindAsync(id);
        if (item == null)
            return NotFound(new { message = "Запись не найдена" });

        if (item.UserId != userId)
            return Forbid();

        item.Status = LostFoundStatus.Resolved;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Статус обновлён" });
    }

    // DELETE: api/lost-found/{id}
    [HttpDelete("{id:guid}")]
    [Authorize]
    public async Task<ActionResult> Delete(Guid id)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        var item = await _context.LostFoundPosts
            .Include(l => l.Images)
            .FirstOrDefaultAsync(l => l.Id == id);

        if (item == null)
            return NotFound(new { message = "Запись не найдена" });

        if (item.UserId != userId)
            return Forbid();

        // Удаляем изображения
        foreach (var image in item.Images)
        {
            DeleteImageFile(image.Url);
        }

        _context.LostFoundPosts.Remove(item);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // POST: api/lost-found/{id}/images
    [HttpPost("{id:guid}/images")]
    [Authorize]
    public async Task<ActionResult<LostFoundImageDto>> UploadImage(Guid id, IFormFile file)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        var item = await _context.LostFoundPosts
            .Include(l => l.Images)
            .FirstOrDefaultAsync(l => l.Id == id);

        if (item == null)
            return NotFound(new { message = "Запись не найдена" });

        if (item.UserId != userId)
            return Forbid();

        if (item.Images.Count >= 5)
            return BadRequest(new { message = "Максимум 5 фотографий" });

        var imageUrl = await SaveImage(file, "lost-found");
        if (imageUrl == null)
            return BadRequest(new { message = "Ошибка загрузки. Проверьте формат и размер файла." });

        var image = new LostFoundImage
        {
            Url = imageUrl,
            Order = item.Images.Count,
            LostFoundId = id
        };

        _context.LostFoundImages.Add(image);
        await _context.SaveChangesAsync();

        return Ok(new LostFoundImageDto(image.Id, image.Url, image.Order));
    }

    // DELETE: api/lost-found/{id}/images/{imageId}
    [HttpDelete("{id:guid}/images/{imageId:guid}")]
    [Authorize]
    public async Task<ActionResult> DeleteImage(Guid id, Guid imageId)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        var item = await _context.LostFoundPosts.FindAsync(id);
        if (item == null)
            return NotFound(new { message = "Запись не найдена" });

        if (item.UserId != userId)
            return Forbid();

        var image = await _context.LostFoundImages.FirstOrDefaultAsync(i => i.Id == imageId && i.LostFoundId == id);
        if (image == null)
            return NotFound(new { message = "Изображение не найдено" });

        DeleteImageFile(image.Url);
        _context.LostFoundImages.Remove(image);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private async Task<string?> SaveImage(IFormFile file, string subPath)
    {
        if (file.Length == 0 || file.Length > MaxFileSize)
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
}
