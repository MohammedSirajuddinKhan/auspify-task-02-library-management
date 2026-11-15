import Book from "../models/Book.js";

export const createBook = async (req, res) => {
  try {
    const { title, author, isbn, category, quantity } = req.body;

    const book = await Book.create({
      title,
      author,
      isbn,
      category,
      quantity,
      availableQuantity: quantity,
    });

    res.status(201).json({
      success: true,
      message: "Book added successfully",
      data: book,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message:
        error.code === 11000
          ? "A book with this ISBN already exists"
          : error.message,
    });
  }
};

export const getAllBooks = async (req, res) => {
  try {
    const { search } = req.query;

    let filter = {};

    if (search) {
      filter = {
        $or: [
          { title: { $regex: search, $options: "i" } },
          { author: { $regex: search, $options: "i" } },
          { isbn: { $regex: search, $options: "i" } },
          { category: { $regex: search, $options: "i" } },
        ],
      };
    }

    const books = await Book.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: books.length,
      data: books,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    res.status(200).json({
      success: true,
      data: book,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Invalid book ID",
    });
  }
};

export const updateBook = async (req, res) => {
  try {
    const allowedFields = ["title", "author", "isbn", "category", "quantity"];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    if (updates.quantity !== undefined) {
      const issuedCopies = book.quantity - book.availableQuantity;

      if (updates.quantity < issuedCopies) {
        return res.status(400).json({
          success: false,
          message: `At least ${issuedCopies} copies are currently issued`,
        });
      }

      book.availableQuantity = updates.quantity - issuedCopies;
      book.quantity = updates.quantity;
      delete updates.quantity;
    }

    Object.assign(book, updates);

    await book.save();

    res.status(200).json({
      success: true,
      message: "Book updated successfully",
      data: book,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message:
        error.code === 11000
          ? "A book with this ISBN already exists"
          : error.message,
    });
  }
};

export const deleteBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    if (book.availableQuantity !== book.quantity) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete a book while copies are issued",
      });
    }

    await Book.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Book deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Invalid book ID",
    });
  }
};
