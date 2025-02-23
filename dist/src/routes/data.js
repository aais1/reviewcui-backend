"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Faculty_1 = require("../models/Faculty"); // Import Faculty Model
const checkToken_1 = require("../middlewares/checkToken");
const mongoose_1 = __importDefault(require("mongoose"));
const router = (0, express_1.Router)();
// ✅ Fetch Faculty Data by ID, Name, or Department
router.get("/faculty", checkToken_1.checkToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id, name, department } = req.query; // Get query params
        let query = {};
        if (id) {
            query._id = id;
        }
        if (name) {
            query.name = { $regex: new RegExp(name, "i") }; // Case-insensitive name search
        }
        if (department) {
            query.department = { $regex: new RegExp(department, "i") }; // Case-insensitive department filter
        }
        const faculties = yield Faculty_1.Faculty.find(query);
        if (!faculties.length) {
            res.json({ message: "No faculty found" });
            return;
        }
        const facultyData = faculties.map((faculty) => {
            // ✅ Calculate Rating Distribution Dynamically
            const ratingDistribution = {
                5: 0,
                4: 0,
                3: 0,
                2: 0,
                1: 0,
            };
            faculty.reviews.forEach((review) => {
                if (review.rating && review.rating >= 1 && review.rating <= 5) {
                    ratingDistribution[review.rating]++;
                }
            });
            // ✅ Compute Total Reviews & Average Rating
            const totalReviews = faculty.reviews.length;
            const avgRating = totalReviews > 0
                ? faculty.reviews.reduce((sum, review) => sum + review.rating, 0) /
                    totalReviews
                : 0;
            return Object.assign(Object.assign({}, faculty.toObject()), { totalReviews, rating: avgRating.toFixed(1), // Rounded to 1 decimal place
                ratingDistribution });
        });
        res.json(facultyData);
    }
    catch (error) {
        console.error("Error fetching faculty:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}));
// ✅ Post a Review for Faculty
router.post("/faculty/:id/review", checkToken_1.checkToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { user, rating, comment, userImage, userId } = req.body;
        // Validate rating (should be between 1 and 5)
        if (typeof rating !== "number" || rating < 1 || rating > 5) {
            res
                .status(400)
                .json({ message: "Rating must be a number between 1 and 5" });
            return;
        }
        const faculty = yield Faculty_1.Faculty.findById(id);
        if (!faculty) {
            res.status(404).json({ message: "Faculty not found" });
            return;
        }
        const newReview = {
            _id: new mongoose_1.default.Types.ObjectId(),
            user,
            date: new Date(),
            rating,
            comment,
            userImage: userImage || "https://randomuser.me/api/portraits/men/1.jpg",
            likes: 0,
            replies: 0,
            userId,
        };
        // ✅ Add review to faculty
        faculty.reviews.push(newReview);
        yield faculty.save();
        res
            .status(201)
            .json({ message: "Review submitted successfully", review: newReview });
    }
    catch (error) {
        console.error("Error submitting review:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}));
router.patch("/faculty/:id/review", checkToken_1.checkToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { user, rating, comment, userImage, userId } = req.body;
        // Validate rating (should be between 1 and 5)
        if (typeof rating !== "number" || rating < 1 || rating > 5) {
            res
                .status(400)
                .json({ message: "Rating must be a number between 1 and 5" });
            return;
        }
        // Find faculty by ID
        const faculty = yield Faculty_1.Faculty.findById(id);
        if (!faculty) {
            res.status(404).json({ message: "Faculty not found" });
            return;
        }
        // Find existing review by user ID
        const existingReview = faculty.reviews.find((review) => { var _a; return ((_a = review.userId) === null || _a === void 0 ? void 0 : _a.toString()) === userId; });
        if (!existingReview) {
            res.status(404).json({ message: "Review not found for this user" });
            return;
        }
        // Update existing review fields
        existingReview.user = user;
        existingReview.rating = rating;
        existingReview.comment = comment;
        existingReview.userImage =
            userImage || "https://randomuser.me/api/portraits/men/1.jpg";
        existingReview.date = new Date();
        // Save updated faculty document
        yield faculty.save();
        res.status(200).json({
            message: "Review updated successfully",
            review: existingReview,
        });
    }
    catch (error) {
        console.error("Error updating review:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}));
router.delete("/faculty/:id/review/:reviewId", checkToken_1.checkToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id, reviewId } = req.params;
        const faculty = yield Faculty_1.Faculty.findById(id);
        if (!faculty) {
            return res.status(404).json({ message: "Faculty not found" });
        }
        // Ensure that reviews exist
        if (faculty.reviews && faculty.reviews.length > 0) {
            // Filter out the review to delete
            faculty.set("reviews", faculty.reviews.filter((review) => review._id.toString() !== reviewId));
            yield faculty.save();
            return res.status(200).json({ message: "Review deleted successfully" });
        }
        else {
            return res
                .status(404)
                .json({ message: "No reviews found for this faculty" });
        }
    }
    catch (error) {
        console.error("Error deleting review:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}));
router.get("/top-three", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const faculties = yield Faculty_1.Faculty.find({});
        // Sort faculties by the number of reviews in descending order
        const topThreeMostReviewed = faculties
            .map((faculty) => {
            const totalReviews = faculty.reviews.length;
            const totalStars = faculty.reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
            const rating = totalReviews > 0 ? totalStars / totalReviews : 0; // Correct formula
            return Object.assign(Object.assign({}, faculty.toObject()), { totalReviews, // Number of reviews
                totalStars, rating: rating.toFixed(1) });
        })
            .sort((a, b) => b.totalReviews - a.totalReviews) // Sort by most reviews
            .slice(0, 3); // Take top 3 most reviewed
        res.json(topThreeMostReviewed);
    }
    catch (error) {
        console.error("Error fetching top three faculties:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}));
exports.default = router;
