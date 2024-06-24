using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TodoRwa.Models;

// The following script assumes that the database does not exist at the time that it is run. The database must be
// dropped externally (e.g. via a shell script and psql) before running this script.

var config = new ConfigurationBuilder()
    .AddUserSecrets<Program>()
    .Build();
var postgresConnStr = config["Postgres:ConnectionString"];

var contextOptions = new DbContextOptionsBuilder<TodoContext>()
    .UseNpgsql(postgresConnStr).Options;
var dbContext = new TodoContext(contextOptions);

dbContext.Database.Migrate();
// Getting the migration to work at design time seems quite problematic. However, running the migration at runtime
// seems to be a good solution. The following answer inspired this solution: https://stackoverflow.com/a/55173783.

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