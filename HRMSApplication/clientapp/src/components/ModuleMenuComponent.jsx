import React, { useState, useEffect, useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import FormContext from '../context/FormContext';

function ModuleMenu({ setSelectedModule }) {
    const { regNo } = useContext(FormContext);
    const [menuItems, setMenuItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hoveredModule, setHoveredModule] = useState(null);
    const [menuTimeout, setMenuTimeout] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchMenuItems = async () => {
            try {
                setIsLoading(true);
                const response = await fetch('/HRMS/ErpDashboard/Index', { credentials: 'include' });
                if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                let data = await response.json();
                console.log('Raw API Response:', data); // Debug log
                if (typeof data === 'string') {
                    data = JSON.parse(data);
                }
                const menuData = Array.isArray(data) ? data : data.dataFetch?.table || [];
                console.log('Processed menuData:', menuData); // Debug log
                if (!menuData || menuData.length === 0) {
                    throw new Error('Invalid API response: menu data is empty');
                }
                const modules = menuData.filter(item => item.menuType === 1); // Using menuType 1
                console.log('Filtered modules (menuType 1):', modules); // Debug log
                const sortedModules = modules.sort((a, b) => a.position - b.position);
                setMenuItems(sortedModules);
            } catch (error) {
                console.error('Fetch error:', error);
                setError(error.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchMenuItems();
    }, []);

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

    const getMenuRoute = (menu) => {
        const isValidLink = menu.controllerName && menu.controllerName !== '0' && menu.actionMethod && menu.actionMethod !== '0';
        if (isValidLink) {
            return `/${menu.areaname ? menu.areaname + '/' : ''}${menu.controllerName}/${menu.actionMethod}`;
        }
        return `/module/${menu.menuID}`;
    };

    const handleModuleClick = (module) => {
        const moduleLabel = module.displayName || `Unnamed Module (ID: ${module.menuID})`;
        const iconSrc = module.images ? `data:image/png;base64,${module.images}` : null; // Use images field
        setSelectedModule({ ...module, iconSrc }); // Pass module with images field
        navigate(`/module/${module.menuID}`);
    };

    const renderModuleCard = (module) => {
        console.log("Module is:", module);
        const moduleLabel = module.displayName || `Unnamed Module (ID: ${module.menuID})`;
        const route = getMenuRoute(module);
        const imageSrc = module.images ? `data:image/png;base64,${module.images}` : null; // Use images field
        return (
            <div
                key={module.menuID}
                className="relative group shadow-md rounded-lg p-6 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
                onMouseEnter={() => handleMouseEnter(module.menuID)}
                onMouseLeave={handleMouseLeave}
                onClick={() => handleModuleClick(module)}
            >
                <NavLink
                    to={route}
                    className={({ isActive }) =>
                        `flex items-center space-x-3 text-sm ${isActive || hoveredModule === module.menuID ? 'text-blue-600' : 'text-gray-600'}`
                    }
                    onClick={(e) => e.preventDefault()}
                >
                    <span className="icon-3d-container w-20 h-20 flex items-center justify-center rounded-lg bg-gray-100">
                        <img src={imageSrc} alt={moduleLabel} className="w-16 h-16 object-contain" />
                    </span>
                    <span className="font-semibold">{moduleLabel}</span>
                </NavLink>
            </div>
        );
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Available Modules</h2>
            {isLoading ? (
                <div className="text-gray-600">Loading modules...</div>
            ) : error ? (
                <div className="text-red-500 flex items-center">
                    {error}
                    <button onClick={() => window.location.reload()} className="ml-2 text-gray-600 underline">
                        Retry
                    </button>
                </div>
            ) : menuItems.length === 0 ? (
                <div className="text-gray-600">No modules available. Check console logs.</div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {menuItems.map((module) => renderModuleCard(module))}
                </div>
            )}
            <style jsx>{`
                .icon-3d-container {
                    position: relative;
                    background: linear-gradient(145deg, #f0f0f0, #e0e0e0);
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1), inset 0 2px 4px rgba(255, 255, 255, 0.3);
                    border-radius: 8px;
                    overflow: hidden;
                }
                .icon-3d-container img {
                    position: relative;
                    z-index: 2;
                    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
                }
                
            `}</style>
        </div>
    );
}

export default ModuleMenu;