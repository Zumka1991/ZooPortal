using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ZooPortal.Api.Data;
using ZooPortal.Api.DTOs;
using ZooPortal.Api.Models;

namespace ZooPortal.Api.Controllers.Admin;

[ApiController]
[Route("api/admin/lost-found")]
[Authorize(Roles = "Admin,Moderator")]
public class AdminLostFoundController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IWebHostEnvironment _environment;

    public AdminLostFoundController(ApplicationDbContext context, IWebHostEnvironment environment)
    {
        _context = context;
        _environment = environment;
    }

    // GET: api/admin/lost-found
    [HttpGet]
    public async Task<ActionResult<AdminLostFoundPagedResponse>> GetAll(
        [FromQuery] ModerationStatus? status,
        [FromQuery] LostFoundType? type,
        [FromQuery] Guid? cityId,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var query = _context.LostFoundPosts
            .Include(l => l.City)
            .Include(l => l.User)
            .Include(l => l.Images)
            .AsQueryable();

        if (status.HasValue)
            query = query.Where(l => l.ModerationStatus == status.Value);

        if (type.HasValue)
            query = query.Where(l => l.Type == type.Value);

        if (cityId.HasValue)
            query = query.Where(l => l.CityId == cityId.Value);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(l =>
                l.Title.ToLower().Contains(searchLower) ||
                l.User.Name.ToLower().Contains(searchLower) ||
                l.User.Email.ToLower().Contains(searchLower));
        }

        // Счётчики
        var pendingCount = await _context.LostFoundPosts.CountAsync(l => l.ModerationStatus == ModerationStatus.Pending);
        var approvedCount = await _context.LostFoundPosts.CountAsync(l => l.ModerationStatus == ModerationStatus.Approved);
        var rejectedCount = await _context.LostFoundPosts.CountAsync(l => l.ModerationStatus == ModerationStatus.Rejected);

        query = query.OrderByDescending(l => l.CreatedAt);

        var totalCount = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(l => new AdminLostFoundListDto(
                l.Id,
                l.Title,
                l.Type,
                l.AnimalType,
                l.Breed,
                new CityDto(l.City.Id, l.City.Name, l.City.Region),
                l.EventDate,
                l.Status,
                l.ModerationStatus,
                l.ModerationComment,
                new AdminLostFoundUserDto(l.User.Id, l.User.Name, l.User.Email),
                l.Images.OrderBy(i => i.Order).Select(i => i.Url).FirstOrDefault(),
                l.CreatedAt
            ))
            .ToListAsync();

        return Ok(new AdminLostFoundPagedResponse(
            items, totalCount, page, pageSize, totalPages,
            pendingCount, approvedCount, rejectedCount
        ));
    }

    // GET: api/admin/lost-found/{id}
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<AdminLostFoundDetailDto>> GetById(Guid id)
    {
        var item = await _context.LostFoundPosts
            .Include(l => l.City)
            .Include(l => l.User)
            .Include(l => l.Images)
            .FirstOrDefaultAsync(l => l.Id == id);

        if (item == null)
            return NotFound(new { message = "Запись не найдена" });

        return Ok(new AdminLostFoundDetailDto(
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
            item.ModeratedAt,
            new AdminLostFoundUserDto(item.User.Id, item.User.Name, item.User.Email),
            item.Images.OrderBy(i => i.Order).Select(i => new LostFoundImageDto(i.Id, i.Url, i.Order)).ToList(),
            item.CreatedAt
        ));
    }

    // POST: api/admin/lost-found/{id}/approve
    [HttpPost("{id:guid}/approve")]
    public async Task<ActionResult> Approve(Guid id, [FromBody] ModerationRequest? request)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        var item = await _context.LostFoundPosts.FindAsync(id);
        if (item == null)
            return NotFound(new { message = "Запись не найдена" });

        item.ModerationStatus = ModerationStatus.Approved;
        item.ModerationComment = request?.Comment;
        item.ModeratedAt = DateTime.UtcNow;
        item.ModeratedById = userId;

        await _context.SaveChangesAsync();

        return Ok(new { message = "Запись одобрена" });
    }

    // POST: api/admin/lost-found/{id}/reject
    [HttpPost("{id:guid}/reject")]
    public async Task<ActionResult> Reject(Guid id, [FromBody] ModerationRequest? request)
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        var item = await _context.LostFoundPosts.FindAsync(id);
        if (item == null)
            return NotFound(new { message = "Запись не найдена" });

        item.ModerationStatus = ModerationStatus.Rejected;
        item.ModerationComment = request?.Comment;
        item.ModeratedAt = DateTime.UtcNow;
        item.ModeratedById = userId;

        await _context.SaveChangesAsync();

        return Ok(new { message = "Запись отклонена" });
    }

    // DELETE: api/admin/lost-found/{id}
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> Delete(Guid id)
    {
        var item = await _context.LostFoundPosts
            .Include(l => l.Images)
            .FirstOrDefaultAsync(l => l.Id == id);

        if (item == null)
            return NotFound(new { message = "Запись не найдена" });

        // Удаляем изображения
        foreach (var image in item.Images)
        {
            DeleteImageFile(image.Url);
        }

        _context.LostFoundPosts.Remove(item);
        await _context.SaveChangesAsync();

        return NoContent();
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

public record ModerationRequest(string? Comment);
