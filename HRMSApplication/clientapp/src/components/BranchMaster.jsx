import { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaFileCsv, FaFilePdf, FaPencilAlt, FaTrash, FaExclamationTriangle } from 'react-icons/fa';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Papa from 'papaparse';
import DataTable from 'react-data-table-component';
import Select from 'react-select';

function BranchMaster() {
    const [formData, setFormData] = useState({
        companyName: null,
        branchName: '',
        address: '',
        pfNo: '',
        logo: null,
        logoPreview: null,
    });
    const [errors, setErrors] = useState({});
    const [branchList, setBranchList] = useState([]);
    const [filteredBranchList, setFilteredBranchList] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [isUpdateMode, setIsUpdateMode] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [branchToDelete, setBranchToDelete] = useState(null);
    const [companyList, setCompanyList] = useState([]);

    // Fetch company list
    const fetchCompanyList = async () => {
        try {
            const response = await fetch('/CompanyMaster/GetCompanyList', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            let result = await response.json();
            if (typeof result === 'string') result = JSON.parse(result);
            if (result?.dataFetch?.table) {
                const options = result.dataFetch.table.map(item => ({
                    value: item.id.toString(),
                    label: item.companyName || 'N/A',
                }));
                setCompanyList(options);
            } else {
                throw new Error('Invalid company list response format');
            }
        } catch (error) {
            toast.error(`Failed to fetch company list: ${error.message}`, {
                position: 'top-right',
                autoClose: 3000,
                toastId: 'fetch-company-error',
            });
        }
    };

    // Fetch branch list
    const fetchBranchList = async () => {
        try {
            const response = await fetch('/BranchMaster/GetBranchList', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            let result = await response.json();
            if (typeof result === 'string') result = JSON.parse(result);
            if (result?.dataFetch?.table) {
                const formattedBranches = result.dataFetch.table.map((item, index) => ({
                    id: index + 1,
                    companyName: item.companyName || 'N/A',
                    branchName: item.branchName || 'N/A',
                    address: item.address || 'N/A',
                    pfNo: item.pfNo || 'N/A',
                    logo: item.logo || 'N/A',
                }));
                setBranchList(formattedBranches);
                setFilteredBranchList(formattedBranches);
            } else {
                throw new Error('Invalid API response format');
            }
        } catch (error) {
            toast.error(`Failed to fetch branch list: ${error.message}`, {
                position: 'top-right',
                autoClose: 3000,
                toastId: 'fetch-branch-error',
            });
            setBranchList([]);
            setFilteredBranchList([]);
        }
    };

    useEffect(() => {
        fetchCompanyList();
        fetchBranchList();
    }, []);

    // Handle input change
    const handleInputChange = (field, value) => {
        let newFormData = { ...formData, [field]: value };
        if (field === 'logo' && value) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...newFormData, logoPreview: reader.result });
            };
            reader.readAsDataURL(value);
        } else {
            setFormData(newFormData);
        }
        if (errors[field]) setErrors({ ...errors, [field]: false });
    };

    // Validate form
    const validateForm = () => {
        const newErrors = {};
        if (!formData.companyName) newErrors.companyName = true;
        if (!formData.branchName) newErrors.branchName = true;
        if (!formData.address) newErrors.address = true;
        if (!formData.pfNo) newErrors.pfNo = true;
        if (!formData.logo && !isUpdateMode) newErrors.logo = true;
        if (Object.keys(newErrors).length > 0) {
            toast.error('Please fill all required fields!', {
                position: 'top-right',
                autoClose: 3000,
                toastId: 'validation-error',
            });
            setErrors(newErrors);
            return false;
        }
        return true;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (validateForm()) {
            try {
                const url = isUpdateMode
                    ? '/BranchMaster/UpdateBranch'
                    : '/BranchMaster/SaveBranch';
                const payload = {
                    ...formData,
                    companyName: formData.companyName?.value || '',
                    branchName: formData.branchName,
                    address: formData.address,
                    pfNo: formData.pfNo,
                    logo: formData.logo ? await convertFileToBase64(formData.logo) : formData.logo,
                };
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
                    throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
                }
                let result = await response.json();
                if (typeof result === 'string') result = JSON.parse(result);
                if (result.statusCode === 1) {
                    toast.success(
                        isUpdateMode ? 'Branch updated successfully!' : 'Branch submitted successfully!',
                        {
                            position: 'top-right',
                            autoClose: 3000,
                            toastId: 'submit-success',
                        }
                    );
                    setFormData({
                        companyName: null,
                        branchName: '',
                        address: '',
                        pfNo: '',
                        logo: null,
                        logoPreview: null,
                    });
                    setErrors({});
                    setIsUpdateMode(false);
                    fetchBranchList();
                } else {
                    toast.error(`Failed to ${isUpdateMode ? 'update' : 'submit'} branch: ${result.message || 'Unknown error'}`, {
                        position: 'top-right',
                        autoClose: 3000,
                        toastId: 'submit-error',
                    });
                }
            } catch (error) {
                toast.error(`Failed to ${isUpdateMode ? 'update' : 'submit'} branch: ${error.message}`, {
                    position: 'top-right',
                    autoClose: 3000,
                    toastId: 'submit-error',
                });
            }
        }
    };

    // Convert file to base64
    const convertFileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    // Handle edit
    const handleEdit = (row) => {
        setFormData({
            companyName: companyList.find(c => c.value === row.companyName) || null,
            branchName: row.branchName,
            address: row.address,
            pfNo: row.pfNo,
            logo: null,
            logoPreview: row.logo !== 'N/A' ? row.logo : null,
        });
        setIsUpdateMode(true);
    };

    // Handle delete
    const handleDeleteClick = (id) => {
        setBranchToDelete(id);
        setShowConfirmDialog(true);
    };

    const confirmDelete = async () => {
        if (!branchToDelete) return;
        try {
            const response = await fetch(`/BranchMaster/DeleteBranch?id=${branchToDelete}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
            }
            let result = await response.json();
            if (typeof result === 'string') result = JSON.parse(result);
            if (result.statusCode === 1) {
                toast.success('Branch deleted successfully!', {
                    position: 'top-center',
                    autoClose: 3000,
                    toastId: 'delete-success',
                });
                fetchBranchList();
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
            setBranchToDelete(null);
        }
    };

    const cancelDelete = () => {
        setShowConfirmDialog(false);
        setBranchToDelete(null);
    };

    // Handle search
    const handleSearch = (e) => {
        const query = e.target.value.toLowerCase();
        setSearchQuery(query);
        if (!query) {
            setFilteredBranchList([...branchList]);
            return;
        }
        const filtered = branchList.filter((item) =>
            item.companyName.toLowerCase().includes(query) ||
            item.branchName.toLowerCase().includes(query) ||
            item.address.toLowerCase().includes(query)
        );
        setFilteredBranchList(filtered);
    };

    // Export fields
    const getExportFields = (data) => {
        if (data.length === 0) return [];
        return [
            { key: 'id', label: 'ID' },
            { key: 'companyName', label: 'Company Name' },
            { key: 'branchName', label: 'Branch Name' },
            { key: 'address', label: 'Address' },
            { key: 'pfNo', label: 'PF No' },
            { key: 'logo', label: 'Logo' },
        ];
    };

    // Export to CSV
    const exportToCSV = () => {
        const exportData = filteredBranchList.map((item) => ({
            id: item.id,
            companyName: item.companyName,
            branchName: item.branchName,
            address: item.address,
            pfNo: item.pfNo,
            logo: item.logo,
        }));
        const csv = Papa.unparse(exportData, { columns: getExportFields(exportData).map((field) => field.key) });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', 'branchList.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setShowExportMenu(false);
    };

    // Export to PDF
    const exportToPDF = () => {
        try {
            const doc = new jsPDF();
            doc.autoTable({
                startY: 20,
                head: [getExportFields(filteredBranchList).map((field) => field.label)],
                body: filteredBranchList.map((item) => [
                    item.id, item.companyName, item.branchName, item.address, item.pfNo, item.logo,
                ]),
                theme: 'striped',
                styles: { fontSize: 10, cellPadding: 5 },
                headStyles: { fillColor: [209, 213, 219], textColor: [255, 255, 255] },
                columnStyles: getExportFields(filteredBranchList).reduce(
                    (acc, _, index) => ({
                        ...acc,
                        [index]: { cellWidth: 'auto' },
                    }),
                    {}
                ),
                didDrawPage: () => {
                    doc.setFontSize(12);
                    doc.text('Branch List', 14, 10);
                },
            });
            doc.save('branchList.pdf');
            setShowExportMenu(false);
        } catch (error) {
            toast.error(`Failed to export PDF: ${error.message}`, {
                position: 'top-center',
                autoClose: 3000,
                toastId: 'export-pdf-error',
            });
        }
    };

    // DataTable columns
    const columns = [
        { name: 'ID', selector: (row) => row.id, sortable: true, minWidth: '80px', maxWidth: '120px', wrap: true },
        { name: 'Company Name', selector: (row) => row.companyName, sortable: true, minWidth: '150px', maxWidth: '200px', wrap: true },
        { name: 'Branch Name', selector: (row) => row.branchName, sortable: true, minWidth: '150px', maxWidth: '200px', wrap: true },
        { name: 'Address', selector: (row) => row.address, sortable: true, minWidth: '150px', maxWidth: '200px', wrap: true },
        { name: 'PF No', selector: (row) => row.pfNo, sortable: true, minWidth: '120px', maxWidth: '150px', wrap: true },
        { name: 'Logo', selector: (row) => row.logo, sortable: true, minWidth: '120px', maxWidth: '150px', wrap: true },
        {
            name: 'Actions',
            cell: (row) => (
                <div className="flex space-x-2">
                    <button
                        type="button"
                        onClick={() => handleEdit(row)}
                        className="text-blue-600 hover:text-blue-800 transition-colors transform hover:scale-110"
                        title="Edit"
                    >
                        <FaPencilAlt className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => handleDeleteClick(row.id)}
                        className="text-red-600 hover:text-red-800 transition-colors transform hover:scale-110"
                        title="Delete"
                    >
                        <FaTrash className="w-4 h-4" />
                    </button>
                </div>
            ),
            ignoreRowClick: true,
            allowOverflow: true,
            button: true,
            minWidth: '80px',
            maxWidth: '100px',
        },
    ];

    // DataTable custom styles
    const customStyles = {
        table: { style: { width: '100%', tableLayout: 'auto' } },
        tableWrapper: { style: { width: '100%', overflowX: 'auto', maxHeight: '60vh', border: '1px solid #e5e7eb', borderRadius: '8px' } },
        headRow: { style: { backgroundColor: '#e5e7eb', color: '#1f2937', position: 'sticky', top: 0, zIndex: 1, minWidth: '100%' } },
        headCells: { style: { fontWeight: '600', fontSize: '12px', padding: '8px', whiteSpace: 'normal', wordBreak: 'break-word' } },
        cells: { style: { fontSize: '12px', padding: '8px', whiteSpace: 'normal', wordBreak: 'break-word', borderBottom: '1px solid #e5e7eb' } },
        rows: {
            style: {
                '&:nth-child(even)': { backgroundColor: '#dbeafe' },
                '&:nth-child(odd)': { backgroundColor: '#ffffff' },
                '&:hover': { backgroundColor: '#bfdbfe', transition: 'background-color 0.2s' },
            },
        },
        pagination: { style: { borderTop: '1px solid #e5e7eb', padding: '8px', fontSize: '12px', flexWrap: 'wrap' } },
    };

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-md flex flex-col md:flex-row gap-6">
                {/* Left Panel */}
                <div className="w-full md:w-1/2 p-6">
                    <h2 className="text-xl font-bold mb-4 text-center text-gray-800">Branch Master</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <div className="w-full">
                                <label className="flex items-center justify-between text-gray-700 font-medium mb-1 text-sm">
                                    Company Name
                                    <span className="ml-2">🏢</span>
                                </label>
                                <Select
                                    options={companyList}
                                    value={formData.companyName}
                                    onChange={(value) => handleInputChange('companyName', value)}
                                    className={`w-full text-sm ${errors.companyName ? 'border-2 border-red-500' : ''}`}
                                    placeholder="Select Company Name..."
                                />
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <div className="w-full">
                                <label className="flex items-center justify-between text-gray-700 font-medium mb-1 text-sm">
                                    Branch Name
                                    <span className="ml-2">🏠</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.branchName}
                                    onChange={(e) => handleInputChange('branchName', e.target.value)}
                                    className={`w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${errors.branchName ? 'border-2 border-red-500' : 'border-gray-300'}`}
                                    placeholder="Enter Branch Name..."
                                />
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <div className="w-full">
                                <label className="flex items-center justify-between text-gray-700 font-medium mb-1 text-sm">
                                    Address
                                    <span className="ml-2">📍</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.address}
                                    onChange={(e) => handleInputChange('address', e.target.value)}
                                    className={`w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${errors.address ? 'border-2 border-red-500' : 'border-gray-300'}`}
                                    placeholder="Enter Address..."
                                />
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <div className="w-full">
                                <label className="flex items-center justify-between text-gray-700 font-medium mb-1 text-sm">
                                    PF No
                                    <span className="ml-2">🔢</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.pfNo}
                                    onChange={(e) => handleInputChange('pfNo', e.target.value)}
                                    className={`w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${errors.pfNo ? 'border-2 border-red-500' : 'border-gray-300'}`}
                                    placeholder="Enter PF No..."
                                />
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <div className="w-full">
                                <label className="flex items-center justify-between text-gray-700 font-medium mb-1 text-sm">
                                    Logo
                                    <span className="ml-2">📷</span>
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleInputChange('logo', e.target.files[0])}
                                    className={`w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${errors.logo ? 'border-2 border-red-500' : 'border-gray-300'}`}
                                />
                            </div>
                        </div>
                        {formData.logoPreview && (
                            <div className="mt-2">
                                <label className="text-gray-700 font-medium text-sm">Logo Preview</label>
                                <img src={formData.logoPreview} alt="Logo Preview" className="mt-2 w-32 h-32 object-cover rounded" />
                            </div>
                        )}
                        <div className="flex justify-center">
                            <button
                                type="submit"
                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors w-full sm:w-auto text-sm"
                            >
                                {isUpdateMode ? 'Update' : 'Submit'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Right Panel */}
                <div className="w-full md:w-1/2 p-6">
                    {filteredBranchList.length > 0 && (
                        <div className="mt-6">
                            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
                                <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Branch List</h3>
                                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={handleSearch}
                                        onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                                        placeholder="Search branches..."
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
                                    data={filteredBranchList}
                                    customStyles={customStyles}
                                    pagination
                                    paginationPerPage={5}
                                    paginationRowsPerPageOptions={[5, 10, 20]}
                                    highlightOnHover
                                    pointerOnHover
                                    responsive
                                    noDataComponent={
                                        <p className="text-gray-600 text-sm text-center py-4">
                                            No branches match your search.
                                        </p>
                                    }
                                />
                            </div>
                        </div>
                    )}

                    {showConfirmDialog && (
                        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
                            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full sm:max-w-md">
                                <div className="text-center">
                                    <FaExclamationTriangle className="text-yellow-500 w-12 h-12 mx-auto mb-4 animate-pulse" />
                                    <h3 className="text-xl font-bold text-gray-800 mb-2">Confirm Deletion</h3>
                                    <p className="text-sm text-gray-600 mb-6">
                                        Are you sure you want to delete this branch? This action cannot be undone.
                                    </p>
                                </div>
                                <div className="flex justify-center space-x-4">
                                    <button
                                        onClick={confirmDelete}
                                        className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                                    >
                                        Confirm
                                    </button>
                                    <button
                                        onClick={cancelDelete}
                                        className="px-4 py-2 bg-gray-300 text-gray-800 text-sm rounded-lg hover:bg-gray-400 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <ToastContainer />
                </div>
            </div>
        </div>
    );
}

export default BranchMaster;