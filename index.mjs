import express from "express";
import pg from "pg";
import { dirname } from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

// Step 1: Security keys Load by --------- (.env)
dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const port = process.env.PORT || 8080;

// Step 2: Database Connection
const pool = new pg.Pool({
  host: "localhost",
  port: 5432, 
  user: "postgres",
  password: "postgres", 
  database: "sql_class_2_db",
  max: 20,
  connectionTimeoutMillis: 0,
  idleTimeoutMillis: 0,
});

const app = express();

// --- MIDDLEWARES ----------------------------------------------------------------------------------
app.use(cors());
app.use(express.json()); 

// --- CUSTOM AUTH MIDDLEWARE (The Gatekeeper) ---
const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.status(403).json({ error: "Access Denied! No token provided." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified; 
    next(); 
  } catch (err) {
    return res.status(401).json({ error: "Invalid or Expired Token!" });
  }
};

// --- ROUTES -----------------------------------------------------------------------------

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

// 1. REGISTER ROUTE
app.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    const userExists = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userExists.rowCount > 0) return res.status(400).json({ error: "Email already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await pool.query(
      "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email",
      [email, hashedPassword]
    );

    res.status(201).json({ message: "Registration successful", user: newUser.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 2. LOGIN ROUTE-----------------
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (user.rowCount === 0) return res.status(400).json({ error: "Invalid credentials" });

    const validPassword = await bcrypt.compare(password, user.rows[0].password_hash);
    if (!validPassword) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.rows[0].id, email: user.rows[0].email },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({ message: "Login successful", token: token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 3. GET ALL SEATS 
app.get("/seats", async (req, res) => {
  const result = await pool.query("select * from seats");
  res.send(result.rows);
});

// 4. BOOK A SEAT 
app.put("/:id/:name", verifyToken, async (req, res) => {
  try {
    const id = req.params.id;
    const name = req.params.name;
    const userId = req.user.id; 


    // PEHLE AISE TRY KIYA THA (WITHOUT TRANSACTION) PAR RACE CONDITION AA RAHI THI
    // const checkSeat = await pool.query("SELECT isbooked FROM seats WHERE id = $1", [id]);

    // if(checkSeat.rows[0].isbooked === 1) return error;

    // FIXXXED: Using Sir's FOR UPDATE transaction below to lock the row properly.

    const conn = await pool.connect();
    await conn.query("BEGIN");
    
    const sql = "SELECT * FROM seats where id = $1 and isbooked = 0 FOR UPDATE";
    const result = await conn.query(sql, [id]);

    if (result.rowCount === 0) {
      await conn.query("ROLLBACK"); 
      conn.release();
      return res.status(400).send({ error: "Seat already booked" });
    }

    const sqlU = "update seats set isbooked = 1, name = $2, user_id = $3 where id = $1";
    const updateResult = await conn.query(sqlU, [id, name, userId]);

    await conn.query("COMMIT");
    conn.release();
    
    res.send({ message: "Seat booked successfully!" });
  } catch (ex) {
    console.log(ex);
    res.status(500).send({ error: "Booking failed due to server error" });
  }
});

app.listen(port, () => console.log("Server starting on port: " + port));