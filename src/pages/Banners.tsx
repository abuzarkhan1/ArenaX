import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Upload, Image as ImageIcon } from 'lucide-react';
import { bannerAPI } from '../services/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface Banner {
    _id: string;
    title: string;
    imageUrl: string;
    order: number;
    isActive: boolean;
    createdAt: string;
}

const Banners = () => {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        order: 0,
        isActive: true,
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchBanners();
    }, []);

    const fetchBanners = async () => {
        try {
            const response = await bannerAPI.getAll({ all: true });
            if (response.data.success) {
                setBanners(response.data.data);
            }
        } catch (error) {
            setError('Failed to fetch banners');
            console.error('Error fetching banners:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (banner: Banner | null = null) => {
        if (banner) {
            setEditingBanner(banner);
            setFormData({
                title: banner.title,
                order: banner.order,
                isActive: banner.isActive,
            });
            setPreviewUrl(`${API_URL}${banner.imageUrl}`);
        } else {
            setEditingBanner(null);
            setFormData({
                title: '',
                order: 0,
                isActive: true,
            });
            setPreviewUrl('');
            setSelectedFile(null);
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingBanner(null);
        setFormData({ title: '', order: 0, isActive: true });
        setSelectedFile(null);
        setPreviewUrl('');
        setError('');
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setError('File size must be less than 5MB');
                return;
            }
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            setError('');
        }
    };

    const handleSubmit = async () => {
        if (!formData.title.trim()) {
            setError('Title is required');
            return;
        }

        if (!editingBanner && !selectedFile) {
            setError('Please select an image');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('title', formData.title);
            formDataToSend.append('order', formData.order.toString());
            formDataToSend.append('isActive', formData.isActive.toString());

            if (selectedFile) {
                formDataToSend.append('image', selectedFile);
            }

            let response;
            if (editingBanner) {
                response = await bannerAPI.update(editingBanner._id, formDataToSend);
            } else {
                response = await bannerAPI.create(formDataToSend);
            }

            if (response.data.success) {
                setSuccess(editingBanner ? 'Banner updated successfully' : 'Banner created successfully');
                handleCloseDialog();
                fetchBanners();
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (error: any) {
            setError(error.response?.data?.message || 'Failed to save banner');
            console.error('Error saving banner:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleStatus = async (bannerId: string, currentStatus: boolean) => {
        try {
            const response = await bannerAPI.toggleStatus(bannerId);

            if (response.data.success) {
                setSuccess('Banner status updated');
                fetchBanners();
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (error) {
            setError('Failed to update banner status');
            console.error('Error toggling banner:', error);
        }
    };

    const handleDelete = async (bannerId: string) => {
        if (!window.confirm('Are you sure you want to delete this banner?')) {
            return;
        }

        try {
            const response = await bannerAPI.delete(bannerId);

            if (response.data.success) {
                setSuccess('Banner deleted successfully');
                fetchBanners();
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (error) {
            setError('Failed to delete banner');
            console.error('Error deleting banner:', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: '#121212' }}>
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2" style={{ borderColor: '#00BFFF' }}></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-6" style={{ background: '#121212' }}>
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-white mb-2">Banners</h1>
                    <p className="text-gray-400">Manage mobile app banners</p>
                </div>
                <button
                    onClick={() => handleOpenDialog()}
                    className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition-all hover:scale-105"
                    style={{ background: '#00BFFF' }}
                >
                    <Plus size={20} />
                    Create Banner
                </button>
            </div>

            {/* Success/Error Messages */}
            {success && (
                <div className="mb-6 p-4 rounded-lg" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                    <p className="text-green-400">{success}</p>
                </div>
            )}
            {error && !openDialog && (
                <div className="mb-6 p-4 rounded-lg" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                    <p className="text-red-400">{error}</p>
                </div>
            )}

            {/* Banners Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {banners.map((banner) => (
                    <div
                        key={banner._id}
                        className="rounded-xl overflow-hidden"
                        style={{
                            background: 'rgba(30, 30, 30, 0.95)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
                        }}
                    >
                        {/* Banner Image */}
                        <div className="relative h-48 bg-gray-800">
                            <img
                                src={`${API_URL}${banner.imageUrl}`}
                                alt={banner.title}
                                className="w-full h-full object-cover"
                            />
                            {!banner.isActive && (
                                <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                                    <span className="text-white font-bold text-lg">INACTIVE</span>
                                </div>
                            )}
                        </div>

                        {/* Banner Info */}
                        <div className="p-4">
                            <h3 className="text-lg font-bold text-white mb-2">{banner.title}</h3>
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-gray-400 text-sm">Order: {banner.order}</span>
                                <label className="flex items-center cursor-pointer">
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            className="sr-only"
                                            checked={banner.isActive}
                                            onChange={() => handleToggleStatus(banner._id, banner.isActive)}
                                        />
                                        <div
                                            className="block w-14 h-8 rounded-full transition-colors"
                                            style={{ background: banner.isActive ? '#00BFFF' : '#4B5563' }}
                                        ></div>
                                        <div
                                            className="dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform"
                                            style={{ transform: banner.isActive ? 'translateX(24px)' : 'translateX(0)' }}
                                        ></div>
                                    </div>
                                </label>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleOpenDialog(banner)}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold text-white transition-all hover:scale-105"
                                    style={{ background: 'rgba(0, 191, 255, 0.2)', border: '1px solid rgba(0, 191, 255, 0.3)' }}
                                >
                                    <Edit2 size={16} />
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(banner._id)}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold text-white transition-all hover:scale-105"
                                    style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.3)' }}
                                >
                                    <Trash2 size={16} />
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {banners.length === 0 && (
                <div className="text-center py-20">
                    <ImageIcon size={64} className="mx-auto mb-4" style={{ color: '#888888' }} />
                    <p className="text-gray-400 text-lg">No banners yet</p>
                    <p className="text-gray-500 text-sm">Create your first banner to get started</p>
                </div>
            )}

            {/* Create/Edit Dialog */}
            {openDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
                    <div
                        className="rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                        style={{
                            background: 'rgba(30, 30, 30, 0.98)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.8)'
                        }}
                    >
                        <h2 className="text-2xl font-bold text-white mb-6">
                            {editingBanner ? 'Edit Banner' : 'Create Banner'}
                        </h2>

                        {error && (
                            <div className="mb-4 p-3 rounded-lg" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                                <p className="text-red-400 text-sm">{error}</p>
                            </div>
                        )}

                        {/* Form */}
                        <div className="space-y-4">
                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Banner Title
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg text-white focus:outline-none focus:ring-2 transition-all"
                                    style={{
                                        background: '#1E1E1E',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        focusRingColor: '#00BFFF'
                                    }}
                                    placeholder="Enter banner title"
                                />
                            </div>

                            {/* Order */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Display Order
                                </label>
                                <input
                                    type="number"
                                    value={formData.order}
                                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                                    className="w-full px-4 py-2 rounded-lg text-white focus:outline-none focus:ring-2 transition-all"
                                    style={{
                                        background: '#1E1E1E',
                                        border: '1px solid rgba(255, 255, 255, 0.1)'
                                    }}
                                    placeholder="0"
                                />
                            </div>

                            {/* Active Status */}
                            <div className="flex items-center gap-3">
                                <label className="flex items-center cursor-pointer">
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            className="sr-only"
                                            checked={formData.isActive}
                                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                        />
                                        <div
                                            className="block w-14 h-8 rounded-full transition-colors"
                                            style={{ background: formData.isActive ? '#00BFFF' : '#4B5563' }}
                                        ></div>
                                        <div
                                            className="dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform"
                                            style={{ transform: formData.isActive ? 'translateX(24px)' : 'translateX(0)' }}
                                        ></div>
                                    </div>
                                </label>
                                <span className="text-gray-300">Active</span>
                            </div>

                            {/* Image Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Banner Image
                                </label>
                                <div
                                    className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all hover:border-opacity-50"
                                    style={{ borderColor: 'rgba(0, 191, 255, 0.3)' }}
                                    onClick={() => document.getElementById('file-input')?.click()}
                                >
                                    {previewUrl ? (
                                        <img
                                            src={previewUrl}
                                            alt="Preview"
                                            className="max-h-64 mx-auto rounded-lg"
                                        />
                                    ) : (
                                        <div>
                                            <Upload size={48} className="mx-auto mb-2" style={{ color: '#00BFFF' }} />
                                            <p className="text-gray-400">Click to upload image</p>
                                            <p className="text-gray-500 text-sm mt-1">Max size: 5MB</p>
                                        </div>
                                    )}
                                </div>
                                <input
                                    id="file-input"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={handleCloseDialog}
                                className="flex-1 px-6 py-3 rounded-lg font-semibold text-white transition-all hover:scale-105"
                                style={{ background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)' }}
                                disabled={submitting}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="flex-1 px-6 py-3 rounded-lg font-semibold text-white transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ background: '#00BFFF' }}
                                disabled={submitting}
                            >
                                {submitting ? 'Saving...' : (editingBanner ? 'Update' : 'Create')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Banners;
