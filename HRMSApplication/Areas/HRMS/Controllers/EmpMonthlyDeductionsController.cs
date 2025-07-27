using HRMSApplication.Services;
using HRMSApplication;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using HRMSApp.Areas.HRMS.Models;

namespace HRMSApp.Areas.HRMS.Controllers
{
    [Area("HRMS")]
    public class EmpMonthlyDeductionsController : Controller
    {
        public IHeaderService _headers;
        private ApiService apiConsume = new ApiService();
        public EmpMonthlyDeductionsController(IHeaderService headerService)
        {
            _headers = headerService;

        }
        public IActionResult EmpMonthlyDeductions()
        {
            return View();
        }

        // Add Employee monthly allowance
        [HttpPost]
        public async Task<ActionResult> SaveEmpMonthlyDeduction([FromBody] EmpMonthlyDeduction empMonthlyDeduction)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage);
                return BadRequest(new { message = "Model binding failed", errors });
            }
            string postData = JsonConvert.SerializeObject(empMonthlyDeduction);
            string url = ApiService.HRMS + "EmpMonthlyDeduction/Add ";
            var mHeader = _headers.GetHeaders();
            var response = await apiConsume.SendRequestAsync(url, HttpMethod.Post, mHeader, null, postData);
            return new JsonResult(response);

        }

        // Employee monthly allowance  List
        public async Task<ActionResult> EmpMonthlyDeductionList(string empcode, int Mm, int Yy, string allowancetype)
        {
            string url = ApiService.HRMS + $"EmpMonthlyDeduction/list?empcode={empcode}&Mm={Mm}&Yy={Yy}&allowancetype={allowancetype}";
            var mHeader = _headers.GetHeaders();
            var response = await apiConsume.SendRequestAsync(url, HttpMethod.Get, mHeader);
            return new JsonResult(response);
        }
    }
}
