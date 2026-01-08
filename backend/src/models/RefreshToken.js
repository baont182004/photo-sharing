import mongoose from "mongoose";

const refreshTokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      required: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    jti: {
      type: String,
      required: true,
      index: true,
    },
    family: {
      type: String,
      required: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    replacedByTokenHash: {
      type: String,
      default: null,
    },
    ip: {
      type: String,
      default: "",
    },
    userAgent: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const RefreshToken = mongoose.model("RefreshToken", refreshTokenSchema);

export default RefreshToken;
