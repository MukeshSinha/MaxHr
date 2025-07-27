using HRMSApplication.Services;
using HRMSApplication;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using CampusConnect.HRMSApplication.Areas.HRMS.Models;

namespace CampusConnect.HRMSApplication.Areas.HRMS.Controllers
{
    public class AllowanceMasterController : Controller
    {
        public IHeaderService _headers;
        private ApiService apiConsume = new ApiService();
        public AllowanceMasterController(IHeaderService headerService)
        {
            _headers = headerService;

        }
        public IActionResult AllowanceMaster()
        {
            return View();
        }

        // Add Allowance Master
        [HttpPost]
        public async Task<ActionResult> SaveAllowanceMaster([FromBody] Allowance allowance)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage);
                return BadRequest(new { message = "Model binding failed", errors });
            }
            string postData = JsonConvert.SerializeObject(allowance);
            string url = ApiService.HRMS + "Allowances/Add";
            var mHeader = _headers.GetHeaders();
            var response = await apiConsume.SendRequestAsync(url, HttpMethod.Post, mHeader, null, postData);
            return new JsonResult(response);

        }

        // Allowance Master List
        public async Task<ActionResult> AllowanceMasterList()
        {
            string url = ApiService.HRMS + "Allowances/list";
            var mHeader = _headers.GetHeaders();
            var response = await apiConsume.SendRequestAsync(url, HttpMethod.Get, mHeader);
            return new JsonResult(response);
        }

        // Update Allowance Master
        [HttpPost]
        public async Task<ActionResult> UpdateAllowanceMaster([FromBody] Allowance allowance)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage);
                return BadRequest(new { message = "Model binding failed", errors });
            }
            string postData = JsonConvert.SerializeObject(allowance);
            string url = ApiService.HRMS + "Allowances/Update";
            var mHeader = _headers.GetHeaders();
            var response = await apiConsume.SendRequestAsync(url, HttpMethod.Post, mHeader, null, postData);
            return new JsonResult(response);

        }

        // Delete Allowance Master

        public async Task<ActionResult> deleteAllowanceMaster(int deptcode)
        {
            string url = ApiService.HRMS + $"Allowances/Delete?deptcode={deptcode}";
            var mHeader = _headers.GetHeaders();
            var response = await apiConsume.SendRequestAsync(url, HttpMethod.Get, mHeader);
            return new JsonResult(response);
        }
    }
}
