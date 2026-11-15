import mongoose from "mongoose";
import Book from "../models/Book.js";
import Transaction from "../models/Transaction.js";

// 1. Issue a book
export const issueBook = async (req, res) => {
  try {
    const { bookId, borrowerName, borrowerEmail } = req.body;

    // Validate required fields
    if (!bookId || !borrowerName || !borrowerEmail) {
      return res.status(400).json({
        success: false,
        message: "Book ID, borrower name and email are required",
      });
    }

    // Validate MongoDB ObjectId
    if (!mongoose.isValidObjectId(bookId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID",
      });
    }

    // Decrease available quantity only if a copy is available
    const book = await Book.findOneAndUpdate(
      {
        _id: bookId,
        availableQuantity: { $gt: 0 },
      },
      {
        $inc: { availableQuantity: -1 },
      },
      { new: true },
    );

    if (!book) {
      const existingBook = await Book.findById(bookId);

      return res.status(existingBook ? 400 : 404).json({
        success: false,
        message: existingBook
          ? "No copies of this book are currently available"
          : "Book not found",
      });
    }

    try {
      const transaction = await Transaction.create({
        book: bookId,
        borrowerName,
        borrowerEmail,
      });

      return res.status(201).json({
        success: true,
        message: "Book issued successfully",
        data: transaction,
      });
    } catch (error) {
      // Restore availability if transaction creation fails
      await Book.findByIdAndUpdate(bookId, {
        $inc: { availableQuantity: 1 },
      });

      throw error;
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 2. Return an issued book
export const returnBook = async (req, res) => {
  try {
    const { transactionId } = req.params;

    // Validate MongoDB ObjectId
    if (!mongoose.isValidObjectId(transactionId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction ID",
      });
    }

    // Find an issued transaction and mark it as returned
    const transaction = await Transaction.findOneAndUpdate(
      {
        _id: transactionId,
        status: "Issued",
      },
      {
        $set: {
          status: "Returned",
          returnDate: new Date(),
        },
      },
      { new: true },
    );

    if (!transaction) {
      const existingTransaction = await Transaction.findById(transactionId);

      return res.status(existingTransaction ? 400 : 404).json({
        success: false,
        message: existingTransaction
          ? "This book has already been returned"
          : "Transaction not found",
      });
    }

    // Increase the available book quantity
    await Book.findByIdAndUpdate(transaction.book, {
      $inc: { availableQuantity: 1 },
    });

    return res.status(200).json({
      success: true,
      message: "Book returned successfully",
      data: transaction,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 3. Get all transaction records
export const getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate("book", "title author isbn")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
