# 🇰🇪 Kenya Todo App

A beautiful, feature-rich todo application with Kenya-themed UI, user authentication, due date tracking, and alarm notifications.

![Kenya Flag](https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Flag_of_Kenya.svg/320px-Flag_of_Kenya.svg.png)

## ✨ Features

### 🎨 Kenya-Themed Design
- Authentic Kenya flag colors (Red, Black, Green, White)
- Responsive and modern UI
- Smooth animations and transitions

### 👤 User Authentication
- Secure user registration and login
- Each user sees only their own tasks
- Token-based authentication

### 📅 Due Dates & Times
- Set specific due dates for tasks
- Set specific completion times
- Visual indicators for overdue tasks
- Created date/time tracking

### 🔔 Alarm Integration
- Browser notifications for overdue tasks
- Visual alarm modal popup
- Audio alerts
- Automatic overdue checking

### ✅ Task Management
- Create, read, update, delete tasks
- Mark tasks as complete/incomplete
- Filter by: All, Pending, Completed, Overdue
- Statistics dashboard
- Real-time validation

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/aasz253/do-to-list-CRUDE.git
cd do-to-list-CRUDE

# Install dependencies
npm install

# Start the server
npm start
```

### Access the App

Open your browser and navigate to:
```
http://localhost:3000
```

## 📖 API Documentation

### Authentication

#### Register
```http
POST /api/register
Content-Type: application/json

{
  "username": "your_username",
  "password": "your_password"
}
```

#### Login
```http
POST /api/login
Content-Type: application/json

{
  "username": "your_username",
  "password": "your_password"
}
```

**Response:**
```json
{
  "id": 1,
  "username": "your_username",
  "token": "abc123..."
}
```

#### Logout
```http
POST /api/logout
Authorization: <token>
```

### Tasks

**Note:** All task endpoints require the `Authorization` header with the token.

#### Create Task
```http
POST /api/tasks
Authorization: <token>
Content-Type: application/json

{
  "title": "Complete project report",
  "due_date": "2026-03-30T14:00:00"
}
```

#### Get All Tasks
```http
GET /api/tasks
Authorization: <token>
```

#### Get Overdue Tasks
```http
GET /api/tasks/overdue
Authorization: <token>
```

#### Update Task
```http
PUT /api/tasks/:id
Authorization: <token>
Content-Type: application/json

{
  "title": "Updated title",
  "completed": 1,
  "due_date": "2026-03-31T18:00:00"
}
```

#### Delete Task
```http
DELETE /api/tasks/:id
Authorization: <token>
```

## 🎯 Task Object Schema

| Field | Type | Description |
|-------|------|-------------|
| id | INTEGER | Unique task identifier |
| user_id | INTEGER | Owner user ID |
| title | TEXT | Task description |
| completed | INTEGER | 0 = pending, 1 = completed |
| due_date | DATETIME | Due date and time (optional) |
| created_at | DATETIME | Creation timestamp |

## 🔒 Security Features

- Password hashing with SHA-256
- Token-based session management
- User-scoped data isolation
- Input validation and sanitization
- Empty task prevention

## 📱 Browser Compatibility

- Chrome (recommended)
- Firefox
- Edge
- Safari

## 🔔 Notifications

The app uses the Web Notifications API. When prompted, allow notifications to receive overdue task alerts.

## 🛠️ Technologies Used

- **Backend:** Node.js, Express
- **Database:** SQLite3
- **Frontend:** HTML5, CSS3, JavaScript
- **Authentication:** Token-based (custom SHA-256)

## 📂 Project Structure

```
├── index.html      # Frontend UI
├── server.js       # Express API server
├── package.json    # Dependencies
└── todos.db        # SQLite database (auto-created)
```

## 🌐 Environment Variables

The app uses default settings. For production, consider:

```bash
PORT=3000           # Server port
```

## 📝 License

MIT License

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

**Harambee** - Together We Can 🇰🇪
