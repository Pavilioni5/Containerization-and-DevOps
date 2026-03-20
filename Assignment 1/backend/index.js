const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

async function initDB() {
  const client = await pool.connect();

  await client.query(`
  CREATE TABLE IF NOT EXISTS students(
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    roll_number VARCHAR(20),
    department VARCHAR(50),
    year INT
  )
  `);

  client.release();
}

initDB();

// Health endpoint
app.get("/health", async (req,res)=>{
  try{
    await pool.query("SELECT 1");
    res.json({status:"ok"});
  }catch{
    res.status(500).json({status:"error"});
  }
});

// Insert student
app.post("/students", async (req,res)=>{

  const {name, roll_number, department, year} = req.body;

  const result = await pool.query(
  "INSERT INTO students(name,roll_number,department,year) VALUES($1,$2,$3,$4) RETURNING *",
  [name,roll_number,department,year]
  );

  res.json(result.rows[0]);
});

// Get students
app.get("/students", async (req,res)=>{
  const result = await pool.query("SELECT * FROM students");
  res.json(result.rows);
});

app.listen(3000,()=>{
 console.log("Server running on port 3000");
});
