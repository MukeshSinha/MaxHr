using HRMSApplication.Services;
using HRMSApplication;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using HRMSApp.Areas.HRMS.Models;

namespace HRMSApp.Areas.HRMS.Controllers
{
    [Area("HRMS")]
    public class AllowanceController : Controller
    {
        public IHeaderService _headers;
        private ApiService apiConsume = new ApiService();
        public AllowanceController(IHeaderService headerService)
        {
            _headers = headerService;

        }
        public IActionResult Allowance()
        {
            return View();
        }

        // Add Allowance 1 
        [HttpPost]
        public async Task<ActionResult> SaveAllowance([FromBody] AllowanceData allowanceData)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage);
                return BadRequest(new { message = "Model binding failed", errors });
            }
            string postData = JsonConvert.SerializeObject(allowanceData);
            string url = ApiService.HRMS + "Employee/Add/Allowances";
            var mHeader = _headers.GetHeaders();
            var response = await apiConsume.SendRequestAsync(url, HttpMethod.Post, mHeader, null, postData);
            return new JsonResult(response);

        }

        // Add Allowance 2

        [HttpPost]
        public async Task<ActionResult> SaveBasicData([FromBody] AllowanceDating allowanceDating)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage);
                return BadRequest(new { message = "Model binding failed", errors });
            }
            string postData = JsonConvert.SerializeObject(allowanceDating);
            string url = ApiService.HRMS + "Employee/Add/Basic";
            var mHeader = _headers.GetHeaders();
            var response = await apiConsume.SendRequestAsync(url, HttpMethod.Post, mHeader, null, postData);
            return new JsonResult(response);

        }

        // Allowance  List
        public async Task<ActionResult> AllowanceList()
        {
            string url = ApiService.HRMS + "Allowances/list";
            var mHeader = _headers.GetHeaders();
            var response = await apiConsume.SendRequestAsync(url, HttpMethod.Get, mHeader);
            return new JsonResult(response);
        }

        // Update Allowance 
        [HttpPost]
        public async Task<ActionResult> UpdateAllowance([FromBody] AllowanceData allowanceData)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage);
                return BadRequest(new { message = "Model binding failed", errors });
            }
            string postData = JsonConvert.SerializeObject(allowanceData);
            string url = ApiService.HRMS + "Allowances/Update";
            var mHeader = _headers.GetHeaders();
            var response = await apiConsume.SendRequestAsync(url, HttpMethod.Post, mHeader, null, postData);
            return new JsonResult(response);

        }

        // Delete Allowance 

        public async Task<ActionResult> deleteAllowance(int deptcode)
        {
            string url = ApiService.HRMS + $"Allowances/Delete?deptcode={deptcode}";
            var mHeader = _headers.GetHeaders();
            var response = await apiConsume.SendRequestAsync(url, HttpMethod.Get, mHeader);
            return new JsonResult(response);
        }
    }
}
