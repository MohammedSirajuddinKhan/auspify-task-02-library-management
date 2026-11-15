import express from "express";

import {
  issueBook,
  returnBook,
  getAllTransactions,
} from "../controllers/transactionController.js";

const router = express.Router();

router.get("/", getAllTransactions);

router.post("/issue", issueBook);

router.put("/return/:transactionId", returnBook);

export default router;
