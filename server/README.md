# 🔐 Authentication & User Management API

A comprehensive Node.js authentication and user management system with JWT tokens, email verification, password reset, and Swagger documentation

## ✨ Features

- **🔐 JWT Authentication** - Secure token-based authentication
- **📧 Email Verification** - Account activation via email
- **🔄 Token Refresh** - Automatic token refresh mechanism
- **🔒 Password Reset** - Secure password reset via email
- **👤 User Management** - Complete user profile management
- **📚 API Documentation** - Interactive Swagger UI documentation
- **🛡️ Security** - Password hashing, input validation, error handling
- **📧 Email Integration** - Nodemailer for transactional emails
- **🗄️ MongoDB** - Scalable database with Mongoose ODM

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- SMTP email service (Gmail, SendGrid, etc.)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/mtalhach/auth-and-user-management-server.git
   cd auth-and-user-management-server
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:

4. **Start the server**

   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

5. **Access API Documentation**
   Visit: `http://localhost:5274/api-docs`

## 📚 API Endpoints

### 🔐 Authentication

| Method | Endpoint                          | Description               |
| ------ | --------------------------------- | ------------------------- |
| `POST` | `/api/auth/register`              | Register a new user       |
| `POST` | `/api/auth/activate-user/{token}` | Activate user account     |
| `POST` | `/api/auth/login`                 | User login                |
| `GET`  | `/api/auth/logout`                | User logout               |
| `GET`  | `/api/auth/refresh-token`         | Refresh access token      |
| `POST` | `/api/auth/request/token/new`     | Resend verification email |

### 👤 User Management

| Method | Endpoint                         | Description           | Auth Required |
| ------ | -------------------------------- | --------------------- | ------------- |
| `GET`  | `/api/auth/me`                   | Get current user info | ✅            |
| `PUT`  | `/api/auth/update-user-info`     | Update user profile   | ✅            |
| `PUT`  | `/api/auth/update-user-password` | Update password       | ✅            |

### 🔒 Password Management

| Method | Endpoint                           | Description               |
| ------ | ---------------------------------- | ------------------------- |
| `POST` | `/api/auth/password/reset`         | Request password reset    |
| `POST` | `/api/auth/password/reset/{token}` | Reset password with token |

## 🔑 Authentication Flow

### 1. Registration

```json
POST /api/auth/register
{
  "name": "Talha Shafiq",
  "email": "talhashafiqch@gmail.com",
  "password": "123Admin",
  "confirmPassword": "123Admin"
}
```

### 2. Email Verification

```json
POST /api/auth/activate-user/{activationToken}
```

### 3. Login

```json
POST /api/auth/login
{
  "email": "talhashafiqch@gmail.com",
  "password": "123Admin"
}
```

### 4. Using Protected Endpoints

Add the access token to the `access-token` header:

```
Headers: {
  "access-token": "your_jwt_access_token_here"
}
```

## 🛡️ Security Features

- **Password Hashing** - bcrypt with salt rounds
- **JWT Tokens** - Secure token-based authentication
- **Email Validation** - Comprehensive email format validation
- **Input Validation** - Joi schema validation
- **Error Handling** - Centralized error handling
- **CORS Protection** - Cross-origin resource sharing
- **Rate Limiting** - Built-in protection against abuse

## 📧 Email Templates

The system includes email templates for:

- Account activation
- Password reset

Templates are located in the `mails/` directory and use EJS for dynamic content.

## 📖 API Documentation

Interactive API documentation is available at:

- **Swagger UI**: `http://localhost:5274/api-docs`
- **OpenAPI Spec**: Automatically generated from JSDoc comments

### Using Swagger UI

1. Start the server
2. Visit `http://localhost:5274/api-docs`
3. Register a user and get activation token
4. Activate your account
5. Login to get access token
6. Click "Authorize" and enter your access token
7. Test protected endpoints

## 📁 Project Structure

```
├── config/
│   ├── db.js              # Database configuration
│   └── swagger.js         # Swagger documentation config
├── controllers/
│   └── authController.js  # Authentication logic
├── middleware/
│   ├── auth.js            # Authentication middleware
│   ├── catchAsyncErrors.js # Error handling
│   └── formValidation/    # Input validation
├── models/
│   └── userModel.js       # User database model
├── routes/
│   └── authRouter.js      # API routes
├── services/
│   └── userService.js     # Business logic
├── utils/
│   ├── errorHandler.js    # Error handling utilities
│   ├── jwtToken.js        # JWT token utilities
│   ├── sendMail.js        # Email utilities
│   └── validationResponse.js # Validation helpers
├── mails/                 # Email templates
├── uploads/               # File uploads
└── index.js              # Server entry point
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**M Talha Ch**

- GitHub: [@mtalhach](https://github.com/mtalhach)

## 🙏 Acknowledgments

- Express.js for the web framework
- Mongoose for MongoDB ODM
- JWT for authentication
- Nodemailer for email functionality
- Swagger for API documentation
- bcryptjs for password hashing

## 📞 Support

If you have any questions or need help, please open an issue on GitHub or contact the author.

---

⭐ **Star this repository if you find it helpful!**
