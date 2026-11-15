import express from "express";

import { issueBook, returnBook } from "../controllers/transactionController.js";

const router = express.Router();

router.post("/issue", issueBook);

router.put("/return/:transactionId", returnBook);

export default router;
