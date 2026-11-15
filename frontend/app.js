const BOOK_API = "/api/v1/books";
const TRANSACTION_API = "/api/v1/transactions";

// DOM Elements
const bookForm = document.getElementById("bookForm");
const issueBookForm = document.getElementById("issueBookForm");
const booksTableBody = document.getElementById("booksTableBody");
const transactionsTableBody = document.getElementById("transactionsTableBody");
const searchInput = document.getElementById("searchInput");
const bookModal = document.getElementById("bookModal");
const toast = document.getElementById("toast");

let books = [];
let transactions = [];
let toastTimer;

// API Request Handler

const apiRequest = async (url, options = {}) => {
  const response = await fetch(url, options);

  const contentType = response.headers.get("content-type");

  if (!contentType || !contentType.includes("application/json")) {
    const responseText = await response.text();

    console.error("Expected JSON but received:", responseText);

    throw new Error(
      `Expected JSON but received ${contentType || "unknown response"} from ${url}`,
    );
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
};

// Escape HTML to safely display database values
function escapeHTML(value = "") {
  return String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char],
  );
}

// Toast Notification
function showToast(message) {
  toast.textContent = message;
  toast.style.display = "block";

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.style.display = "none";
  }, 3000);
}

// Format Date
function formatDate(date) {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-IN");
}

// Load Books
async function loadBooks(search = "") {
  try {
    const url = search
      ? `${BOOK_API}?search=${encodeURIComponent(search)}`
      : BOOK_API;

    const result = await apiRequest(url);

    books = result.data;

    renderBooks(books);
    updateBookDropdown();
    updateStatistics();
  } catch (error) {
    booksTableBody.innerHTML = `
            <tr>
                <td colspan="7">${escapeHTML(error.message)}</td>
            </tr>
        `;

    showToast(error.message);
  }
}

// Render Books
function renderBooks(bookList) {
  if (!bookList.length) {
    booksTableBody.innerHTML = `
            <tr>
                <td colspan="7">No books found.</td>
            </tr>
        `;
    return;
  }

  booksTableBody.innerHTML = bookList
    .map(
      (book) => `
        <tr>
            <td>${escapeHTML(book.title)}</td>
            <td>${escapeHTML(book.author)}</td>
            <td>${escapeHTML(book.isbn)}</td>
            <td>${escapeHTML(book.category)}</td>
            <td>${book.quantity}</td>
            <td>${book.availableQuantity}</td>

            <td>
                <button
                    class="action-btn edit-btn"
                    data-action="edit"
                    data-id="${escapeHTML(book._id)}">
                    Edit
                </button>

                <button
                    class="action-btn delete-btn"
                    data-action="delete"
                    data-id="${escapeHTML(book._id)}">
                    Delete
                </button>
            </td>
        </tr>
    `,
    )
    .join("");
}

// Update Book Dropdown
function updateBookDropdown() {
  const dropdown = document.getElementById("issueBookId");

  dropdown.innerHTML = `
        <option value="">Select a book</option>
    `;

  books
    .filter((book) => book.availableQuantity > 0)
    .forEach((book) => {
      const option = document.createElement("option");

      option.value = book._id;
      option.textContent = `${book.title} (${book.availableQuantity} available)`;

      dropdown.appendChild(option);
    });
}

// Load Transactions
async function loadTransactions() {
  try {
    const result = await apiRequest(TRANSACTION_API);

    transactions = result.data;

    renderTransactions();
    updateStatistics();
    updateReports();
  } catch (error) {
    transactionsTableBody.innerHTML = `
            <tr>
                <td colspan="4">${escapeHTML(error.message)}</td>
            </tr>
        `;

    showToast(error.message);
  }
}

// Render Issued Transactions
function renderTransactions() {
  const issuedTransactions = transactions.filter(
    (transaction) => transaction.status === "Issued",
  );

  if (!issuedTransactions.length) {
    transactionsTableBody.innerHTML = `
            <tr>
                <td colspan="4">No currently issued books.</td>
            </tr>
        `;
    return;
  }

  transactionsTableBody.innerHTML = issuedTransactions
    .map(
      (transaction) => `
        <tr>
            <td>
                ${escapeHTML(transaction.book?.title || "Book unavailable")}
            </td>

            <td>${escapeHTML(transaction.borrowerName)}</td>

            <td>${formatDate(transaction.issueDate)}</td>

            <td>
                <button
                    class="action-btn return-btn"
                    data-action="return"
                    data-id="${escapeHTML(transaction._id)}">
                    Return
                </button>
            </td>
        </tr>
    `,
    )
    .join("");
}

// Update Dashboard Statistics
function updateStatistics() {
  const totalBooks = books.reduce((total, book) => total + book.quantity, 0);

  const availableBooks = books.reduce(
    (total, book) => total + book.availableQuantity,
    0,
  );

  const issuedBooks = totalBooks - availableBooks;

  document.getElementById("totalBooks").textContent = totalBooks;

  document.getElementById("availableBooks").textContent = availableBooks;

  document.getElementById("issuedBooks").textContent = issuedBooks;

  document.getElementById("totalTransactions").textContent =
    transactions.length;
}

// Update Report Summary
function updateReports() {
  const totalBooks = books.reduce((total, book) => total + book.quantity, 0);

  const availableBooks = books.reduce(
    (total, book) => total + book.availableQuantity,
    0,
  );

  const issuedTransactions = transactions.filter(
    (transaction) => transaction.status === "Issued",
  ).length;

  const returnedTransactions = transactions.filter(
    (transaction) => transaction.status === "Returned",
  ).length;

  document.getElementById("reportSummary").innerHTML = `
        <p><strong>Total book copies:</strong> ${totalBooks}</p>
        <p><strong>Available copies:</strong> ${availableBooks}</p>
        <p><strong>Issued transactions:</strong> ${issuedTransactions}</p>
        <p><strong>Returned transactions:</strong> ${returnedTransactions}</p>
        <p><strong>Total transactions:</strong> ${transactions.length}</p>
    `;
}

// Open Add Book Modal
document.getElementById("addBookBtn").addEventListener("click", () => {
  bookForm.reset();

  document.getElementById("bookId").value = "";
  document.getElementById("modalTitle").textContent = "Add Book";

  bookModal.style.display = "flex";
});

// Close Modal
document.getElementById("closeModalBtn").addEventListener("click", () => {
  bookModal.style.display = "none";
});

// Close Modal on Outside Click
bookModal.addEventListener("click", (event) => {
  if (event.target === bookModal) {
    bookModal.style.display = "none";
  }
});

// Add or Update Book
bookForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const bookId = document.getElementById("bookId").value;

  const bookData = {
    title: document.getElementById("title").value.trim(),
    author: document.getElementById("author").value.trim(),
    isbn: document.getElementById("isbn").value.trim(),
    category: document.getElementById("category").value.trim(),
    quantity: Number(document.getElementById("quantity").value),
  };

  if (
    !bookData.title ||
    !bookData.author ||
    !bookData.isbn ||
    !bookData.category ||
    !Number.isInteger(bookData.quantity) ||
    bookData.quantity < 0
  ) {
    showToast("Please enter valid book details");
    return;
  }

  try {
    const url = bookId ? `${BOOK_API}/${encodeURIComponent(bookId)}` : BOOK_API;

    const method = bookId ? "PUT" : "POST";

    const result = await apiRequest(url, {
      method,
      body: JSON.stringify(bookData),
    });

    showToast(result.message);

    bookModal.style.display = "none";

    await loadBooks(searchInput.value.trim());
    await loadTransactions();
  } catch (error) {
    showToast(error.message);
  }
});

// Edit and Delete Book
booksTableBody.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");

  if (!button) return;

  const { action, id } = button.dataset;

  if (action === "edit") {
    const book = books.find((item) => item._id === id);

    if (!book) return;

    document.getElementById("bookId").value = book._id;
    document.getElementById("title").value = book.title;
    document.getElementById("author").value = book.author;
    document.getElementById("isbn").value = book.isbn;
    document.getElementById("category").value = book.category;
    document.getElementById("quantity").value = book.quantity;

    document.getElementById("modalTitle").textContent = "Edit Book";

    bookModal.style.display = "flex";
  }

  if (action === "delete") {
    const confirmed = window.confirm(
      "Are you sure you want to delete this book?",
    );

    if (!confirmed) return;

    try {
      const result = await apiRequest(`${BOOK_API}/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      showToast(result.message);

      await loadBooks(searchInput.value.trim());
      await loadTransactions();
    } catch (error) {
      showToast(error.message);
    }
  }
});

// Search Books
let searchTimer;

searchInput.addEventListener("input", () => {
  clearTimeout(searchTimer);

  searchTimer = setTimeout(() => {
    loadBooks(searchInput.value.trim());
  }, 300);
});

// Issue Book
issueBookForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const bookId = document.getElementById("issueBookId").value;

  const borrowerName = document.getElementById("borrowerName").value.trim();

  const borrowerEmail = document.getElementById("borrowerEmail").value.trim();

  if (!bookId || !borrowerName || !borrowerEmail) {
    showToast("Please complete all issue details");
    return;
  }

  try {
    const result = await apiRequest(`${TRANSACTION_API}/issue`, {
      method: "POST",
      body: JSON.stringify({
        bookId,
        borrowerName,
        borrowerEmail,
      }),
    });

    showToast(result.message);

    issueBookForm.reset();

    await loadBooks(searchInput.value.trim());
    await loadTransactions();
  } catch (error) {
    showToast(error.message);
  }
});

// Return Book
transactionsTableBody.addEventListener("click", async (event) => {
  const button = event.target.closest('button[data-action="return"]');

  if (!button) return;

  const transactionId = button.dataset.id;

  const confirmed = window.confirm("Confirm that this book has been returned?");

  if (!confirmed) return;

  try {
    const result = await apiRequest(
      `${TRANSACTION_API}/return/${encodeURIComponent(transactionId)}`,
      { method: "PUT" },
    );

    showToast(result.message);

    await loadBooks(searchInput.value.trim());
    await loadTransactions();
  } catch (error) {
    showToast(error.message);
  }
});

// Generate CSV Report
document.getElementById("exportReportBtn").addEventListener("click", () => {
  const headers = [
    "Book Title",
    "Author",
    "ISBN",
    "Category",
    "Total Quantity",
    "Available Quantity",
    "Borrower Name",
    "Borrower Email",
    "Issue Date",
    "Return Date",
    "Transaction Status",
  ];

  const rows = transactions.map((transaction) => {
    const book = transaction.book || {};

    return [
      book.title || "",
      book.author || "",
      book.isbn || "",
      "",
      "",
      "",
      transaction.borrowerName,
      transaction.borrowerEmail,
      formatDate(transaction.issueDate),
      formatDate(transaction.returnDate),
      transaction.status,
    ];
  });

  // Include books that have no transactions
  const transactionBookIds = new Set(
    transactions.map((transaction) => transaction.book?._id?.toString()),
  );

  books.forEach((book) => {
    if (!transactionBookIds.has(book._id.toString())) {
      rows.push([
        book.title,
        book.author,
        book.isbn,
        book.category,
        book.quantity,
        book.availableQuantity,
        "",
        "",
        "",
        "",
        "",
      ]);
    }
  });

  const csvCell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

  const csvContent = [
    headers.map(csvCell).join(","),
    ...rows.map((row) => row.map(csvCell).join(",")),
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;
  link.download = "library-management-report.csv";

  link.click();

  URL.revokeObjectURL(url);

  showToast("Report exported successfully");
});

// Initialize Application
async function initializeApp() {
  await loadBooks();
  await loadTransactions();
}

initializeApp();
