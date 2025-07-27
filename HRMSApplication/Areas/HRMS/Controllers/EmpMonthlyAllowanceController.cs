using HRMSApplication.Services;
using HRMSApplication;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using HRMSApp.Areas.HRMS.Models;

namespace HRMSApp.Areas.HRMS.Controllers
{
    public class EmpMonthlyAllowanceController : Controller
    {
        public IHeaderService _headers;
        private ApiService apiConsume = new ApiService();
        public EmpMonthlyAllowanceController(IHeaderService headerService)
        {
            _headers = headerService;

        }
        public IActionResult Index()
        {
            return View();
        }

        // Add Employee monthly allowance
        [HttpPost]
        public async Task<ActionResult> SaveEmpMonthlyAllowance([FromBody] EmpMonthlyAllowance empMonthlyAllowance)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage);
                return BadRequest(new { message = "Model binding failed", errors });
            }
            string postData = JsonConvert.SerializeObject(empMonthlyAllowance);
            string url = ApiService.HRMS + "EmpMonthlyAllow/Add";
            var mHeader = _headers.GetHeaders();
            var response = await apiConsume.SendRequestAsync(url, HttpMethod.Post, mHeader, null, postData);
            return new JsonResult(response);

        }

        // Employee monthly allowance  List
        public async Task<ActionResult> EmpMonthlyAllowanceList(string empcode, int Mm, int Yy, string allowancetype)
        {
            string url = ApiService.HRMS + $"EmpMonthlyAllow/list?empcode={empcode}&Mm={Mm}&Yy={Yy}&allowancetype={allowancetype}";
            var mHeader = _headers.GetHeaders();
            var response = await apiConsume.SendRequestAsync(url, HttpMethod.Get, mHeader);
            return new JsonResult(response);
        }
    }
}
