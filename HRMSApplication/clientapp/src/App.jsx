import React, { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import DummyComponent from './components/DummyComponent';
import EmployeeMaster from './components/EmployeeMaster';
import PreLoginComponent from './components/PreLoginComponent';
import DashboardComponent from './components/DashboardComponent';
import PasswordComponent from './components/PasswordComponent';
import NavBarComponent from './components/NavBarComponent';
import FormContext from './context/FormContext';
import ModuleMenu from './Components/ModuleMenuComponent';
import CategoryManagement from './components/CategoryManagement';
import DepartmentManagement from './components/DepartmentManagement';
import DesignationManagement from './components/DesignationManagement';
import AllowanceMaster from './components/AllowanceMaster';
import DeductionMaster from './components/DeductionMaster';
import AllowanceComponent from './components/AllowanceComponent';
import DeductionList from './components/DeductionList';
import CompanyLeaves from './components/CompanyLeaves';
import ShiftMaster from './components/ShiftMaster';
import HolidayMaster from './components/HolidayMaster';
import EmployeeShiftConfig from './components/EmployeeShiftConfig';
import EmployeeAllowance from './components/EmployeeAllowance';
import EmployeeDeduction from './components/EmployeeDeduction';
import BranchMaster from './components/BranchMaster';
import LocationMaster from './components/LocationMaster';
import ImportEmployee from './components/ImportEmployee';
import ImportSalaryMaster from './components/ImportSalaryMaster';
import LeaveRequest from './components/LeaveRequest';
import AttendanceProcess from './components/AttendanceProcess';
import PFAndESIMaster from './components/PFAndESIMaster';

import PrepareSalary from './components/PrepareSalary';
import GetPendingLeaves from './components/GetPendingLeaves';

const FormProvider = ({ children }) => {
    const [formData, setFormData] = useState({
        formNo: null,
        regNo: null,
        statusCode: null,
        LoginID: null,
        studentName: "",
        className: "",
        email: "",
        mobileNo: "",
    });

    return (
        <FormContext.Provider value={{ formData, setFormData }}>
            {children}
        </FormContext.Provider>
    );
};

const ModuleContent = ({ selectedModule }) => {
    console.log("Selected Module is:", selectedModule);
    const moduleLabel = selectedModule ? selectedModule.displayName || `Module (ID: ${selectedModule.menuID})` : 'No Module Selected';
    const iconSrc = selectedModule?.iconSrc || 'dist/icons/School.png'; // Fallback icon

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="flex items-center space-x-4 mb-6">
                {selectedModule && (
                    <span className="icon-3d-container w-20 h-20 flex items-center justify-center rounded-lg bg-gray-100">
                        <img src={iconSrc} alt={moduleLabel} className="w-16 h-16 object-contain" />
                    </span>
                )}
                <h2 className="text-2xl font-bold text-gray-800">
                    {moduleLabel}
                </h2>
            </div>

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
};

function Layout({ selectedModule, setSelectedModule }) {
    const location = useLocation();

    const excludedPaths = [
        '/Login',
        '/HRMS/EmployeeRegistration/Dashboard',
        '/Password',
    ];

    const shouldShowNavBar = !excludedPaths.includes(location.pathname);

    return (
        <div className="tw-h-screen tw-w-screen">
            {shouldShowNavBar && <NavBarComponent selectedModule={selectedModule} setSelectedModule={setSelectedModule} />}
            <Routes>
                <Route path="/HRMS/EmployeeRegistration/Dashboard" element={<DashboardComponent />} />
                <Route path="/HRMS/Employees/EmployeeMaster" element={<EmployeeMaster />} />
                <Route path="/Login" element={<PreLoginComponent />} />
                <Route path="/Password" element={<PasswordComponent />} />
                <Route path="/Password" element={<PasswordComponent />} />
                <Route path="/modules" element={<ModuleMenu setSelectedModule={setSelectedModule} />} />
                <Route path="/module/:menuID" element={<ModuleContent selectedModule={selectedModule} />} />
                <Route path="/HRMS/CategoryDepartment/CreateCategory" element={<CategoryManagement />} />
                <Route path="/HRMS/Department/CreateDepartment" element={<DepartmentManagement />} />
                <Route path="/HRMS/Designation/CreateDesignation" element={<DesignationManagement />} />
                <Route path="/HRMS/AllowanceMaster/AllowanceMaster" element={<AllowanceMaster />} />
                <Route path="/HRMS/DeductionMaster/DeductionMaster" element={<DeductionMaster />} />
                <Route path="/HRMS/HolidayMaster/HolidayMaster" element={<HolidayMaster />} />
                <Route path="/HRMS/CompanyLeaves/CompanyLeaves" element={<CompanyLeaves />} />
                <Route path="/HRMS/ShiftMaster/ShiftMaster" element={<ShiftMaster />} />
                <Route path="/HRMS/MonthlySalary/monthlyAllowance" element={<EmployeeAllowance />} />
                <Route path="/HRMS/MonthlySalary/monthlyDeductions" element={<EmployeeDeduction />} />
                <Route path="/HRMS/MonthlySalary/prepareSalary" element={<PrepareSalary />} />
                <Route path="/HRMS/TimeOffice/TimeOfficeSetup" element={<EmployeeShiftConfig />} />
                <Route path="/HRMS/TimeOffice/AttendanceProcess" element={<AttendanceProcess />} />
                <Route path="/HRMS/TimeOffice/LeaveRequest" element={<LeaveRequest />} />
                <Route path="/HRMS/PFsetting/PFsetting" element={<GetPendingLeaves />} />
            </Routes>
        </div>
    );
}

function App() {
    const [selectedModule, setSelectedModule] = useState(null);
    return (
        <FormProvider>
            <Layout selectedModule={selectedModule} setSelectedModule={setSelectedModule} />
        </FormProvider>
    );
}

export default App;