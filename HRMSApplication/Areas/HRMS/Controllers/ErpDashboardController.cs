using System.Text.Json.Nodes;
using HRMSApplication.Areas.HRMS.Models;
using HRMSApplication.Services;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;

namespace HRMSApplication.Areas.HRMS.Controllers
{
    [Area("HRMS")]
    public class ErpDashboardController : Controller
    {
        ApiService apiService = new ApiService();
        public IHeaderService _headers;
        public ErpDashboardController(IHeaderService headerService)
        {
            _headers = headerService;
            
        }
        public async Task<IActionResult> Index()
        {
            try
            {
                var userId = HttpContext.Session.GetString("UserID");
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized();
                }

                string url = ApiService.userMenu + $"MenuSetting/GetMenuListByUser?UserID={userId}";
                var mHeader = _headers.GetHeaders();
                Console.WriteLine(mHeader);
                mHeader["UserID"] = userId;

                var responseGet = await apiService.SendRequestAsync(url, HttpMethod.Get, mHeader);
                string jsonResponse = responseGet;
                var jsonNode = JsonNode.Parse(jsonResponse);
                if (jsonNode == null)
                {
                    return StatusCode(500, new { error = "Invalid JSON response from API" });
                }

                JsonObject jsonObject;
                if (jsonNode is JsonObject)
                {
                    jsonObject = jsonNode.AsObject();
                }
                else if (jsonNode is JsonArray jsonArray)
                {
                    jsonObject = new JsonObject { ["dataFetch"] = new JsonObject { ["table"] = jsonNode } };
                }
                else
                {
                    return StatusCode(500, new { error = "Unexpected JSON format" });
                }

                var tableArray = jsonObject?["dataFetch"]?["table"]?.AsArray();
                if (tableArray == null)
                {
                    return Unauthorized();
                }

                var menuItems = JsonConvert.DeserializeObject<List<MenuItem>>(tableArray.ToString());
                if (menuItems == null || !menuItems.Any())
                {
                    return StatusCode(500, new { error = "No menu items found in response" });
                }

                var menuHierarchy = BuildMenuHierarchy(menuItems);
                return Json(menuHierarchy);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to fetch menu items", details = ex.Message });
            }
        }

        private List<MenuItem> BuildMenuHierarchy(List<MenuItem> menuItems)
        {
            var lookup = menuItems.ToDictionary(m => m.menuID, m => m);
            var hierarchy = new List<MenuItem>();

            // Sort by menuType and position for consistent processing
            var sortedItems = menuItems.OrderBy(m => m.menuType).ThenBy(m => m.position).ToList();

            // First Pass: Add ParentMenus (menuType: 1)
            foreach (var item in sortedItems.Where(m => m.menuType == 1 && string.IsNullOrEmpty(m.controllerNm) && string.IsNullOrEmpty(m.acmethod)))
            {
                hierarchy.Add(item);
                item.subMenus = new List<MenuItem>(); // Initialize subMenus list
            }

            // Second Pass: Add SubMenus (menuType: 2) under ParentMenus using mainMenu
            foreach (var item in sortedItems.Where(m => m.menuType == 2))
            {
                if (item.mainMenu > 0 && lookup.TryGetValue(item.mainMenu, out var parent) && parent.menuType == 1)
                {
                    if (parent.subMenus == null) parent.subMenus = new List<MenuItem>();
                    parent.subMenus.Add(item);
                    item.subMenus = new List<MenuItem>(); // Initialize subMenus for potential children
                }
            }

            // Third Pass: Add ChildMenus (menuType: 3) under SubMenus using subMenu
            foreach (var item in sortedItems.Where(m => m.menuType == 3))
            {
                if (item.subMenu > 0 && lookup.TryGetValue(item.subMenu, out var parent) && parent.menuType == 2)
                {
                    if (parent.subMenus == null) parent.subMenus = new List<MenuItem>();
                    parent.subMenus.Add(item);
                    item.subMenus = new List<MenuItem>(); // Initialize subMenus for potential grandchildren
                }
            }

            // Fourth Pass: Add GrandChildMenus (menuType: 4) under ChildMenus using childMenu
            foreach (var item in sortedItems.Where(m => m.menuType == 4))
            {
                if (item.childMenu > 0 && lookup.TryGetValue(item.childMenu, out var parent) && parent.menuType == 3)
                {
                    if (parent.subMenus == null) parent.subMenus = new List<MenuItem>();
                    parent.subMenus.Add(item);
                }
            }

            // Sort subMenus at each level by position
            void SortSubMenus(List<MenuItem> menus)
            {
                foreach (var menu in menus)
                {
                    if (menu.subMenus != null && menu.subMenus.Any())
                    {
                        menu.subMenus = menu.subMenus.OrderBy(m => m.position).ToList();
                        SortSubMenus(menu.subMenus);
                    }
                }
            }

            SortSubMenus(hierarchy);

            return hierarchy.OrderBy(m => m.position).ToList();
        }
    }
}
