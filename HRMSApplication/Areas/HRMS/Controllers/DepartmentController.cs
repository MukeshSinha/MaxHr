using HRMSApplication.Services;
using HRMSApplication;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using CampusConnect.HRMSApplication.Areas.HRMS.Models;

namespace CampusConnect.HRMSApplication.Areas.HRMS.Controllers
{
    [Area("HRMS")]
    public class DepartmentController : Controller
    {
        public IHeaderService _headers;
        private ApiService apiConsume = new ApiService();
        public DepartmentController(IHeaderService headerService)
        {
            _headers = headerService;

        }
        public IActionResult CreateDepartment()
        {
            return View();
        }

        // add Department
        [HttpPost]
        public async Task<ActionResult> SaveDepartment([FromBody] Department department)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage);
                return BadRequest(new { message = "Model binding failed", errors });
            }
            string postData = JsonConvert.SerializeObject(department);
            string url = ApiService.HRMS + "Org/Department/Add";
            var mHeader = _headers.GetHeaders();
            var response = await apiConsume.SendRequestAsync(url, HttpMethod.Post, mHeader, null, postData);
            return new JsonResult(response);

        }

        // Department List
        public async Task<ActionResult> DepartmentList()
        {
            string url = ApiService.HRMS + "Org/Department/list";
            var mHeader = _headers.GetHeaders();
            var response = await apiConsume.SendRequestAsync(url, HttpMethod.Get, mHeader);
            return new JsonResult(response);
        }

        // Update Department
        [HttpPost]
        public async Task<ActionResult> UpdateDepartment([FromBody] Department department)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage);
                return BadRequest(new { message = "Model binding failed", errors });
            }
            string postData = JsonConvert.SerializeObject(department);
            string url = ApiService.HRMS + "Org/Department/Update";
            var mHeader = _headers.GetHeaders();
            var response = await apiConsume.SendRequestAsync(url, HttpMethod.Post, mHeader, null, postData);
            return new JsonResult(response);

        }

        // Delete Department

        public async Task<ActionResult> deleteDepartment(int deptcode)
        {
            string url = ApiService.HRMS + $"Org/Department/Delete?deptcode={deptcode}";
            var mHeader = _headers.GetHeaders();
            var response = await apiConsume.SendRequestAsync(url, HttpMethod.Get, mHeader);
            return new JsonResult(response);
        }
    }
}
