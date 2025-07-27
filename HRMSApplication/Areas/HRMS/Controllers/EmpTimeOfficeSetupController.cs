using HRMSApplication.Services;
using HRMSApplication;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using HRMSApp.Areas.HRMS.Models;

namespace HRMSApp.Areas.HRMS.Controllers
{
    [Area("HRMS")]
    public class EmpTimeOfficeSetupController : Controller
    {
        public IHeaderService _headers;
        private ApiService apiConsume = new ApiService();
        public EmpTimeOfficeSetupController(IHeaderService headerService)
        {
            _headers = headerService;

        }
        public IActionResult Index()
        {
            return View();
        }

        // Save Setup Master
        [HttpPost]
        public async Task<ActionResult> SaveSetupMaster([FromBody] EmployeeSetup employeeSetup)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage);
                return BadRequest(new { message = "Model binding failed", errors });
            }
            string postData = JsonConvert.SerializeObject(employeeSetup);
            string url = ApiService.HRMS + "EmpTimeOfficeSetup/Setup";
            var mHeader = _headers.GetHeaders();
            var response = await apiConsume.SendRequestAsync(url, HttpMethod.Post, mHeader, null, postData);
            return new JsonResult(response);

        }

        // Shift Master  List
        public async Task<ActionResult> ShiftMasterList()
        {
            string url = ApiService.HRMS + "TimeOffice/list/shift";
            var mHeader = _headers.GetHeaders();
            var response = await apiConsume.SendRequestAsync(url, HttpMethod.Get, mHeader);
            return new JsonResult(response);
        }
    }
}
