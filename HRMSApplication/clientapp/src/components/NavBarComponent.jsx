import React, { useState, useEffect, useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    ChevronDownIcon,
    Bars3Icon,
    XMarkIcon,
    ArrowLeftIcon,
    ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/solid';
import FormContext from '../context/FormContext';

function NavBarComponent({ selectedModule, setSelectedModule }) {
    const { regNo } = useContext(FormContext);
    const [menuItems, setMenuItems] = useState([]);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [openSubMenus, setOpenSubMenus] = useState({});
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [studentImage, setStudentImage] = useState(null);
    const [hoveredModule, setHoveredModule] = useState(null);
    const [menuTimeout, setMenuTimeout] = useState(null);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const navigate = useNavigate();

    const defaultAdminImage = 'https://www.shareicon.net/data/512x512/2016/07/09/118402_user_512x512.png';

    const menuIcons = {
        'Employee': <img src="dist/icons/Employee.png" alt="Employee" className="ml-2 h-6 w-6" />,
        'Hrms': <img src="dist/icons/HRMS.png" alt="Hrms" className="ml-2 h-6 w-6" />,
        'Master': <img src="dist/icons/Master.png" alt="Master" className="ml-2 h-6 w-6" />,
        'Org Structure': <img src="dist/icons/OrgStrcture.png" alt="Org Structure" className="ml-2 h-6 w-6" />,
        'Department': <img src="dist/icons/department.png" alt="Department" className="ml-2 h-6 w-6" />,
        'Category': <img src="dist/icons/Category.png" alt="Category" className="ml-2 h-6 w-6" />,
        'Designation': <img src="dist/icons/Designation.png" alt="Designation" className="ml-2 h-6 w-6" />,
        'Employee Detail': <img src="dist/icons/information.png" alt="Employee Detail" className="ml-2 h-6 w-6" />,
        'Salary': <img src="dist/icons/Salary.png" alt="Salary" className="ml-2 h-6 w-6" />,
        'Allowances': <img src="dist/icons/Allowances.png" alt="Allowances" className="ml-2 h-6 w-6" />,
        'Deductions': <img src="dist/icons/Deductions.png" alt="Deductions" className="ml-2 h-6 w-6" />,
        'Time-Office': <img src="dist/icons/timeOffice.png" alt="timeOffice" className="ml-2 h-6 w-6" />,
        'Holiday': <img src="dist/icons/Holiday.png" alt="Holiday" className="ml-2 h-6 w-6" />,
        'Leave': <img src="dist/icons/EmployeeLeave.png" alt="EmployeeLeave" className="ml-2 h-6 w-6" />,
        'Shift': <img src="dist/icons/Shift.png" alt="Shift" className="ml-2 h-6 w-6" />,
        'Employee Allowance': <img src="dist/icons/EmployeeAllowance.png" alt="EmployeeAllowance" className="ml-2 h-6 w-6" />,
        'Employee Deduction': <img src="dist/icons/EmployeeSaalaryDeduction.png" alt="EmployeeSaalaryDeductiond" className="ml-2 h-6 w-6" />,
    };

    useEffect(() => {
        const fetchMenuItems = async () => {
            try {
                setIsLoading(true);
                const response = await fetch('/HRMS/ErpDashboard/Index', { credentials: 'include' });
                if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                let data = await response.json();
                if (typeof data === 'string') {
                    data = JSON.parse(data);
                }
                const menuData = Array.isArray(data) ? data : data.dataFetch?.table || [];
                if (!menuData || menuData.length === 0) {
                    throw new Error('Invalid API response: menu data is empty');
                }
                console.log('Fetched menuItems:', menuData); // Debug log
                setMenuItems(menuData); // Should contain nested hierarchy
            } catch (error) {
                console.error('Error fetching menu items:', error);
                setError(error.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchMenuItems();
    }, []);

    useEffect(() => {
        const fetchStudentImage = async () => {
            if (!regNo) {
                setStudentImage(defaultAdminImage);
                return;
            }
            try {
                const response = await fetch(`/Registration/DocumentImage/GetStudentImage?RegistrationId=${regNo}`, {
                    method: 'GET',
                    credentials: 'include',
                });
                if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                const data = await response.json();
                if (data.base64Image) {
                    setStudentImage(data.base64Image);
                } else {
                    setStudentImage(defaultAdminImage);
                }
            } catch (error) {
                console.error('Error fetching student image:', error);
                setStudentImage(defaultAdminImage);
            }
        };
        fetchStudentImage();
    }, [regNo]);

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen((prev) => !prev);
    };

    const toggleSubMenu = (menuID) => {
        setOpenSubMenus((prev) => ({
            ...prev,
            [menuID]: !prev[menuID],
        }));
    };

    const handleMouseEnter = (menuID) => {
        if (menuTimeout) {
            clearTimeout(menuTimeout);
            setMenuTimeout(null);
        }
        setHoveredModule(menuID);
    };

    const handleMouseLeave = () => {
        const timeout = setTimeout(() => {
            setHoveredModule(null);
        }, 300);
        setMenuTimeout(timeout);
    };

    const handleDropdownMouseEnter = (menuID) => {
        if (menuTimeout) {
            clearTimeout(menuTimeout);
            setMenuTimeout(null);
        }
        setHoveredModule(menuID);
    };

    const handleDropdownMouseLeave = () => {
        const timeout = setTimeout(() => {
            setHoveredModule(null);
        }, 300);
        setMenuTimeout(timeout);
    };

    const toggleProfileDropdown = () => {
        setIsProfileDropdownOpen((prev) => !prev);
    };

    const getMenuRoute = (menu) => {
        const isValidLink = menu.controllerNm && menu.controllerNm !== '0' && menu.acmethod && menu.acmethod !== '0';
        if (isValidLink) {
            return `${menu.areaname ? `/${menu.areaname}` : ''}/${menu.controllerNm}/${menu.acmethod}`;
        }
        return `/module/${menu.menuID}`;
    };

    const handleMenuClick = (menu, event) => {
        const route = getMenuRoute(menu);
        const isValidLink = menu.controllerNm && menu.controllerNm !== '0' && menu.acmethod && menu.acmethod !== '0';
        if (isValidLink && (!menu.subMenus || menu.subMenus.length === 0)) {
            event.preventDefault();
            navigate(route);
        } else if (!isValidLink && menu.menuType === 1) {
            event.preventDefault();
            setSelectedModule(menu);
            navigate(`/module/${menu.menuID}`);
        } else if (menu.subMenus?.length > 0 && !isValidLink) {
            event.preventDefault();
            toggleSubMenu(menu.menuID);
        }
    };

    const handleLogout = () => {
        setIsProfileDropdownOpen(false);
        navigate('/HRMS/EmployeeRegistration/Dashboard');
    };

    const handleBackToModules = () => {
        setSelectedModule(null);
        navigate('/modules');
    };

    const renderAllNestedMenus = (menus, level = 0) => (
        <ul className={`space-y-1 ${level > 0 ? 'ml-6' : ''}`}>
            {menus.map((menu) => {
                const menuLabel = menu.displayName || `Unnamed (ID: ${menu.menuID})`;
                const route = getMenuRoute(menu);

                return (
                    <li key={menu.menuID}>
                        <NavLink
                            to={route}
                            onClick={(event) => handleMenuClick(menu, event)}
                            className={({ isActive }) =>
                                `flex items-center space-x-3 px-4 py-2 text-sm rounded-lg transition-colors duration-150 cursor-pointer ${isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                                }`
                            }
                        >
                            <span className="w-8 h-8 flex items-center justify-center text-gray-600">
                                {menuIcons[menuLabel] || <img src="/dist/icons/default.png" alt="Default" className="h-6 w-6" />}
                            </span>
                            <span>{menuLabel}</span>
                        </NavLink>
                        {menu.subMenus?.length > 0 && renderAllNestedMenus(menu.subMenus, level + 1)}
                    </li>
                );
            })}
        </ul>
    );

    const renderMobileSubMenus = (menus, level = 0) => (
        <ul className={`space-y-1 ${level > 0 ? 'ml-6' : ''}`}>
            {menus.map((menu) => {
                const menuLabel = menu.displayName || `Unnamed Menu (ID: ${menu.menuID})`;
                const route = getMenuRoute(menu);

                return (
                    <li key={menu.menuID}>
                        <div className="flex items-center justify-between">
                            <NavLink
                                to={route}
                                onClick={(event) => {
                                    handleMenuClick(menu, event);
                                    if (menu.subMenus?.length > 0) {
                                        event.preventDefault();
                                        toggleSubMenu(menu.menuID);
                                    }
                                }}
                                className={({ isActive }) =>
                                    `flex items-center space-x-3 px-4 py-2 text-base rounded-lg cursor-pointer ${isActive || openSubMenus[menu.menuID]
                                        ? 'text-blue-600 bg-blue-50'
                                        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                                    }`
                                }
                            >
                                <span className="w-8 h-8 flex items-center justify-center text-gray-600">
                                    {menuIcons[menuLabel] || <img src="/dist/icons/default.png" alt="Default" className="h-6 w-6" />}
                                </span>
                                <span>{menuLabel}</span>
                            </NavLink>
                            {menu.subMenus?.length > 0 && (
                                <button
                                    onClick={() => toggleSubMenu(menu.menuID)}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-150"
                                >
                                    <ChevronDownIcon
                                        className={`w-5 h-5 text-gray-500 transform transition-transform duration-150 ${openSubMenus[menu.menuID] ? 'rotate-180' : ''
                                            }`}
                                    />
                                </button>
                            )}
                        </div>
                        {menu.subMenus?.length > 0 && openSubMenus[menu.menuID] && (
                            <div className="ml-6 mt-2">{renderMobileSubMenus(menu.subMenus, level + 1)}</div>
                        )}
                    </li>
                );
            })}
        </ul>
    );

    const parentMenus = React.useMemo(() => {
        if (!selectedModule) {
            return menuItems.filter((menu) => menu.menuType === 1).sort((a, b) => a.position - b.position);
        }
        return selectedModule?.subMenus || [];
    }, [menuItems, selectedModule]);

    const handleImageClick = () => {
        navigate('/modules');
    };

    return (
        <div>
            <header className="bg-gray-50 text-gray-800 p-4 shadow-md relative">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        {selectedModule && (
                            <button
                                onClick={handleBackToModules}
                                className="p-2 rounded-full hover:bg-gray-100 focus:outline-none"
                                aria-label="Back to modules"
                            >
                                <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
                            </button>
                        )}
                        <div className="flex-shrink-0">
                            <img
                                src="dist/icons/SchoolLogo.jpeg"
                                alt="School Logo"
                                className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover cursor-pointer"
                                onClick={handleImageClick}
                            />
                        </div>
                    </div>
                    <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-center flex-1 break-words max-w-[calc(100vw-160px)] sm:max-w-[calc(100vw-200px)]">
                        RSSR School Connect
                    </h1>
                    <div className="flex items-center space-x-2">
                        <div className="relative">
                            <button
                                onClick={toggleProfileDropdown}
                                className="focus:outline-none"
                                aria-label="Profile menu"
                                aria-expanded={isProfileDropdownOpen}
                            >
                                <img
                                    src={studentImage || defaultAdminImage}
                                    alt={studentImage ? 'Student Profile' : 'Admin Profile'}
                                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border border-gray-200"
                                />
                            </button>
                            {isProfileDropdownOpen && (
                                <div className="absolute right-0 top-12 mt-2 w-36 sm:w-40 bg-white shadow-lg rounded-lg z-[100] border border-gray-200">
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-150"
                                    >
                                        <ArrowRightOnRectangleIcon className="h-5 w-5" />
                                        <span>Logout</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <nav className="bg-white shadow-sm z-50 sticky top-0" aria-label="Main navigation">
                <div className="w-full px-2 sm:px-4 lg:px-6">
                    <div className="flex justify-between items-center h-14">
                        <div className="flex items-center w-full">
                            <button
                                onClick={toggleMobileMenu}
                                className="md:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100 focus:outline-none"
                                aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                                aria-expanded={isMobileMenuOpen}
                            >
                                {isMobileMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
                            </button>

                            <div className="hidden md:flex space-x-2">
                                {isLoading ? (
                                    <div className="text-gray-500 p-4">Loading...</div>
                                ) : error ? (
                                    <div className="text-red-500 flex items-center p-4">
                                        {error}
                                        <button
                                            onClick={() => window.location.reload()}
                                            className="ml-2 text-gray-900 underline"
                                        >
                                            Retry
                                        </button>
                                    </div>
                                ) : parentMenus.length === 0 ? (
                                    <div className="text-gray-500 p-4">No menus available</div>
                                ) : (
                                    parentMenus.map((menu) => (
                                        <div
                                            key={menu.menuID}
                                            className="relative group"
                                            onMouseEnter={() => handleMouseEnter(menu.menuID)}
                                            onMouseLeave={handleMouseLeave}
                                        >
                                            <NavLink
                                                to={getMenuRoute(menu)}
                                                onClick={(event) => handleMenuClick(menu, event)}
                                                className={({ isActive }) =>
                                                    `flex items-center space-x-3 px-4 py-2 text-sm rounded-lg transition-colors duration-150 cursor-pointer ${isActive || hoveredModule === menu.menuID
                                                        ? 'text-blue-600 bg-blue-50'
                                                        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                                                    }`
                                                }
                                            >
                                                <span className="w-8 h-8 flex items-center justify-center text-gray-600">
                                                    {menuIcons[menu.displayName] || <img src="/dist/icons/default.png" alt="Default" className="h-6 w-6" />}
                                                </span>
                                                <span>{menu.displayName || `Unnamed (ID: ${menu.menuID})`}</span>
                                                {menu.subMenus?.length > 0 && (
                                                    <ChevronDownIcon
                                                        className={`w-4 h-4 text-gray-500 transform transition-transform duration-150 ${hoveredModule === menu.menuID ? 'rotate-180' : ''
                                                            }`}
                                                    />
                                                )}
                                            </NavLink>
                                            {menu.subMenus?.length > 0 && hoveredModule === menu.menuID && (
                                                <div
                                                    className="absolute left-0 top-full mt-2 bg-white shadow-lg rounded-lg p-4 z-50 border border-gray-200 w-64"
                                                    onMouseEnter={() => handleDropdownMouseEnter(menu.menuID)}
                                                    onMouseLeave={handleDropdownMouseLeave}
                                                >
                                                    {renderAllNestedMenus(menu.subMenus)}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {isMobileMenuOpen && (
                    <div className="md:hidden bg-white p-6 shadow-md border-t border-gray-200">
                        {isLoading ? (
                            <div className="text-gray-500 text-base">Loading...</div>
                        ) : error ? (
                            <div className="text-red-500 flex items-center text-base">
                                {error}
                                <button onClick={() => window.location.reload()} className="ml-2 text-gray-900 underline">
                                    Retry
                                </button>
                            </div>
                        ) : parentMenus.length === 0 ? (
                            <div className="text-gray-500 text-base">No menus available</div>
                        ) : (
                            parentMenus.map((menu) => (
                                <div key={menu.menuID} className="mb-4">
                                    <div className="flex items-center justify-between">
                                        <NavLink
                                            to={getMenuRoute(menu)}
                                            onClick={(event) => {
                                                handleMenuClick(menu, event);
                                                if (menu.subMenus?.length > 0) {
                                                    event.preventDefault();
                                                    toggleSubMenu(menu.menuID);
                                                }
                                            }}
                                            className={({ isActive }) =>
                                                `flex items-center space-x-3 px-4 py-2 text-base rounded-lg cursor-pointer ${isActive || openSubMenus[menu.menuID]
                                                    ? 'text-blue-600 bg-blue-50'
                                                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                                                }`
                                            }
                                        >
                                            <span className="w-8 h-8 flex items-center justify-center text-gray-600">
                                                {menuIcons[menu.displayName] || <img src="/dist/icons/default.png" alt="Default" className="h-6 w-6" />}
                                            </span>
                                            <span>{menu.displayName || `Unnamed Menu (ID: ${menu.menuID})`}</span>
                                        </NavLink>
                                        {menu.subMenus?.length > 0 && (
                                            <button
                                                onClick={() => toggleSubMenu(menu.menuID)}
                                                className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-150"
                                            >
                                                <ChevronDownIcon
                                                    className={`w-5 h-5 text-gray-500 transform transition-transform duration-150 ${openSubMenus[menu.menuID] ? 'rotate-180' : ''
                                                        }`}
                                                />
                                            </button>
                                        )}
                                    </div>
                                    {menu.subMenus?.length > 0 && openSubMenus[menu.menuID] && (
                                        <div className="ml-6 mt-2">{renderMobileSubMenus(menu.subMenus)}</div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}
            </nav>
        </div>
    );
}

export default NavBarComponent;