# Micro Finance Management System

A production-ready microfinance web application built with Node.js, Express, MongoDB, and EJS. This system provides separate authentication and role-based access control for both customers and bank administrators.

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Database Models](#database-models)
- [Authentication & Authorization](#authentication--authorization)
- [Loan Application Lifecycle](#loan-application-lifecycle)
- [Security Considerations](#security-considerations)
- [Future Enhancements](#future-enhancements)

---

## 🎯 Project Overview

This system bridges the gap between microfinance institutions and customers by providing:
- **Customer Portal**: Apply for loans, track applications, manage profile, verify KYC
- **Admin Dashboard**: Manage customers, approve/reject loan applications, verify KYC, view analytics

The application follows real-world banking workflows with a focus on data security and compliance.

---

## ✨ Features

### Customer Features
- ✅ User Registration & Authentication (JWT-based)
- ✅ Profile Management
- ✅ KYC Verification Submission
- ✅ Browse Available Loan Products
- ✅ Apply for Loans
- ✅ Track Loan Application Status
- ✅ View Active Loans & EMI Schedule
- ✅ Dashboard with Statistics
- ✅ Responsive UI

### Admin Features
- ✅ Secure Admin Portal with Role-Based Access
- ✅ Comprehensive Dashboard with Analytics
- ✅ Customer Management (View, Search, Filter)
- ✅ KYC Verification Workflow
- ✅ Loan Application Review & Approval
- ✅ Loan Rejection with Remarks
- ✅ Loan Activation & EMI Tracking
- ✅ Create New Admin Users
- ✅ Activity Logging & Audit Trail
- ✅ Real-time Statistics

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | HTML5, Tailwind CSS, JavaScript, EJS |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB with Mongoose |
| **Authentication** | JWT (JSON Web Tokens), bcryptjs |
| **Security** | Helmet, CORS, Input Validation |
| **Tools** | VS Code, Postman, Git |

---

## 📁 Project Structure

```
micro-finance-system/
│
├── server/
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── models/
│   │   ├── Customer.js           # Customer schema with password hashing
│   │   ├── Admin.js              # Admin schema with permissions
│   │   ├── Loan.js               # Loan product schema
│   │   └── LoanApplication.js    # Loan application schema
│   ├── controllers/
│   │   ├── authController.js     # Authentication logic
│   │   ├── customerController.js # Customer operations
│   │   ├── adminController.js    # Admin operations
│   │   └── loanController.js     # Loan management
│   ├── routes/
│   │   ├── authRoutes.js         # Auth endpoints
│   │   ├── customerRoutes.js     # Customer endpoints
│   │   ├── adminRoutes.js        # Admin endpoints
│   │   └── loanRoutes.js         # Loan endpoints
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT verification
│   │   ├── roleMiddleware.js     # RBAC middleware
│   │   └── errorMiddleware.js    # Error handling
│   ├── utils/
│   │   └── emiCalculator.js      # EMI calculation utility
│   ├── app.js                    # Express app configuration
│   └── server.js                 # Server entry point
│
├── views/
│   ├── customer/
│   │   ├── login.ejs
│   │   ├── register.ejs
│   │   └── dashboard.ejs
│   ├── admin/
│   │   ├── login.ejs
│   │   └── dashboard.ejs
│   └── shared/
│       ├── layout.ejs
│       ├── body.ejs
│       └── about.ejs
│
├── public/
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── main.js
│
├── .env                          # Environment variables
├── .gitignore
├── package.json
└── README.md
```

---

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Steps

1. **Clone or Extract the Project**
   ```bash
   cd micro-finance-system
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Set Up Environment Variables**
   Create a `.env` file in the root directory:
   ```
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/micro-finance-system
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
   JWT_EXPIRY=7d
   ```

4. **Ensure MongoDB is Running**
   ```bash
   # If using local MongoDB
   mongod
   ```

---

## ⚙️ Configuration

### Environment Variables
Update `.env` with your configuration:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/micro-finance-system
# For MongoDB Atlas: mongodb+srv://user:password@cluster.mongodb.net/db

# JWT
JWT_SECRET=your_secret_key_here
JWT_EXPIRY=7d

# Admin
ADMIN_SECRET_KEY=admin_secret_key_here
```

### MongoDB Connection
The application uses Mongoose for database operations. Ensure MongoDB is running before starting the server.

---

## 🚀 Running the Application

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### Default Port
Server will run on `http://localhost:5000`

### Health Check
```
GET http://localhost:5000/api/health
```

---

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### Customer Registration
```
POST /auth/customer/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "password": "password123",
  "confirmPassword": "password123",
  "street": "123 Main St",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001",
  "monthlyIncome": 50000,
  "occupation": "Software Engineer",
  "employmentType": "salaried"
}
```

#### Customer Login
```
POST /auth/customer/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Admin Login
```
POST /auth/admin/login
Content-Type: application/json

{
  "email": "admin@test.com",
  "password": "Admin@123"
}
```

### Loan Endpoints

#### Get All Loans
```
GET /loans
```

#### Apply for Loan
```
POST /loans/apply
Authorization: Bearer <token>
Content-Type: application/json

{
  "loanId": "507f1f77bcf86cd799439011",
  "loanAmount": 50000,
  "tenureMonths": 12,
  "purpose": "Business expansion"
}
```

### Customer Endpoints

#### Get Profile
```
GET /customers/profile
Authorization: Bearer <token>
```

#### Update Profile
```
PUT /customers/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "John",
  "monthlyIncome": 75000
}
```

#### Get Dashboard
```
GET /customers/dashboard
Authorization: Bearer <token>
```

### Admin Endpoints

#### Get Dashboard
```
GET /admin/dashboard
Authorization: Bearer <token>
```

#### Get All Customers
```
GET /admin/customers?page=1&limit=10
Authorization: Bearer <token>
```

#### Approve Loan Application
```
PUT /admin/application/:id/approve
Authorization: Bearer <token>
Content-Type: application/json

{
  "remarks": "Documents verified, approved for disbursement"
}
```

#### Reject Loan Application
```
PUT /admin/application/:id/reject
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Income insufficient for the requested amount"
}
```

#### Verify KYC
```
PUT /admin/customer/:id/kyc
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "verified"
}
```

---

## 🗄️ Database Models

### Customer Model
```javascript
{
  firstName: String (required),
  lastName: String (required),
  email: String (unique, required),
  phone: String (unique, required),
  password: String (hashed, required),
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  kycStatus: String (pending|verified|rejected),
  aadharNumber: String (unique),
  panNumber: String (unique),
  monthlyIncome: Number (required),
  occupation: String (required),
  employmentType: String (required),
  accountStatus: String (active|inactive|suspended),
  isVerified: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Admin Model
```javascript
{
  firstName: String (required),
  lastName: String (required),
  email: String (unique, required),
  phone: String (required),
  password: String (hashed, required),
  role: String (super_admin|loan_officer|customer_service|compliance_officer),
  permissions: {
    canApproveLoans: Boolean,
    canVerifyKYC: Boolean,
    canManageAdmins: Boolean,
    canViewAnalytics: Boolean,
    canManageCustomers: Boolean
  },
  department: String (required),
  accountStatus: String (active|inactive|suspended),
  lastLoginAt: Date,
  loginAttempts: Number,
  lockUntil: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### LoanApplication Model
```javascript
{
  customerId: ObjectId (required),
  loanId: ObjectId (required),
  applicationNumber: String (unique),
  loanAmount: Number (required),
  tenureMonths: Number (required),
  purpose: String (required),
  status: String (pending|under_review|approved|rejected|active|closed),
  interestRate: Number (required),
  monthlyEMI: Number,
  totalInterest: Number,
  totalAmount: Number,
  approvalDate: Date,
  rejectionDate: Date,
  rejectionReason: String,
  approvedBy: ObjectId (ref: Admin),
  emiStartDate: Date,
  emiEndDate: Date,
  emisPaid: Number,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔐 Authentication & Authorization

### JWT Flow
1. User provides email and password
2. Server verifies credentials and password hash
3. Server generates JWT token (valid for 7 days)
4. Client stores token in localStorage
5. Client includes token in Authorization header for protected routes

### Role-Based Access Control (RBAC)
Admins have different roles with specific permissions:
- **Super Admin**: Full access
- **Loan Officer**: Can approve/reject loans, view analytics
- **Compliance Officer**: Can verify KYC, view analytics
- **Customer Service**: Can manage customers

### Protected Routes
All customer and admin routes require valid JWT token in header:
```
Authorization: Bearer <jwt_token>
```

---

## 💰 Loan Application Lifecycle

### Application States
```
[Pending] → [Under Review] → [Approved/Rejected]
                  ↓
            [Active] → [Closed]
```

### Workflow
1. **Pending**: Customer applies, awaits admin review
2. **Under Review**: Admin is reviewing application
3. **Approved**: Admin approves, customer notified
4. **Rejected**: Admin rejects with remarks
5. **Active**: Loan approved and disbursed, EMI cycle begins
6. **Closed**: All EMIs paid, loan closed

### EMI Calculation
Formula: `EMI = [P × R × (1+R)^N] / [(1+R)^N - 1]`
- P = Principal (Loan Amount)
- R = Monthly Interest Rate (Annual Rate / 100 / 12)
- N = Number of Months (Tenure)

---

## 🔒 Security Considerations

### Password Security
- Passwords hashed using bcryptjs (10 rounds)
- Never stored in plaintext
- Password field excluded from default queries

### JWT Security
- Tokens stored in localStorage (client-side)
- Tokens expire after 7 days
- Invalid/expired tokens rejected

### Data Protection
- Sensitive data masked in responses (Aadhar, PAN)
- CORS enabled for controlled access
- Helmet.js for HTTP headers security
- Input validation and sanitization

### Database Security
- Mongoose schema validation
- Unique index enforcement
- Query injection prevention

### Account Protection
- Admin account lockout after 5 failed login attempts
- 30-minute lockout period
- Activity logging for admins

---

## 🔍 Testing with Postman

### Steps
1. Import API collection into Postman
2. Create environment variables for `base_url`, `token`, `admin_token`
3. First request: Login to get token
4. Use token in subsequent requests
5. Test different scenarios (approve, reject, activate loans)

### Sample Test Sequence
1. Register customer → Get token
2. Get customer profile
3. Get available loans
4. Apply for loan
5. Admin login → Get admin token
6. View loan application
7. Approve/Reject application
8. Activate approved loan

---

## 🚧 Future Enhancements

- [ ] Payment gateway integration
- [ ] SMS/Email notifications
- [ ] Document upload & storage
- [ ] Advanced analytics & reporting
- [ ] Loan disbursement tracking
- [ ] EMI payment tracking
- [ ] User notifications dashboard
- [ ] Audit trail for all operations
- [ ] Mobile app (React Native)
- [ ] Real-time notifications (Socket.io)
- [ ] Multi-factor authentication
- [ ] Biometric authentication
- [ ] Loan recommendation engine
- [ ] Credit scoring algorithm
- [ ] API rate limiting

---

## 📝 License

This project is proprietary and created for educational and demonstration purposes.

---

## 👨‍💻 Development Notes

### Code Standards
- ES6+ JavaScript syntax
- Comments for complex logic
- Async/await for promises
- Error handling middleware
- Centralized error responses

### Best Practices
- MVC architecture adherence
- DRY (Don't Repeat Yourself)
- Separation of concerns
- Input validation at all layers
- Consistent naming conventions

### Debugging
Enable debug mode:
```javascript
// In server.js
process.env.DEBUG = '*';
```

---

## 📞 Support & Contact

For issues, questions, or suggestions:
- Email: support@microfinance.com
- Phone: 1800-123-4567
- Documentation: [Read README.md]

---

## 🎓 Educational Value

This project demonstrates:
- Full-stack web application development
- RESTful API design
- Database modeling with MongoDB
- Authentication & authorization patterns
- Production-ready code structure
- Real-world fintech workflows
- Security best practices

---

**Last Updated**: January 2024
**Version**: 1.0.0
**Status**: Production Ready
