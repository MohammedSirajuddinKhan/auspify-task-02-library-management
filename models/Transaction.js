import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },

    borrowerName: {
      type: String,
      required: [true, "Borrower name is required"],
      trim: true,
    },

    borrowerEmail: {
      type: String,
      required: [true, "Borrower email is required"],
      lowercase: true,
      trim: true,
    },

    issueDate: {
      type: Date,
      default: Date.now,
    },

    returnDate: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: ["Issued", "Returned"],
      default: "Issued",
    },
  },
  {
    timestamps: true,
  },
);

export const Transaction = mongoose.model("Transaction", transactionSchema);
