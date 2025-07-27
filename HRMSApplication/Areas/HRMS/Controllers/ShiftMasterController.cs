using HRMSApp.Areas.HRMS.Models;
using HRMSApplication.Services;
using HRMSApplication;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;

namespace HRMSApp.Areas.HRMS.Controllers
{
    [Area("HRMS")]
    public class ShiftMasterController : Controller
    {
        public IHeaderService _headers;
        private ApiService apiConsume = new ApiService();
        public ShiftMasterController(IHeaderService headerService)
        {
            _headers = headerService;

        }
        public IActionResult Index()
        {
            return View();
        }

        // Save Shift Master
        [HttpPost]
        public async Task<ActionResult> SaveShiftMaster([FromBody] Shift shift)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage);
                return BadRequest(new { message = "Model binding failed", errors });
            }
            string postData = JsonConvert.SerializeObject(shift);
            string url = ApiService.HRMS + "TimeOffice/Add/Shift";
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

        // Update Shift Master
        [HttpPost]
        public async Task<ActionResult> UpdateShiftMaster([FromBody] Holiday holiday)
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

        // Delete Shift Master

        public async Task<ActionResult> deleteShiftMaster(int hid)
        {
            string url = ApiService.HRMS + $"TimeOffice/delete/Holiday?hid={hid}";
            var mHeader = _headers.GetHeaders();
            var response = await apiConsume.SendRequestAsync(url, HttpMethod.Get, mHeader);
            return new JsonResult(response);
        }
    }
}
