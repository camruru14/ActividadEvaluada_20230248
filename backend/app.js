import express from "express";


const app = express();

app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true
}))

app.use(cookieStore.Parser());
app.use(express.json());

export default app;