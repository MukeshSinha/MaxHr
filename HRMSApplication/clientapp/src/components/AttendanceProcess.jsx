import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { format, isBefore, parseISO } from 'date-fns';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AttendanceProcess = () => {
    const [colleges, setColleges] = useState([]);
    const [selectedCollege, setSelectedCollege] = useState(null);
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [employees, setEmployees] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredEmployees, setFilteredEmployees] = useState([]);
    const [selectedEmployees, setSelectedEmployees] = useState({});

    // Fetch colleges from GetCollegeList APIs
    useEffect(() => {
        const fetchColleges = async () => {
            try {
                const response = await fetch(`/HRMS/College/GetCollegeList`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                let result = await response.json();
                if (typeof result === "string") result = JSON.parse(result);
                let data = result.dataFetch.table;
                const formattedColleges = data.map(college => ({
                    value: college.college_CODE,
                    label: college.college_NAME,
                }));
                setColleges(formattedColleges);
            } catch (error) {
                console.error('Error fetching colleges:', error);
                toast.error('Failed to fetch colleges', {
                    position: 'top-right',
                    duration: 3000,
                });
            }
        };
        fetchColleges();
    }, []);

    // Fetch employees when Show Employee is clicked
    const handleShowEmployees = async () => {
        if (!selectedCollege) {
            toast.error('Please select a college', {
                position: 'top-right',
                duration: 3000,
            });
            return;
        }

        try {
            const response = await fetch(
                `/HRMS/Employees/SearchEmployee?CollegeID=${selectedCollege.value}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
            let result = await response.json();
            if (typeof result === "string") result = JSON.parse(result);
            let data = result.dataFetch.table;

            setEmployees(data);
            setFilteredEmployees(data);

            const initialSelected = {};
            data.forEach(emp => {
                initialSelected[emp.empCode] = true;
            });
            setSelectedEmployees(initialSelected);
        } catch (error) {
            console.error('Error fetching employees:', error);
            toast.error('Failed to fetch employees', {
                position: 'top-right',
                duration: 3000,
            });
        }
    };

    // Handle search filtering
    useEffect(() => {
        const filtered = employees.filter(
            emp =>
                emp.empCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                emp.empName?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredEmployees(filtered);
    }, [searchTerm, employees]);

    // Handle checkbox toggle
    const handleCheckboxChange = (empCode) => {
        setSelectedEmployees(prev => ({
            ...prev,
            [empCode]: !prev[empCode],
        }));
    };

    // Validate toDate is not before fromDate
    const handleToDateChange = (e) => {
        const newToDate = e.target.value;
        if (fromDate && isBefore(parseISO(newToDate), parseISO(fromDate))) {
            toast.error('To Date cannot be before From Date', {
                position: 'top-right',
                duration: 3000,
            });
            return;
        }
        setToDate(newToDate);
    };

    // Handle Process button click
    const handleProcess = () => {
        // Add your process logic here
        handleToDateChange();
        toast.success('Processing attendance...', {
            position: 'top-right',
            duration: 3000,
        });
    };

    return (
        <div className="container mx-auto p-4 max-w-4xl">
            <ToastContainer position="top-right" autoClose={3000} />
            <h3 className="text-base sm:text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent drop-shadow-md mb-4">
                AttendanceProcess
            </h3>
            {/* College Selection */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select College
                </label>
                <Select
                    options={colleges}
                    value={selectedCollege}
                    onChange={setSelectedCollege}
                    placeholder="Select a college..."
                    className="w-full"
                    classNamePrefix="react-select"
                />
            </div>

            {/* Date Pickers */}
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        From Date
                    </label>
                    <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        To Date
                    </label>
                    <input
                        type="date"
                        value={toDate}
                        onChange={handleToDateChange}
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Show Employees Button */}
            <div className="mb-4">
                <button
                    onClick={handleShowEmployees}
                    className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    Show Employees
                </button>
            </div>

            {/* Search Box */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search Employee
                </label>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by Employee Code or Name"
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* Employees Table with Scrollbar */}
            <div className="mb-4 max-h-[400px] overflow-y-auto">
                <table className="min-w-full border-collapse border border-gray-300">
                    <thead className="sticky top-0 bg-gray-100">
                        <tr>
                            <th className="border border-gray-300 p-2 text-left text-sm font-medium text-gray-700">Employee Code</th>
                            <th className="border border-gray-300 p-2 text-left text-sm font-medium text-gray-700">Employee Name</th>
                            <th className="border border-gray-300 p-2 text-center text-sm font-medium text-gray-700">Select</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredEmployees.map(emp => (
                            <tr key={emp.empCode} className="hover:bg-gray-50">
                                <td className="border border-gray-300 p-2 text-sm">
                                    {emp.empCode}
                                    <input
                                        type="hidden"
                                        name={`employeeCode_${emp.empCode}`}
                                        value={emp.empCode}
                                    />
                                    <input
                                        type="hidden"
                                        name={`collegeCode_${emp.empCode}`}
                                        value={selectedCollege?.value || ''}
                                    />
                                </td>
                                <td className="border border-gray-300 p-2 text-sm">{emp.empName}</td>
                                <td className="border border-gray-300 p-2 text-center">
                                    <input
                                        type="checkbox"
                                        checked={selectedEmployees[emp.empCode] || false}
                                        onChange={() => handleCheckboxChange(emp.empCode)}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Process Button */}
            <div className="mt-4">
                <button
                    onClick={handleProcess}
                    className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                    Process
                </button>
            </div>
        </div>
    );
};

export default AttendanceProcess;