using HRMSApplication.Services;
using HRMSApplication;
using Microsoft.AspNetCore.Mvc;
using CampusConnect.HRMSApplication.Areas.HRMS.Models;
using Newtonsoft.Json;

namespace HRMSApp.Areas.HRMS.Controllers
{
    [Area("HRMS")]
    public class LocationMasterController : Controller
    {
        public IHeaderService _headers;
        private ApiService apiConsume = new ApiService();
        public LocationMasterController(IHeaderService headerService)
        {
            _headers = headerService;
            
        }
        public IActionResult LocationMaster()
        {
            return View();
        }

        // Add Location Master
        public async Task<ActionResult> SaveLocationMaster([FromBody] Category category)
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

        // Branch Location Master
        public async Task<ActionResult> LocationMasterList()
        {
            string url = ApiService.HRMS + "Org/category/list";
            var mHeader = _headers.GetHeaders();
            var response = await apiConsume.SendRequestAsync(url, HttpMethod.Get, mHeader);
            return new JsonResult(response);
        }

        // Update Location Master
        public async Task<ActionResult> UpdateLocationMaster([FromBody] Category category)
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

        // Delete Location Master

        public async Task<ActionResult> deleteLocationMaster(int deptcode)
        {
            string url = ApiService.HRMS + $"Org/category/Delete?deptcode={deptcode}";
            var mHeader = _headers.GetHeaders();
            var response = await apiConsume.SendRequestAsync(url, HttpMethod.Get, mHeader);
            return new JsonResult(response);
        }
    }
}
