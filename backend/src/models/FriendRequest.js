import mongoose from "mongoose";

const friendRequestSchema = new mongoose.Schema(
    {
        from: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        to: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        status: {
            type: String,
            enum: ["PENDING"],
            default: "PENDING",
        },
    },
    { timestamps: true }
);

friendRequestSchema.index(
    { from: 1, to: 1 },
    { unique: true, partialFilterExpression: { status: "PENDING" } }
);

const FriendRequest = mongoose.model("FriendRequest", friendRequestSchema);

export default FriendRequest;
