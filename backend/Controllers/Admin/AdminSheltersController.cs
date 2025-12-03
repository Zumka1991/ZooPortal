using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ZooPortal.Api.Data;
using ZooPortal.Api.DTOs;
using ZooPortal.Api.Models;

namespace ZooPortal.Api.Controllers.Admin;

[ApiController]
[Route("api/admin/shelters")]
[Authorize(Roles = "Admin,Moderator")]
public class AdminSheltersController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IWebHostEnvironment _environment;

    public AdminSheltersController(ApplicationDbContext context, IWebHostEnvironment environment)
    {
        _context = context;
        _environment = environment;
    }

    /// <summary>
    /// Получить все приюты для модерации
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<AdminSheltersPagedResponse>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] ModerationStatus? status = null,
        [FromQuery] Guid? cityId = null,
        [FromQuery] bool? isVerified = null,
        [FromQuery] string? search = null)
    {
        pageSize = Math.Clamp(pageSize, 1, 100);
        page = Math.Max(1, page);

        var query = _context.Shelters
            .Include(s => s.City)
            .Include(s => s.Owner)
            .Include(s => s.Images.OrderBy(i => i.SortOrder))
            .AsQueryable();

        if (status.HasValue)
        {
            query = query.Where(s => s.ModerationStatus == status.Value);
        }

        if (cityId.HasValue)
        {
            query = query.Where(s => s.CityId == cityId.Value);
        }

        if (isVerified.HasValue)
        {
            query = query.Where(s => s.IsVerified == isVerified.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(s =>
                s.Name.ToLower().Contains(searchLower) ||
                s.City.Name.ToLower().Contains(searchLower) ||
                (s.Owner != null && s.Owner.Name.ToLower().Contains(searchLower)));
        }

        query = query.OrderByDescending(s => s.CreatedAt);

        var totalCount = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        // Get counts by status
        var pendingCount = await _context.Shelters.CountAsync(s => s.ModerationStatus == ModerationStatus.Pending);
        var approvedCount = await _context.Shelters.CountAsync(s => s.ModerationStatus == ModerationStatus.Approved);
        var rejectedCount = await _context.Shelters.CountAsync(s => s.ModerationStatus == ModerationStatus.Rejected);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var itemDtos = items.Select(MapToDetailDto).ToList();

        return Ok(new AdminSheltersPagedResponse(
            itemDtos, totalCount, page, pageSize, totalPages,
            pendingCount, approvedCount, rejectedCount));
    }

    /// <summary>
    /// Одобрить приют
    /// </summary>
    [HttpPost("{id:guid}/approve")]
    public async Task<ActionResult<ShelterDetailDto>> Approve(Guid id, [FromBody] ModerateShelterRequest? request)
    {
        return await ModerateAsync(id, ModerationStatus.Approved, request?.Comment);
    }

    /// <summary>
    /// Отклонить приют
    /// </summary>
    [HttpPost("{id:guid}/reject")]
    public async Task<ActionResult<ShelterDetailDto>> Reject(Guid id, [FromBody] ModerateShelterRequest? request)
    {
        return await ModerateAsync(id, ModerationStatus.Rejected, request?.Comment);
    }

    /// <summary>
    /// Верифицировать приют
    /// </summary>
    [HttpPost("{id:guid}/verify")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ShelterDetailDto>> Verify(Guid id)
    {
        var shelter = await _context.Shelters
            .Include(s => s.City)
            .Include(s => s.Owner)
            .Include(s => s.Images)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (shelter == null)
        {
            return NotFound(new { message = "Приют не найден" });
        }

        shelter.IsVerified = true;
        await _context.SaveChangesAsync();

        return Ok(MapToDetailDto(shelter));
    }

    /// <summary>
    /// Снять верификацию
    /// </summary>
    [HttpPost("{id:guid}/unverify")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ShelterDetailDto>> Unverify(Guid id)
    {
        var shelter = await _context.Shelters
            .Include(s => s.City)
            .Include(s => s.Owner)
            .Include(s => s.Images)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (shelter == null)
        {
            return NotFound(new { message = "Приют не найден" });
        }

        shelter.IsVerified = false;
        await _context.SaveChangesAsync();

        return Ok(MapToDetailDto(shelter));
    }

    /// <summary>
    /// Деактивировать приют
    /// </summary>
    [HttpPost("{id:guid}/deactivate")]
    public async Task<ActionResult<ShelterDetailDto>> Deactivate(Guid id)
    {
        var shelter = await _context.Shelters
            .Include(s => s.City)
            .Include(s => s.Owner)
            .Include(s => s.Images)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (shelter == null)
        {
            return NotFound(new { message = "Приют не найден" });
        }

        shelter.IsActive = false;
        await _context.SaveChangesAsync();

        return Ok(MapToDetailDto(shelter));
    }

    /// <summary>
    /// Активировать приют
    /// </summary>
    [HttpPost("{id:guid}/activate")]
    public async Task<ActionResult<ShelterDetailDto>> Activate(Guid id)
    {
        var shelter = await _context.Shelters
            .Include(s => s.City)
            .Include(s => s.Owner)
            .Include(s => s.Images)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (shelter == null)
        {
            return NotFound(new { message = "Приют не найден" });
        }

        shelter.IsActive = true;
        await _context.SaveChangesAsync();

        return Ok(MapToDetailDto(shelter));
    }

    /// <summary>
    /// Удалить приют
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> Delete(Guid id)
    {
        var shelter = await _context.Shelters
            .Include(s => s.Images)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (shelter == null)
        {
            return NotFound(new { message = "Приют не найден" });
        }

        // Delete all images
        foreach (var image in shelter.Images)
        {
            if (!string.IsNullOrEmpty(image.FileName))
            {
                var filePath = Path.Combine(_environment.ContentRootPath, "uploads", "shelters", "images", image.FileName);
                if (System.IO.File.Exists(filePath))
                {
                    System.IO.File.Delete(filePath);
                }
            }
        }

        _context.Shelters.Remove(shelter);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Приют удалён" });
    }

    private async Task<ActionResult<ShelterDetailDto>> ModerateAsync(Guid id, ModerationStatus status, string? comment)
    {
        var moderatorId = GetUserId();
        if (moderatorId == null) return Unauthorized();

        var shelter = await _context.Shelters
            .Include(s => s.City)
            .Include(s => s.Owner)
            .Include(s => s.Images)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (shelter == null)
        {
            return NotFound(new { message = "Приют не найден" });
        }

        shelter.ModerationStatus = status;
        shelter.ModerationComment = comment;
        shelter.ModeratedAt = DateTime.UtcNow;
        shelter.ModeratedById = moderatorId.Value;

        await _context.SaveChangesAsync();

        return Ok(MapToDetailDto(shelter));
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
