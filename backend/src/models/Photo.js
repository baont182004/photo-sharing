import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    comment: { type: String, required: true, trim: true },
    date_time: { type: Date, default: Date.now },
    likeCount: { type: Number, default: 0, min: 0 },
    dislikeCount: { type: Number, default: 0, min: 0 },

    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { _id: true }
);

const photoSchema = new mongoose.Schema(
  {
    imageUrl: { type: String },
    publicId: { type: String, index: true },
    width: { type: Number },
    height: { type: Number },
    format: { type: String },
    bytes: { type: Number },
    date_time: { type: Date, default: Date.now },

    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    likeCount: { type: Number, default: 0, min: 0 },
    dislikeCount: { type: Number, default: 0, min: 0 },
    comments: { type: [commentSchema], default: [] },
  },
  { timestamps: true }
);

const Photo = mongoose.model("Photo", photoSchema);
export default Photo;

