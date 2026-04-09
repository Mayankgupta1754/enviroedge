import express  from "express";
import cors from 'cors';
import { connectDB } from "./config/db.js";
import userRouter from "./routes/userRoute.js";
import probRouter from "./routes/probRoute.js";
import 'dotenv/config';
import { initEdgeIntelligence } from "./services/edgeIntelligence.js";

const app = express();
const port = process.env.PORT || 4000;

app.use(express.json());
app.use(cors());

app.use("/api/user", userRouter);
app.use("/api/probability", probRouter);

app.get("/", (req, res) => {
  res.send("API Working");
});

initEdgeIntelligence();

app.listen(port, () => console.log(`Server started on http://localhost:${port}`));