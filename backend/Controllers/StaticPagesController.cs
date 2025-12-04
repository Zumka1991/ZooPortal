using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ZooPortal.Api.Data;
using ZooPortal.Api.DTOs;

namespace ZooPortal.Api.Controllers;

[ApiController]
[Route("api/static-pages")]
public class StaticPagesController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public StaticPagesController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("{slug}")]
    public async Task<ActionResult<StaticPageDto>> GetBySlug(string slug)
    {
        var page = await _context.StaticPages
            .Include(p => p.LastEditedBy)
            .FirstOrDefaultAsync(p => p.Slug == slug && p.IsPublished);

        if (page == null)
            return NotFound(new { message = "Страница не найдена" });

        return Ok(new StaticPageDto(
            page.Id,
            page.Slug,
            page.Title,
            page.Content,
            page.MetaDescription,
            page.IsPublished,
            page.CreatedAt,
            page.UpdatedAt,
            page.LastEditedBy != null
                ? new EditorDto(page.LastEditedBy.Id, page.LastEditedBy.Name)
                : null
        ));
    }
}
