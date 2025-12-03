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
[Authorize]
public class FavoritesController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public FavoritesController(ApplicationDbContext context)
    {
        _context = context;
    }

    private Guid? GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(userIdClaim, out var userId) ? userId : null;
    }

    // GET: api/favorites
    [HttpGet]
    public async Task<ActionResult<ListingsPagedResponse>> GetFavorites(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12)
    {
        var userId = GetUserId();
        if (!userId.HasValue)
            return Unauthorized();

        var query = _context.Favorites
            .Include(f => f.Listing)
                .ThenInclude(l => l.City)
            .Include(f => f.Listing)
                .ThenInclude(l => l.Images)
            .Include(f => f.Listing)
                .ThenInclude(l => l.Shelter)
            .Where(f => f.UserId == userId.Value)
            .OrderByDescending(f => f.CreatedAt);

        var totalCount = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        var favoriteListings = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(f => f.Listing)
            .ToListAsync();

        var favoriteIds = favoriteListings.Select(l => l.Id).ToList();

        var items = favoriteListings.Select(l => new ListingListDto(
            l.Id,
            l.Title,
            l.AnimalType,
            l.Breed,
            l.Age,
            l.Gender,
            l.Type,
            l.Price,
            new ListingCityDto(l.City.Id, l.City.Name, l.City.Region),
            l.Images.OrderBy(i => i.Order).FirstOrDefault()?.Url,
            l.Status,
            l.ModerationStatus,
            true, // Все в избранном
            l.Shelter != null
                ? new ListingShelterDto(l.Shelter.Id, l.Shelter.Name, l.Shelter.LogoUrl, l.Shelter.IsVerified)
                : null,
            l.CreatedAt,
            l.ExpiresAt
        )).ToList();

        return Ok(new ListingsPagedResponse(items, totalCount, page, pageSize, totalPages));
    }

    // POST: api/favorites/{listingId}
    [HttpPost("{listingId:guid}")]
    public async Task<ActionResult> AddToFavorites(Guid listingId)
    {
        var userId = GetUserId();
        if (!userId.HasValue)
            return Unauthorized();

        // Проверяем, существует ли объявление
        var listingExists = await _context.Listings.AnyAsync(l => l.Id == listingId);
        if (!listingExists)
            return NotFound(new { message = "Объявление не найдено" });

        // Проверяем, нет ли уже в избранном
        var exists = await _context.Favorites
            .AnyAsync(f => f.UserId == userId.Value && f.ListingId == listingId);

        if (exists)
            return Ok(new { message = "Объявление уже в избранном" });

        var favorite = new Favorite
        {
            UserId = userId.Value,
            ListingId = listingId
        };

        _context.Favorites.Add(favorite);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Добавлено в избранное" });
    }

    // DELETE: api/favorites/{listingId}
    [HttpDelete("{listingId:guid}")]
    public async Task<ActionResult> RemoveFromFavorites(Guid listingId)
    {
        var userId = GetUserId();
        if (!userId.HasValue)
            return Unauthorized();

        var favorite = await _context.Favorites
            .FirstOrDefaultAsync(f => f.UserId == userId.Value && f.ListingId == listingId);

        if (favorite == null)
            return NotFound(new { message = "Объявление не в избранном" });

        _context.Favorites.Remove(favorite);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // GET: api/favorites/check?ids=...
    [HttpGet("check")]
    public async Task<ActionResult<List<Guid>>> CheckFavorites([FromQuery] List<Guid> ids)
    {
        var userId = GetUserId();
        if (!userId.HasValue)
            return Unauthorized();

        var favoriteIds = await _context.Favorites
            .Where(f => f.UserId == userId.Value && ids.Contains(f.ListingId))
            .Select(f => f.ListingId)
            .ToListAsync();

        return Ok(favoriteIds);
    }

    // GET: api/favorites/count
    [HttpGet("count")]
    public async Task<ActionResult<int>> GetFavoritesCount()
    {
        var userId = GetUserId();
        if (!userId.HasValue)
            return Unauthorized();

        var count = await _context.Favorites
            .CountAsync(f => f.UserId == userId.Value);

        return Ok(count);
    }
}
