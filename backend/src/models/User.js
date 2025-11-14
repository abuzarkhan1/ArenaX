import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    fullName: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["admin", "player"],
      default: "player",
    },
    coinBalance: {
      type: Number,
      default: 0,
    },
    totalCoinsEarned: {
      type: Number,
      default: 0,
    },
    totalCoinsSpent: {
      type: Number,
      default: 0,
    },
    accountStatus: {
      type: String,
      enum: ["active", "suspended", "banned"],
      default: "active",
    },
    profileImage: {
      type: String,
      default: "",
    },
    gameStats: {
      totalTournamentsJoined: { type: Number, default: 0 },
      totalWins: { type: Number, default: 0 },
      totalKills: { type: Number, default: 0 },
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    pushToken: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.virtual("hasUnlimitedCoins").get(function () {
  return this.role === "admin";
});

const User = mongoose.model("User", userSchema);

export default User;
