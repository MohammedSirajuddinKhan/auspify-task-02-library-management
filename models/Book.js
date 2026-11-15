import mongoose from "mongoose";

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Book title is required."],
      trim: true,
    },
    author: {
      type: String,
      required: [true, "Author name is required."],
      trim: true,
    },
    isbn: {
      type: String,
      required: [true, "ISBN is required."],
      unique: true,
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Book category is required"],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, "Book quantity is required"],
      min: [0, "Quantity cannot be negative"],
    },
    availableQuantity: {
      type: Number,
      required: true,
      min: [0, "Available quantity cannot be negative"],
    },
  },
  { timestamps: true },
);

export const Book = mongoose.model("Book", bookSchema);
