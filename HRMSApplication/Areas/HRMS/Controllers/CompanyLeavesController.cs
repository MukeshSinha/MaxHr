using HRMSApplication.Services;
using HRMSApplication;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using HRMSApp.Areas.HRMS.Models;

namespace HRMSApp.Areas.HRMS.Controllers
{
    [Area("HRMS")]
    public class CompanyLeavesController : Controller
    {
        public IHeaderService _headers;
        private ApiService apiConsume = new ApiService();
        public CompanyLeavesController(IHeaderService headerService)
        {
            _headers = headerService;

        }
        public IActionResult CompanyLeaves()
        {
            return View();
        }

        // Save Company Leaves
        [HttpPost]
        public async Task<ActionResult> SaveCompanyLeaves([FromBody] Leave Leave)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage);
                return BadRequest(new { message = "Model binding failed", errors });
            }
            string postData = JsonConvert.SerializeObject(Leave);
            string url = ApiService.HRMS + "TimeOffice/Add/Leaves";
            var mHeader = _headers.GetHeaders();
            var response = await apiConsume.SendRequestAsync(url, HttpMethod.Post, mHeader, null, postData);
            return new JsonResult(response);

        }

        // Company Leaves  List
        public async Task<ActionResult> CompanyLeavesList()
        {
            string url = ApiService.HRMS + "TimeOffice/list/Leaves";
            var mHeader = _headers.GetHeaders();
            var response = await apiConsume.SendRequestAsync(url, HttpMethod.Get, mHeader);
            return new JsonResult(response);
        }

        // Update Company Leaves
        [HttpPost]
        public async Task<ActionResult> UpdateCompanyLeaves([FromBody] Leave Leave)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage);
                return BadRequest(new { message = "Model binding failed", errors });
            }
            string postData = JsonConvert.SerializeObject(Leave);
            string url = ApiService.HRMS + "Allowances/Update";
            var mHeader = _headers.GetHeaders();
            var response = await apiConsume.SendRequestAsync(url, HttpMethod.Post, mHeader, null, postData);
            return new JsonResult(response);

        }

        // Delete Company Leaves

        public async Task<ActionResult> deleteCompanyLeaves(int deptcode)
        {
            string url = ApiService.HRMS + $"Allowances/Delete?deptcode={deptcode}";
            var mHeader = _headers.GetHeaders();
            var response = await apiConsume.SendRequestAsync(url, HttpMethod.Get, mHeader);
            return new JsonResult(response);
        }
    }
}
