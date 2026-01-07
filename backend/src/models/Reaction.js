import mongoose from "mongoose";

const reactionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        targetType: {
            type: String,
            enum: ["Photo", "Comment"],
            required: true,
            index: true,
        },
        targetId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            index: true,
        },
        value: {
            type: Number,
            enum: [1, -1],
            required: true,
        },
    },
    { timestamps: true }
);

reactionSchema.index({ user: 1, targetType: 1, targetId: 1 }, { unique: true });

const Reaction = mongoose.model("Reaction", reactionSchema);

export default Reaction;
