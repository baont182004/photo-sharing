import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    comment: { type: String, required: true, trim: true },
    date_time: { type: Date, default: Date.now },

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
    file_name: { type: String, required: true },
    date_time: { type: Date, default: Date.now },

    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    comments: { type: [commentSchema], default: [] },
  },
  { timestamps: true }
);

const Photo = mongoose.model("Photo", photoSchema);
export default Photo;

