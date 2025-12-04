using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ZooPortal.Api.Data;
using ZooPortal.Api.DTOs;
using ZooPortal.Api.Models;

namespace ZooPortal.Api.Controllers.Admin;

[ApiController]
[Route("api/admin/static-pages")]
[Authorize(Roles = "Admin,Moderator")]
public class AdminStaticPagesController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public AdminStaticPagesController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<StaticPagesListResponse>> GetAll()
    {
        var pages = await _context.StaticPages
            .OrderBy(p => p.Slug)
            .Select(p => new StaticPageListDto(
                p.Id,
                p.Slug,
                p.Title,
                p.IsPublished,
                p.CreatedAt,
                p.UpdatedAt
            ))
            .ToListAsync();

        return Ok(new StaticPagesListResponse(pages, pages.Count));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<StaticPageDto>> GetById(Guid id)
    {
        var page = await _context.StaticPages
            .Include(p => p.LastEditedBy)
            .FirstOrDefaultAsync(p => p.Id == id);

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

    [HttpPost]
    public async Task<ActionResult<StaticPageDto>> Create([FromBody] CreateStaticPageRequest request)
    {
        // Проверка уникальности slug
        if (await _context.StaticPages.AnyAsync(p => p.Slug == request.Slug))
            return BadRequest(new { message = "Страница с таким slug уже существует" });

        var currentUserId = Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);

        var page = new StaticPage
        {
            Slug = request.Slug,
            Title = request.Title,
            Content = request.Content,
            MetaDescription = request.MetaDescription,
            IsPublished = request.IsPublished,
            LastEditedById = currentUserId,
            CreatedAt = DateTime.UtcNow
        };

        _context.StaticPages.Add(page);
        await _context.SaveChangesAsync();

        // Загрузить редактора для ответа
        await _context.Entry(page).Reference(p => p.LastEditedBy).LoadAsync();

        return CreatedAtAction(
            nameof(GetById),
            new { id = page.Id },
            new StaticPageDto(
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
            )
        );
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<StaticPageDto>> Update(Guid id, [FromBody] UpdateStaticPageRequest request)
    {
        var page = await _context.StaticPages
            .Include(p => p.LastEditedBy)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (page == null)
            return NotFound(new { message = "Страница не найдена" });

        var currentUserId = Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);

        page.Title = request.Title;
        page.Content = request.Content;
        page.MetaDescription = request.MetaDescription;
        page.IsPublished = request.IsPublished;
        page.LastEditedById = currentUserId;
        page.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // Перезагрузить редактора
        await _context.Entry(page).Reference(p => p.LastEditedBy).LoadAsync();

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

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        var page = await _context.StaticPages.FindAsync(id);

        if (page == null)
            return NotFound(new { message = "Страница не найдена" });

        _context.StaticPages.Remove(page);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Страница удалена" });
    }
}
