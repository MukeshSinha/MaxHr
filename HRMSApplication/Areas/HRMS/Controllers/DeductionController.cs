using HRMSApp.Areas.HRMS.Models;
using HRMSApplication.Services;
using HRMSApplication;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;

namespace HRMSApp.Areas.HRMS.Controllers
{
    public class DeductionController : Controller
    {
        public IHeaderService _headers;
        private ApiService apiConsume = new ApiService();
        public DeductionController(IHeaderService headerService)
        {
            _headers = headerService;
        }
        public IActionResult Deduction()
        {
            return View();
        }

        // Add Deduction
        [HttpPost]
        public async Task<ActionResult> SaveDeduction([FromBody] DeductionPayload deductionPayload)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage);
                return BadRequest(new { message = "Model binding failed", errors });
            }
            string postData = JsonConvert.SerializeObject(deductionPayload);
            string url = ApiService.HRMS + "Employee/Add/Deductions";
            var mHeader = _headers.GetHeaders();
            var response = await apiConsume.SendRequestAsync(url, HttpMethod.Post, mHeader, null, postData);
            return new JsonResult(response);

        }

        // Deduction  List
        public async Task<ActionResult> DeductionList()
        {
            string url = ApiService.HRMS + "Allowances/list";
            var mHeader = _headers.GetHeaders();
            var response = await apiConsume.SendRequestAsync(url, HttpMethod.Get, mHeader);
            return new JsonResult(response);
        }

        // Update Deduction 
        [HttpPost]
        public async Task<ActionResult> UpdateDeduction([FromBody] AllowanceData allowanceData)
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

        // Delete Deduction

        public async Task<ActionResult> deleteDeduction(int deptcode)
        {
            string url = ApiService.HRMS + $"Allowances/Delete?deptcode={deptcode}";
            var mHeader = _headers.GetHeaders();
            var response = await apiConsume.SendRequestAsync(url, HttpMethod.Get, mHeader);
            return new JsonResult(response);
        }
    }
}
