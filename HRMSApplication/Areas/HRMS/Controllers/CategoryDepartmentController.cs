using HRMSApplication.Services;
using HRMSApplication;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using CampusConnect.HRMSApplication.Areas.HRMS.Models;

namespace CampusConnect.HRMSApplication.Areas.HRMS.Controllers
{
    [Area("HRMS")]
    public class CategoryDepartmentController : Controller
    {
        public IHeaderService _headers;
        private ApiService apiConsume = new ApiService();
        public CategoryDepartmentController(IHeaderService headerService)
        {
            _headers = headerService;

        }
        public IActionResult CreateCategory()
        {
            return View();
        }

        // Add Category
        public async Task<ActionResult> SaveCategory([FromBody] Category category)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage);
                return BadRequest(new { message = "Model binding failed", errors });
            }
            string postData = JsonConvert.SerializeObject(category);
            string url = ApiService.HRMS + "Org/Category/Add";
            var mHeader = _headers.GetHeaders();
            var response = await apiConsume.SendRequestAsync(url, HttpMethod.Post, mHeader, null, postData);
            return new JsonResult(response);

        }

        // Category List
        public async Task<ActionResult> CategoryList()
        {
            string url = ApiService.HRMS + "Org/category/list";
            var mHeader = _headers.GetHeaders();
            var response = await apiConsume.SendRequestAsync(url, HttpMethod.Get, mHeader);
            return new JsonResult(response);
        }

        // Update Category
        public async Task<ActionResult> UpdateCategory([FromBody] Category category)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage);
                return BadRequest(new { message = "Model binding failed", errors });
            }
            string postData = JsonConvert.SerializeObject(category);
            string url = ApiService.HRMS + "Org/category/Update";
            var mHeader = _headers.GetHeaders();
            var response = await apiConsume.SendRequestAsync(url, HttpMethod.Post, mHeader, null, postData);
            return new JsonResult(response);

        }

        // Delete Category

        public async Task<ActionResult> deleteCategory(int deptcode)
        {
            string url = ApiService.HRMS + $"Org/category/Delete?deptcode={deptcode}";
            var mHeader = _headers.GetHeaders();
            var response = await apiConsume.SendRequestAsync(url, HttpMethod.Get, mHeader);
            return new JsonResult(response);
        }
    }
}
