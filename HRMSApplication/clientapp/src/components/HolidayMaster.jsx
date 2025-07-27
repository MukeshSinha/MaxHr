import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaSearch, FaFileCsv, FaFilePdf, FaTrash, FaExclamationTriangle, FaEdit, FaSave } from 'react-icons/fa';
import DataTable from 'react-data-table-component';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Select from 'react-select';

const HolidayMaster = () => {
    const [collegeOptions, setCollegeOptions] = useState([]);
    const [collegeMap, setCollegeMap] = useState({});
    const [selectedCollege, setSelectedCollege] = useState(null);
    const [categories, setCategories] = useState([]);
    const [filteredCategories, setFilteredCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [holidayName, setHolidayName] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [holidays, setHolidays] = useState([]);
    const [filteredHolidays, setFilteredHolidays] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [holidayToDelete, setHolidayToDelete] = useState(null);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    const [editingHoliday, setEditingHoliday] = useState(null);
    const [allDataReady, setAllDataReady] = useState(false);

    const fetchColleges = async () => {
        try {
            const response = await fetch('/HRMS/College/GetCollegeList');
            if (!response.ok) throw new Error('Failed to fetch colleges');
            let result = await response.json();
            if (typeof result === "string") result = JSON.parse(result);
            const colleges = result.dataFetch.table.map(college => ({
                value: college.college_CODE.replace(/^0+/, ''),
                label: college.college_NAME
            }));
            const collegeMapping = result.dataFetch.table.reduce((map, college) => {
                map[college.college_CODE.replace(/^0+/, '')] = college.college_NAME;
                return map;
            }, {});
            setCollegeOptions([{ value: '0', label: '-- Select College --' }, ...colleges]);
            setCollegeMap(collegeMapping);
            console.log('College Map:', collegeMapping);
        } catch (error) {
            toast.error(`Error fetching colleges: ${error.message}`);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await fetch('/HRMS/CategoryDepartment/CategoryList');
            if (!response.ok) throw new Error('Failed to fetch categories');
            let result = await response.json();
            console.log('Fetched categories:', result);
            if (typeof result === "string") {
                try {
                    result = JSON.parse(result);
                } catch (parseError) {
                    console.error('Failed to parse JSON string:', parseError);
                    throw new Error('Invalid JSON response');
                }
            }
            const data = result.dataFetch.table;
            setCategories(data);
            setFilteredCategories(data);
        } catch (error) {
            toast.error(`Error fetching categories: ${error.message}`);
            setCategories([]);
            setFilteredCategories([]);
        }
    };

    const fetchHolidays = async () => {
        try {
            const response = await fetch('/HRMS/HolidayMaster/HolidayMasterList');
            if (!response.ok) throw new Error('Failed to fetch holidays');
            let result = await response.json();
            if (typeof result === 'string') result = JSON.parse(result);
            const data = result.dataFetch.table;
            console.log('Raw holiday data:', data);
            // Group by hid and find min/max dates
            const groupedHolidays = data.reduce((acc, item) => {
                const existing = acc.get(item.hid);
                if (!existing) {
                    acc.set(item.hid, { ...item, FromDate: item.hdDate.split('T')[0], UptoDate: item.hdDate.split('T')[0] });
                } else {
                    const existingFromDate = new Date(existing.FromDate);
                    const existingUptoDate = new Date(existing.UptoDate);
                    const newDate = new Date(item.hdDate.split('T')[0]);
                    existing.FromDate = new Date(Math.min(existingFromDate, newDate)).toISOString().split('T')[0];
                    existing.UptoDate = new Date(Math.max(existingUptoDate, newDate)).toISOString().split('T')[0];
                }
                return acc;
            }, new Map());
            const processedData = Array.from(groupedHolidays.values()).map(item => ({
                ID: item.hid,
                CompCode: item.ezone,
                CtgId: item.ctgId,
                HdName: item.holidayName,
                FromDate: item.FromDate,
                UptoDate: item.UptoDate
            }));
            console.log('Processed holiday data:', processedData);
            setHolidays(processedData);
            setIsDataLoaded(true);
        } catch (error) {
            toast.error(`Error fetching holidays: ${error.message}`);
            setHolidays([]);
            setIsDataLoaded(false);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            await Promise.all([fetchColleges(), fetchCategories(), fetchHolidays()]);
            setAllDataReady(true);
        };
        loadData();
    }, []);

    useEffect(() => {
        if (allDataReady && isDataLoaded && Object.keys(collegeMap).length > 0 && categories.length > 0) {
            const mappedHolidays = holidays.map(holiday => {
                const normalizedCompCode = holiday.CompCode.replace(/^0+/, '');
                const compCodeName = collegeMap[normalizedCompCode] || collegeMap[holiday.CompCode] || `Unknown College (${holiday.CompCode})`;
                const ctgIdName = categories.find(cat => String(cat.id) === String(holiday.CtgId))?.category || `Unknown Category (${holiday.CtgId})`;
                console.log(`Mapping: CompCode=${holiday.CompCode}, Normalized=${normalizedCompCode}, CtgId=${holiday.CtgId}, CompCodeName=${compCodeName}, CtgIdName=${ctgIdName}`);
                return {
                    ...holiday,
                    CompCodeName: compCodeName,
                    CtgIdName: ctgIdName
                };
            });
            console.log('Mapped holidays:', mappedHolidays);
            setFilteredHolidays(mappedHolidays);
        }
    }, [allDataReady, isDataLoaded, collegeMap, categories, holidays]);

    const handleSubmitHoliday = async () => {
        if (selectedCollege && selectedCategory && holidayName && fromDate && toDate) {
            if (new Date(toDate) <= new Date(fromDate)) {
                toast.error('To Date must be after From Date', { position: 'top-center', autoClose: 3000 });
                return;
            }
            const newHoliday = {
                iD: 0,
                compCode: selectedCollege.value,
                ctgId: selectedCategory.value,
                hdName: holidayName,
                fromDate: fromDate,
                uptoDate: toDate
            };
            try {
                const response = await fetch('/HRMS/HolidayMaster/SaveHolidayMaster', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newHoliday)
                });
                if (!response.ok) throw new Error('Failed to save holiday');
                let result = await response.json();
                if (typeof result === 'string') result = JSON.parse(result);
                if (result.statusCode === 1) {
                    toast.success('Holiday added successfully!', { position: 'top-center', autoClose: 3000 });
                    await fetchHolidays(); // Refresh holiday list
                    setSelectedCollege(null);
                    setSelectedCategory(null);
                    setHolidayName('');
                    setFromDate('');
                    setToDate('');
                    setEditingHoliday(null);
                } else {
                    throw new Error(result.message || 'Holiday not saved');
                }
            } catch (error) {
                toast.error(`Submission failed: ${error.message}`, { position: 'top-center', autoClose: 3000 });
            }
        } else {
            toast.error('Please fill all fields', { position: 'top-center', autoClose: 3000 });
        }
    };

    const handleUpdateHoliday = async () => {
        if (editingHoliday && selectedCollege && selectedCategory && holidayName && fromDate && toDate) {
            if (new Date(toDate) <= new Date(fromDate)) {
                toast.error('To Date must be after From Date', { position: 'top-center', autoClose: 3000 });
                return;
            }
            const updatedHoliday = {
                ID: editingHoliday.ID,
                CompCode: selectedCollege.value,
                CtgId: selectedCategory.value,
                HdName: holidayName,
                FromDate: fromDate,
                UptoDate: toDate
            };
            try {
                const response = await fetch('/HRMS/HolidayMaster/UpdateHolidayMaster', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedHoliday)
                });
                if (!response.ok) throw new Error('Failed to update holiday');
                let result = await response.json();
                if (typeof result === 'string') result = JSON.parse(result);
                if (result.statusCode === 1) {
                    toast.success('Holiday updated successfully!', { position: 'top-center', autoClose: 3000 });
                    await fetchHolidays(); // Refresh holiday list
                    setEditingHoliday(null);
                    setSelectedCollege(null);
                    setSelectedCategory(null);
                    setHolidayName('');
                    setFromDate('');
                    setToDate('');
                } else {
                    throw new Error(result.message || 'Holiday not updated');
                }
            } catch (error) {
                toast.error(`Update failed: ${error.message}`, { position: 'top-center', autoClose: 3000 });
            }
        } else {
            toast.error('Please fill all fields', { position: 'top-center', autoClose: 3000 });
        }
    };

    const handleEditClick = (holiday) => {
        console.log('Editing holiday:', holiday);
        setEditingHoliday(holiday);
        // Set college with matching value and label from collegeOptions
        const collegeOption = collegeOptions.find(option => option.value === holiday.CompCode);
        setSelectedCollege(collegeOption || { value: holiday.CompCode, label: collegeMap[holiday.CompCode] || `Unknown College (${holiday.CompCode})` });
        // Set category with matching value and label from categories
        const categoryOption = categories.find(cat => String(cat.id) === String(holiday.CtgId));
        setSelectedCategory(categoryOption ? { value: categoryOption.id, label: categoryOption.category } : null);
        setHolidayName(holiday.HdName);
        setFromDate(holiday.FromDate);
        setToDate(holiday.UptoDate);
    };

    const handleDeleteClick = (id) => {
        setHolidayToDelete(id); // id should be hid
        setShowConfirmDialog(true);
    };

    const confirmDelete = async () => {
        if (!holidayToDelete) return;
        try {
            const response = await fetch(`/HRMS/HolidayMaster/deleteHolidayMaster?hid=${holidayToDelete}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!response.ok) throw new Error('Failed to delete holiday');
            let result = await response.json();
            if (typeof result === 'string') result = JSON.parse(result);
            if (result.statusCode === 1) {
                toast.success('Holiday deleted successfully!', { position: 'top-center', autoClose: 3000, toastId: 'delete-success' });
                await fetchHolidays(); // Refresh holiday list
                const updatedHolidays = holidays.filter(h => h.ID !== holidayToDelete);
                setHolidays(updatedHolidays);
                setFilteredHolidays(updatedHolidays);
            } else {
                throw new Error(result.message || 'Unknown error');
            }
        } catch (error) {
            toast.error(`Deletion failed: ${error.message}`, { position: 'top-center', autoClose: 3000, toastId: 'delete-error' });
        } finally {
            setShowConfirmDialog(false);
            setHolidayToDelete(null);
        }
    };

    const cancelDelete = () => {
        setShowConfirmDialog(false);
        setHolidayToDelete(null);
    };

    const exportToCSV = () => {
        const exportData = filteredHolidays.map(item => ({
            ID: item.ID,
            'College Name': item.CompCodeName || `Unknown College (${item.CompCode})`,
            'Category Name': item.CtgIdName || `Unknown Category (${item.CtgId})`,
            'Holiday Name': item.HdName,
            'From Date': item.FromDate,
            'To Date': item.UptoDate
        }));
        const csv = Papa.unparse(exportData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', 'holidays.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportToPDF = () => {
        try {
            const doc = new jsPDF();
            doc.autoTable({
                startY: 20,
                head: [['ID', 'College Name', 'Category Name', 'Holiday Name', 'From Date', 'To Date']],
                body: filteredHolidays.map(item => [
                    item.ID,
                    item.CompCodeName || `Unknown College (${item.CompCode})`,
                    item.CtgIdName || `Unknown Category (${item.CtgId})`,
                    item.HdName,
                    item.FromDate,
                    item.UptoDate
                ]),
                theme: 'striped',
                styles: { fontSize: 10, cellPadding: 5 },
                headStyles: { fillColor: [209, 213, 219], textColor: [255, 255, 255] },
                didDrawPage: () => {
                    doc.setFontSize(12);
                    doc.text('Holiday Master Details', 14, 10);
                },
            });
            doc.save('holidays.pdf');
        } catch (error) {
            toast.error(`Failed to export PDF: ${error.message}`, { position: 'top-center', autoClose: 3000 });
        }
    };

    const columns = [
        { name: 'College Name', selector: row => row.CompCodeName || `Unknown College (${row.CompCode})`, sortable: true },
        { name: 'Category Name', selector: row => row.CtgIdName || `Unknown Category (${row.CtgId})`, sortable: true },
        { name: 'Holiday Name', selector: row => row.HdName, sortable: true },
        { name: 'From Date', selector: row => row.FromDate, sortable: true },
        { name: 'To Date', selector: row => row.UptoDate, sortable: true },
        {
            name: 'Actions',
            cell: row => (
                <div className="flex space-x-2">
                    <button onClick={() => handleEditClick(row)} className="text-blue-500 hover:text-blue-700" title="Edit">
                        <FaEdit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteClick(row.ID)} className="text-red-500 hover:text-red-700" title="Delete">
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
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left Side - Input Fields */}
                <div className="bg-white rounded-lg shadow-md p-4">
                    <h2 className="text-2xl font-bold text-white bg-blue-600 p-4 rounded-t-lg text-center">
                        Holiday Master
                    </h2>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">College</label>
                                <Select
                                    options={collegeOptions}
                                    value={selectedCollege}
                                    onChange={setSelectedCollege}
                                    placeholder="Select College"
                                    className="mt-1"
                                    styles={{
                                        control: (base) => ({
                                            ...base,
                                            borderRadius: '0.375rem',
                                            borderColor: '#d1d5db',
                                            boxShadow: '0 0 #0000, 0 0 #0000',
                                            '&:hover': { borderColor: '#93c5fd' },
                                        }),
                                        menu: (base) => ({ ...base, zIndex: 9999 }),
                                    }}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Category</label>
                                <Select
                                    options={categories.map(cat => ({ value: cat.id, label: cat.category }))}
                                    value={selectedCategory}
                                    onChange={setSelectedCategory}
                                    placeholder="Select Category"
                                    className="mt-1"
                                    styles={{
                                        control: (base) => ({
                                            ...base,
                                            borderRadius: '0.375rem',
                                            borderColor: '#d1d5db',
                                            boxShadow: '0 0 #0000, 0 0 #0000',
                                            '&:hover': { borderColor: '#93c5fd' },
                                        }),
                                        menu: (base) => ({ ...base, zIndex: 9999 }),
                                    }}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Holiday Name</label>
                                <input
                                    type="text"
                                    value={holidayName}
                                    onChange={(e) => setHolidayName(e.target.value)}
                                    placeholder="Enter Holiday Name"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">From Date</label>
                                <input
                                    type="date"
                                    value={fromDate}
                                    onChange={(e) => {
                                        const newFromDate = e.target.value;
                                        setFromDate(newFromDate);
                                        if (new Date(toDate) <= new Date(newFromDate)) setToDate('');
                                    }}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">To Date</label>
                                <input
                                    type="date"
                                    value={toDate}
                                    onChange={(e) => {
                                        const newToDate = e.target.value;
                                        if (new Date(newToDate) > new Date(fromDate)) setToDate(newToDate);
                                        else toast.error('To Date must be after From Date', { position: 'top-center', autoClose: 3000 });
                                    }}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                        <div className="flex space-x-2">
                            {!editingHoliday && (
                                <button
                                    onClick={handleSubmitHoliday}
                                    className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition-colors"
                                >
                                    Submit
                                </button>
                            )}
                            {editingHoliday && (
                                <button
                                    onClick={handleUpdateHoliday}
                                    className="w-full bg-green-600 text-white p-2 rounded-md hover:bg-green-700 transition-colors"
                                >
                                    <FaSave className="inline mr-1" /> Update
                                </button>
                            )}
                        </div>
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
                            placeholder="Search holidays..."
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
                            data={filteredHolidays.filter(item => {
                                const compCodeName = item.CompCodeName || '';
                                const ctgIdName = item.CtgIdName || '';
                                return (
                                    compCodeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    ctgIdName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    (item.HdName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    (item.FromDate || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    (item.UptoDate || '').toLowerCase().includes(searchQuery.toLowerCase())
                                );
                            })}
                            pagination
                            paginationPerPage={5}
                            paginationRowsPerPageOptions={[5, 10, 20]}
                            responsive
                            highlightOnHover
                            customStyles={customStyles}
                            noDataComponent={
                                <p className="text-gray-600 text-sm text-center py-4">
                                    No holidays match your search or data is loading.
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
                            <p className="text-sm text-gray-600 mb-4">Are you sure you want to delete this holiday? This action cannot be undone.</p>
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

export default HolidayMaster;