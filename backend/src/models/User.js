import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  login_name: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    select: false
  },
  first_name: { type: String, required: true, trim: true },
  last_name: { type: String, required: true, trim: true },
  location: { type: String, default: "" },
  description: { type: String, default: "" },
  occupation: { type: String, default: "" },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  auth_provider: {
    type: String,
    enum: ["github", "google", "facebook", "local", "admin"],
    default: "local",
    index: true,
  },
  provider_user_id: { type: String, index: true },
  display_name: { type: String },
  handle: { type: String, index: true },
  avatar_url: { type: String },
  avatar_public_id: { type: String },
  primary_email: { type: String, default: null },
}, { timestamps: true })

userSchema.index({ auth_provider: 1, provider_user_id: 1 }, { unique: false });

const User = mongoose.model("User", userSchema);

export default User;
