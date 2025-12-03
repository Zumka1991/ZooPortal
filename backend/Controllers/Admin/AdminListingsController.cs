using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ZooPortal.Api.Data;
using ZooPortal.Api.DTOs;
using ZooPortal.Api.Models;

namespace ZooPortal.Api.Controllers.Admin;

[ApiController]
[Route("api/admin/listings")]
[Authorize(Roles = "Admin,Moderator")]
public class AdminListingsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public AdminListingsController(ApplicationDbContext context)
    {
        _context = context;
    }

    private Guid? GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(userIdClaim, out var userId) ? userId : null;
    }

    // GET: api/admin/listings
    [HttpGet]
    public async Task<ActionResult<AdminListingsPagedResponse>> GetAll(
        [FromQuery] ModerationStatus? status,
        [FromQuery] ListingType? type,
        [FromQuery] AnimalType? animalType,
        [FromQuery] Guid? cityId,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var query = _context.Listings
            .Include(l => l.City)
            .Include(l => l.User)
            .Include(l => l.Shelter)
            .Include(l => l.Images)
            .Include(l => l.Likes)
            .AsQueryable();

        if (status.HasValue)
            query = query.Where(l => l.ModerationStatus == status.Value);

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
                (l.Breed != null && l.Breed.ToLower().Contains(searchLower)) ||
                l.User.Name.ToLower().Contains(searchLower));
        }

        // Сначала Pending, потом по дате
        query = query
            .OrderBy(l => l.ModerationStatus == ModerationStatus.Pending ? 0 : 1)
            .ThenByDescending(l => l.CreatedAt);

        var totalCount = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        // Статистика
        var pendingCount = await _context.Listings.CountAsync(l => l.ModerationStatus == ModerationStatus.Pending);
        var approvedCount = await _context.Listings.CountAsync(l => l.ModerationStatus == ModerationStatus.Approved);
        var rejectedCount = await _context.Listings.CountAsync(l => l.ModerationStatus == ModerationStatus.Rejected);
        var expiredCount = await _context.Listings.CountAsync(l => l.ExpiresAt <= DateTime.UtcNow);

        var itemDtos = items.Select(l => MapToDetailDto(l)).ToList();

        return Ok(new AdminListingsPagedResponse(
            itemDtos, totalCount, page, pageSize, totalPages,
            pendingCount, approvedCount, rejectedCount, expiredCount));
    }

    // POST: api/admin/listings/{id}/approve
    [HttpPost("{id:guid}/approve")]
    public async Task<ActionResult<ListingDetailDto>> Approve(Guid id, [FromBody] ModerateListingRequest? request)
    {
        return await ModerateAsync(id, ModerationStatus.Approved, request?.Comment);
    }

    // POST: api/admin/listings/{id}/reject
    [HttpPost("{id:guid}/reject")]
    public async Task<ActionResult<ListingDetailDto>> Reject(Guid id, [FromBody] ModerateListingRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Comment))
            return BadRequest(new { message = "Укажите причину отклонения" });

        return await ModerateAsync(id, ModerationStatus.Rejected, request.Comment);
    }

    // POST: api/admin/listings/bulk-approve
    [HttpPost("bulk-approve")]
    public async Task<ActionResult> BulkApprove([FromBody] BulkModerateRequest request)
    {
        var moderatorId = GetUserId();
        if (!moderatorId.HasValue)
            return Unauthorized();

        var listings = await _context.Listings
            .Where(l => request.Ids.Contains(l.Id))
            .ToListAsync();

        foreach (var listing in listings)
        {
            listing.ModerationStatus = ModerationStatus.Approved;
            listing.Status = ListingStatus.Active;
            listing.ModerationComment = request.Comment;
            listing.ModeratedAt = DateTime.UtcNow;
            listing.ModeratedById = moderatorId.Value;
        }

        await _context.SaveChangesAsync();

        return Ok(new { message = $"Одобрено {listings.Count} объявлений" });
    }

    // POST: api/admin/listings/bulk-reject
    [HttpPost("bulk-reject")]
    public async Task<ActionResult> BulkReject([FromBody] BulkModerateRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Comment))
            return BadRequest(new { message = "Укажите причину отклонения" });

        var moderatorId = GetUserId();
        if (!moderatorId.HasValue)
            return Unauthorized();

        var listings = await _context.Listings
            .Where(l => request.Ids.Contains(l.Id))
            .ToListAsync();

        foreach (var listing in listings)
        {
            listing.ModerationStatus = ModerationStatus.Rejected;
            listing.ModerationComment = request.Comment;
            listing.ModeratedAt = DateTime.UtcNow;
            listing.ModeratedById = moderatorId.Value;
        }

        await _context.SaveChangesAsync();

        return Ok(new { message = $"Отклонено {listings.Count} объявлений" });
    }

    // DELETE: api/admin/listings/{id}
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> Delete(Guid id)
    {
        var listing = await _context.Listings
            .Include(l => l.Images)
            .FirstOrDefaultAsync(l => l.Id == id);

        if (listing == null)
            return NotFound(new { message = "Объявление не найдено" });

        _context.Listings.Remove(listing);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // === Private Methods ===

    private async Task<ActionResult<ListingDetailDto>> ModerateAsync(
        Guid id, ModerationStatus status, string? comment)
    {
        var moderatorId = GetUserId();
        if (!moderatorId.HasValue)
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

        listing.ModerationStatus = status;
        listing.ModerationComment = comment;
        listing.ModeratedAt = DateTime.UtcNow;
        listing.ModeratedById = moderatorId.Value;

        // При одобрении активируем объявление
        if (status == ModerationStatus.Approved)
        {
            listing.Status = ListingStatus.Active;
        }

        await _context.SaveChangesAsync();

        return Ok(MapToDetailDto(listing));
    }

    private static ListingDetailDto MapToDetailDto(Listing listing)
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
            false, // В админке не нужен isFavorite
            listing.Likes.Count,
            false, // В админке не нужен isLiked
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
