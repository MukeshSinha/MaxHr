import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import DataTable from 'react-data-table-component';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaFileCsv, FaFilePdf, FaPencilAlt, FaTrash, FaExclamationTriangle } from 'react-icons/fa';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const DeductionMaster = () => {
    const [deductionHead, setDeductionHead] = useState('');
    const [payType, setPayType] = useState('');
    const [deductions, setDeductions] = useState([]);
    const [filteredDeductions, setFilteredDeductions] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editDeductionId, setEditDeductionId] = useState(null);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [deductionToDelete, setDeductionToDelete] = useState(null);
    const [showExportMenu, setShowExportMenu] = useState(false);

    // Map payType to readable labels
    const payTypeMap = {
        '1': 'Fixed',
        '2': 'As Per Day'
    };

    const fetchDeductions = async () => {
        try {
            const response = await fetch('/HRMS/DeductionMaster/DeductionMasterList');
            if (!response.ok) throw new Error('Failed to fetch deductions');
            let result = await response.json();
            if (typeof result === "string") result = JSON.parse(result);
            const data = result.dataFetch.table.map(item => ({
                ...item,
                dedType: payTypeMap[item.dedType.toString()] || item.dedType,
                deductionName: item.deductionName
            }));
            setDeductions(data);
            setFilteredDeductions(data);
        } catch (error) {
            toast.error(`Error fetching deductions: ${error.message}`);
            setDeductions([]);
            setFilteredDeductions([]);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            await fetchDeductions();
        };
        loadData();
    }, []);

    useEffect(() => {
        const filtered = deductions.filter(item =>
            item.deductionName.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredDeductions(filtered);
    }, [searchQuery, deductions]);

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
    };

    const validateDeduction = () => {
        if (!deductionHead.trim()) {
            toast.error('Please enter a deduction head');
            return false;
        }
        if (!payType) {
            toast.error('Please select a pay type');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateDeduction()) return;

        const deductionData = {
            dID: 0,
            dedName: deductionHead,
            dedType: Object.keys(payTypeMap).find(key => payTypeMap[key] === payType) || payType
        };

        try {
            if (isEditing) {
                const response = await fetch('/HRMS/DeductionMaster/UpdateDeductionMaster', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        deductionId: parseInt(editDeductionId),
                        deductionHead: deductionHead,
                        payType: Object.keys(payTypeMap).find(key => payTypeMap[key] === payType) || payType
                    })
                });
                let result = await response.json();
                if (!response.ok) throw new Error('Failed to update deduction');
                if (typeof result === "string") result = JSON.parse(result);
                if (result.statusCode === 1) toast.success('Deduction updated successfully!');
                else throw new Error(result.message || 'Deduction not updated');
            } else {
                const response = await fetch('/HRMS/DeductionMaster/SaveDeductionMaster', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(deductionData)
                });
                let result = await response.json();
                if (!response.ok) throw new Error('Failed to save deduction');
                if (typeof result === "string") result = JSON.parse(result);
                if (result.statusCode === 1) toast.success('Deduction saved successfully!');
                else throw new Error(result.message || 'Deduction not saved');
            }
            clearForm();
            await fetchDeductions();
        } catch (error) {
            toast.error(`Error: ${error.message}`);
        }
    };

    const clearForm = () => {
        setDeductionHead('');
        setPayType('');
        setIsEditing(false);
        setEditDeductionId(null);
    };

    const handleEdit = (row) => {
        setIsEditing(true);
        setEditDeductionId(row.deductionId);
        setDeductionHead(row.deductionHead);
        setPayType(row.payType); // Set payType to the mapped label (e.g., 'Fixed' or 'As Per Day')
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteClick = (deductionId) => {
        setDeductionToDelete(deductionId);
        setShowConfirmDialog(true);
    };

    const confirmDelete = async () => {
        if (!deductionToDelete) return;
        try {
            const response = await fetch(`/HRMS/Deduction/deleteDeduction?deductionId=${deductionToDelete}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!response.ok) throw new Error('Failed to delete deduction');
            let result = await response.json();
            if (typeof result === 'string') result = JSON.parse(result);
            if (result.statusCode === 1) {
                toast.success('Deduction deleted successfully!', {
                    position: 'top-center',
                    autoClose: 3000,
                    toastId: 'delete-success',
                });
                await fetchDeductions();
            } else {
                throw new Error(result.message || 'Unknown error');
            }
        } catch (error) {
            toast.error(`Deletion failed: ${error.message}`, {
                position: 'top-center',
                autoClose: 3000,
                toastId: 'delete-error',
            });
        } finally {
            setShowConfirmDialog(false);
            setDeductionToDelete(null);
        }
    };

    const cancelDelete = () => {
        setShowConfirmDialog(false);
        setDeductionToDelete(null);
    };

    const exportToCSV = () => {
        const exportData = deductions.map(item => ({
            ID: item.deductionId,
            'Deduction Head': item.deductionHead,
            'Pay Type': item.payType,
        }));
        const csv = Papa.unparse(exportData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', 'deductions.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportToPDF = () => {
        try {
            const doc = new jsPDF();
            doc.autoTable({
                startY: 20,
                head: [['ID', 'Deduction Head', 'Pay Type']],
                body: deductions.map(item => [
                    item.deductionId,
                    item.deductionHead,
                    item.payType,
                ]),
                theme: 'striped',
                styles: { fontSize: 10, cellPadding: 5 },
                headStyles: { fillColor: [209, 213, 219], textColor: [255, 255, 255] },
                didDrawPage: () => {
                    doc.setFontSize(12);
                    doc.text('Deduction Management Details', 14, 10);
                },
            });
            doc.save('deductions.pdf');
        } catch (error) {
            toast.error(`Failed to export PDF: ${error.message}`, {
                position: 'top-center',
                autoClose: 3000,
            });
        }
    };

    const columns = [
        { name: 'Deduction Head', selector: row => row.deductionName, sortable: true },
        { name: 'Deduction Type', selector: row => row.dedType, sortable: true },
        {
            name: 'Actions',
            cell: row => (
                <div className="flex gap-2">
                    <button
                        onClick={() => handleEdit(row)}
                        className="text-green-500 hover:text-green-700"
                        title="Edit"
                    >
                        <FaPencilAlt className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => handleDeleteClick(row.deductionId)}
                        className="text-red-500 hover:text-red-700"
                        title="Delete"
                    >
                        <FaTrash className="w-4 h-4" />
                    </button>
                </div>
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
    };

    return (
        <div className="container mx-auto p-4 max-w-5xl">
            <ToastContainer position="top-right" autoClose={3000} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Form Section */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-2xl font-bold text-white bg-blue-600 p-4 rounded-t-lg text-center">
                        Deduction Master
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Deduction Head</label>
                            <input
                                type="text"
                                value={deductionHead}
                                onChange={(e) => setDeductionHead(e.target.value)}
                                placeholder="Enter deduction head"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Pay Type</label>
                            <div className="mt-1 flex gap-4">
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        value="1"
                                        checked={payType === '1'}
                                        onChange={(e) => setPayType(e.target.value)}
                                        className="mr-2"
                                    />
                                    Fixed
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        value="2"
                                        checked={payType === '2'}
                                        onChange={(e) => setPayType(e.target.value)}
                                        className="mr-2"
                                    />
                                    As Per Day
                                </label>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="submit"
                                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                            >
                                {isEditing ? 'Update Deduction' : 'Save Deduction'}
                            </button>
                            {isEditing && (
                                <button
                                    type="button"
                                    onClick={clearForm}
                                    className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* Table Section */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    {filteredDeductions.length > 0 && (
                        <div className="mt-6">
                            <h3 className="text-base sm:text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent drop-shadow-md mb-4">
                                Deduction List
                            </h3>
                            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
                                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={handleSearch}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') e.preventDefault();
                                        }}
                                        placeholder="Search deductions..."
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
                            </div>
                            <div className="overflow-x-auto">
                                <DataTable
                                    columns={columns}
                                    data={filteredDeductions}
                                    pagination
                                    paginationPerPage={5}
                                    paginationRowsPerPageOptions={[5, 10, 20]}
                                    responsive
                                    highlightOnHover
                                    customStyles={customStyles}
                                    noDataComponent={
                                        <p className="text-gray-600 text-sm text-center py-4">
                                            No deductions match your search.
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
                    <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full sm:max-w-md transform transition-all duration-300 ease-in-out hover:shadow-3xl">
                        <div className="text-center">
                            <FaExclamationTriangle className="text-yellow-500 w-12 h-12 mx-auto mb-4 animate-pulse" />
                            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Confirm Deletion</h3>
                            <p className="text-sm sm:text-base text-gray-600 mb-6">
                                Are you sure you want to delete this deduction? This action cannot be undone.
                            </p>
                        </div>
                        <div className="flex justify-center space-x-4">
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors duration-200 transform hover:scale-105"
                            >
                                Confirm
                            </button>
                            <button
                                onClick={cancelDelete}
                                className="px-4 py-2 bg-gray-300 text-gray-800 text-sm rounded-lg hover:bg-gray-400 transition-colors duration-200 transform hover:scale-105"
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

export default DeductionMaster;