using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TodoRwa.Models;

IConfigurationRoot config = new ConfigurationBuilder()
    .AddUserSecrets<Program>()
    .Build();
var postgresConnStr = config["Postgres:ConnectionString"];

var contextOptions = new DbContextOptionsBuilder<TodoContext>()
    .UseNpgsql(postgresConnStr).Options;
var dbContext = new TodoContext(contextOptions);
dbContext.Database.Migrate();
using var transaction = dbContext.Database.BeginTransaction();

try
{
    var testRow1 = new TodoItem
    {
        Name = "foo",
        IsComplete = false
    };
    var testRow2 = new TodoItem
    {
        Name = "bar",
        IsComplete = true
    };
    var testRow3 = new TodoItem
    {
        Name = null,
        IsComplete = true
    };

    dbContext.Database.ExecuteSql($"DELETE FROM \"TodoItems\"");
    dbContext.TodoItems.Add(testRow1);
    dbContext.TodoItems.Add(testRow2);
    dbContext.TodoItems.Add(testRow3);
    dbContext.SaveChanges();
    
    transaction.Commit();
}
catch (Exception e)
{
    
    Console.Error.WriteLine(
        $"Error encountered while performing database operations: {e.Message}");
    Environment.Exit(1);
}