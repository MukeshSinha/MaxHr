using HRMSApplication.Areas.HRMS.Models;
using HRMSApplication.Services;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
namespace HRMSApplication.Areas.HRMS.Controllers
{
    [Area("HRMS")]
    public class EmployeesController : Controller
    {
        public IHeaderService _headers;
        private ApiService apiConsume = new ApiService();
        public EmployeesController(IHeaderService headerService)
        {
            _headers = headerService;
        }
        public IActionResult EmployeeMaster()
        {
            return View();
        }

        // Save Employee
        [HttpPost]
        public async Task<ActionResult> SaveEmployee([FromBody] Employee employee)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage);
                return BadRequest(new { message = "Model binding failed", errors });
            }
            string postData = JsonConvert.SerializeObject(employee);
            string url = ApiService.HRMS + "Employee/Add";
            var mHeader = _headers.GetHeaders();
            var response = await apiConsume.SendRequestAsync(url, HttpMethod.Post, mHeader, null, postData);
            return new JsonResult(response);
        }

        // Serach Employee
        public async Task<ActionResult> SearchEmployee(string CollegeID)
        {
            string url = ApiService.HRMS + $"Employee/Get?CollegeID={CollegeID}";
            var mHeader = _headers.GetHeaders();
            var response = await apiConsume.SendRequestAsync(url, HttpMethod.Get, mHeader, null);
            //var result=JsonConvert.SerializeObject(response);
            return new JsonResult(response);
        }

        // Search Employee By Code
        public async Task<ActionResult> SearchEmployeeByCode(string empCode)
        {
            string url = ApiService.HRMS + $"Employee/Get?empCode={empCode}";
            var mHeader = _headers.GetHeaders();
            var response = await apiConsume.SendRequestAsync(url, HttpMethod.Get, mHeader, null);
            //var result=JsonConvert.SerializeObject(response);
            return new JsonResult(response);

        }

        // Search Teacher By Emp Category
        public async Task<ActionResult> SearchTeacherByCategory(string empcategory)
        {
            string url = ApiService.HRMS + $"Employee/Get?empcategory={empcategory}";
            var mHeader = _headers.GetHeaders();
            var response = await apiConsume.SendRequestAsync(url, HttpMethod.Get, mHeader, null);
            //var result=JsonConvert.SerializeObject(response);
            return new JsonResult(response);

        }

        // get College On base of Teacher Id
        public async Task<ActionResult> TeacherCollege(string empCode)
        {
            string url = ApiService.HRMS + $"Employee/Get?empCode={empCode}";
            var mHeader = _headers.GetHeaders();
            var response = await apiConsume.SendRequestAsync(url, HttpMethod.Get, mHeader, null);
            //var result=JsonConvert.SerializeObject(response);
            return new JsonResult(response);

        }



    }
}
