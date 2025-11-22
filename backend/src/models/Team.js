import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Team name is required'],
            trim: true,
            maxlength: [50, 'Team name cannot exceed 50 characters'],
        },
        logo: {
            type: String,
            default: null,
        },
        teamCode: {
            type: String,
            required: true,
            unique: true,
            length: 6,
        },
        teamType: {
            type: String,
            required: [true, 'Team type is required'],
            enum: ['duo', 'squad'],
        },
        leader: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        members: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
    },
    {
        timestamps: true,
    }
);

// Generate unique 6-digit team code
teamSchema.statics.generateTeamCode = async function () {
    let code;
    let isUnique = false;

    while (!isUnique) {
        // Generate random 6-digit number
        code = Math.floor(100000 + Math.random() * 900000).toString();

        // Check if code already exists
        const existingTeam = await this.findOne({ teamCode: code });
        if (!existingTeam) {
            isUnique = true;
        }
    }

    return code;
};

// Validate team member count before saving
teamSchema.pre('save', function (next) {
    const maxMembers = this.teamType === 'duo' ? 2 : 4;

    if (this.members.length > maxMembers) {
        return next(
            new Error(
                `${this.teamType === 'duo' ? 'Duo' : 'Squad'} teams can have maximum ${maxMembers} members`
            )
        );
    }

    next();
});

// Index for efficient querying
teamSchema.index({ teamCode: 1 });
teamSchema.index({ leader: 1 });
teamSchema.index({ members: 1 });

const Team = mongoose.model('Team', teamSchema);

export default Team;
