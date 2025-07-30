import { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaFileCsv, FaFilePdf, FaPencilAlt, FaTrash, FaExclamationTriangle } from 'react-icons/fa';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Papa from 'papaparse';
import DataTable from 'react-data-table-component';
import Select from 'react-select';

function LocationMaster() {
    const [formData, setFormData] = useState({
        branch: null,
        locationName: '',
        latitude: '',
        longitude: '',
        variation: '',
    });
    const [errors, setErrors] = useState({});
    const [locationList, setLocationList] = useState([]);
    const [filteredLocationList, setFilteredLocationList] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [isUpdateMode, setIsUpdateMode] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [locationToDelete, setLocationToDelete] = useState(null);
    const [branchList, setBranchList] = useState([]);

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
                const options = result.dataFetch.table.map(item => ({
                    value: item.id.toString(),
                    label: item.branchName || 'N/A',
                }));
                setBranchList(options);
            } else {
                throw new Error('Invalid branch list response format');
            }
        } catch (error) {
            toast.error(`Failed to fetch branch list: ${error.message}`, {
                position: 'top-right',
                autoClose: 3000,
                toastId: 'fetch-branch-error',
            });
        }
    };

    // Fetch location list
    const fetchLocationList = async () => {
        try {
            const response = await fetch('/LocationMaster/GetLocationList', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            let result = await response.json();
            if (typeof result === 'string') result = JSON.parse(result);
            if (result?.dataFetch?.table) {
                const formattedLocations = result.dataFetch.table.map((item, index) => ({
                    id: index + 1,
                    branch: item.branch || 'N/A',
                    locationName: item.locationName || 'N/A',
                    latitude: item.latitude || 'N/A',
                    longitude: item.longitude || 'N/A',
                    variation: item.variation || 'N/A',
                }));
                setLocationList(formattedLocations);
                setFilteredLocationList(formattedLocations);
            } else {
                throw new Error('Invalid API response format');
            }
        } catch (error) {
            toast.error(`Failed to fetch location list: ${error.message}`, {
                position: 'top-right',
                autoClose: 3000,
                toastId: 'fetch-location-error',
            });
            setLocationList([]);
            setFilteredLocationList([]);
        }
    };

    useEffect(() => {
        fetchBranchList();
        fetchLocationList();
    }, []);

    // Handle input change
    const handleInputChange = (field, value) => {
        setFormData({ ...formData, [field]: value });
        if (errors[field]) setErrors({ ...errors, [field]: false });
    };

    // Validate form
    const validateForm = () => {
        const newErrors = {};
        if (!formData.branch) newErrors.branch = true;
        if (!formData.locationName) newErrors.locationName = true;
        if (!formData.latitude) newErrors.latitude = true;
        if (!formData.longitude) newErrors.longitude = true;
        if (!formData.variation) newErrors.variation = true;
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
                    ? '/LocationMaster/UpdateLocation'
                    : '/LocationMaster/SaveLocation';
                const payload = {
                    ...formData,
                    branch: formData.branch?.value || '',
                    locationName: formData.locationName,
                    latitude: formData.latitude,
                    longitude: formData.longitude,
                    variation: formData.variation,
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
                        isUpdateMode ? 'Location updated successfully!' : 'Location submitted successfully!',
                        {
                            position: 'top-right',
                            autoClose: 3000,
                            toastId: 'submit-success',
                        }
                    );
                    setFormData({
                        branch: null,
                        locationName: '',
                        latitude: '',
                        longitude: '',
                        variation: '',
                    });
                    setErrors({});
                    setIsUpdateMode(false);
                    fetchLocationList();
                } else {
                    toast.error(`Failed to ${isUpdateMode ? 'update' : 'submit'} location: ${result.message || 'Unknown error'}`, {
                        position: 'top-right',
                        autoClose: 3000,
                        toastId: 'submit-error',
                    });
                }
            } catch (error) {
                toast.error(`Failed to ${isUpdateMode ? 'update' : 'submit'} location: ${error.message}`, {
                    position: 'top-right',
                    autoClose: 3000,
                    toastId: 'submit-error',
                });
            }
        }
    };

    // Handle edit
    const handleEdit = (row) => {
        setFormData({
            branch: branchList.find(b => b.value === row.branch) || null,
            locationName: row.locationName,
            latitude: row.latitude,
            longitude: row.longitude,
            variation: row.variation,
        });
        setIsUpdateMode(true);
    };

    // Handle delete
    const handleDeleteClick = (id) => {
        setLocationToDelete(id);
        setShowConfirmDialog(true);
    };

    const confirmDelete = async () => {
        if (!locationToDelete) return;
        try {
            const response = await fetch(`/LocationMaster/DeleteLocation?id=${locationToDelete}`, {
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
                toast.success('Location deleted successfully!', {
                    position: 'top-center',
                    autoClose: 3000,
                    toastId: 'delete-success',
                });
                fetchLocationList();
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
            setLocationToDelete(null);
        }
    };

    const cancelDelete = () => {
        setShowConfirmDialog(false);
        setLocationToDelete(null);
    };

    // Handle search
    const handleSearch = (e) => {
        const query = e.target.value.toLowerCase();
        setSearchQuery(query);
        if (!query) {
            setFilteredLocationList([...locationList]);
            return;
        }
        const filtered = locationList.filter((item) =>
            item.branch.toLowerCase().includes(query) ||
            item.locationName.toLowerCase().includes(query) ||
            item.latitude.toLowerCase().includes(query) ||
            item.longitude.toLowerCase().includes(query) ||
            item.variation.toLowerCase().includes(query)
        );
        setFilteredLocationList(filtered);
    };

    // Export fields
    const getExportFields = (data) => {
        if (data.length === 0) return [];
        return [
            { key: 'id', label: 'ID' },
            { key: 'branch', label: 'Branch' },
            { key: 'locationName', label: 'Location Name' },
            { key: 'latitude', label: 'Latitude' },
            { key: 'longitude', label: 'Longitude' },
            { key: 'variation', label: 'Variation' },
        ];
    };

    // Export to CSV
    const exportToCSV = () => {
        const exportData = filteredLocationList.map((item) => ({
            id: item.id,
            branch: item.branch,
            locationName: item.locationName,
            latitude: item.latitude,
            longitude: item.longitude,
            variation: item.variation,
        }));
        const csv = Papa.unparse(exportData, { columns: getExportFields(exportData).map((field) => field.key) });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', 'locationList.csv');
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
                head: [getExportFields(filteredLocationList).map((field) => field.label)],
                body: filteredLocationList.map((item) => [
                    item.id, item.branch, item.locationName, item.latitude, item.longitude, item.variation,
                ]),
                theme: 'striped',
                styles: { fontSize: 10, cellPadding: 5 },
                headStyles: { fillColor: [209, 213, 219], textColor: [255, 255, 255] },
                columnStyles: getExportFields(filteredLocationList).reduce(
                    (acc, _, index) => ({
                        ...acc,
                        [index]: { cellWidth: 'auto' },
                    }),
                    {}
                ),
                didDrawPage: () => {
                    doc.setFontSize(12);
                    doc.text('Location List', 14, 10);
                },
            });
            doc.save('locationList.pdf');
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
        { name: 'Branch', selector: (row) => row.branch, sortable: true, minWidth: '150px', maxWidth: '200px', wrap: true },
        { name: 'Location Name', selector: (row) => row.locationName, sortable: true, minWidth: '150px', maxWidth: '200px', wrap: true },
        { name: 'Latitude', selector: (row) => row.latitude, sortable: true, minWidth: '120px', maxWidth: '150px', wrap: true },
        { name: 'Longitude', selector: (row) => row.longitude, sortable: true, minWidth: '120px', maxWidth: '150px', wrap: true },
        { name: 'Variation', selector: (row) => row.variation, sortable: true, minWidth: '120px', maxWidth: '150px', wrap: true },
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
                    <h2 className="text-xl font-bold mb-4 text-center text-gray-800">Location Master</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <div className="w-full">
                                <label className="flex items-center justify-between text-gray-700 font-medium mb-1 text-sm">
                                    Branch
                                    <span className="ml-2">🏠</span>
                                </label>
                                <Select
                                    options={branchList}
                                    value={formData.branch}
                                    onChange={(value) => handleInputChange('branch', value)}
                                    className={`w-full text-sm ${errors.branch ? 'border-2 border-red-500' : ''}`}
                                    placeholder="Select Branch..."
                                />
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <div className="w-full">
                                <label className="flex items-center justify-between text-gray-700 font-medium mb-1 text-sm">
                                    Location Name
                                    <span className="ml-2">📍</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.locationName}
                                    onChange={(e) => handleInputChange('locationName', e.target.value)}
                                    className={`w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${errors.locationName ? 'border-2 border-red-500' : 'border-gray-300'}`}
                                    placeholder="Enter Location Name..."
                                />
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <div className="w-1/2">
                                <label className="flex items-center justify-between text-gray-700 font-medium mb-1 text-sm">
                                    Latitude
                                    <span className="ml-2">🌐</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.latitude}
                                    onChange={(e) => handleInputChange('latitude', e.target.value)}
                                    className={`w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${errors.latitude ? 'border-2 border-red-500' : 'border-gray-300'}`}
                                    placeholder="Enter Latitude..."
                                />
                            </div>
                            <div className="w-1/2">
                                <label className="flex items-center justify-between text-gray-700 font-medium mb-1 text-sm">
                                    Longitude
                                    <span className="ml-2">🌐</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.longitude}
                                    onChange={(e) => handleInputChange('longitude', e.target.value)}
                                    className={`w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${errors.longitude ? 'border-2 border-red-500' : 'border-gray-300'}`}
                                    placeholder="Enter Longitude..."
                                />
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <div className="w-full">
                                <label className="flex items-center justify-between text-gray-700 font-medium mb-1 text-sm">
                                    Variation
                                    <span className="ml-2">📏</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.variation}
                                    onChange={(e) => handleInputChange('variation', e.target.value)}
                                    className={`w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${errors.variation ? 'border-2 border-red-500' : 'border-gray-300'}`}
                                    placeholder="Enter Variation..."
                                />
                            </div>
                        </div>
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
                    {filteredLocationList.length > 0 && (
                        <div className="mt-6">
                            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
                                <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Location List</h3>
                                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={handleSearch}
                                        onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                                        placeholder="Search locations..."
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
                                    data={filteredLocationList}
                                    customStyles={customStyles}
                                    pagination
                                    paginationPerPage={5}
                                    paginationRowsPerPageOptions={[5, 10, 20]}
                                    highlightOnHover
                                    pointerOnHover
                                    responsive
                                    noDataComponent={
                                        <p className="text-gray-600 text-sm text-center py-4">
                                            No locations match your search.
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
                                        Are you sure you want to delete this location? This action cannot be undone.
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

export default LocationMaster;