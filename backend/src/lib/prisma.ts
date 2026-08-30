import dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@prisma/client";

console.log("DEBUG — DATABASE_URL is:", process.env.DATABASE_URL ? "SET (length " + process.env.DATABASE_URL.length + ")" : "UNDEFINED");

const prisma = new PrismaClient();

export default prisma;