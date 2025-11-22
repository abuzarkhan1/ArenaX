import Team from '../models/Team.js';
import User from '../models/User.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// @desc    Create new team
// @route   POST /api/teams
// @access  Private
export const createTeam = async (req, res) => {
    try {
        const { name, teamType } = req.body;
        const userId = req.user._id;

        // Validate team type
        if (!['duo', 'squad'].includes(teamType)) {
            return res.status(400).json({
                success: false,
                message: 'Team type must be either "duo" or "squad"',
            });
        }

        // Generate unique team code
        const teamCode = await Team.generateTeamCode();

        // Handle logo upload
        let logoUrl = null;
        if (req.file) {
            logoUrl = `/uploads/teams/${req.file.filename}`;
        }

        // Create team with leader as first member
        const team = await Team.create({
            name,
            logo: logoUrl,
            teamCode,
            teamType,
            leader: userId,
            members: [userId],
        });

        // Populate team data
        await team.populate('leader', 'username email');
        await team.populate('members', 'username email');

        res.status(201).json({
            success: true,
            message: 'Team created successfully',
            data: team,
        });
    } catch (error) {
        console.error('Error creating team:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create team',
            error: error.message,
        });
    }
};

// @desc    Join team using team code
// @route   POST /api/teams/join
// @access  Private
export const joinTeam = async (req, res) => {
    try {
        const { teamCode } = req.body;
        const userId = req.user._id;

        if (!teamCode || teamCode.length !== 6) {
            return res.status(400).json({
                success: false,
                message: 'Valid 6-digit team code is required',
            });
        }

        // Find team by code
        const team = await Team.findOne({ teamCode });

        if (!team) {
            return res.status(404).json({
                success: false,
                message: 'Team not found. Please check the code and try again.',
            });
        }

        // Check if user is already a member
        if (team.members.includes(userId)) {
            return res.status(400).json({
                success: false,
                message: 'You are already a member of this team',
            });
        }

        // Check team capacity
        const maxMembers = team.teamType === 'duo' ? 2 : 4;
        if (team.members.length >= maxMembers) {
            return res.status(400).json({
                success: false,
                message: `This ${team.teamType} team is already full (${maxMembers}/${maxMembers} members)`,
            });
        }

        // Add user to team
        team.members.push(userId);
        await team.save();

        // Populate team data
        await team.populate('leader', 'username email');
        await team.populate('members', 'username email');

        res.status(200).json({
            success: true,
            message: 'Successfully joined the team',
            data: team,
        });
    } catch (error) {
        console.error('Error joining team:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to join team',
            error: error.message,
        });
    }
};

// @desc    Get all teams user is part of
// @route   GET /api/teams/my-teams
// @access  Private
export const getMyTeams = async (req, res) => {
    try {
        const userId = req.user._id;

        const teams = await Team.find({ members: userId })
            .populate('leader', 'username email')
            .populate('members', 'username email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: teams.length,
            data: teams,
        });
    } catch (error) {
        console.error('Error fetching teams:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch teams',
            error: error.message,
        });
    }
};

// @desc    Get team by ID
// @route   GET /api/teams/:id
// @access  Private
export const getTeamById = async (req, res) => {
    try {
        const team = await Team.findById(req.params.id)
            .populate('leader', 'username email')
            .populate('members', 'username email');

        if (!team) {
            return res.status(404).json({
                success: false,
                message: 'Team not found',
            });
        }

        // Check if user is a member
        if (!team.members.some((member) => member._id.toString() === req.user._id.toString())) {
            return res.status(403).json({
                success: false,
                message: 'You are not a member of this team',
            });
        }

        res.status(200).json({
            success: true,
            data: team,
        });
    } catch (error) {
        console.error('Error fetching team:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch team',
            error: error.message,
        });
    }
};

// @desc    Update team
// @route   PUT /api/teams/:id
// @access  Private (Leader only)
export const updateTeam = async (req, res) => {
    try {
        const { name } = req.body;
        const team = await Team.findById(req.params.id);

        if (!team) {
            return res.status(404).json({
                success: false,
                message: 'Team not found',
            });
        }

        // Check if user is team leader
        if (team.leader.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Only team leader can update team details',
            });
        }

        // Update fields
        if (name) team.name = name;

        // Handle logo update
        if (req.file) {
            // Delete old logo if exists
            if (team.logo) {
                const oldLogoPath = join(__dirname, '../../', team.logo);
                if (fs.existsSync(oldLogoPath)) {
                    fs.unlinkSync(oldLogoPath);
                }
            }
            team.logo = `/uploads/teams/${req.file.filename}`;
        }

        await team.save();

        // Populate team data
        await team.populate('leader', 'username email');
        await team.populate('members', 'username email');

        res.status(200).json({
            success: true,
            message: 'Team updated successfully',
            data: team,
        });
    } catch (error) {
        console.error('Error updating team:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update team',
            error: error.message,
        });
    }
};

// @desc    Delete team
// @route   DELETE /api/teams/:id
// @access  Private (Leader only)
export const deleteTeam = async (req, res) => {
    try {
        const team = await Team.findById(req.params.id);

        if (!team) {
            return res.status(404).json({
                success: false,
                message: 'Team not found',
            });
        }

        // Check if user is team leader
        if (team.leader.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Only team leader can delete the team',
            });
        }

        // Delete logo if exists
        if (team.logo) {
            const logoPath = join(__dirname, '../../', team.logo);
            if (fs.existsSync(logoPath)) {
                fs.unlinkSync(logoPath);
            }
        }

        await Team.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Team deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting team:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete team',
            error: error.message,
        });
    }
};

// @desc    Leave team
// @route   POST /api/teams/:id/leave
// @access  Private
export const leaveTeam = async (req, res) => {
    try {
        const team = await Team.findById(req.params.id);

        if (!team) {
            return res.status(404).json({
                success: false,
                message: 'Team not found',
            });
        }

        // Check if user is team leader
        if (team.leader.toString() === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'Team leader cannot leave the team. Please delete the team or transfer leadership first.',
            });
        }

        // Check if user is a member
        const memberIndex = team.members.findIndex(
            (member) => member.toString() === req.user._id.toString()
        );

        if (memberIndex === -1) {
            return res.status(400).json({
                success: false,
                message: 'You are not a member of this team',
            });
        }

        // Remove user from team
        team.members.splice(memberIndex, 1);
        await team.save();

        res.status(200).json({
            success: true,
            message: 'Successfully left the team',
        });
    } catch (error) {
        console.error('Error leaving team:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to leave team',
            error: error.message,
        });
    }
};
