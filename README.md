# FinTrack — Personal Finance & Budget Tracker

A full-stack web application for tracking income, expenses, and budgets with a rich analytics dashboard.

## Tech Stack

| Layer    | Technology                                |
|----------|-------------------------------------------|
| Frontend | React 18 + Vite, React Router, Recharts   |
| Backend  | Node.js, Express                          |
| Database | SQLite via better-sqlite3                 |
| Auth     | JWT (JSON Web Tokens) + bcryptjs          |

---

## Project Structure

```
finance-tracker/
├── backend/
│   ├── src/
│   │   ├── middleware/
│   │   │   └── auth.js          # JWT authentication middleware
│   │   ├── routes/
│   │   │   ├── auth.js          # Register, login, /me
│   │   │   ├── categories.js    # Category CRUD
│   │   │   ├── transactions.js  # Transaction CRUD + filters
│   │   │   ├── budgets.js       # Budget CRUD + progress
│   │   │   └── dashboard.js     # Aggregated analytics
│   │   ├── db.js                # SQLite setup + schema
│   │   └── index.js             # Express entry point
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/
    │   ├── api/
    │   │   └── client.js        # Axios instance with JWT interceptors
    │   ├── context/
    │   │   └── AuthContext.jsx  # Auth state management
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── Dashboard.jsx    # Charts + summary cards
    │   │   ├── Transactions.jsx # CRUD + filtering
    │   │   ├── Budgets.jsx      # Progress bars + alerts
    │   │   └── Categories.jsx   # Income/expense categories
    │   ├── components/
    │   │   └── Layout.jsx       # Sidebar navigation
    │   ├── App.jsx              # Router + protected routes
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## Setup Instructions

### Prerequisites
- Node.js v18+ (v20+ recommended)
- npm v9+

---

### 1. Installing Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

---

### 2. Running the Backend

```bash
cd backend

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

The API will start at **http://localhost:3001**

> The SQLite database (`finance.db`) is auto-created on first run. No setup required.

---

### 3. Running the Frontend

```bash
cd frontend
npm run dev
```

The app will be available at **http://localhost:5173**

---

### 4. Database

No manual database setup is needed. SQLite creates the `backend/finance.db` file automatically when the server starts for the first time.

To reset the database, simply delete `backend/finance.db` and restart the server.

**Schema overview:**
- `users` — registered accounts
- `categories` — income/expense categories (per user)
- `transactions` — financial records with type, amount, date
- `budgets` — monthly spending limits per category

---

## API Endpoints

### Auth
| Method | Endpoint            | Description      |
|--------|---------------------|------------------|
| POST   | /api/auth/register  | Create account   |
| POST   | /api/auth/login     | Login            |
| GET    | /api/auth/me        | Current user     |

### Transactions
| Method | Endpoint                    | Description              |
|--------|-----------------------------|--------------------------|
| GET    | /api/transactions           | List (supports filters)  |
| POST   | /api/transactions           | Create                   |
| PUT    | /api/transactions/:id       | Update                   |
| DELETE | /api/transactions/:id       | Delete                   |

**Filter params:** `startDate`, `endDate`, `categoryId`, `type`

### Budgets
| Method | Endpoint           | Description                        |
|--------|--------------------|------------------------------------|
| GET    | /api/budgets       | List with current spending progress |
| POST   | /api/budgets       | Create                             |
| PUT    | /api/budgets/:id   | Update amount                      |
| DELETE | /api/budgets/:id   | Delete                             |

### Categories, Dashboard
| Method | Endpoint           | Description               |
|--------|--------------------|---------------------------|
| GET    | /api/categories    | List categories           |
| POST   | /api/categories    | Create                    |
| PUT    | /api/categories/:id| Update                    |
| DELETE | /api/categories/:id| Delete                    |
| GET    | /api/dashboard     | Full analytics payload    |

---

## Features

- **Authentication** — JWT-based register/login/logout with bcrypt password hashing
- **Transactions** — Full CRUD with filtering by date range, category, and type
- **Budgets** — Monthly budget limits with real-time progress tracking and over-budget alerts
- **Categories** — Customizable income/expense categories with color coding
- **Dashboard Charts:**
  - Expense distribution by category (Pie chart)
  - Monthly income vs expenses — last 6 months (Bar chart)
  - Budget vs actual spending (Horizontal bar chart)
  - Recent transactions list with category badges
- **Responsive layout** with dark theme

---

## Possible Future Improvements

- Export transactions to CSV/PDF
- Recurring transaction support
- Multi-currency support
- Email notifications for budget alerts
- Mobile app (React Native)
- OAuth (Google/GitHub) login
- Data import from bank CSV exports
