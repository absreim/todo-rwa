FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
USER $APP_UID
WORKDIR /app

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["TodoRwa/TodoRwa.csproj", "TodoRwa/"]
RUN dotnet restore "TodoRwa/TodoRwa.csproj"
COPY ["SeedDatabase/SeedDatabase.csproj", "SeedDatabase/"]
RUN dotnet restore "SeedDatabase/SeedDatabase.csproj"
COPY . .
WORKDIR "/src/TodoRwa"
RUN dotnet build "TodoRwa.csproj" -c $BUILD_CONFIGURATION -o /app/build
WORKDIR "/src/SeedDatabase"
RUN dotnet build "SeedDatabase.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
WORKDIR "/src/TodoRwa"
RUN dotnet publish "TodoRwa.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false
WORKDIR "/src/SeedDatabase"
RUN dotnet publish "SeedDatabase.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
EXPOSE 8080
EXPOSE 8081
ENTRYPOINT dotnet ${DLL_PREFIX}.dll