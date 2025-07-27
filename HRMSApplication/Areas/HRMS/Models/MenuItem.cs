namespace HRMSApplication.Areas.HRMS.Models
{
    public class MenuItem
    {
        public int menuID { get; set; }
        public int module { get; set; }
        public int mainModule { get; set; }
        public int menuType { get; set; } // 1: MainMenu, 2: SubMenu, 3: ChildMenu, 4: GrandChildMenu
        public string? displayName { get; set; } // Use displayName instead of column1
        public int mainMenu { get; set; }
        public int subMenu { get; set; }
        public int childMenu { get; set; }
        public int position { get; set; }
        public string? controllerNm { get; set; } // Match API response
        public string? acmethod { get; set; } // Match API response
        public string? areaname { get; set; }
        public string? images { get; set; } // Match API response
        public List<MenuItem> subMenus { get; set; } = new List<MenuItem>(); // Initialize to avoid null
    }
}
