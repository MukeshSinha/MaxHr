import React, { useState, useEffect } from 'react';
import DataTable from 'react-data-table-component';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaFileCsv, FaFilePdf } from 'react-icons/fa';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const GetPendingLeaves = () => {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredLeaves, setFilteredLeaves] = useState([]);
    const [showExportMenu, setShowExportMenu] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch pending leaves
                const leavesResponse = await fetch(
                    '/HRMS/PendingLeaveApproval/getPendingLeaves',
                    {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            // Add authorization if needed, e.g., 'Authorization': `Bearer ${token}`
                        }
                    }
                );
                if (!leavesResponse.ok) throw new Error('Failed to fetch leaves');
                let leavesResult = await leavesResponse.json();
                if (typeof leavesResult === 'string') leavesResult = JSON.parse(leavesResult);
                const leavesData = leavesResult.dataFetch.table;

                // Fetch employee names
                const employeeResponse = await fetch(
                    '/HRMS/Employees/SearchEmployeeByCode',
                    {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            // Add authorization if needed
                        }
                    }
                );
                if (!leavesResponse.ok) throw new Error('Failed to fetch employees');
                let employeeResult = await employeeResponse.json();
                if (typeof employeeResult === 'string') employeeResult = JSON.parse(employeeResult);
                const employeeData = employeeResult.dataFetch.table || employeeResult;

                // Create employee map
                const employeeMap = new Map(
                    employeeData.map(emp => [emp.empCode, emp.empName])
                );

                // Combine data
                const combinedData = leavesData.map(leave => ({
                    empCode: leave.empCode,
                    name: employeeMap.get(leave.empCode) || 'Unknown',
                    leaveType: leave.leaveType,
                    fromDate: new Date(leave.from1).toLocaleDateString(),
                    toDate: new Date(leave.to1).toLocaleDateString(),
                    days: leave.dday,
                    action: false
                }));

                setLeaves(combinedData);
                setFilteredLeaves(combinedData);
            } catch (err) {
                setError('Failed to fetch data: ' + err.message);
                toast.error(`Error: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        const filtered = leaves.filter(item =>
            item.empCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.leaveType.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredLeaves(filtered);
    }, [searchQuery, leaves]);

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
    };

    const exportToCSV = () => {
        const exportData = filteredLeaves.map(item => ({
            'Emp Code': item.empCode,
            'Employee Name': item.name,
            'Leave Type': item.leaveType,
            'From Date': item.fromDate,
            'To Date': item.toDate,
            'Days': item.days,
        }));
        const csv = Papa.unparse(exportData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', 'pending_leaves.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Exported to CSV successfully!');
    };

    const exportToPDF = () => {
        try {
            const doc = new jsPDF();
            doc.autoTable({
                startY: 20,
                head: [['Emp Code', 'Employee Name', 'Leave Type', 'From Date', 'To Date', 'Days']],
                body: filteredLeaves.map(item => [
                    item.empCode,
                    item.name,
                    item.leaveType,
                    item.fromDate,
                    item.toDate,
                    item.days,
                ]),
                theme: 'striped',
                styles: { fontSize: 10, cellPadding: 5 },
                headStyles: { fillColor: [209, 213, 219], textColor: [255, 255, 255] },
                didDrawPage: () => {
                    doc.setFontSize(12);
                    doc.text('Pending Leaves Report', 14, 10);
                },
            });
            doc.save('pending_leaves.pdf');
            toast.success('Exported to PDF successfully!');
        } catch (error) {
            toast.error(`Failed to export PDF: ${error.message}`);
        }
    };

    const handleSubmit = async () => {
        const selectedLeaves = filteredLeaves.filter(item => item.action);
        if (selectedLeaves.length === 0) {
            toast.error('Please select at least one leave to submit');
            return;
        }

        const payload = selectedLeaves.map(item => ({
            empCode: item.empCode,
            name: item.name,
            leaveType: item.leaveType,
            fromDate: item.fromDate,
            toDate: item.toDate,
            days: item.days,
        }));

        try {
            const response = await fetch('/HRMS/PendingLeaveApproval/submitLeaves', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Add authorization if needed, e.g., 'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Failed to submit leaves');
            let result = await response.json();
            if (typeof result === 'string') result = JSON.parse(result);

            if (result.statusCode === 1) {
                toast.success('Leaves submitted successfully!');
                // Refresh the data after successful submission
                const fetchData = async () => {
                    try {
                        const leavesResponse = await fetch(
                            '/HRMS/PendingLeaveApproval/getPendingLeaves',
                            {
                                method: 'GET',
                                headers: {
                                    'Content-Type': 'application/json',
                                }
                            }
                        );
                        if (!leavesResponse.ok) throw new Error('Failed to fetch leaves');
                        let leavesResult = await leavesResponse.json();
                        if (typeof leavesResult === 'string') leavesResult = JSON.parse(leavesResult);
                        const leavesData = leavesResult.dataFetch.table;

                        const employeeResponse = await fetch(
                            '/HRMS/Employees/SearchEmployeeByCode',
                            {
                                method: 'GET',
                                headers: {
                                    'Content-Type': 'application/json',
                                }
                            }
                        );
                        if (!employeeResponse.ok) throw new Error('Failed to fetch employees');
                        let employeeResult = await employeeResponse.json();
                        if (typeof employeeResult === 'string') result = JSON.parse(employeeResult);
                        const employeeData = employeeResult.dataFetch.table || employeeResult;

                        const employeeMap = new Map(
                            employeeData.map(emp => [emp.empCode, emp.empName])
                        );

                        const combinedData = leavesData.map(leave => ({
                            empCode: leave.empCode,
                            name: employeeMap.get(leave.empCode) || 'Unknown',
                            leaveType: leave.leaveType,
                            fromDate: new Date(leave.from1).toLocaleDateString(),
                            toDate: new Date(leave.to1).toLocaleDateString(),
                            days: leave.dday,
                            action: false
                        }));

                        setLeaves(combinedData);
                        setFilteredLeaves(combinedData);
                    } catch (err) {
                        setError('Failed to fetch data: ' + err.message);
                        toast.error(`Error: ${err.message}`);
                    }
                };
                await fetchData();
            } else {
                throw new Error(result.message || 'Failed to submit leaves');
            }
        } catch (error) {
            toast.error(`Error: ${error.message}`);
        }
    };

    const columns = [
        {
            name: 'Emp Code',
            selector: row => row.empCode,
            sortable: true,
            wrap: true,
        },
        {
            name: 'Employee Name',
            selector: row => row.name,
            sortable: true,
            wrap: true,
        },
        {
            name: 'Leave Type',
            selector: row => row.leaveType,
            sortable: true,
            wrap: true,
        },
        {
            name: 'From Date',
            selector: row => row.fromDate,
            sortable: true,
        },
        {
            name: 'To Date',
            selector: row => row.toDate,
            sortable: true,
        },
        {
            name: 'Days',
            selector: row => row.days,
            sortable: true,
        },
        {
            name: 'Actions',
            cell: row => (
                <input
                    type="checkbox"
                    checked={row.action}
                    onChange={async () => {
                        setLeaves(prev =>
                            prev.map(item =>
                                item.empCode === row.empCode
                                    ? { ...item, action: !item.action }
                                    : item
                            )
                        );
                        setFilteredLeaves(prev =>
                            prev.map(item =>
                                item.empCode === row.empCode
                                    ? { ...item, action: !item.action }
                                    : item
                            )
                        );
                    }}
                    className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                />
            ),
            ignoreRowClick: true,
        },
    ];

    const customStyles = {
        table: {
            style: {
                backgroundColor: '#fff',
            },
        },
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
    };

    return (
        <div className="container mx-auto p-4 max-w-5xl">
            <ToastContainer position="top-right" autoClose={3000} />
            <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Pending Leaves Approval
            </h1>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm sm:text-base">
                    {error}
                </div>
            )}

            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3 p-4">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={handleSearch}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') e.preventDefault();
                        }}
                        placeholder="Search by emp code, name, or leave type..."
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
                    />
                    <div className="relative w-full sm:w-auto">
                        <button
                            type="button"
                            className="w-full sm:w-auto px-3 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 transition-colors flex items-center justify-center"
                            onClick={() => setShowExportMenu(!showExportMenu)}
                        >
                            Export
                            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {showExportMenu && (
                            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                                <button
                                    type="button"
                                    onClick={exportToCSV}
                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                    <FaFileCsv className="w-4 h-4 mr-2" /> Export to CSV
                                </button>
                                <button
                                    type="button"
                                    onClick={exportToPDF}
                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                    <FaFilePdf className="w-4 h-4 mr-2" /> Export to PDF
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <DataTable
                        columns={columns}
                        data={filteredLeaves}
                        progressPending={loading}
                        customStyles={customStyles}
                        responsive
                        pagination
                        paginationPerPage={5}
                        paginationRowsPerPageOptions={[5, 10, 20]}
                        highlightOnHover
                        pointerOnHover
                        noDataComponent={
                            <p className="text-gray-600 text-sm text-center py-4">
                                No leaves match your search.
                            </p>
                        }
                    />
                </div>
                <div className="flex justify-end p-4">
                    <button
                        type="button"
                        onClick={handleSubmit}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                    >
                        Submit Selected Leaves
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GetPendingLeaves;