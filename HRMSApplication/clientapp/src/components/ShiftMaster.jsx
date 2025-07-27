import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaSearch, FaFileCsv, FaFilePdf, FaTrash, FaExclamationTriangle, FaEdit, FaSave } from 'react-icons/fa';
import DataTable from 'react-data-table-component';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const ShiftMaster = () => {
    const [shiftName, setShiftName] = useState('');
    const [arrivalTime, setArrivalTime] = useState('');
    const [deptTime, setDeptTime] = useState('');
    const [workHrs, setWorkHrs] = useState('');
    const [gracePeriod, setGracePeriod] = useState('');
    const [minHalfDayHrs, setMinHalfDayHrs] = useState('');
    const [minFullDayHrs, setMinFullDayHrs] = useState('');
    const [absentIfLessThan, setAbsentIfLessThan] = useState('');
    const [shifts, setShifts] = useState([]);
    const [filteredShifts, setFilteredShifts] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [shiftToDelete, setShiftToDelete] = useState(null);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    const [editingShift, setEditingShift] = useState(null);
    const [isNight, setIsNight] = useState(false);

    const fetchShifts = async () => {
        console.log('Fetching shifts...');
        try {
            const response = await fetch('/HRMS/ShiftMaster/ShiftMasterList');
            if (!response.ok) throw new Error('Failed to fetch shifts');
            let result = await response.json();
            if (typeof result === 'string') result = JSON.parse(result);
            const data = result.dataFetch.table.map(item => ({
                ...item,
                id: item.id,
                shiftName: item.shiftName,
                arrivalTime: item.arrival,
                deptTime: item.departure,
                workHrs: item.wrkHrs,
                gracePeriod: item.grace,
                minHalfDayHrs: item.hlfDy,
                minFullDayHrs: item.fulldy,
                absentIfLessThan: item.absHrs,
                isNight: item.isNight
            }));
            console.log('Fetched data shift:', data);
            setShifts(data);
            setFilteredShifts(data);
            setIsDataLoaded(true);
        } catch (error) {
            console.error('Fetch error:', error);
            toast.error(`Error fetching shifts: ${error.message}`);
            setShifts([]);
            setFilteredShifts([]);
            setIsDataLoaded(true);
        }
    };

    useEffect(() => {
        fetchShifts();
    }, []);

    const handleInputChange = (setter) => (e) => {
        const value = e.target.value;
        if (/^\d*$/.test(value) || e.target.type === 'text') {
            setter(value);
        }
    };

    const handleAddOrUpdateShift = async () => {
        if (!shiftName || !arrivalTime || !deptTime || !workHrs || !gracePeriod || !minHalfDayHrs || !minFullDayHrs || !absentIfLessThan) {
            toast.error('Please fill all fields', { position: 'top-center', autoClose: 3000 });
            return;
        }

        const newShift = {
            sid: editingShift ? editingShift.sid : 0,
            shiftName: shiftName,
            arrival: arrivalTime,
            departure: deptTime,
            wrkHrs: workHrs,
            grace: parseInt(gracePeriod) || 0,
            hlfDy: parseInt(minHalfDayHrs) || 0,
            fulldy: parseInt(minFullDayHrs) || 0,
            absHrs: parseInt(absentIfLessThan) || 0,
            isNight: isNight
        };

        try {
            const url = editingShift
                ? `/HRMS/Shift/updateShift?id=${editingShift.id}`
                : '/HRMS/ShiftMaster/SaveShiftMaster';
            const method = editingShift ? 'PUT' : 'POST';
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newShift)
            });
            if (!response.ok) throw new Error(`Failed to ${editingShift ? 'update' : 'save'} shift`);
            let result = await response.json();
            if (typeof result === 'string') result = JSON.parse(result);
            if (result.statusCode === 1) {
                toast.success(`${editingShift ? 'Shift updated' : 'Shift added'} successfully!`, { position: 'top-center', autoClose: 3000 });
                await fetchShifts();
                setShiftName('');
                setArrivalTime('');
                setDeptTime('');
                setWorkHrs('');
                setGracePeriod('');
                setMinHalfDayHrs('');
                setMinFullDayHrs('');
                setAbsentIfLessThan('');
                setIsNight(false);
                setEditingShift(null);
            } else {
                throw new Error(result.message || 'Operation failed');
            }
        } catch (error) {
            toast.error(`Operation failed: ${error.message}`, { position: 'top-center', autoClose: 3000 });
        }
    };

    const handleEditClick = (shift) => {
        setEditingShift(shift);
        setShiftName(shift.shiftName || '');
        setArrivalTime(shift.arrivalTime || '');
        setDeptTime(shift.deptTime || '');
        setWorkHrs(shift.workHrs || '');
        setGracePeriod(shift.gracePeriod || '');
        setMinHalfDayHrs(shift.minHalfDayHrs || '');
        setMinFullDayHrs(shift.minFullDayHrs || '');
        setAbsentIfLessThan(shift.absentIfLessThan || '');
        setIsNight(shift.isNight || false);
    };

    const handleDeleteClick = (id) => {
        setShiftToDelete(id);
        setShowConfirmDialog(true);
    };

    const confirmDelete = async () => {
        if (!shiftToDelete) return;
        try {
            const response = await fetch(`/HRMS/Shift/deleteShift?id=${shiftToDelete}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!response.ok) throw new Error('Failed to delete shift');
            let result = await response.json();
            if (typeof result === 'string') result = JSON.parse(result);
            if (result.statusCode === 1) {
                toast.success('Shift deleted successfully!', { position: 'top-center', autoClose: 3000, toastId: 'delete-success' });
                const updatedShifts = shifts.filter(s => s.id !== shiftToDelete);
                setShifts(updatedShifts);
                setFilteredShifts(updatedShifts);
            } else {
                throw new Error(result.message || 'Unknown error');
            }
        } catch (error) {
            toast.error(`Deletion failed: ${error.message}`, { position: 'top-center', autoClose: 3000, toastId: 'delete-error' });
        } finally {
            setShowConfirmDialog(false);
            setShiftToDelete(null);
        }
    };

    const cancelDelete = () => {
        setShowConfirmDialog(false);
        setShiftToDelete(null);
    };

    const exportToCSV = () => {
        const exportData = filteredShifts.map(item => ({
            ID: item.id,
            'Shift Name': item.shiftName,
            'Arrival Time': item.arrivalTime,
            'Dept Time': item.deptTime,
            'Work Hrs': item.workHrs,
            'Grace Period': item.gracePeriod,
            'Min Half Day Hrs': item.minHalfDayHrs,
            'Min Full Day Hrs': item.minFullDayHrs,
            'Absent If Less Than': item.absentIfLessThan
        }));
        const csv = Papa.unparse(exportData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', 'shifts.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportToPDF = () => {
        try {
            const doc = new jsPDF();
            doc.autoTable({
                startY: 20,
                head: [['ID', 'Shift Name', 'Arrival Time', 'Dept Time', 'Work Hrs', 'Grace Period', 'Min Half Day Hrs', 'Min Full Day Hrs', 'Absent If Less Than']],
                body: filteredShifts.map(item => [
                    item.id,
                    item.shiftName,
                    item.arrivalTime,
                    item.deptTime,
                    item.workHrs,
                    item.gracePeriod,
                    item.minHalfDayHrs,
                    item.minFullDayHrs,
                    item.absentIfLessThan
                ]),
                theme: 'striped',
                styles: { fontSize: 10, cellPadding: 5 },
                headStyles: { fillColor: [209, 213, 219], textColor: [255, 255, 255] },
                didDrawPage: () => {
                    doc.setFontSize(12);
                    doc.text('Shift Master Details', 14, 10);
                },
            });
            doc.save('shifts.pdf');
        } catch (error) {
            toast.error(`Failed to export PDF: ${error.message}`, { position: 'top-center', autoClose: 3000 });
        }
    };

    const columns = [
        { name: 'Shift Name', selector: row => row.shiftName, sortable: true },
        { name: 'Arrival Time', selector: row => row.arrivalTime, sortable: true },
        { name: 'Dept Time', selector: row => row.deptTime, sortable: true },
        { name: 'Work Hrs', selector: row => row.workHrs, sortable: true },
        { name: 'Grace Period', selector: row => row.gracePeriod, sortable: true },
        { name: 'Min Half Day Hrs', selector: row => row.minHalfDayHrs, sortable: true },
        { name: 'Min Full Day Hrs', selector: row => row.minFullDayHrs, sortable: true },
        { name: 'Absent If Less Than', selector: row => row.absentIfLessThan, sortable: true },
        {
            name: 'Actions',
            cell: row => (
                <div className="flex space-x-2">
                    <button onClick={() => handleEditClick(row)} className="text-blue-500 hover:text-blue-700" title="Edit">
                        <FaEdit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteClick(row.id)} className="text-red-500 hover:text-red-700" title="Delete">
                        <FaTrash className="w-4 h-4" />
                    </button>
                </div>
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
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Shift Master</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left Side - Input Fields */}
                <div className="bg-white rounded-lg shadow-md p-4">
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Shift Name</label>
                                <input
                                    type="text"
                                    value={shiftName}
                                    onChange={(e) => setShiftName(e.target.value)}
                                    placeholder="Enter Shift Name"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Arrival Time</label>
                                <input
                                    type="time"
                                    value={arrivalTime}
                                    onChange={(e) => setArrivalTime(e.target.value)}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Dept Time</label>
                                <input
                                    type="time"
                                    value={deptTime}
                                    onChange={(e) => setDeptTime(e.target.value)}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Work Hrs</label>
                                <input
                                    type="text"
                                    value={workHrs}
                                    onChange={(e) => setWorkHrs(e.target.value)}
                                    placeholder="Enter Work Hrs"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 items-center">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Grace Period (mins)</label>
                                <input
                                    type="text"
                                    value={gracePeriod}
                                    onChange={handleInputChange(setGracePeriod)}
                                    placeholder="Enter Grace Period"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div className="flex items-center space-x-2">
                                <label className="block text-sm font-medium text-gray-700">Is Night</label>
                                <input
                                    type="checkbox"
                                    checked={isNight}
                                    onChange={(e) => setIsNight(e.target.checked)}
                                    className="mt-1 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Minimum Work Hours for Half Day</label>
                                <input
                                    type="text"
                                    value={minHalfDayHrs}
                                    onChange={handleInputChange(setMinHalfDayHrs)}
                                    placeholder="Enter Min Half Day Hrs"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Minimum Work Hours for Full Day</label>
                                <input
                                    type="text"
                                    value={minFullDayHrs}
                                    onChange={handleInputChange(setMinFullDayHrs)}
                                    placeholder="Enter Min Full Day Hrs"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Absent If Work Hours Less Than</label>
                                <input
                                    type="text"
                                    value={absentIfLessThan}
                                    onChange={handleInputChange(setAbsentIfLessThan)}
                                    placeholder="Enter Absent If Less Than"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                        <div className="flex space-x-2">
                            {!editingShift && (
                                <button
                                    onClick={handleAddOrUpdateShift}
                                    className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition-colors"
                                >
                                    Submit
                                </button>
                            )}
                            {editingShift && (
                                <button
                                    onClick={handleAddOrUpdateShift}
                                    className="w-full bg-green-600 text-white p-2 rounded-md hover:bg-green-700 transition-colors"
                                >
                                    <FaSave className="inline mr-1" /> Update
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Side - DataTable or Message */}
                <div className="bg-white rounded-lg shadow-md p-4">
                    {!isDataLoaded ? (
                        <p className="text-gray-600 text-sm text-center py-4">Loading...</p>
                    ) : filteredShifts.length === 0 ? (
                        <p className="text-gray-600 text-sm text-center py-4">No shifts available.</p>
                    ) : (
                        <div>
                            <div className="mb-4 flex justify-between items-center">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                                    placeholder="Search shifts..."
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
                                    data={filteredShifts.filter(item =>
                                        (item.shiftName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                                        (item.arrivalTime || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                                        (item.deptTime || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                                        (item.workHrs || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                                        (item.gracePeriod || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                                        (item.minHalfDayHrs || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                                        (item.minFullDayHrs || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                                        (item.absentIfLessThan || '').toLowerCase().includes(searchQuery.toLowerCase())
                                    )}
                                    pagination
                                    paginationPerPage={5}
                                    paginationRowsPerPageOptions={[5, 10, 20]}
                                    responsive
                                    highlightOnHover
                                    customStyles={customStyles}
                                    noDataComponent={
                                        <p className="text-gray-600 text-sm text-center py-4">
                                            No shifts match your search.
                                        </p>
                                    }
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Confirmation Dialog */}
            {showConfirmDialog && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
                    <div className="bg-white rounded-lg shadow-2xl p-6 max-w-sm w-full transform transition-all duration-300 ease-in-out hover:shadow-3xl">
                        <div className="text-center">
                            <FaExclamationTriangle className="text-yellow-500 w-12 h-12 mx-auto mb-4 animate-pulse" />
                            <h3 className="text-lg font-bold text-gray-800 mb-2">Confirm Deletion</h3>
                            <p className="text-sm text-gray-600 mb-4">Are you sure you want to delete this shift? This action cannot be undone.</p>
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

export default ShiftMaster;