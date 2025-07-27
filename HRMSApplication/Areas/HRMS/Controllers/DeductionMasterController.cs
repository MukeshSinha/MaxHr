using HRMSApplication.Services;
using HRMSApplication;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using CampusConnect.HRMSApplication.Areas.HRMS.Models;

namespace CampusConnect.HRMSApplication.Areas.HRMS.Controllers
{
    [Area("HRMS")]
    public class DeductionMasterController : Controller
    {
        public IHeaderService _headers;
        private ApiService apiConsume = new ApiService();
        public DeductionMasterController(IHeaderService headerService)
        {
            _headers = headerService;

        }
        public IActionResult DeductionMaster()
        {
            return View();
        }

        // Add Deduction Master
        [HttpPost]
        public async Task<ActionResult> SaveDeductionMaster([FromBody] Deduction deduction)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage);
                return BadRequest(new { message = "Model binding failed", errors });
            }
            string postData = JsonConvert.SerializeObject(deduction);
            string url = ApiService.HRMS + "Deductions/Add";
            var mHeader = _headers.GetHeaders();
            var response = await apiConsume.SendRequestAsync(url, HttpMethod.Post, mHeader, null, postData);
            return new JsonResult(response);

        }

        // Deduction Master List
        public async Task<ActionResult> DeductionMasterList()
        {
            string url = ApiService.HRMS + "Deductions/list";
            var mHeader = _headers.GetHeaders();
            var response = await apiConsume.SendRequestAsync(url, HttpMethod.Get, mHeader);
            return new JsonResult(response);
        }

        // Update Deduction Master
        [HttpPost]
        public async Task<ActionResult> UpdateDeductionMaster([FromBody] Deduction deduction)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage);
                return BadRequest(new { message = "Model binding failed", errors });
            }
            string postData = JsonConvert.SerializeObject(deduction);
            string url = ApiService.HRMS + "Deductions/Update";
            var mHeader = _headers.GetHeaders();
            var response = await apiConsume.SendRequestAsync(url, HttpMethod.Post, mHeader, null, postData);
            return new JsonResult(response);

        }

        // Delete Deduction Master

        public async Task<ActionResult> deleteDeductionMaster(int deptcode)
        {
            string url = ApiService.HRMS + $"Deductions/Delete?deptcode={deptcode}";
            var mHeader = _headers.GetHeaders();
            var response = await apiConsume.SendRequestAsync(url, HttpMethod.Get, mHeader);
            return new JsonResult(response);
        }
    }
}
