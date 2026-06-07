# Smart Department Workflow and Approval Management System

A web-based workflow management system developed using Node.js, Express.js, MongoDB, Mongoose, EJS, and Express Session. The system automates the approval process for departmental requests by allowing Students, Mentors, and HODs (Head of Department) to manage requests through a structured approval workflow.

## Features

### User Management
- User Registration
- Secure Login Authentication
- Password Hashing using bcryptjs
- Session Management
- Role-Based Access Control

### Roles

#### Student
- Create new requests
- Track request status
- View personal requests

#### Mentor
- View requests assigned for mentor approval
- Approve requests and forward them to HOD
- Reject requests

#### HOD
- View requests forwarded by mentors
- Approve requests
- Reject requests

### Request Workflow

```text
Student
   |
   ▼
Mentor Approval
   |
   ├── Reject → Rejected
   |
   ▼
HOD Approval
   |
   ├── Reject → Rejected
   |
   ▼
Approved
