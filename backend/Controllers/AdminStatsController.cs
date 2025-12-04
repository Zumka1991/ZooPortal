using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ZooPortal.Api.Data;

namespace ZooPortal.Api.Controllers;

[ApiController]
[Route("api/admin/[controller]")]
[Authorize(Roles = "Admin,Moderator")]
public class StatsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public StatsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<AdminStatsDto>> GetStats()
    {
        var articlesCount = await _context.Articles.CountAsync(a => a.IsPublished);
        var galleryCount = await _context.GalleryImages.CountAsync(g => g.Status == Models.ModerationStatus.Approved);
        var listingsCount = await _context.Listings.CountAsync(l => l.ModerationStatus == Models.ModerationStatus.Approved);
        var lostFoundCount = await _context.LostFound.CountAsync(l => l.ModerationStatus == Models.ModerationStatus.Approved);
        var sheltersCount = await _context.Shelters.CountAsync(s => s.Status == Models.ModerationStatus.Approved);
        var citiesCount = await _context.Cities.CountAsync();

        return Ok(new AdminStatsDto
        {
            ArticlesCount = articlesCount,
            GalleryCount = galleryCount,
            ListingsCount = listingsCount,
            LostFoundCount = lostFoundCount,
            SheltersCount = sheltersCount,
            CitiesCount = citiesCount
        });
    }
}

public record AdminStatsDto
{
    public int ArticlesCount { get; init; }
    public int GalleryCount { get; init; }
    public int ListingsCount { get; init; }
    public int LostFoundCount { get; init; }
    public int SheltersCount { get; init; }
    public int CitiesCount { get; init; }
}
