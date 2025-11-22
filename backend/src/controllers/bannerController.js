import Banner from '../models/Banner.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// @desc    Create new banner
// @route   POST /api/banners
// @access  Admin
export const createBanner = async (req, res) => {
    try {
        const { title, order } = req.body;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Banner image is required',
            });
        }

        // Construct image URL
        const imageUrl = `/uploads/banners/${req.file.filename}`;

        const banner = await Banner.create({
            title,
            imageUrl,
            order: order || 0,
        });

        res.status(201).json({
            success: true,
            message: 'Banner created successfully',
            data: banner,
        });
    } catch (error) {
        console.error('Error creating banner:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create banner',
            error: error.message,
        });
    }
};

// @desc    Get all banners
// @route   GET /api/banners
// @access  Public (active only) / Admin (all)
export const getAllBanners = async (req, res) => {
    try {
        const { all } = req.query;
        const isAdmin = req.user?.role === 'admin';

        let query = {};

        // If not admin or 'all' param not provided, only show active banners
        if (!isAdmin || all !== 'true') {
            query.isActive = true;
        }

        const banners = await Banner.find(query).sort({ order: 1, createdAt: -1 });

        res.status(200).json({
            success: true,
            count: banners.length,
            data: banners,
        });
    } catch (error) {
        console.error('Error fetching banners:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch banners',
            error: error.message,
        });
    }
};

// @desc    Get banner by ID
// @route   GET /api/banners/:id
// @access  Public
export const getBannerById = async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id);

        if (!banner) {
            return res.status(404).json({
                success: false,
                message: 'Banner not found',
            });
        }

        res.status(200).json({
            success: true,
            data: banner,
        });
    } catch (error) {
        console.error('Error fetching banner:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch banner',
            error: error.message,
        });
    }
};

// @desc    Update banner
// @route   PUT /api/banners/:id
// @access  Admin
export const updateBanner = async (req, res) => {
    try {
        const { title, order, isActive } = req.body;
        const banner = await Banner.findById(req.params.id);

        if (!banner) {
            return res.status(404).json({
                success: false,
                message: 'Banner not found',
            });
        }

        // Update fields
        if (title !== undefined) banner.title = title;
        if (order !== undefined) banner.order = order;
        if (isActive !== undefined) banner.isActive = isActive;

        // If new image is uploaded, delete old one and update
        if (req.file) {
            // Delete old image
            const oldImagePath = join(__dirname, '../../', banner.imageUrl);
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }

            banner.imageUrl = `/uploads/banners/${req.file.filename}`;
        }

        await banner.save();

        res.status(200).json({
            success: true,
            message: 'Banner updated successfully',
            data: banner,
        });
    } catch (error) {
        console.error('Error updating banner:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update banner',
            error: error.message,
        });
    }
};

// @desc    Delete banner
// @route   DELETE /api/banners/:id
// @access  Admin
export const deleteBanner = async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id);

        if (!banner) {
            return res.status(404).json({
                success: false,
                message: 'Banner not found',
            });
        }

        // Delete image file
        const imagePath = join(__dirname, '../../', banner.imageUrl);
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }

        await Banner.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Banner deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting banner:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete banner',
            error: error.message,
        });
    }
};

// @desc    Toggle banner status
// @route   PATCH /api/banners/:id/toggle
// @access  Admin
export const toggleBannerStatus = async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id);

        if (!banner) {
            return res.status(404).json({
                success: false,
                message: 'Banner not found',
            });
        }

        banner.isActive = !banner.isActive;
        await banner.save();

        res.status(200).json({
            success: true,
            message: `Banner ${banner.isActive ? 'activated' : 'deactivated'} successfully`,
            data: banner,
        });
    } catch (error) {
        console.error('Error toggling banner status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to toggle banner status',
            error: error.message,
        });
    }
};
