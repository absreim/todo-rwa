using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Npgsql;
using TodoRwa.Models;

var config = new ConfigurationBuilder()
    .AddEnvironmentVariables()
    .AddUserSecrets<Program>()
    .Build();

// Some considerations when into my decision to drop the database before each reseed instead of deleting table contents
// or dropping tables in the database.
// 1. Sequence numbers do not get reset by clearing out the contents of tables. Ideally, tests should not break when
// sequence numbers change, but it is quite possible that after enough runs that sequence numbers might become large
// enough to become an eyesore.
// 2. Maintaining table-dropping code can be tedious. To make matters worse, some database engines understandably do not
// allow multiple cascade paths. In schemas complex enough to require such consideration, one would likely get around
// the issue by disabling cascade delete. Doing so would require carefully ordered dropping of tables to avoid
// protections on dropping tables that are being referenced by foreign keys, making the table-dropping code even more
// complicated.
//
// To drop a database, one must make a connection to a database other one that they want to drop. The main database
// just happens to conveniently exist. Theoretically, one can connect any other database to perform the drop.
// Of course, the user account would need to have permission to connect to the other database.
var mainDbConnStr = config["MAIN_DB_CONN_STR"];
var testDbName = config["TEST_DB_NAME"];
if (testDbName == null)
{
    Console.Error.WriteLine("Please specify the name of the test DB in the 'TestDbName' configuration value.");
    Environment.Exit(1);
}

var dataSourceBuilder = new NpgsqlDataSourceBuilder(mainDbConnStr);
var dataSource = dataSourceBuilder.Build();
await using (var conn = await dataSource.OpenConnectionAsync())
{
    var cmd = new NpgsqlCommand($"DROP DATABASE IF EXISTS {testDbName}", conn);
    cmd.Parameters.AddWithValue(testDbName);
    await cmd.ExecuteNonQueryAsync();
}

var postgresConnStr = config["TEST_DB_CONN_STR"];

var contextOptions = new DbContextOptionsBuilder<TodoContext>()
    .UseNpgsql(postgresConnStr).Options;
var dbContext = new TodoContext(contextOptions);

// Getting the migration to work at design time seems quite problematic. However, running the migration at runtime
// seems to be a good solution. The following answer inspired this solution: https://stackoverflow.com/a/55173783.
//
// Runtime migrations create the database if it does not already exist. Since we are dropping the database earlier
// in this script and are now recreating it, please ensure that the database role has permission to create a database.
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
        Name = "baz",
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