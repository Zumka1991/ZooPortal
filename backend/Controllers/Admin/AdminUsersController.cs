using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ZooPortal.Api.Data;
using ZooPortal.Api.DTOs;
using ZooPortal.Api.Models;

namespace ZooPortal.Api.Controllers.Admin;

[ApiController]
[Route("api/admin/users")]
[Authorize(Roles = "Admin")]
public class AdminUsersController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public AdminUsersController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<UsersPagedResponse>> GetUsers(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] UserRole? role = null,
        [FromQuery] bool? isActive = null,
        [FromQuery] string? search = null)
    {
        pageSize = Math.Clamp(pageSize, 1, 100);
        page = Math.Max(1, page);

        var query = _context.Users.AsQueryable();

        if (role.HasValue)
            query = query.Where(u => u.Role == role.Value);

        if (isActive.HasValue)
            query = query.Where(u => u.IsActive == isActive.Value);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(u =>
                u.Name.ToLower().Contains(searchLower) ||
                u.Email.ToLower().Contains(searchLower) ||
                (u.Phone != null && u.Phone.Contains(searchLower)));
        }

        var totalCount = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        var items = await query
            .OrderByDescending(u => u.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new AdminUserDto(
                u.Id,
                u.Email,
                u.Name,
                u.Phone,
                u.AvatarUrl,
                u.Role,
                u.IsActive,
                u.CreatedAt
            ))
            .ToListAsync();

        return Ok(new UsersPagedResponse(items, totalCount, page, pageSize, totalPages));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<AdminUserDetailDto>> GetUser(Guid id)
    {
        var user = await _context.Users
            .Include(u => u.Listings)
            .Include(u => u.GalleryImages)
            .Include(u => u.LostFoundPosts)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null)
            return NotFound(new { message = "Пользователь не найден" });

        var sheltersCount = await _context.Shelters.CountAsync(s => s.OwnerId == id);

        return Ok(new AdminUserDetailDto(
            user.Id,
            user.Email,
            user.Name,
            user.Phone,
            user.AvatarUrl,
            user.Role,
            user.IsActive,
            user.Listings.Count,
            user.GalleryImages.Count,
            user.LostFoundPosts.Count,
            sheltersCount,
            user.CreatedAt,
            user.UpdatedAt
        ));
    }

    [HttpPut("{id:guid}/role")]
    public async Task<ActionResult> UpdateRole(Guid id, [FromBody] UpdateUserRoleRequest request)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null)
            return NotFound(new { message = "Пользователь не найден" });

        Console.WriteLine($"Updating user {user.Email} role from {user.Role} to {request.Role}");

        user.Role = request.Role;
        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        Console.WriteLine($"User {user.Email} role updated successfully. New role: {user.Role}");

        return Ok(new {
            message = "Роль обновлена",
            userId = user.Id,
            newRole = user.Role
        });
    }

    [HttpPut("{id:guid}/status")]
    public async Task<ActionResult> UpdateStatus(Guid id, [FromBody] UpdateUserStatusRequest request)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null)
            return NotFound(new { message = "Пользователь не найден" });

        user.IsActive = request.IsActive;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Статус обновлён" });
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> DeleteUser(Guid id)
    {
        var user = await _context.Users
            .Include(u => u.Listings)
                .ThenInclude(l => l.Images)
            .Include(u => u.GalleryImages)
            .Include(u => u.LostFoundPosts)
                .ThenInclude(l => l.Images)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null)
            return NotFound(new { message = "Пользователь не найден" });

        // Нельзя удалить самого себя
        var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (currentUserId != null && Guid.Parse(currentUserId) == id)
            return BadRequest(new { message = "Нельзя удалить самого себя" });

        // Нельзя удалить последнего админа
        if (user.Role == UserRole.Admin)
        {
            var adminsCount = await _context.Users.CountAsync(u => u.Role == UserRole.Admin);
            if (adminsCount <= 1)
                return BadRequest(new { message = "Нельзя удалить последнего администратора" });
        }

        // TODO: Удалить файлы пользователя (аватар, изображения из объявлений и галереи)

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Пользователь удалён" });
    }
}
