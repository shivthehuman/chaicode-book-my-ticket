# 🎟️ ChaiCode Hackathon - Book My Ticket (Backend Extension)

This repository contains the backend and frontend implementation for the ChaiCode "Book My Ticket" hackathon. The goal was to extend an existing production codebase by adding an authentication layer and protected booking flow without breaking existing endpoints.

## 🚀 Features Implemented
- **User Authentication:** Secure Registration and Login using `bcrypt` and `jsonwebtoken`.
- **Protected Routes:** Custom Express middleware to ensure only logged-in users can book seats.
- **Data Integrity:** Used PostgreSQL `UNIQUE` constraints and `FOR UPDATE` transactions to strictly prevent duplicate seat bookings and race conditions.
- **User Association:** Modified the existing database schema to associate every booking with the logged-in user's ID.
- **🌟 Bonus (Frontend Integration):** Added a responsive Login/Register UI that stores the JWT in `localStorage` and automatically attaches it to the authorization headers for seamless bookings. Visually patched the original UI to be fully responsive on mobile devices.

## 🛠️ Tech Stack
- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL (`pg` package)
- **Security:** bcrypt, jsonwebtoken, dotenv
- **Frontend:** HTML, Tailwind CSS, Vanilla JavaScript (Fetch API)

## ⚙️ Setup & Installation

**1. Clone the repository**
\`\`\`bash
git clone <your_github_repo_link>
cd chai-book-ticket-hackathon
\`\`\`

**2. Install Dependencies**
\`\`\`bash
npm install
\`\`\`

**3. Database Setup**
- Create a PostgreSQL database named `sql_class_2_db`.
- Run the following queries to setup tables:
\`\`\`sql
CREATE TABLE users (id SERIAL PRIMARY KEY, email VARCHAR(255) UNIQUE NOT NULL, password_hash VARCHAR(255) NOT NULL);
CREATE TABLE seats (id SERIAL PRIMARY KEY, name VARCHAR(255), isbooked INT DEFAULT 0, user_id INT REFERENCES users(id));
INSERT INTO seats (isbooked) SELECT 0 FROM generate_series(1, 20);
\`\`\`

**4. Environment Variables**
Create a `.env` file in the root directory and add your JWT secret:
\`\`\`env
JWT_SECRET=YourSuperSecretKeyHere
\`\`\`

**5. Run the Server**
\`\`\`bash
node index.mjs
\`\`\`
The server will start on `http://localhost:8080`.

## 📡 API Endpoints
| Method | Endpoint | Description | Protected |
|--------|----------|-------------|-----------|
| GET | `/` | Serves the frontend UI | No |
| GET | `/seats` | Fetches all 20 seats and their booking status | No |
| POST | `/register`| Creates a new user (requires email, password) | No |
| POST | `/login` | Authenticates user and returns JWT | No |
| PUT | `/:id/:name`| Books a seat & associates with user | **Yes** (Requires JWT) |