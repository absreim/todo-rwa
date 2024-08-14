namespace TodoRwa.Models;

public class TodoItem
{
    public long Id { get; set; }
    public string Name { get; set; } = null!;
    public bool IsComplete { get; set; }
}