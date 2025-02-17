import mongoose from "mongoose";

export async function dbConnect() {
  try {
    await mongoose.connect(
      "mongodb+srv://aaisali228:BiL6AvwklChLiPx6@cluster0.szjsx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    );
    console.info("Connected to the database");
  } catch (e: any) {
    console.log(e.message);
  }
}
