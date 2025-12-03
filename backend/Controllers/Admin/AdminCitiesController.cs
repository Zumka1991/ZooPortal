using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ZooPortal.Api.Data;
using ZooPortal.Api.DTOs;
using ZooPortal.Api.Models;

namespace ZooPortal.Api.Controllers.Admin;

[ApiController]
[Route("api/admin/cities")]
[Authorize(Roles = "Admin")]
public class AdminCitiesController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public AdminCitiesController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET: api/admin/cities
    [HttpGet]
    public async Task<ActionResult<AdminCitiesPagedResponse>> GetAll(
        [FromQuery] string? search,
        [FromQuery] bool? isActive,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        var query = _context.Cities.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(c =>
                c.Name.ToLower().Contains(searchLower) ||
                (c.Region != null && c.Region.ToLower().Contains(searchLower)));
        }

        if (isActive.HasValue)
            query = query.Where(c => c.IsActive == isActive.Value);

        query = query.OrderBy(c => c.Name);

        var totalCount = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        var cities = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new AdminCityDto(
                c.Id,
                c.Name,
                c.Region,
                c.IsActive,
                c.Shelters.Count,
                _context.Listings.Count(l => l.CityId == c.Id),
                c.CreatedAt
            ))
            .ToListAsync();

        return Ok(new AdminCitiesPagedResponse(cities, totalCount, page, pageSize, totalPages));
    }

    // GET: api/admin/cities/{id}
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<AdminCityDto>> GetById(Guid id)
    {
        var city = await _context.Cities
            .Where(c => c.Id == id)
            .Select(c => new AdminCityDto(
                c.Id,
                c.Name,
                c.Region,
                c.IsActive,
                c.Shelters.Count,
                _context.Listings.Count(l => l.CityId == c.Id),
                c.CreatedAt
            ))
            .FirstOrDefaultAsync();

        if (city == null)
            return NotFound(new { message = "Город не найден" });

        return Ok(city);
    }

    // POST: api/admin/cities
    [HttpPost]
    public async Task<ActionResult<AdminCityDto>> Create([FromBody] AdminCreateCityRequest request)
    {
        // Проверяем, нет ли уже такого города
        var exists = await _context.Cities.AnyAsync(c =>
            c.Name.ToLower() == request.Name.ToLower() &&
            (c.Region == null && request.Region == null ||
             c.Region != null && request.Region != null && c.Region.ToLower() == request.Region.ToLower()));

        if (exists)
            return BadRequest(new { message = "Город с таким названием уже существует" });

        var city = new City
        {
            Name = request.Name,
            Region = request.Region,
            IsActive = true
        };

        _context.Cities.Add(city);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = city.Id }, new AdminCityDto(
            city.Id,
            city.Name,
            city.Region,
            city.IsActive,
            0,
            0,
            city.CreatedAt
        ));
    }

    // PUT: api/admin/cities/{id}
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<AdminCityDto>> Update(Guid id, [FromBody] AdminUpdateCityRequest request)
    {
        var city = await _context.Cities.FindAsync(id);
        if (city == null)
            return NotFound(new { message = "Город не найден" });

        // Проверяем, нет ли дубликата
        var duplicate = await _context.Cities.AnyAsync(c =>
            c.Id != id &&
            c.Name.ToLower() == request.Name.ToLower() &&
            (c.Region == null && request.Region == null ||
             c.Region != null && request.Region != null && c.Region.ToLower() == request.Region.ToLower()));

        if (duplicate)
            return BadRequest(new { message = "Город с таким названием уже существует" });

        city.Name = request.Name;
        city.Region = request.Region;
        city.IsActive = request.IsActive;

        await _context.SaveChangesAsync();

        var sheltersCount = await _context.Shelters.CountAsync(s => s.CityId == id);
        var listingsCount = await _context.Listings.CountAsync(l => l.CityId == id);

        return Ok(new AdminCityDto(
            city.Id,
            city.Name,
            city.Region,
            city.IsActive,
            sheltersCount,
            listingsCount,
            city.CreatedAt
        ));
    }

    // DELETE: api/admin/cities/{id}
    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        var city = await _context.Cities.FindAsync(id);
        if (city == null)
            return NotFound(new { message = "Город не найден" });

        // Проверяем, есть ли связанные данные
        var hasShelters = await _context.Shelters.AnyAsync(s => s.CityId == id);
        var hasListings = await _context.Listings.AnyAsync(l => l.CityId == id);

        if (hasShelters || hasListings)
            return BadRequest(new { message = "Невозможно удалить город, так как с ним связаны приюты или объявления. Деактивируйте город вместо удаления." });

        _context.Cities.Remove(city);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // POST: api/admin/cities/seed-russia
    [HttpPost("seed-russia")]
    public async Task<ActionResult<SeedCitiesResponse>> SeedRussianCities()
    {
        var existingCount = await _context.Cities.CountAsync();

        // Список крупных и средних городов России с регионами
        var russianCities = new List<(string Name, string Region)>
        {
            // Города федерального значения
            ("Москва", ""),
            ("Санкт-Петербург", ""),
            ("Севастополь", ""),

            // Города-миллионники
            ("Новосибирск", "Новосибирская область"),
            ("Екатеринбург", "Свердловская область"),
            ("Казань", "Республика Татарстан"),
            ("Нижний Новгород", "Нижегородская область"),
            ("Челябинск", "Челябинская область"),
            ("Самара", "Самарская область"),
            ("Омск", "Омская область"),
            ("Ростов-на-Дону", "Ростовская область"),
            ("Уфа", "Республика Башкортостан"),
            ("Красноярск", "Красноярский край"),
            ("Воронеж", "Воронежская область"),
            ("Пермь", "Пермский край"),
            ("Волгоград", "Волгоградская область"),

            // Крупные города (500-1000 тыс.)
            ("Краснодар", "Краснодарский край"),
            ("Саратов", "Саратовская область"),
            ("Тюмень", "Тюменская область"),
            ("Тольятти", "Самарская область"),
            ("Ижевск", "Удмуртская Республика"),
            ("Барнаул", "Алтайский край"),
            ("Ульяновск", "Ульяновская область"),
            ("Иркутск", "Иркутская область"),
            ("Хабаровск", "Хабаровский край"),
            ("Ярославль", "Ярославская область"),
            ("Владивосток", "Приморский край"),
            ("Махачкала", "Республика Дагестан"),
            ("Томск", "Томская область"),
            ("Оренбург", "Оренбургская область"),
            ("Кемерово", "Кемеровская область"),
            ("Новокузнецк", "Кемеровская область"),
            ("Рязань", "Рязанская область"),
            ("Астрахань", "Астраханская область"),
            ("Набережные Челны", "Республика Татарстан"),
            ("Пенза", "Пензенская область"),
            ("Липецк", "Липецкая область"),
            ("Киров", "Кировская область"),

            // Средние города (200-500 тыс.)
            ("Чебоксары", "Чувашская Республика"),
            ("Балашиха", "Московская область"),
            ("Калининград", "Калининградская область"),
            ("Тула", "Тульская область"),
            ("Курск", "Курская область"),
            ("Сочи", "Краснодарский край"),
            ("Ставрополь", "Ставропольский край"),
            ("Улан-Удэ", "Республика Бурятия"),
            ("Тверь", "Тверская область"),
            ("Магнитогорск", "Челябинская область"),
            ("Иваново", "Ивановская область"),
            ("Брянск", "Брянская область"),
            ("Белгород", "Белгородская область"),
            ("Сургут", "Ханты-Мансийский АО"),
            ("Владимир", "Владимирская область"),
            ("Нижний Тагил", "Свердловская область"),
            ("Архангельск", "Архангельская область"),
            ("Чита", "Забайкальский край"),
            ("Калуга", "Калужская область"),
            ("Смоленск", "Смоленская область"),
            ("Волжский", "Волгоградская область"),
            ("Якутск", "Республика Саха (Якутия)"),
            ("Саранск", "Республика Мордовия"),
            ("Череповец", "Вологодская область"),
            ("Курган", "Курганская область"),
            ("Вологда", "Вологодская область"),
            ("Орёл", "Орловская область"),
            ("Подольск", "Московская область"),
            ("Грозный", "Чеченская Республика"),
            ("Владикавказ", "Республика Северная Осетия"),
            ("Тамбов", "Тамбовская область"),
            ("Мурманск", "Мурманская область"),
            ("Петрозаводск", "Республика Карелия"),
            ("Нижневартовск", "Ханты-Мансийский АО"),
            ("Кострома", "Костромская область"),
            ("Йошкар-Ола", "Республика Марий Эл"),
            ("Новороссийск", "Краснодарский край"),
            ("Стерлитамак", "Республика Башкортостан"),
            ("Таганрог", "Ростовская область"),
            ("Комсомольск-на-Амуре", "Хабаровский край"),
            ("Химки", "Московская область"),
            ("Сыктывкар", "Республика Коми"),
            ("Нальчик", "Кабардино-Балкарская Республика"),
            ("Шахты", "Ростовская область"),
            ("Дзержинск", "Нижегородская область"),
            ("Братск", "Иркутская область"),
            ("Орск", "Оренбургская область"),
            ("Ангарск", "Иркутская область"),
            ("Энгельс", "Саратовская область"),
            ("Благовещенск", "Амурская область"),
            ("Старый Оскол", "Белгородская область"),
            ("Великий Новгород", "Новгородская область"),
            ("Королёв", "Московская область"),
            ("Псков", "Псковская область"),
            ("Мытищи", "Московская область"),
            ("Люберцы", "Московская область"),
            ("Южно-Сахалинск", "Сахалинская область"),
            ("Бийск", "Алтайский край"),
            ("Прокопьевск", "Кемеровская область"),
            ("Армавир", "Краснодарский край"),
            ("Рыбинск", "Ярославская область"),
            ("Норильск", "Красноярский край"),
            ("Балаково", "Саратовская область"),
            ("Абакан", "Республика Хакасия"),
            ("Петропавловск-Камчатский", "Камчатский край"),
            ("Северодвинск", "Архангельская область"),
            ("Симферополь", "Республика Крым"),
            ("Керчь", "Республика Крым"),
            ("Евпатория", "Республика Крым"),
            ("Ялта", "Республика Крым"),
        };

        var addedCount = 0;
        var existingNames = await _context.Cities
            .Select(c => c.Name.ToLower())
            .ToListAsync();

        foreach (var (name, region) in russianCities)
        {
            if (!existingNames.Contains(name.ToLower()))
            {
                _context.Cities.Add(new City
                {
                    Name = name,
                    Region = string.IsNullOrEmpty(region) ? null : region,
                    IsActive = true
                });
                addedCount++;
            }
        }

        await _context.SaveChangesAsync();

        var totalCount = await _context.Cities.CountAsync();

        var message = addedCount > 0
            ? $"Добавлено {addedCount} городов России"
            : "Все города России уже добавлены";

        return Ok(new SeedCitiesResponse(addedCount, totalCount, message));
    }

    // GET: api/admin/cities/stats
    [HttpGet("stats")]
    public async Task<ActionResult> GetStats()
    {
        var totalCount = await _context.Cities.CountAsync();
        var activeCount = await _context.Cities.CountAsync(c => c.IsActive);
        var withSheltersCount = await _context.Cities.CountAsync(c => c.Shelters.Any());
        var withListingsCount = await _context.Cities.CountAsync(c => _context.Listings.Any(l => l.CityId == c.Id));

        return Ok(new
        {
            totalCount,
            activeCount,
            inactiveCount = totalCount - activeCount,
            withSheltersCount,
            withListingsCount
        });
    }
}
