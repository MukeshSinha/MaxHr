import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Select from 'react-select';
import DataTable from 'react-data-table-component';

const LeaveRequest = () => {
    const [empCode, setEmpCode] = useState('');
    const [empDetails, setEmpDetails] = useState({ name: '', department: '', designation: '', doj: '' });
    const [leaveType, setLeaveType] = useState(null);
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [dayDifference, setDayDifference] = useState('');
    const [isFirstHalf, setIsFirstHalf] = useState(false);
    const [isSecondHalf, setIsSecondHalf] = useState(false);
    const [remarks, setRemarks] = useState('');
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [balanceData, setBalanceData] = useState([]);
    const [attendanceData, setAttendanceData] = useState([]);
    const [isLoadingBalance, setIsLoadingBalance] = useState(false);
    const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);

    const fetchLeaveTypes = async () => {
        try {
            const response = await fetch('/HRMS/CompanyLeaves/CompanyLeavesList');
            if (!response.ok) throw new Error('Failed to fetch leave types');
            let result = await response.json();
            if (typeof result === 'string') result = JSON.parse(result);
            if (result.statusCode === 1 && result.dataFetch?.table) {
                const leaveOptions = result.dataFetch.table.map(leave => ({
                    value: leave.lvid,
                    label: `${leave.fullName} (${leave.leaveCode})`,
                }));
                setLeaveTypes(leaveOptions);
            } else {
                throw new Error(result.message || 'No leave types found');
            }
        } catch (error) {
            toast.error(`Error fetching leave types: ${error.message}`, { position: 'top-center', autoClose: 3000 });
        }
    };

    useEffect(() => {
        fetchLeaveTypes();
    }, []);

    const fetchEmployeeDetails = async (code) => {
        setEmpDetails({ name: '', department: '', designation: '', doj: '' });
        if (!code) return false;
        try {
            const response = await fetch(`/HRMS/Employees/SearchEmployeeByCode?empCode=${code}`);
            if (!response.ok) throw new Error('Failed to fetch employee details');
            let result = await response.json();
            if (typeof result === 'string') result = JSON.parse(result);
            const employeeData = result.dataFetch?.table[0];
            if (employeeData) {
                setEmpDetails({
                    name: employeeData.empName || '',
                    department: employeeData.department || '',
                    designation: employeeData.desig || '',
                    doj: employeeData.doj ? new Date(employeeData.doj).toLocaleDateString() : '',
                });
                return true;
            } else {
                toast.error('Employee not found', { position: 'top-center', autoClose: 3000 });
                return false;
            }
        } catch (error) {
            toast.error(`Error fetching employee details: ${error.message}`, { position: 'top-center', autoClose: 3000 });
            return false;
        }
    };

    const fetchBalanceData = async () => {
        setIsLoadingBalance(true);
        try {
            setBalanceData(
                leaveTypes.map(leave => ({
                    leaveType: leave.label.split(' (')[0],
                    open: '10',
                    available: '8',
                    balance: '2',
                    status: false
                }))
            );
        } catch (error) {
            toast.error(`Error fetching balance data: ${error.message}`, { position: 'top-center', autoClose: 3000 });
            setBalanceData([]);
        } finally {
            setIsLoadingBalance(false);
        }
    };

    const fetchAttendanceData = async () => {
        setIsLoadingAttendance(true);
        try {
            const defaultAttendanceData = [
                { date: '2025-07-25', inTime: '09:00', outTime: '17:00', workHours: '8', status: false },
                { date: '2025-07-26', inTime: '09:00', outTime: '16:30', workHours: '7.5', status: false },
                { date: '2025-07-27', inTime: '09:00', outTime: '17:00', workHours: '8', status: false },
                { date: '2025-07-28', inTime: '09:00', outTime: '16:30', workHours: '7.5', status: false },
                { date: '2025-07-29', inTime: '09:00', outTime: '17:00', workHours: '8', status: false },
                { date: '2025-07-30', inTime: '09:00', outTime: '16:30', workHours: '7.5', status: false },
            ];
            setAttendanceData(defaultAttendanceData);
        } catch (error) {
            toast.error(`Error fetching attendance data: ${error.message}`, { position: 'top-center', autoClose: 3000 });
            setAttendanceData([]);
        } finally {
            setIsLoadingAttendance(false);
        }
    };

    useEffect(() => {
        if (fromDate && toDate) {
            const from = new Date(fromDate);
            const to = new Date(toDate);
            if (to < from) {
                toast.error('To Date cannot be earlier than From Date', { position: 'top-center', autoClose: 3000 });
                setToDate('');
                setDayDifference('');
                return;
            }
            if ((isFirstHalf || isSecondHalf) && from.toDateString() !== to.toDateString()) {
                toast.error('Please select same From Date, To Date', { position: 'top-center', autoClose: 3000 });
                setToDate('');
                setDayDifference('');
            } else if (isFirstHalf || isSecondHalf) {
                setDayDifference('0.5');
            } else {
                const diffTime = to - from;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                setDayDifference(diffDays >= 0 ? diffDays : '');
            }
        } else {
            setDayDifference('');
        }
    }, [fromDate, toDate, isFirstHalf, isSecondHalf]);

    const handleShowClick = () => {
        if (!empCode) {
            toast.error('Please enter an employee code', { position: 'top-center', autoClose: 3000 });
            return;
        }
        fetchEmployeeDetails(empCode);
        fetchBalanceData();
        fetchAttendanceData();
    };

    const handleSubmit = async () => {
        if (!empCode || !leaveType || !fromDate || !toDate || !remarks) {
            toast.error('Please fill all required fields', { position: 'top-center', autoClose: 3000 });
            return;
        }

        // Check if employee exists
        const employeeExists = await fetchEmployeeDetails(empCode);
        console.log("Employee Exists data is:", employeeExists);
        if (!employeeExists) {
            toast.error('Employee not found', { position: 'top-center', autoClose: 3000 });
            return;
        }

        try {
            const payload = {
                leaveNo: 0,
                empCode,
                fromDate,
                uptoDate: toDate,
                reason: remarks,
                leaveType: leaveType.label.split(' (')[0],
                dday: parseFloat(dayDifference) || 0,
                sess: isFirstHalf ? '1st Half' : isSecondHalf ? '2nd Half' : '-',
                status: '' || ''
            };
            const response = await fetch('/HRMS/EmpTimeOfficeSetup/SaveLeaveRequest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!response.ok) throw new Error('Failed to submit leave request');
            let result = await response.json();
            if (typeof result === 'string') result = JSON.parse(result);
            if (result.statusCode === 1) {
                toast.success('Leave request submitted successfully!', { position: 'top-center', autoClose: 3000 });
                setEmpCode('');
                setLeaveType(null);
                setFromDate('');
                setToDate('');
                setDayDifference('');
                setIsFirstHalf(false);
                setIsSecondHalf(false);
                setRemarks('');
                setEmpDetails({ name: '', department: '', designation: '', doj: '' });
                setBalanceData([]);
                setAttendanceData([]);
            } else {
                throw new Error(result.message || 'Submission failed');
            }
        } catch (error) {
            toast.error(`Submission failed: ${error.message}`, { position: 'top-center', autoClose: 3000 });
        }
    };

    const balanceColumns = [
        { name: 'Leave Type', selector: row => row.leaveType || '', sortable: true },
        { name: 'Open', selector: row => row.open || '', sortable: true },
        { name: 'Available', selector: row => row.available || '', sortable: true },
        { name: 'Balance', selector: row => row.balance || '', sortable: true },
        {
            name: 'Status',
            selector: row => row.status,
            sortable: true,
            cell: row => (
                <input
                    type="checkbox"
                    checked={row.status}
                    onChange={() => {
                        setBalanceData(prev =>
                            prev.map(item =>
                                item.leaveType === row.leaveType
                                    ? { ...item, status: !item.status }
                                    : item
                            )
                        );
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
            ),
        },
    ];

    const attendanceColumns = [
        { name: 'Date', selector: row => row.date || '', sortable: true },
        { name: 'In Time', selector: row => row.inTime || '', sortable: true },
        { name: 'Out Time', selector: row => row.outTime || '', sortable: true },
        { name: 'Work Hours', selector: row => row.workHours || '', sortable: true },
        {
            name: 'Status',
            selector: row => row.status,
            sortable: true,
            cell: row => (
                <input
                    type="checkbox"
                    checked={row.status}
                    onChange={() => {
                        setAttendanceData(prev =>
                            prev.map(item =>
                                item.date === row.date
                                    ? { ...item, status: !item.status }
                                    : item
                            )
                        );
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
            ),
        },
    ];

    const customStyles = {
        headCells: {
            style: {
                backgroundColor: '#2563eb',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '14px',
                padding: '12px',
            },
        },
        cells: {
            style: {
                padding: '12px',
                fontSize: '14px',
            },
        },
        rows: {
            style: {
                minHeight: '56px',
            },
        },
        table: {
            style: {
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                overflow: 'hidden',
            },
        },
    };

    const noDataComponent = <div style={{ height: '56px' }}></div>;

    return (
        <div className="p-4 max-w-7xl mx-auto">
            <ToastContainer position="top-right" autoClose={3000} />
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Left Panel */}
                <div className="w-full lg:w-1/2 bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-base sm:text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent drop-shadow-md mb-4">
                        Leave Request
                    </h3>

                    {/* Employee Code and Show Button */}
                    <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center mt-2">
                        <div className="w-full relative">
                            <input
                                type="text"
                                placeholder="Enter Employee Code"
                                className="w-full p-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={empCode}
                                onChange={(e) => setEmpCode(e.target.value)}
                            />
                            <svg
                                className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1116.65 16.65z"
                                />
                            </svg>
                        </div>
                        <button
                            onClick={handleShowClick}
                            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors w-full sm:w-auto"
                        >
                            Show
                        </button>
                    </div>

                    {/* Employee Details */}
                    {empDetails.name && (
                        <div className="mb-6 p-2 bg-[rgba(255,128,64,0.9)] text-white rounded-md flex flex-wrap justify-between items-center gap-2">
                            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:space-x-4 text-sm w-full">
                                <p className="w-full sm:w-auto"><strong>Employee Name:</strong> {empDetails.name}</p>
                                <p className="w-full sm:w-auto"><strong>Department:</strong> {empDetails.department}</p>
                                <p className="w-full sm:w-auto"><strong>Designation:</strong> {empDetails.designation}</p>
                                <p className="w-full sm:w-auto"><strong>DOJ:</strong> {empDetails.doj}</p>
                            </div>
                        </div>
                    )}

                    {/* Leave Type, From Date, To Date */}
                    <div className="mb-6 flex flex-col sm:flex-row gap-4">
                        <div className="w-full sm:w-1/2">
                            <label className="block text-sm font-medium text-gray-700">Leave Type</label>
                            <Select
                                value={leaveType}
                                onChange={setLeaveType}
                                options={leaveTypes}
                                className="mt-1 text-sm w-full"
                                styles={{ control: (base) => ({ ...base, minHeight: '40px' }) }}
                                placeholder="Select Leave Type"
                            />
                        </div>
                        <div className="w-full sm:w-1/4">
                            <label className="block text-sm font-medium text-gray-700">From Date</label>
                            <input
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div className="w-full sm:w-1/4">
                            <label className="block text-sm font-medium text-gray-700">To Date</label>
                            <input
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* First Half, Second Half, Days */}
                    <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                        <div className="flex flex-col sm:flex-row sm:space-x-6 w-full sm:w-auto">
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    checked={isFirstHalf}
                                    onChange={(e) => {
                                        setIsFirstHalf(e.target.checked);
                                        setIsSecondHalf(false);
                                    }}
                                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                />
                                First Half
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    checked={isSecondHalf}
                                    onChange={(e) => {
                                        setIsSecondHalf(e.target.checked);
                                        setIsFirstHalf(false);
                                    }}
                                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                />
                                Second Half
                            </label>
                        </div>
                        <div className="w-full sm:w-1/3">
                            <label className="block text-sm font-medium text-gray-700">Days</label>
                            <input
                                type="text"
                                value={dayDifference}
                                disabled
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-100 cursor-not-allowed text-sm"
                            />
                        </div>
                    </div>

                    {/* Remarks */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700">Remarks</label>
                        <textarea
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                            rows="4"
                            placeholder="Enter remarks"
                        />
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end">
                        <button
                            onClick={handleSubmit}
                            className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors w-full sm:w-auto"
                        >
                            Save
                        </button>
                    </div>
                </div>

                {/* Right Panel */}
                <div className="w-full lg:w-1/2 flex flex-col gap-6">
                    {/* Balance Enhancement Table */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-base sm:text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent drop-shadow-md mb-4">
                            Balance Enhancement
                        </h3>
                        <div className="overflow-x-auto">
                            <DataTable
                                columns={balanceColumns}
                                data={balanceData}
                                pagination
                                paginationPerPage={5}
                                paginationRowsPerPageOptions={[5, 10, 20]}
                                responsive
                                highlightOnHover
                                customStyles={customStyles}
                                noDataComponent={noDataComponent}
                                progressPending={isLoadingBalance}
                                progressComponent={<div className="text-gray-600 text-sm text-center py-4">Loading balance data...</div>}
                            />
                        </div>
                    </div>

                    {/* Attendance Table */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-base sm:text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent drop-shadow-md mb-4">
                            Attendance Details
                        </h3>
                        <div className="overflow-x-auto">
                            <DataTable
                                columns={attendanceColumns}
                                data={attendanceData}
                                pagination
                                paginationPerPage={5}
                                paginationRowsPerPageOptions={[5, 10, 20]}
                                responsive
                                highlightOnHover
                                customStyles={customStyles}
                                noDataComponent={noDataComponent}
                                progressPending={isLoadingAttendance}
                                progressComponent={<div className="text-gray-600 text-sm text-center py-4">Loading attendance data...</div>}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LeaveRequest;