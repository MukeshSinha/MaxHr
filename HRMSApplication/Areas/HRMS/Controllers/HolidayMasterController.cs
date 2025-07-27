using HRMSApplication.Services;
using HRMSApplication;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using HRMSApp.Areas.HRMS.Models;

namespace HRMSApp.Areas.HRMS.Controllers
{
    [Area("HRMS")]
    public class HolidayMasterController : Controller
    {
        public IHeaderService _headers;
        private ApiService apiConsume = new ApiService();
        public HolidayMasterController(IHeaderService headerService)
        {
            _headers = headerService;

        }
        public IActionResult HolidayMaster()
        {
            return View();
        }

        // Save Holiday Master
        [HttpPost]
        public async Task<ActionResult> SaveHolidayMaster([FromBody] Holiday holiday)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage);
                return BadRequest(new { message = "Model binding failed", errors });
            }
            string postData = JsonConvert.SerializeObject(holiday);
            string url = ApiService.HRMS + "TimeOffice/Add/Holiday";
            var mHeader = _headers.GetHeaders();
            var response = await apiConsume.SendRequestAsync(url, HttpMethod.Post, mHeader, null, postData);
            return new JsonResult(response);

        }

        // Holiday Master  List
        public async Task<ActionResult> HolidayMasterList()
        {
            string url = ApiService.HRMS + "TimeOffice/list/Holiday";
            var mHeader = _headers.GetHeaders();
            var response = await apiConsume.SendRequestAsync(url, HttpMethod.Get, mHeader);
            return new JsonResult(response);
        }

        // Update Holiday Master
        [HttpPost]
        public async Task<ActionResult> UpdateHolidayMaster([FromBody] Holiday holiday)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage);
                return BadRequest(new { message = "Model binding failed", errors });
            }
            string postData = JsonConvert.SerializeObject(holiday);
            string url = ApiService.HRMS + "TimeOffice/Update/Holiday";
            var mHeader = _headers.GetHeaders();
            var response = await apiConsume.SendRequestAsync(url, HttpMethod.Post, mHeader, null, postData);
            return new JsonResult(response);

        }

        // Delete Company Leaves

        public async Task<ActionResult> deleteHolidayMaster(int hid)
        {
            string url = ApiService.HRMS + $"TimeOffice/delete/Holiday?hid={hid}";
            var mHeader = _headers.GetHeaders();
            var response = await apiConsume.SendRequestAsync(url, HttpMethod.Get, mHeader);
            return new JsonResult(response);
        }
    }
}
