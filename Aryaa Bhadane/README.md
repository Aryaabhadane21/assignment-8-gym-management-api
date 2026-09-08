# 🏋️‍♂️ Gym & Fitness Center Management REST API

> **Author:** Aryaa Bhadane  
> **Course / Track:** Backend Development — ITM Assignment 08  
> **Tech Stack:** Node.js, Express.js, MongoDB (Local Instance), Mongoose, Passport.js (Local Strategy), Express-Session, bcryptjs, dotenv, CORS  

---

## 📌 Project Overview

This is a backend RESTful API for a **Gym & Fitness Center Management System**. It manages the entire lifecycle of gym memberships, workout class schedules, capacity-constrained class bookings, and session-based user authentication.

### Core Highlights:
- **Persistent Membership Lifecycle Management**: Automatic calculation of membership expiration dates (30 days per month), flexible renewal logic extending from the later of today or current expiry, and status tracking (`active`, `expired`, `frozen`).
- **Class Booking & Capacity Constraints**: Real-time business validation preventing class over-enrollment (`enrolledMembers.length >= maxCapacity`), duplicate booking prevention, and enrollment protection for expired members.
- **Stateful Authentication**: Implemented using Passport.js Local Strategy and `express-session`, securing passwords with `bcryptjs` hashing (10 salt rounds) and storing session cookies.
- **Relational Data Modeling with Mongoose**: Cross-document references and Mongoose `.populate()` linking `User` members with `FitnessClass` schedules.

---

## 🏗️ Project Architecture

```text
Aryaa Bhadane/
├── config/
│   ├── db.js                # Local MongoDB Mongoose connection handler
│   └── passport.js          # Passport Local strategy, serialization & deserialization
├── controllers/
│   ├── authController.js    # Register (auto-expiry calc), Login, Me profile, Logout
│   ├── classController.js   # Class CRUD, capacity validation, enrollment & cancellation
│   └── memberController.js  # Membership renewal & expired members query
├── middleware/
│   ├── authMiddleware.js    # Session-based authentication check (req.isAuthenticated())
│   └── checkActiveMember.js # Membership expiry & status validation for bookings
├── models/
│   ├── FitnessClass.js      # Fitness class schema with enrolledMembers ref array
│   └── User.js              # User schema with pre-save hashing & expiry status hooks
├── routes/
│   ├── authRoutes.js        # Auth endpoint routing (/api/auth)
│   ├── classRoutes.js       # Class endpoint routing (/api/classes)
│   └── memberRoutes.js      # Membership management routing (/api/members)
├── .env                     # Local environment variables
├── .env.example             # Template environment variables
├── .gitignore               # Excludes node_modules, .env, and OS files
├── package.json             # NPM dependencies and scripts
├── server.js                # Express app entry point & middleware orchestrator
├── README.md                # Project documentation & API guide
└── gym_management_api.postman_collection.json # Exported Postman test suite
```

---

## ⚙️ Prerequisites & Installation

### 1. Prerequisites
- **Node.js** (v18.x or higher)
- **npm** (v9.x or higher)
- **MongoDB** running locally on port `27017`

### 2. Installation Steps

1. Navigate to the project directory:
   ```bash
   cd "Aryaa Bhadane"
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Create a `.env` file (or use the provided `.env` / `.env.example`):
   ```env
   PORT=5001
   MONGO_URI=mongodb://127.0.0.1:27017/gym-management-db
   SESSION_SECRET=gym_management_super_secret_session_key_2026
   NODE_ENV=development
   ```

4. Start Local MongoDB (if not running):
   ```bash
   # On macOS via Homebrew:
   brew services start mongodb-community
   # Or directly:
   mongod --dbpath /usr/local/var/mongodb
   ```

5. Run the Server:
   ```bash
   # Development mode with nodemon auto-restart:
   npm run dev

   # Production mode:
   npm start
   ```

   Server will run at `http://localhost:5001`.

---

## 🗄️ Database Schemas

### 1. Member / User Model (`models/User.js`)
| Field | Type | Description |
|---|---|---|
| `username` | String | Unique, trimmed username (Required) |
| `email` | String | Unique, lowercase, validated email (Required) |
| `password` | String | Salted & hashed password using bcrypt (Required) |
| `membershipTier` | String | `Bronze`, `Silver`, `Gold`, `Platinum` (Default: `Bronze`) |
| `membershipStatus` | String | `active`, `expired`, `frozen` (Default: `active`) |
| `membershipExpiryDate` | Date | Automatically calculated expiry timestamp (Required) |
| `emergencyContact` | String | Optional emergency contact information |
| `timestamps` | Date | Auto-generated `createdAt` and `updatedAt` |

### 2. Fitness Class Model (`models/FitnessClass.js`)
| Field | Type | Description |
|---|---|---|
| `title` | String | Workout class title e.g. "HIIT Bootcamp" (Required) |
| `trainerName` | String | Assigned trainer name (Required) |
| `scheduleDate` | Date | Class scheduled date and time (Required) |
| `durationMinutes` | Number | Duration in minutes (Default: `60`, Min: `15`) |
| `maxCapacity` | Number | Maximum participant capacity (Required, Min: `1`) |
| `enrolledMembers` | Array of ObjectIds | References to `User` model |
| `timestamps` | Date | Auto-generated `createdAt` and `updatedAt` |

---

## 📋 API Endpoints Reference

### 🔐 1. Authentication (`/api/auth`)

#### `POST /api/auth/register`
- **Description:** Registers a new member and auto-calculates expiry date based on `durationMonths * 30 days`.
- **Request Body:**
  ```json
  {
    "username": "fit_sam",
    "email": "sam@fit.com",
    "password": "mypassword",
    "membershipTier": "Gold",
    "durationMonths": 3,
    "emergencyContact": "+1-555-0199"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Member registered successfully",
    "data": {
      "_id": "6601a2b3c4d5e6f7a8b9c0d1",
      "username": "fit_sam",
      "email": "sam@fit.com",
      "membershipTier": "Gold",
      "membershipStatus": "active",
      "membershipExpiryDate": "2026-07-09T05:00:00.000Z",
      "remainingDays": 90
    }
  }
  ```

#### `POST /api/auth/login`
- **Description:** Authenticates user credentials using Passport Local Strategy and establishes a session.
- **Request Body:**
  ```json
  {
    "username": "fit_sam",
    "password": "mypassword"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "_id": "6601a2b3c4d5e6f7a8b9c0d1",
      "username": "fit_sam",
      "email": "sam@fit.com",
      "membershipTier": "Gold",
      "membershipStatus": "active",
      "membershipExpiryDate": "2026-07-09T05:00:00.000Z",
      "remainingDays": 90
    }
  }
  ```

#### `GET /api/auth/me`
- **Description:** Fetches logged-in member's profile and real-time remaining membership days.
- **Headers:** Session cookie (`connect.sid`)
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "_id": "6601a2b3c4d5e6f7a8b9c0d1",
      "username": "fit_sam",
      "email": "sam@fit.com",
      "membershipTier": "Gold",
      "membershipStatus": "active",
      "membershipExpiryDate": "2026-07-09T05:00:00.000Z",
      "remainingDays": 90
    }
  }
  ```

#### `POST /api/auth/logout`
- **Description:** Clears session and logs out user.
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Logged out successfully"
  }
  ```

---

### 🏋️‍♂️ 2. Fitness Classes & Booking (`/api/classes`)

#### `GET /api/classes`
- **Description:** Fetch all workout classes. Supports optional query filter `?trainer=John` (case-insensitive).
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "count": 2,
    "data": [
      {
        "_id": "6602b3c4d5e6f7a8b9c0d1e2",
        "title": "HIIT Bootcamp",
        "trainerName": "John Davis",
        "scheduleDate": "2026-04-20T08:00:00.000Z",
        "durationMinutes": 45,
        "maxCapacity": 2,
        "enrolledMembers": []
      }
    ]
  }
  ```

#### `GET /api/classes/:id`
- **Description:** Fetch detailed workout class information with populated enrolled members.
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "_id": "6602b3c4d5e6f7a8b9c0d1e2",
      "title": "HIIT Bootcamp",
      "trainerName": "John Davis",
      "scheduleDate": "2026-04-20T08:00:00.000Z",
      "durationMinutes": 45,
      "maxCapacity": 2,
      "enrolledMembers": [
        {
          "_id": "6601a2b3c4d5e6f7a8b9c0d1",
          "username": "fit_sam",
          "email": "sam@fit.com",
          "membershipTier": "Gold",
          "membershipStatus": "active"
        }
      ]
    }
  }
  ```

#### `POST /api/classes`
- **Description:** Create a new workout class.
- **Request Body:**
  ```json
  {
    "title": "Zumba Cardio",
    "trainerName": "Maria",
    "scheduleDate": "2026-04-15T09:00:00.000Z",
    "durationMinutes": 60,
    "maxCapacity": 20
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Fitness class created successfully",
    "data": { ... }
  }
  ```

#### `POST /api/classes/:id/book`
- **Description:** Enrolls the logged-in member into the class.
- **Protected by:** `isAuthenticated` and `checkActiveMember`
- **Business Validations:**
  - Rejects if member is not logged in (`401 Unauthorized`).
  - Rejects if member is expired or frozen (`400 Bad Request: Membership has expired`).
  - Rejects if member is already booked (`400 Bad Request: You are already enrolled in this class`).
  - Rejects if class is full (`400 Bad Request: Class capacity reached`).
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Successfully enrolled in class",
    "data": { ... }
  }
  ```

#### `DELETE /api/classes/:id/cancel`
- **Description:** Cancels member booking from class.
- **Protected by:** `isAuthenticated`
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Class booking cancelled successfully",
    "data": { ... }
  }
  ```

---

### 💳 3. Membership Management (`/api/members`)

#### `PATCH /api/members/:id/renew`
- **Description:** Extends membership expiry date by `additionalMonths` from either **today** or the **current expiry date** (whichever is later), and updates tier/status.
- **Request Body:**
  ```json
  {
    "additionalMonths": 6,
    "tier": "Platinum"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Membership successfully renewed for 6 month(s)",
    "data": {
      "_id": "6601a2b3c4d5e6f7a8b9c0d1",
      "username": "fit_sam",
      "membershipTier": "Platinum",
      "membershipStatus": "active",
      "membershipExpiryDate": "2026-10-15T05:00:00.000Z",
      "remainingDays": 270
    }
  }
  ```

#### `GET /api/members/expired`
- **Description:** Returns all members whose `membershipExpiryDate < current date` or `membershipStatus === 'expired'`.
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "count": 1,
    "data": [
      {
        "_id": "6601a2b3c4d5e6f7a8b9c0d9",
        "username": "expired_user",
        "email": "old@fit.com",
        "membershipTier": "Bronze",
        "membershipStatus": "expired",
        "membershipExpiryDate": "2024-01-01T00:00:00.000Z",
        "remainingDays": 0
      }
    ]
  }
  ```

---

## 🧪 Testing & Validation Guide

The test suite validates all requirements specified in Assignment 8:

1. **Auto-Expiry Calculation**:
   - Registering a user with `durationMonths: 1` sets `membershipExpiryDate` to exactly 30 days (`1 * 30 * 24 * 60 * 60 * 1000` ms) in the future.
2. **Class Capacity Constraint**:
   - Creating a class with `maxCapacity: 2`.
   - Member 1 books -> Success (`200 OK`).
   - Member 2 books -> Success (`200 OK`).
   - Member 3 books -> Fails with `400 Bad Request` and `{ "message": "Class capacity reached" }`.
3. **Expired Membership Restrictions**:
   - Members with past `membershipExpiryDate` fail booking with `400 Bad Request: Membership has expired`.
   - `GET /api/members/expired` retrieves all expired accounts.
4. **Postman Collection**:
   - Import `gym_management_api.postman_collection.json` directly into Postman to run all requests with pre-configured request payloads.
