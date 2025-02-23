"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Faculty = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const FacultySchema = new mongoose_1.default.Schema({
    name: String,
    profileImage: String,
    profileLink: String,
    department: String,
    designation: String,
    hecApproved: Boolean,
    interest: String,
    reviews: [
        {
            user: String,
            date: Date,
            rating: Number,
            comment: String,
            userImage: String,
            likes: Number,
            replies: Number,
            userId: mongoose_1.default.Schema.Types.ObjectId,
        },
    ],
});
exports.Faculty = mongoose_1.default.model("Faculty", FacultySchema);
