import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import DataTable from 'react-data-table-component';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaFileCsv, FaFilePdf, FaPencilAlt, FaTrash, FaExclamationTriangle } from 'react-icons/fa';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const AllowanceMaster = () => {
    const [allowanceHead, setAllowanceHead] = useState('');
    const [payType, setPayType] = useState('');
    const [taxablePercent, setTaxablePercent] = useState('');
    const [formulaId, setFormulaId] = useState({ value: '0', label: 'None' });
    const [allowances, setAllowances] = useState([]);
    const [filteredAllowances, setFilteredAllowances] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editAllowanceId, setEditAllowanceId] = useState(null);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [allowanceToDelete, setAllowanceToDelete] = useState(null);
    const [showExportMenu, setShowExportMenu] = useState(false);

    // Map allowType to readable labels
    const payTypeMap = {
        '1': 'Fixed',
        '2': 'As Per Day',
        '3': 'Variable Pay'
    };

    const fetchAllowances = async () => {
        try {
            const response = await fetch('/HRMS/AllowanceMaster/AllowanceMasterList');
            if (!response.ok) throw new Error('Failed to fetch allowances');
            let result = await response.json();
            if (typeof result === "string") result = JSON.parse(result);
            const data = result.dataFetch.table.map(item => ({
                ...item,
                allowType: payTypeMap[item.allowType.toString()] || item.allowType,
                allowanceName: item.allowanceName
            }));
            setAllowances(data);
            setFilteredAllowances(data);
        } catch (error) {
            toast.error(`Error fetching allowances: ${error.message}`);
            setAllowances([]);
            setFilteredAllowances([]);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            await fetchAllowances();
        };
        loadData();
    }, []);

    useEffect(() => {
        const filtered = allowances.filter(item =>
            item.allowanceName.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredAllowances(filtered);
    }, [searchQuery, allowances]);

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
    };

    const validateAllowance = () => {
        if (!allowanceHead.trim()) {
            toast.error('Please enter an allowance head');
            return false;
        }
        const parsedPercent = parseFloat(taxablePercent) || 0;
        if (taxablePercent && (isNaN(parsedPercent) || parsedPercent < 0 || parsedPercent > 100)) {
            toast.error('Taxable percent must be between 0 and 100');
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
        if (!validateAllowance()) return;

        const allowanceData = {
            AID: 0,
            AllowName: allowanceHead,
            AllowType: Object.keys(payTypeMap).find(key => payTypeMap[key] === payType) || payType,
            TaxPercent: parseFloat(taxablePercent) || 0,
            formulaId: formulaId.value === '0' ? null : parseInt(formulaId.value)
        };

        try {
            if (isEditing) {
                const response = await fetch('/HRMS/Allowance/UpdateAllowance', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        allowanceId: parseInt(editAllowanceId),
                        allowanceHead: allowanceHead,
                        payType: Object.keys(payTypeMap).find(key => payTypeMap[key] === payType) || payType,
                        taxablePercent: parseFloat(taxablePercent) || 0,
                        formulaId: formulaId.value === '0' ? null : parseInt(formulaId.value)
                    })
                });
                let result = await response.json();
                if (!response.ok) throw new Error('Failed to update allowance');
                if (typeof result === "string") result = JSON.parse(result);
                if (result.statusCode === 1) toast.success('Allowance updated successfully!');
                else throw new Error(result.message || 'Allowance not updated');
            } else {
                const response = await fetch('/HRMS/AllowanceMaster/SaveAllowanceMaster', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(allowanceData)
                });
                let result = await response.json();
                if (!response.ok) throw new Error('Failed to save allowance');
                if (typeof result === "string") result = JSON.parse(result);
                if (result.statusCode === 1) toast.success('Allowance saved successfully!');
                else throw new Error(result.message || 'Allowance not saved');
            }
            clearForm();
            await fetchAllowances();
        } catch (error) {
            toast.error(`Error: ${error.message}`);
        }
    };

    const clearForm = () => {
        setAllowanceHead('');
        setPayType('');
        setTaxablePercent('');
        setFormulaId({ value: '0', label: 'None' });
        setIsEditing(false);
        setEditAllowanceId(null);
    };

    const handleEdit = (row) => {
        setIsEditing(true);
        setEditAllowanceId(row.aid);
        setAllowanceHead(row.allowanceName);
        setPayType(row.allowType); // Set payType to the mapped label (e.g., 'Fixed')
        setTaxablePercent(row.taxPerCent !== null ? row.taxPerCent.toString() : '');
        setFormulaId(row.formulaID ? { value: row.formulaID.toString(), label: row.formulaID.toString() } : { value: '0', label: 'None' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteClick = (allowanceId) => {
        setAllowanceToDelete(allowanceId);
        setShowConfirmDialog(true);
    };

    const confirmDelete = async () => {
        if (!allowanceToDelete) return;
        try {
            const response = await fetch(`/HRMS/Allowance/deleteAllowance?allowanceId=${allowanceToDelete}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!response.ok) throw new Error('Failed to delete allowance');
            let result = await response.json();
            if (typeof result === 'string') result = JSON.parse(result);
            if (result.statusCode === 1) {
                toast.success('Allowance deleted successfully!', {
                    position: 'top-center',
                    autoClose: 3000,
                    toastId: 'delete-success',
                });
                await fetchAllowances();
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
            setAllowanceToDelete(null);
        }
    };

    const cancelDelete = () => {
        setShowConfirmDialog(false);
        setAllowanceToDelete(null);
    };

    const exportToCSV = () => {
        const exportData = allowances.map(item => ({
            ID: item.aid,
            'Allowance Head': item.allowanceName,
            'Pay Type': item.allowType,
            'Taxable Percent': item.taxPerCent || 0,
            'Formula ID': item.formulaID || 'None',
        }));
        const csv = Papa.unparse(exportData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', 'allowances.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportToPDF = () => {
        try {
            const doc = new jsPDF();
            doc.autoTable({
                startY: 20,
                head: [['ID', 'Allowance Head', 'Pay Type', 'Taxable Percent', 'Formula ID']],
                body: allowances.map(item => [
                    item.aid,
                    item.allowanceName,
                    item.allowType,
                    item.taxPerCent || 0,
                    item.formulaID || 'None',
                ]),
                theme: 'striped',
                styles: { fontSize: 10, cellPadding: 5 },
                headStyles: { fillColor: [209, 213, 219], textColor: [255, 255, 255] },
                didDrawPage: () => {
                    doc.setFontSize(12);
                    doc.text('Allowance Management Details', 14, 10);
                },
            });
            doc.save('allowances.pdf');
        } catch (error) {
            toast.error(`Failed to export PDF: ${error.message}`, {
                position: 'top-center',
                autoClose: 3000,
            });
        }
    };

    const columns = [
        { name: 'Allowance Head', selector: row => row.allowanceName, sortable: true },
        { name: 'Pay Type', selector: row => row.allowType, sortable: true },
        { name: 'Taxable Percent', selector: row => row.taxPerCent || 0, sortable: true },
        { name: 'Formula ID', selector: row => row.formulaID || 'None', sortable: true },
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
                        onClick={() => handleDeleteClick(row.aid)}
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
                        Allowance Master
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Allowance Head</label>
                            <input
                                type="text"
                                value={allowanceHead}
                                onChange={(e) => setAllowanceHead(e.target.value)}
                                placeholder="Enter allowance head"
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
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        value="3"
                                        checked={payType === '3'}
                                        onChange={(e) => setPayType(e.target.value)}
                                        className="mr-2"
                                    />
                                    Variable Pay
                                </label>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-1/2">
                                <label className="block text-sm font-medium text-gray-700">Taxable Percent</label>
                                <input
                                    type="number"
                                    value={taxablePercent}
                                    onChange={(e) => {
                                        let value = e.target.value;
                                        if (value && !isNaN(value)) {
                                            // Remove any characters after 2 decimal places
                                            const parts = value.split('.');
                                            if (parts.length > 1) {
                                                parts[1] = parts[1].slice(0, 2); // Limit to 2 decimal places
                                                value = parts.join('.');
                                            }
                                            setTaxablePercent(value);
                                        } else if (value === '') {
                                            setTaxablePercent('');
                                        }
                                    }}
                                    placeholder="Enter taxable percent (0-100)"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                />
                            </div>
                            <div className="w-1/2">
                                <label className="block text-sm font-medium text-gray-700">Formula ID</label>
                                <Select
                                    options={[{ value: '0', label: 'None' }]}
                                    value={formulaId}
                                    onChange={setFormulaId}
                                    placeholder="Select Formula ID"
                                    className="mt-1"
                                    classNamePrefix="react-select"
                                    isClearable
                                />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="submit"
                                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                            >
                                {isEditing ? 'Update Allowance' : 'Save Allowance'}
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
                    {filteredAllowances.length > 0 && (
                        <div className="mt-6">
                            <h3 className="text-base sm:text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent drop-shadow-md mb-4">
                                Allowance List
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
                                        placeholder="Search allowances..."
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
                                    data={filteredAllowances}
                                    pagination
                                    paginationPerPage={5}
                                    paginationRowsPerPageOptions={[5, 10, 20]}
                                    responsive
                                    highlightOnHover
                                    customStyles={customStyles}
                                    noDataComponent={
                                        <p className="text-gray-600 text-sm text-center py-4">
                                            No allowances match your search.
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
                                Are you sure you want to delete this allowance? This action cannot be undone.
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

export default AllowanceMaster;