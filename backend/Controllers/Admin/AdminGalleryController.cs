using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ZooPortal.Api.Data;
using ZooPortal.Api.DTOs;
using ZooPortal.Api.Models;

namespace ZooPortal.Api.Controllers.Admin;

[ApiController]
[Route("api/admin/gallery")]
[Authorize(Roles = "Admin,Moderator")]
public class AdminGalleryController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IWebHostEnvironment _environment;

    public AdminGalleryController(ApplicationDbContext context, IWebHostEnvironment environment)
    {
        _context = context;
        _environment = environment;
    }

    /// <summary>
    /// Получить все изображения для модерации
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<AdminGalleryPagedResponse>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] ModerationStatus? status = null,
        [FromQuery] string? search = null)
    {
        pageSize = Math.Clamp(pageSize, 1, 100);
        page = Math.Max(1, page);

        var query = _context.GalleryImages
            .Include(g => g.User)
            .Include(g => g.ModeratedBy)
            .AsQueryable();

        if (status.HasValue)
        {
            query = query.Where(g => g.Status == status.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(g =>
                g.Title.ToLower().Contains(searchLower) ||
                g.User.Name.ToLower().Contains(searchLower) ||
                g.User.Email.ToLower().Contains(searchLower));
        }

        query = query.OrderByDescending(g => g.CreatedAt);

        var totalCount = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        // Get counts by status
        var pendingCount = await _context.GalleryImages.CountAsync(g => g.Status == ModerationStatus.Pending);
        var approvedCount = await _context.GalleryImages.CountAsync(g => g.Status == ModerationStatus.Approved);
        var rejectedCount = await _context.GalleryImages.CountAsync(g => g.Status == ModerationStatus.Rejected);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(g => new GalleryImageDetailDto(
                g.Id,
                g.Title,
                g.ImageUrl,
                g.FileName,
                g.Status,
                g.ModerationComment,
                g.ModeratedAt,
                g.ModeratedBy != null ? new GalleryUserDto(g.ModeratedBy.Id, g.ModeratedBy.Name) : null,
                g.CreatedAt,
                new GalleryUserDto(g.User.Id, g.User.Name)
            ))
            .ToListAsync();

        return Ok(new AdminGalleryPagedResponse(
            items, totalCount, page, pageSize, totalPages,
            pendingCount, approvedCount, rejectedCount));
    }

    /// <summary>
    /// Одобрить изображение
    /// </summary>
    [HttpPost("{id:guid}/approve")]
    public async Task<ActionResult<GalleryImageDetailDto>> Approve(Guid id, [FromBody] ModerateImageRequest? request)
    {
        return await ModerateImage(id, ModerationStatus.Approved, request?.Comment);
    }

    /// <summary>
    /// Отклонить изображение
    /// </summary>
    [HttpPost("{id:guid}/reject")]
    public async Task<ActionResult<GalleryImageDetailDto>> Reject(Guid id, [FromBody] ModerateImageRequest? request)
    {
        return await ModerateImage(id, ModerationStatus.Rejected, request?.Comment);
    }

    /// <summary>
    /// Модерировать изображение (универсальный endpoint)
    /// </summary>
    [HttpPost("{id:guid}/moderate")]
    public async Task<ActionResult<GalleryImageDetailDto>> Moderate(Guid id, [FromBody] ModerateImageRequest request)
    {
        return await ModerateImage(id, request.Status, request.Comment);
    }

    /// <summary>
    /// Удалить изображение (админ)
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        var image = await _context.GalleryImages.FindAsync(id);
        if (image == null)
        {
            return NotFound(new { message = "Изображение не найдено" });
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

    /// <summary>
    /// Массовое одобрение
    /// </summary>
    [HttpPost("bulk-approve")]
    public async Task<ActionResult> BulkApprove([FromBody] List<Guid> ids)
    {
        var moderatorId = GetUserId();
        if (moderatorId == null) return Unauthorized();

        var images = await _context.GalleryImages
            .Where(g => ids.Contains(g.Id))
            .ToListAsync();

        foreach (var image in images)
        {
            image.Status = ModerationStatus.Approved;
            image.ModeratedAt = DateTime.UtcNow;
            image.ModeratedById = moderatorId.Value;
        }

        await _context.SaveChangesAsync();

        return Ok(new { message = $"Одобрено изображений: {images.Count}" });
    }

    /// <summary>
    /// Массовое отклонение
    /// </summary>
    [HttpPost("bulk-reject")]
    public async Task<ActionResult> BulkReject([FromBody] BulkRejectRequest request)
    {
        var moderatorId = GetUserId();
        if (moderatorId == null) return Unauthorized();

        var images = await _context.GalleryImages
            .Where(g => request.Ids.Contains(g.Id))
            .ToListAsync();

        foreach (var image in images)
        {
            image.Status = ModerationStatus.Rejected;
            image.ModerationComment = request.Comment;
            image.ModeratedAt = DateTime.UtcNow;
            image.ModeratedById = moderatorId.Value;
        }

        await _context.SaveChangesAsync();

        return Ok(new { message = $"Отклонено изображений: {images.Count}" });
    }

    private async Task<ActionResult<GalleryImageDetailDto>> ModerateImage(Guid id, ModerationStatus status, string? comment)
    {
        var moderatorId = GetUserId();
        if (moderatorId == null) return Unauthorized();

        var image = await _context.GalleryImages
            .Include(g => g.User)
            .FirstOrDefaultAsync(g => g.Id == id);

        if (image == null)
        {
            return NotFound(new { message = "Изображение не найдено" });
        }

        image.Status = status;
        image.ModerationComment = comment;
        image.ModeratedAt = DateTime.UtcNow;
        image.ModeratedById = moderatorId.Value;

        await _context.SaveChangesAsync();

        var moderator = await _context.Users.FindAsync(moderatorId.Value);

        return Ok(new GalleryImageDetailDto(
            image.Id,
            image.Title,
            image.ImageUrl,
            image.FileName,
            image.Status,
            image.ModerationComment,
            image.ModeratedAt,
            moderator != null ? new GalleryUserDto(moderator.Id, moderator.Name) : null,
            image.CreatedAt,
            new GalleryUserDto(image.User.Id, image.User.Name)
        ));
    }

    private Guid? GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(userIdClaim, out var userId) ? userId : null;
    }
}

public record BulkRejectRequest(List<Guid> Ids, string? Comment);
