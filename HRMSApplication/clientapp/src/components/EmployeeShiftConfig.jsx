import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Select from 'react-select';
import { FaUser, FaCalendar, FaRegFileAlt, FaFileAlt } from 'react-icons/fa';

const EmployeeShiftConfig = () => {
    const [empCode, setEmpCode] = useState('');
    const [empDetails, setEmpDetails] = useState({ name: '', designation: '', department: '' });
    const [activeTab, setActiveTab] = useState('biometric');
    const [isEmpCodeValid, setIsEmpCodeValid] = useState(false);
    const [biometricData, setBiometricData] = useState({
        biometricId: '',
        minPunch: 2,
        currentShift: null,
        rotationAllowed: false,
        otAllow: false,
        otRate: 1,
        compOffAllow: false,
        geoFenceAllow: false,
        mobilePunchAllow: false,
        workHours: '',
    });
    const [wefDate, setWefDate] = useState('');
    const [shiftSchedule, setShiftSchedule] = useState({
        Sunday: ['', '', '', '', ''],
        Monday: ['', '', '', '', ''],
        Tuesday: ['', '', '', '', ''],
        Wednesday: ['', '', '', '', ''],
        Thursday: ['', '', '', '', ''],
        Friday: ['', '', '', '', ''],
        Saturday: ['', '', '', '', ''],
    });
    const [shifts, setShifts] = useState([]);
    const [leaves, setLeaves] = useState([]);
    const [leaveBalances, setLeaveBalances] = useState({});

    useEffect(() => {
        const fetchShifts = async () => {
            try {
                const response = await fetch(`/HRMS/ShiftMaster/ShiftMasterList`);
                if (!response.ok) throw new Error('Failed to fetch shifts');
                let result = await response.json();
                if (typeof result === 'string') result = JSON.parse(result);
                let data = result.dataFetch.table;
                const shiftOptions = data.map(shift => ({ value: shift.id, label: shift.shiftName }));
                setShifts(shiftOptions);
            } catch (error) {
                toast.error(`Error fetching shifts: ${error.message}`);
            }
        };

        const fetchLeaves = async () => {
            try {
                const response = await fetch('/HRMS/CompanyLeaves/CompanyLeavesList');
                if (!response.ok) throw new Error('Failed to fetch leaves');
                let result = await response.json();
                if (typeof result === 'string') result = JSON.parse(result);
                const data = result.dataFetch.table.map(item => ({
                    ...item,
                    leaveCode: item.leaveCode || '',
                    lvFull: item.fullName || '',
                    isIncremental: item.incremental || false,
                    isCarryForward: item.isCarryForwarded || false,
                    isEncashment: item.isEncashment || false
                }));
                setLeaves(data);
                setLeaveBalances(data.reduce((acc, leave) => ({ ...acc, [leave.lvid]: '' }), {}));
            } catch (error) {
                toast.error(`Error fetching leaves: ${error.message}`);
                setLeaves([]);
            }
        };

        fetchShifts();
        fetchLeaves();
    }, []);

    const handleEmpCodeBlur = async () => {
        if (empCode) {
            try {
                const response = await fetch(`HRMS/Employees/SearchEmployeeByCode?empCode=${empCode}`);
                if (!response.ok) throw new Error('Failed to fetch employee data');
                let result = await response.json();
                if (typeof result === 'string') result = JSON.parse(result);
                const data = result.dataFetch?.table[0];
                if (data) {
                    setEmpDetails({
                        name: data.empName || '',
                        designation: data.desig || '',
                        department: data.department || '',
                    });
                    setIsEmpCodeValid(true);
                } else {
                    setEmpDetails({ name: '', designation: '', department: '' });
                    setIsEmpCodeValid(false);
                    toast.error("Employee doesn't exist");
                }
            } catch (error) {
                console.error('Fetch error:', error);
                setEmpDetails({ name: '', designation: '', department: '' });
                setIsEmpCodeValid(false);
                toast.error(`Error fetching employee data: ${error.message}`);
            }
        } else {
            setEmpDetails({ name: '', designation: '', department: '' });
            setIsEmpCodeValid(false);
        }
    };

    const handleBiometricChange = (e) => {
        const { name, value, type, checked } = e.target;
        setBiometricData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleLeaveBalanceChange = (lvid, value) => {
        setLeaveBalances(prev => ({ ...prev, [lvid]: value }));
    };

    const handleShiftScheduleChange = (day, index) => (e) => {
        setShiftSchedule(prev => ({
            ...prev,
            [day]: prev[day].map((val, i) => (i === index ? e.target.value : val)),
        }));
    };

    const handleTabClick = (tab) => {
        setActiveTab(tab);
    };

    const handleBiometricSubmit = async () => {
        if (!empCode.trim()) {
            toast.error('Please fill employee code');
            return;
        }
        if (!isEmpCodeValid) {
            toast.error("Employee doesn't exist");
            return;
        }
        if (!biometricData.biometricId.trim()) {
            toast.error('Please fill biometric Id');
            return;
        }
        if (!biometricData.currentShift) {
            toast.error('Please select current shift');
            return;
        }
        const payload = {
            empCode: empCode,
            biometricID: biometricData.biometricId,
            isGeoFenceAllow: biometricData.geoFenceAllow,
            isCoffAllow: biometricData.compOffAllow,
            isOtAllow: biometricData.otAllow,
            otRate: parseInt(biometricData.otRate, 10) || 0,
            minPunch: parseInt(biometricData.minPunch, 10) || 0,
            currentShift: String(biometricData.currentShift ? biometricData.currentShift.value : null),
            isRotationApplicable: biometricData.rotationAllowed,
        };

        try {
            const response = await fetch('/HRMS/EmpTimeOfficeSetup/SaveSetupMaster', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });
            if (!response.ok) throw new Error('Failed to save setup');
            let result = await response.json();
            if (typeof result === "string") result = JSON.parse(result);
            if (result.statusCode === 1) {
                toast.success('Biometric data submitted successfully!');
                setBiometricData({
                    biometricId: '',
                    minPunch: 2,
                    currentShift: null,
                    rotationAllowed: false,
                    otAllow: false,
                    otRate: 1,
                    compOffAllow: false,
                    geoFenceAllow: false,
                    mobilePunchAllow: false,
                    workHours: '',
                });
            } else {
                throw new Error(result.message || 'Biometric data not submitted');
            }
        } catch (error) {
            toast.error(`Error saving setup: ${error.message}`);
        }
    };

    const handleWefDateSubmit = async () => {
        if (!empCode.trim()) {
            toast.error('Please fill employee code');
            return;
        }
        if (!isEmpCodeValid) {
            toast.error("Employee doesn't exist");
            return;
        }
        if (!wefDate) {
            toast.error('Please select Wef Date');
            return;
        }
        // Example validation: Ensure at least one shift value is entered
        const hasShiftValue = Object.values(shiftSchedule).some(day => day.some(value => value !== ''));
        if (!hasShiftValue) {
            toast.error('Please enter at least one shift value');
            return;
        }

        try {
            // Placeholder for WefDate API call (adjust endpoint and payload as needed)
            const payload = {
                empCode,
                wefDate,
                shiftSchedule,
            };
            // Example API call (replace with actual endpoint)
            toast.success('Shift schedule submitted successfully!');
        } catch (error) {
            toast.error(`Error saving shift schedule: ${error.message}`);
        }
    };

    const handleLeavesSubmit = async () => {
        if (!empCode.trim()) {
            toast.error('Please fill employee code');
            return;
        }
        if (!isEmpCodeValid) {
            toast.error("Employee doesn't exist");
            return;
        }
        // Example validation: Ensure at least one leave balance is entered
        const hasLeaveBalance = Object.values(leaveBalances).some(balance => balance !== '');
        if (!hasLeaveBalance) {
            toast.error('Please enter at least one leave balance');
            return;
        }

        try {
            // Placeholder for Leaves API call (adjust endpoint and payload as needed)
            toast.success('Leave balances submitted successfully!');
        } catch (error) {
            toast.error(`Error saving leave balances: ${error.message}`);
        }
    };

    return (
        <div className="container mx-auto p-2 mt-4 max-w-4xl">
            <ToastContainer position="top-right" autoClose={3000} />
            <h1 className="text-2xl font-bold text-white bg-blue-600 p-4 rounded-t-lg text-center">Time Office Setup</h1>

            {/* Emp Code Input */}
            <div className="mb-2">
                <label className="block text-sm font-medium text-gray-700">Emp Code</label>
                <input
                    type="text"
                    value={empCode}
                    onChange={(e) => setEmpCode(e.target.value)}
                    onBlur={handleEmpCodeBlur}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="Enter Emp Code"
                />
            </div>

            {/* Employee Details */}
            {empDetails.name && (
                <div className="mb-2 p-2 bg-[rgba(255,128,64,0.9)] text-white rounded-md flex flex-wrap justify-between items-center gap-2">
                    <div className="flex flex-wrap space-x-2 text-sm">
                        <p><strong>Employee Name:</strong> {empDetails.name}</p>
                        <p><strong>Designation:</strong> {empDetails.designation}</p>
                        <p><strong>Department:</strong> {empDetails.department}</p>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="flex space-x-2 mb-2">
                <button
                    onClick={() => handleTabClick('biometric')}
                    className={`flex items-center px-2 py-1 rounded-t-lg ${activeTab === 'biometric' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'} hover:bg-blue-500 hover:text-white transition-colors text-sm`}
                >
                    <FaUser className="mr-1" /> Biometric
                </button>
                <button
                    onClick={() => handleTabClick('wefDate')}
                    className={`flex items-center px-2 py-1 rounded-t-lg ${activeTab === 'wefDate' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'} hover:bg-blue-500 hover:text-white transition-colors text-sm`}
                >
                    <FaCalendar className="mr-1" /> Week off Day
                </button>
                <button
                    onClick={() => handleTabClick('leaves')}
                    className={`flex items-center px-2 py-1 rounded-t-lg ${activeTab === 'leaves' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'} hover:bg-blue-500 hover:text-white transition-colors text-sm`}
                >
                    <FaRegFileAlt className="mr-1" /> Leaves
                </button>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-lg shadow-md p-2">
                {activeTab === 'biometric' && (
                    <div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                            <div>
                                <label className="block text-xs font-medium text-gray-700">Biometric/FaceId</label>
                                <input
                                    type="text"
                                    name="biometricId"
                                    value={biometricData.biometricId}
                                    onChange={handleBiometricChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    placeholder="Enter Biometric/FaceId"
                                />
                            </div>
                            <div className="flex items-center space-x-2">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700">Minimum Punch</label>
                                    <input
                                        type="number"
                                        name="minPunch"
                                        value={biometricData.minPunch}
                                        onChange={handleBiometricChange}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    />
                                </div>
                                <div className="w-full">
                                    <label className="block text-xs font-medium text-gray-700">Current Shift</label>
                                    <Select
                                        name="currentShift"
                                        value={biometricData.currentShift}
                                        onChange={(value) => setBiometricData(prev => ({ ...prev, currentShift: value }))}
                                        options={shifts}
                                        className="mt-1 block w-full text-sm"
                                        placeholder="Select Shift"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                            <div className="flex items-center space-x-2">
                                <div>
                                    <label className="flex items-center text-xs">
                                        <input
                                            type="checkbox"
                                            name="rotationAllowed"
                                            checked={biometricData.rotationAllowed}
                                            onChange={handleBiometricChange}
                                            className="mr-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        Rotation Allowed
                                    </label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <label className="flex items-center text-xs">
                                        <input
                                            type="checkbox"
                                            name="otAllow"
                                            checked={biometricData.otAllow}
                                            onChange={handleBiometricChange}
                                            className="mr-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        OT Allow
                                    </label>
                                    {biometricData.otAllow && (
                                        <input
                                            type="number"
                                            name="otRate"
                                            value={biometricData.otRate}
                                            onChange={handleBiometricChange}
                                            className="mt-1 w-16 border border-gray-300 rounded-md shadow-sm p-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                            <div>
                                <label className="flex items-center text-xs">
                                    <input
                                        type="checkbox"
                                        name="compOffAllow"
                                        checked={biometricData.compOffAllow}
                                        onChange={handleBiometricChange}
                                        className="mr-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    Compensatory Off Allow
                                </label>
                            </div>
                            <div>
                                <label className="flex items-center text-xs">
                                    <input
                                        type="checkbox"
                                        name="geoFenceAllow"
                                        checked={biometricData.geoFenceAllow}
                                        onChange={handleBiometricChange}
                                        className="mr-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    GeoFence Punch Allow
                                </label>
                            </div>
                            <div>
                                <label className="flex items-center text-xs">
                                    <input
                                        type="checkbox"
                                        name="mobilePunchAllow"
                                        checked={biometricData.mobilePunchAllow}
                                        onChange={handleBiometricChange}
                                        className="mr-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    Mobile Punch Allow
                                </label>
                            </div>
                        </div>
                        <div className="mb-2">
                            <label className="block text-xs font-medium text-gray-700">Work Hours</label>
                            <input
                                type="text"
                                name="workHours"
                                value={biometricData.workHours}
                                onChange={handleBiometricChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                placeholder="Enter Work Hours"
                            />
                        </div>
                        <button
                            onClick={handleBiometricSubmit}
                            className="w-full bg-blue-600 text-white p-1 rounded-md hover:bg-blue-700 transition-colors text-sm"
                        >
                            Submit
                        </button>
                    </div>
                )}

                {activeTab === 'wefDate' && (
                    <div>
                        <div className="mb-2">
                            <label className="block text-xs font-medium text-gray-700">Wef Date</label>
                            <input
                                type="date"
                                value={wefDate}
                                onChange={(e) => setWefDate(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            />
                            <p className="text-red-500 text-xs mt-1">For Full Day Enter :- 1 ,For Half Day Enter :- 0.5</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left text-gray-500">
                                <thead className="text-[10px] text-gray-700 uppercase bg-gray-50">
                                    <tr>
                                        <th className="px-2 py-1">Day</th>
                                        <th className="px-2 py-1">1</th>
                                        <th className="px-2 py-1">2</th>
                                        <th className="px-2 py-1">3</th>
                                        <th className="px-2 py-1">4</th>
                                        <th className="px-2 py-1">5</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(shiftSchedule).map(([day, values]) => (
                                        <tr key={day} className="bg-white border-b">
                                            <td className="px-2 py-1">{day}</td>
                                            {values.map((value, index) => (
                                                <td key={index} className="px-2 py-1">
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        value={value || ''}
                                                        onChange={handleShiftScheduleChange(day, index)}
                                                        className="w-16 border border-gray-300 rounded-md shadow-sm p-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                                        placeholder="Enter value"
                                                    />
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <button
                            onClick={handleWefDateSubmit}
                            className="mt-2 w-full bg-blue-600 text-white p-1 rounded-md hover:bg-blue-700 transition-colors text-sm"
                        >
                            Submit
                        </button>
                    </div>
                )}

                {activeTab === 'leaves' && (
                    <div>
                        <div className="flex items-center mb-2">
                            <FaFileAlt className="mr-1 text-blue-600" />
                            <h2 className="text-lg font-bold text-gray-800">Open Balance</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left text-gray-500">
                                <thead className="text-[10px] text-gray-700 uppercase bg-gray-50">
                                    <tr>
                                        <th className="px-2 py-1">Leave Type</th>
                                        <th className="px-2 py-1">Balance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leaves.map(leave => (
                                        <tr key={leave.lvid} className="bg-white border-b">
                                            <td className="px-2 py-1">
                                                <input type="hidden" value={leave.lvid} />
                                                {`${leave.lvFull} (${leave.leaveCode})`}
                                            </td>
                                            <td className="px-2 py-1">
                                                <input
                                                    type="number"
                                                    value={leaveBalances[leave.lvid] || ''}
                                                    onChange={(e) => handleLeaveBalanceChange(leave.lvid, e.target.value)}
                                                    className="w-24 border border-gray-300 rounded-md shadow-sm p-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                                    placeholder="Enter balance"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <button
                            onClick={handleLeavesSubmit}
                            className="mt-2 w-full bg-blue-600 text-white p-1 rounded-md hover:bg-blue-700 transition-colors text-sm"
                        >
                            Submit
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmployeeShiftConfig;