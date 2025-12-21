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
}, { timestamps: true })

const User = mongoose.model("User", userSchema);

export default User;