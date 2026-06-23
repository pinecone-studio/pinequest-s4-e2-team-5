import express from "express";
import cors from "cors";

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "PineQuest server ажиллаж байна! 🌲" });
});

app.listen(port, () => {
  console.log(`Server ${port} порт дээр ажиллаж байна`);
});