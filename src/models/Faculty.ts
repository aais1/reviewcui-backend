import mongoose from "mongoose";

const FacultySchema = new mongoose.Schema({
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
      userId: mongoose.Schema.Types.ObjectId,
    },
  ],
});

export const Faculty = mongoose.model("Faculty", FacultySchema);
