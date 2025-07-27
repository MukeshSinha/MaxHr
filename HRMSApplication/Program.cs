using HRMSApplication.BusinessLayer;
using HRMSApplication.Services;

var builder = WebApplication.CreateBuilder(args);

var basePath = builder.Configuration["BasePath"] ?? string.Empty;

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAllOrigins", builder =>
    {
        builder.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });
});

builder.Services.AddControllersWithViews();
builder.Services.AddScoped<SessionManager>();
builder.Services.AddScoped<IHeaderService, HeaderServices>();
builder.Services.AddSingleton<IHttpContextAccessor, HttpContextAccessor>();
builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromMinutes(30);
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
});

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();

// Add UseStaticFiles with cache-control headers
app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = ctx =>
    {
        ctx.Context.Response.Headers.Append("Cache-Control", "no-cache, no-store, must-revalidate");
        ctx.Context.Response.Headers.Append("Pragma", "no-cache");
        ctx.Context.Response.Headers.Append("Expires", "0");
    }
});

if (!string.IsNullOrEmpty(basePath))
{
    app.UsePathBase(basePath);
}

app.UseCors("AllowAllOrigins");
app.UseSession();
app.UseAuthorization();

app.Use(async (context, next) =>
{
    var path = context.Request.Path.Value?.TrimEnd('/');
    var pathBase = context.Request.PathBase.Value;

    if (string.IsNullOrEmpty(path) || path == pathBase)
    {
        context.Response.Redirect($"/{pathBase}/HRMS/EmployeeRegistration/Dashboard".Replace("//", "/"));
        return;
    }

    await next();
});

app.MapControllerRoute(
    name: "areas",
    pattern: "{area:exists}/{controller}/{action}/{id?}");

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Accounts}/{action=Login}/{id?}");

app.MapFallbackToFile("{pathBase}/index.html");

app.Run();