import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaSearch, FaFileCsv, FaFilePdf, FaTrash, FaExclamationTriangle } from 'react-icons/fa';
import DataTable from 'react-data-table-component';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const CompanyLeaves = () => {
    const [leaveCode, setLeaveCode] = useState('');
    const [fullName, setFullName] = useState('');
    const [isIncremental, setIsIncremental] = useState(false);
    const [carryForward, setCarryForward] = useState(false);
    const [isEncashment, setIsEncashment] = useState(false);
    const [leaves, setLeaves] = useState([]);
    const [filteredLeaves, setFilteredLeaves] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [leaveToDelete, setLeaveToDelete] = useState(null);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [isDataLoaded, setIsDataLoaded] = useState(false);

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
            setFilteredLeaves(data);
            setIsDataLoaded(true);
        } catch (error) {
            toast.error(`Error fetching leaves: ${error.message}`);
            setLeaves([]);
            setFilteredLeaves([]);
            setIsDataLoaded(false);
        }
    };

    useEffect(() => {
        fetchLeaves();
    }, []);

    const handleAddLeave = async () => {
        if (leaveCode && fullName) {
            const newLeave = {
                lvId:0,
                leaveCode,
                lvFull: fullName,
                isIncremental,
                isCarryForward: carryForward,
                isEncashment
            };
            try {
                const response = await fetch('/HRMS/CompanyLeaves/SaveCompanyLeaves', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newLeave)
                });
                if (!response.ok) throw new Error('Failed to save leave');
                let result = await response.json();

                if (typeof result === 'string') result = JSON.parse(result);
                if (result.statusCode === 1) {
                    toast.success('Leave added successfully!', { position: 'top-center', autoClose: 3000 });
                    setLeaves([...leaves, newLeave]);
                    setFilteredLeaves([...leaves, newLeave]);
                    setLeaveCode('');
                    setFullName('');
                    setIsIncremental(false);
                    setCarryForward(false);
                    setIsEncashment(false);
                } else {
                    throw new Error(result.message || 'Leave not saved');
                }
            } catch (error) {
                toast.error(`Submission failed: ${error.message}`, { position: 'top-center', autoClose: 3000 });
            }
        } else {
            toast.error('Please fill Leave Code and Full Name', { position: 'top-center', autoClose: 3000 });
        }
    };

    const handleDeleteClick = (id) => {
        setLeaveToDelete(id);
        setShowConfirmDialog(true);
    };

    const confirmDelete = async () => {
        if (!leaveToDelete) return;
        try {
            const response = await fetch(`/HRMS/Leave/deleteLeave?id=${leaveToDelete}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!response.ok) throw new Error('Failed to delete leave');
            let result = await response.json();
            if (typeof result === 'string') result = JSON.parse(result);
            if (result.statusCode === 1) {
                toast.success('Leave deleted successfully!', { position: 'top-center', autoClose: 3000, toastId: 'delete-success' });
                const updatedLeaves = leaves.filter(l => l.id !== leaveToDelete);
                setLeaves(updatedLeaves);
                setFilteredLeaves(updatedLeaves);
            } else {
                throw new Error(result.message || 'Unknown error');
            }
        } catch (error) {
            toast.error(`Deletion failed: ${error.message}`, { position: 'top-center', autoClose: 3000, toastId: 'delete-error' });
        } finally {
            setShowConfirmDialog(false);
            setLeaveToDelete(null);
        }
    };

    const cancelDelete = () => {
        setShowConfirmDialog(false);
        setLeaveToDelete(null);
    };

    const exportToCSV = () => {
        const exportData = filteredLeaves.map(item => ({
            ID: item.lvId,
            'Leave Code': item.leaveCode,
            'Full Name': item.lvFull,
            'Is Incremental': item.isIncremental ? 'Yes' : 'No',
            'Carry Forward': item.isCarryForward ? 'Yes' : 'No',
            'Is Encashment': item.isEncashment ? 'Yes' : 'No'
        }));
        const csv = Papa.unparse(exportData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', 'leaves.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportToPDF = () => {
        try {
            const doc = new jsPDF();
            doc.autoTable({
                startY: 20,
                head: [['ID', 'Leave Code', 'Full Name', 'Is Incremental', 'Carry Forward', 'Is Encashment']],
                body: filteredLeaves.map(item => [
                    item.lvId,
                    item.leaveCode,
                    item.lvFull,
                    item.isIncremental ? 'Yes' : 'No',
                    item.isCarryForward ? 'Yes' : 'No',
                    item.isEncashment ? 'Yes' : 'No'
                ]),
                theme: 'striped',
                styles: { fontSize: 10, cellPadding: 5 },
                headStyles: { fillColor: [209, 213, 219], textColor: [255, 255, 255] },
                didDrawPage: () => {
                    doc.setFontSize(12);
                    doc.text('Company Leaves Details', 14, 10);
                },
            });
            doc.save('leaves.pdf');
        } catch (error) {
            toast.error(`Failed to export PDF: ${error.message}`, { position: 'top-center', autoClose: 3000 });
        }
    };

    const columns = [
        { name: 'Leave Code', selector: row => row.leaveCode, sortable: true },
        { name: 'Full Name', selector: row => row.lvFull, sortable: true },
        { name: 'Is Incremental', selector: row => row.isIncremental ? 'Yes' : 'No', sortable: true },
        { name: 'Carry Forward', selector: row => row.isCarryForward ? 'Yes' : 'No', sortable: true },
        { name: 'Is Encashment', selector: row => row.isEncashment ? 'Yes' : 'No', sortable: true },
        {
            name: 'Actions',
            cell: row => (
                <button onClick={() => handleDeleteClick(row.id)} className="text-red-500 hover:text-red-700" title="Delete">
                    <FaTrash className="w-4 h-4" />
                </button>
            )
        },
    ];

    const customStyles = {
        headCells: {
            style: {
                backgroundColor: '#2563eb',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '14px',
                padding: '8px',
            },
        },
        cells: {
            style: {
                padding: '8px',
                fontSize: '13px',
            },
        },
        rows: {
            style: {
                minHeight: '48px',
            },
        },
    };

    return (
        <div className="container mx-auto p-4 min-h-screen">
            <ToastContainer position="top-right" autoClose={3000} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left Side - Input Fields */}
                <div className="bg-white rounded-lg shadow-md p-4">
                    <h2 className="text-2xl font-bold text-white bg-blue-600 p-4 rounded-t-lg text-center">
                        Company Leave
                    </h2>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Leave Code</label>
                                <input
                                    type="text"
                                    value={leaveCode}
                                    onChange={(e) => setLeaveCode(e.target.value)}
                                    placeholder="Enter Leave Code"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Enter Full Name"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Is Incremental</label>
                                <input
                                    type="checkbox"
                                    checked={isIncremental}
                                    onChange={(e) => setIsIncremental(e.target.checked)}
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Carry Forward</label>
                                <input
                                    type="checkbox"
                                    checked={carryForward}
                                    onChange={(e) => setCarryForward(e.target.checked)}
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Is Encashment</label>
                                <input
                                    type="checkbox"
                                    checked={isEncashment}
                                    onChange={(e) => setIsEncashment(e.target.checked)}
                                    className="mt-1"
                                />
                            </div>
                        </div>
                        <button
                            onClick={handleAddLeave}
                            className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition-colors"
                        >
                            Add Leave
                        </button>
                    </div>
                </div>

                {/* Right Side - DataTable */}
                <div className="bg-white rounded-lg shadow-md p-4">
                    <div className="mb-4 flex justify-between items-center">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                            placeholder="Search leaves..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                        <div className="relative ml-2">
                            <button
                                type="button"
                                className="px-3 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 transition-colors flex items-center"
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
                            data={filteredLeaves.filter(item =>
                                item.leaveCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                item.lvFull.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                (item.isIncremental ? 'yes' : 'no').toLowerCase().includes(searchQuery.toLowerCase()) ||
                                (item.isCarryForward ? 'yes' : 'no').toLowerCase().includes(searchQuery.toLowerCase()) ||
                                (item.isEncashment ? 'yes' : 'no').toLowerCase().includes(searchQuery.toLowerCase())
                            )}
                            pagination
                            paginationPerPage={5}
                            paginationRowsPerPageOptions={[5, 10, 20]}
                            responsive
                            highlightOnHover
                            customStyles={customStyles}
                            noDataComponent={
                                <p className="text-gray-600 text-sm text-center py-4">
                                    No leaves match your search.
                                </p>
                            }
                        />
                    </div>
                </div>
            </div>

            {/* Confirmation Dialog */}
            {showConfirmDialog && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
                    <div className="bg-white rounded-lg shadow-2xl p-6 max-w-sm w-full transform transition-all duration-300 ease-in-out hover:shadow-3xl">
                        <div className="text-center">
                            <FaExclamationTriangle className="text-yellow-500 w-12 h-12 mx-auto mb-4 animate-pulse" />
                            <h3 className="text-lg font-bold text-gray-800 mb-2">Confirm Deletion</h3>
                            <p className="text-sm text-gray-600 mb-4">Are you sure you want to delete this leave? This action cannot be undone.</p>
                        </div>
                        <div className="flex justify-center space-x-4">
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200 transform hover:scale-105"
                            >
                                Confirm
                            </button>
                            <button
                                onClick={cancelDelete}
                                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors duration-200 transform hover:scale-105"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompanyLeaves;