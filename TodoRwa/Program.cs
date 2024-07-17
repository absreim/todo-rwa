using Microsoft.EntityFrameworkCore;
using TodoRwa.Models;

var builder = WebApplication.CreateBuilder(args);

var corsPolicyName = "_CorsPolicy";

builder.Services.AddCors(options =>
{
    options.AddPolicy(name: corsPolicyName,
        policy =>
        {
            policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
        });
});

// Add services to the container.

builder.Services.AddControllers();

var postgresConnStr = builder.Configuration["Postgres:ConnectionString"];

builder.Services.AddDbContext<TodoContext>(opt => opt.UseNpgsql(postgresConnStr));

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors(corsPolicyName);

app.UseAuthorization();

app.MapControllers();

app.Run();