import { Router, Request, Response } from "express";
import { Faculty } from "../models/Faculty"; // Import Faculty Model
import { checkToken } from "../middlewares/checkToken";
import mongoose from "mongoose";

const router = Router();

// ✅ Fetch Faculty Data by ID, Name, or Department
router.get(
  "/faculty",
  checkToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id, name, department } = req.query; // Get query params

      let query: any = {};

      if (id) {
        query._id = id;
      }
      if (name) {
        query.name = { $regex: new RegExp(name as string, "i") }; // Case-insensitive name search
      }
      if (department) {
        query.department = { $regex: new RegExp(department as string, "i") }; // Case-insensitive department filter
      }

      const faculties = await Faculty.find(query);

      if (!faculties.length) {
        res.json({ message: "No faculty found" });
        return;
      }

      const facultyData = faculties.map((faculty) => {
        // ✅ Calculate Rating Distribution Dynamically
        const ratingDistribution: Record<number, number> = {
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
        const avgRating =
          totalReviews > 0
            ? faculty.reviews.reduce((sum, review) => sum + review.rating!, 0) /
              totalReviews
            : 0;

        return {
          ...faculty.toObject(),
          totalReviews,
          rating: avgRating.toFixed(1), // Rounded to 1 decimal place
          ratingDistribution,
        };
      });

      res.json(facultyData);
    } catch (error) {
      console.error("Error fetching faculty:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

// ✅ Post a Review for Faculty
router.post(
  "/faculty/:id/review",
  checkToken,
  async (req: Request, res: Response): Promise<void> => {
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

      const faculty = await Faculty.findById(id);
      if (!faculty) {
        res.status(404).json({ message: "Faculty not found" });
        return;
      }

      const newReview = {
        _id: new mongoose.Types.ObjectId(),
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
      await faculty.save();

      res
        .status(201)
        .json({ message: "Review submitted successfully", review: newReview });
    } catch (error) {
      console.error("Error submitting review:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

router.patch(
  "/faculty/:id/review",
  checkToken,
  async (req: Request, res: Response): Promise<void> => {
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
      const faculty = await Faculty.findById(id);
      if (!faculty) {
        res.status(404).json({ message: "Faculty not found" });
        return;
      }

      // Find existing review by user ID
      const existingReview = faculty.reviews.find(
        (review: any) => review.userId?.toString() === userId
      );

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
      await faculty.save();

      res.status(200).json({
        message: "Review updated successfully",
        review: existingReview,
      });
    } catch (error) {
      console.error("Error updating review:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

router.delete(
  "/faculty/:id/review/:reviewId",
  checkToken,
  async (req: Request, res: Response): Promise<any> => {
    try {
      const { id, reviewId } = req.params;
      const faculty = await Faculty.findById(id);

      if (!faculty) {
        return res.status(404).json({ message: "Faculty not found" });
      }

      // Ensure that reviews exist
      if (faculty.reviews && faculty.reviews.length > 0) {
        // Filter out the review to delete
        faculty.set(
          "reviews",
          faculty.reviews.filter(
            (review: any) => review._id.toString() !== reviewId
          )
        );
        await faculty.save();
        return res.status(200).json({ message: "Review deleted successfully" });
      } else {
        return res
          .status(404)
          .json({ message: "No reviews found for this faculty" });
      }
    } catch (error) {
      console.error("Error deleting review:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

router.get("/top-three", async (req, res) => {
  try {
    const faculties = await Faculty.find({});

    // Calculate average rating for each faculty and sort by rating
    const topFaculties = faculties
      .map((faculty) => {
        const totalReviews = faculty.reviews.length || 0;
        const avgRating =
          totalReviews > 0
            ? faculty.reviews.reduce(
                (sum, review) => sum + (review.rating || 0),
                0
              ) / totalReviews
            : 0;

        return {
          ...faculty.toObject(),
          rating: avgRating.toFixed(1),
          totalReviews,
        };
      })
      .sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating)) // Sort by rating in descending order
      .slice(0, 3); // Take top 3 faculties

    res.json(topFaculties);
  } catch (error) {
    console.error("Error fetching top three faculties:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;
