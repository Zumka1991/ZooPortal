using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ZooPortal.Api.Data;
using ZooPortal.Api.DTOs;
using ZooPortal.Api.Models;

namespace ZooPortal.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CitiesController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public CitiesController(ApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Получить список городов
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<CityDto>>> GetCities()
    {
        var cities = await _context.Cities
            .Where(c => c.IsActive)
            .OrderBy(c => c.Name)
            .Select(c => new CityDto(c.Id, c.Name, c.Region))
            .ToListAsync();

        return Ok(cities);
    }

    /// <summary>
    /// Добавить город (только админ)
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<CityDto>> CreateCity([FromBody] CreateCityRequest request)
    {
        var city = new City
        {
            Name = request.Name.Trim(),
            Region = request.Region?.Trim()
        };

        _context.Cities.Add(city);
        await _context.SaveChangesAsync();

        return Ok(new CityDto(city.Id, city.Name, city.Region));
    }

    /// <summary>
    /// Удалить город (только админ)
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> DeleteCity(Guid id)
    {
        var city = await _context.Cities.FindAsync(id);
        if (city == null)
        {
            return NotFound(new { message = "Город не найден" });
        }

        // Check if city has shelters
        var hasShelters = await _context.Shelters.AnyAsync(s => s.CityId == id);
        if (hasShelters)
        {
            return BadRequest(new { message = "Нельзя удалить город, в котором есть приюты" });
        }

        _context.Cities.Remove(city);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Город удалён" });
    }
}
