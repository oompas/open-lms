using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace Api;

[Table("WeatherForecast")]
public class WeatherForecast : BaseModel
{
    [PrimaryKey("Id", false)]
    public long Id { get; set; }

    [Column]
    public DateTime Date { get; set; }

    [Column]
    public int TemperatureC { get; set; }

    [Column]
    public string? Summary { get; set; }
    
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}
