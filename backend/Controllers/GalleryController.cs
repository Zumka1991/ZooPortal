using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ZooPortal.Api.Data;
using ZooPortal.Api.DTOs;
using ZooPortal.Api.Models;

namespace ZooPortal.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GalleryController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IWebHostEnvironment _environment;
    private readonly IConfiguration _configuration;

    private static readonly string[] AllowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    private const long MaxFileSize = 5 * 1024 * 1024; // 5MB

    public GalleryController(
        ApplicationDbContext context,
        IWebHostEnvironment environment,
        IConfiguration configuration)
    {
        _context = context;
        _environment = environment;
        _configuration = configuration;
    }

    /// <summary>
    /// Получить общую галерею (только одобренные изображения)
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<GalleryPagedResponse>> GetGallery(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12)
    {
        pageSize = Math.Clamp(pageSize, 1, 50);
        page = Math.Max(1, page);

        var query = _context.GalleryImages
            .Include(g => g.User)
            .Where(g => g.Status == ModerationStatus.Approved)
            .OrderByDescending(g => g.CreatedAt);

        var totalCount = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(g => new GalleryImageDto(
                g.Id,
                g.Title,
                g.ImageUrl,
                g.Status,
                g.CreatedAt,
                new GalleryUserDto(g.User.Id, g.User.Name)
            ))
            .ToListAsync();

        return Ok(new GalleryPagedResponse(items, totalCount, page, pageSize, totalPages));
    }

    /// <summary>
    /// Получить личную галерею пользователя
    /// </summary>
    [HttpGet("my")]
    [Authorize]
    public async Task<ActionResult<GalleryPagedResponse>> GetMyGallery(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12,
        [FromQuery] ModerationStatus? status = null)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        pageSize = Math.Clamp(pageSize, 1, 50);
        page = Math.Max(1, page);

        var query = _context.GalleryImages
            .Include(g => g.User)
            .Where(g => g.UserId == userId.Value);

        if (status.HasValue)
        {
            query = query.Where(g => g.Status == status.Value);
        }

        query = query.OrderByDescending(g => g.CreatedAt);

        var totalCount = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(g => new GalleryImageDto(
                g.Id,
                g.Title,
                g.ImageUrl,
                g.Status,
                g.CreatedAt,
                new GalleryUserDto(g.User.Id, g.User.Name)
            ))
            .ToListAsync();

        return Ok(new GalleryPagedResponse(items, totalCount, page, pageSize, totalPages));
    }

    /// <summary>
    /// Загрузить изображение в галерею
    /// </summary>
    [HttpPost]
    [Authorize]
    public async Task<ActionResult<GalleryImageDto>> Upload(
        [FromForm] string title,
        [FromForm] IFormFile file)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        if (string.IsNullOrWhiteSpace(title))
        {
            return BadRequest(new { message = "Название обязательно" });
        }

        if (title.Length > 200)
        {
            return BadRequest(new { message = "Название не должно превышать 200 символов" });
        }

        if (file == null || file.Length == 0)
        {
            return BadRequest(new { message = "Файл не выбран" });
        }

        if (file.Length > MaxFileSize)
        {
            return BadRequest(new { message = "Размер файла не должен превышать 5MB" });
        }

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(extension))
        {
            return BadRequest(new { message = "Разрешены только изображения: jpg, jpeg, png, gif, webp" });
        }

        // Create uploads directory
        var uploadsPath = Path.Combine(_environment.ContentRootPath, "uploads", "gallery");
        Directory.CreateDirectory(uploadsPath);

        // Generate unique filename
        var fileName = $"{Guid.NewGuid()}{extension}";
        var filePath = Path.Combine(uploadsPath, fileName);

        // Save file
        await using var stream = new FileStream(filePath, FileMode.Create);
        await file.CopyToAsync(stream);

        // Build URL
        var baseUrl = _configuration["App:BaseUrl"] ?? $"{Request.Scheme}://{Request.Host}";
        var imageUrl = $"{baseUrl}/uploads/gallery/{fileName}";

        // Create database entry
        var user = await _context.Users.FindAsync(userId.Value);
        if (user == null) return Unauthorized();

        var galleryImage = new GalleryImage
        {
            Title = title.Trim(),
            ImageUrl = imageUrl,
            FileName = fileName,
            UserId = userId.Value,
            Status = ModerationStatus.Pending
        };

        _context.GalleryImages.Add(galleryImage);
        await _context.SaveChangesAsync();

        return Ok(new GalleryImageDto(
            galleryImage.Id,
            galleryImage.Title,
            galleryImage.ImageUrl,
            galleryImage.Status,
            galleryImage.CreatedAt,
            new GalleryUserDto(user.Id, user.Name)
        ));
    }

    /// <summary>
    /// Удалить своё изображение
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize]
    public async Task<ActionResult> Delete(Guid id)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var image = await _context.GalleryImages.FindAsync(id);
        if (image == null)
        {
            return NotFound(new { message = "Изображение не найдено" });
        }

        // Allow deletion only by owner or admin/moderator
        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
        if (image.UserId != userId.Value && userRole != "Admin" && userRole != "Moderator")
        {
            return Forbid();
        }

        // Delete file from disk
        if (!string.IsNullOrEmpty(image.FileName))
        {
            var filePath = Path.Combine(_environment.ContentRootPath, "uploads", "gallery", image.FileName);
            if (System.IO.File.Exists(filePath))
            {
                System.IO.File.Delete(filePath);
            }
        }

        _context.GalleryImages.Remove(image);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Изображение удалено" });
    }

    private Guid? GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(userIdClaim, out var userId) ? userId : null;
    }
}
