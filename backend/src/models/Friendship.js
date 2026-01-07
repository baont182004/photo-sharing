import mongoose from "mongoose";

const friendshipSchema = new mongoose.Schema(
    {
        users: {
            type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
            required: true,
            validate: {
                validator: (users) => Array.isArray(users) && users.length === 2,
                message: "Friendship must contain exactly 2 users",
            },
        },
        pairKey: {
            type: String,
            required: true,
            index: true,
        },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

friendshipSchema.index({ pairKey: 1 }, { unique: true });

friendshipSchema.pre("validate", function setPairKey(next) {
    if (Array.isArray(this.users) && this.users.length === 2) {
        const [first, second] = this.users
            .map((id) => String(id))
            .sort();
        this.users = [
            new mongoose.Types.ObjectId(first),
            new mongoose.Types.ObjectId(second),
        ];
        this.pairKey = `${first}:${second}`;
    }
    next();
});

const Friendship = mongoose.model("Friendship", friendshipSchema);

export default Friendship;
