using Api.Views;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("[controller]")]
public class WeatherForecastController : ControllerBase
{
    private static readonly string[] Summaries = new[]
    {
        "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
    };

    private readonly ILogger<WeatherForecastController> _logger;

    public WeatherForecastController(ILogger<WeatherForecastController> logger)
    {
        _logger = logger;
    }

    [HttpGet(Name = "GetWeatherForecast")]
    public async Task<IResult> Get(long id, Supabase.Client client)
    {
        var response = await client
            .From<WeatherForecast>()
            .Where(w => w.Id == id)
            .Get();

        var forecast = response.Models.FirstOrDefault();

        if (forecast == null)
        {
            return Results.NotFound();
        }

        var rsp = new GetWeatherForecastResponse
        {
            Id = forecast.Id,
            Date = forecast.Date,
            TemperatureC = forecast.TemperatureC,
            TemperatureF = forecast.TemperatureF,
            Summary = forecast.Summary,
        };

        return Results.Ok(rsp);
    }
}
