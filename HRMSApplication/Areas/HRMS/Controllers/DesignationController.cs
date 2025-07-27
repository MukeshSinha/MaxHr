using HRMSApplication.Services;
using HRMSApplication;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using CampusConnect.HRMSApplication.Areas.HRMS.Models;

namespace CampusConnect.HRMSApplication.Areas.HRMS.Controllers
{
    [Area("HRMS")]
    public class DesignationController : Controller
    {
        public IHeaderService _headers;
        private ApiService apiConsume = new ApiService();
        public DesignationController(IHeaderService headerService)
        {
            _headers = headerService;

        }
        public IActionResult CreateDesignation()
        {
            return View();
        }

        // Add Designation
        public async Task<ActionResult> SaveDesignation([FromBody] Designation designation)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage);
                return BadRequest(new { message = "Model binding failed", errors });
            }
            string postData = JsonConvert.SerializeObject(designation);
            string url = ApiService.HRMS + "Org/Designation/Add ";
            var mHeader = _headers.GetHeaders();
            var response = await apiConsume.SendRequestAsync(url, HttpMethod.Post, mHeader, null, postData);
            return new JsonResult(response);

        }

        // Designation List
        public async Task<ActionResult> DesignationList(string? ezone = null)
        {
            string url = ApiService.HRMS + $"Org/Designation/list?ezone={ezone}";
            var mHeader = _headers.GetHeaders();
            var response = await apiConsume.SendRequestAsync(url, HttpMethod.Get, mHeader);
            return new JsonResult(response);
        }

        // Update Designation
        public async Task<ActionResult> UpdateDesignation([FromBody] Designation designation)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage);
                return BadRequest(new { message = "Model binding failed", errors });
            }
            string postData = JsonConvert.SerializeObject(designation);
            string url = ApiService.HRMS + "Org/Designation/Update";
            var mHeader = _headers.GetHeaders();
            var response = await apiConsume.SendRequestAsync(url, HttpMethod.Post, mHeader, null, postData);
            return new JsonResult(response);

        }

        // Delete Designation

        public async Task<ActionResult> deleteDesignation(int deptcode)
        {
            string url = ApiService.HRMS + $"Org/Department/Delete?deptcode={deptcode}";
            var mHeader = _headers.GetHeaders();
            var response = await apiConsume.SendRequestAsync(url, HttpMethod.Get, mHeader);
            return new JsonResult(response);
        }
    }
}
