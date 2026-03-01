# Quick Delivery POS System - Pages Structure Guide

This comprehensive guide explains the structure, purpose, and functionality of each page in the Quick Delivery POS System.

## Table of Contents
1. [System Overview](#system-overview)
2. [User Roles & Access Control](#user-roles--access-control)
3. [Main Pages Structure](#main-pages-structure)
4. [API Routes](#api-routes)
5. [Component Architecture](#component-architecture)
6. [Navigation Flow](#navigation-flow)

## System Overview

The Quick Delivery POS System is a multi-role e-commerce platform built with Next.js 14, featuring:
- **Firebase Authentication** with email verification
- **Prisma ORM** with MySQL database
- **Role-based access control** (ADMIN, VENDOR, CUSTOMER, DRIVER)
- **Material Design** components
- **Responsive design** with Tailwind CSS

## User Roles & Access Control

### Role Hierarchy
1. **ADMIN** - Full system access, manages all entities
2. **VENDOR** - Manages own products and orders
3. **CUSTOMER** - Browses products, places orders
4. **DRIVER** - Handles order delivery (planned feature)

### Access Control Logic
- Each page checks user authentication and role permissions
- Automatic redirection based on user role after login
- Email verification required for all users
- Role-based component rendering

## Main Pages Structure

### 1. Root Page (`/`)
**File:** `src/app/page.js`
**Purpose:** Entry point and role-based redirector
**Functionality:**
- Detects Firebase email verification links
- Redirects users based on their role:
  - ADMIN → `/dashboard`
  - VENDOR → `/vendor-dashboard`
  - CUSTOMER → `/customer`
- Shows loading spinner during authentication check
- Handles unauthenticated users → `/login`

### 2. Authentication Pages

#### Login Page (`/login`)
**File:** `src/app/login/page.js`
**Purpose:** User authentication
**Features:**
- Email/password login form
- Password visibility toggle
- Role-based redirection after login
- Logout functionality for testing
- Link to registration page
- Responsive design with animations

#### Registration Page (`/register`)
**File:** `src/app/register/page.js`
**Purpose:** New user registration
**Features:**
- Complete registration form (name, email, phone, role, type)
- Role selection dropdown (ADMIN, VENDOR, CUSTOMER, DRIVER)
- Password confirmation validation
- Form validation (minimum password length, matching passwords)
- Redirects to verification page after successful registration

#### Email Verification Page (`/verify`)
**File:** `src/app/verify/page.js`
**Purpose:** Email verification handling
**Features:**
- Processes Firebase verification links
- Three-step verification process:
  1. **Verifying** - Shows loading spinner
  2. **Success** - Confirms verification, auto-redirects to login
  3. **Error** - Shows error message with retry options
- Error boundary for handling verification failures
- User information display after successful verification

### 3. Dashboard Pages

#### Admin Dashboard (`/dashboard`)
**File:** `src/app/dashboard/page.js`
**Purpose:** Main admin control panel
**Access:** ADMIN role only
**Features:**
- Tabbed interface with multiple sections:
  - **Overview** - Dashboard statistics and analytics
  - **Customers** - Customer management
  - **Products** - Product management
  - **Vendors** - Vendor management
  - **Orders** - Order management
  - **Settings** - System settings
- Real-time statistics display
- Role-based access control
- Responsive design with animations

#### Vendor Dashboard (`/vendor-dashboard`)
**File:** `src/app/vendor-dashboard/page.js`
**Purpose:** Vendor-specific management interface
**Access:** VENDOR role only
**Features:**
- Product management for vendor's own products
- Order management for vendor's orders
- Vendor-specific statistics
- Uses `VendorProductManagement` component

#### Customer Dashboard (`/customer`)
**File:** `src/app/customer/page.js`
**Purpose:** Customer shopping interface
**Access:** CUSTOMER role only
**Features:**
- Tabbed interface:
  - **Products** - Product catalog with search
  - **My Orders** - Order history
  - **Favorites** - Saved products
  - **Profile** - Customer profile management
- Shopping cart functionality
- Product search and filtering
- Mobile-responsive design
- User profile display

### 4. Sub-pages

#### Product Management (`/dashboard/products`)
**File:** `src/app/dashboard/products/page.js`
**Purpose:** Product management interface
**Access:** ADMIN, SUPER_ADMIN, VENDOR roles
**Features:**
- Role-based component rendering:
  - VENDOR → `VendorProductManagement`
  - ADMIN/SUPER_ADMIN → `ProductManagement`
- Product CRUD operations
- Category and subcategory management

#### Vendor Management (`/dashboard/vendors`)
**File:** `src/app/dashboard/vendors/page.js`
**Purpose:** Vendor management for admins
**Access:** ADMIN, SUPER_ADMIN roles only
**Features:**
- Vendor registration and approval
- Vendor performance metrics
- Vendor product oversight

#### Settings Page (`/dashboard/settings`)
**File:** `src/app/dashboard/settings/page.js`
**Purpose:** User settings and preferences
**Access:** All authenticated users
**Features:**
- Profile information editing
- Password change functionality
- Notification preferences
- Privacy settings
- Account management

#### Material Customer Page (`/customer/material`)
**File:** `src/app/customer/material/page.js`
**Purpose:** Material Design customer interface
**Features:**
- Alternative customer interface using Material Design
- Uses `MaterialCustomerDashboard` component

## API Routes

### Authentication API (`/api/auth/verify`)
**File:** `src/app/api/auth/verify/route.js`
**Purpose:** Email verification processing
**Methods:**
- `POST` - Processes Firebase verification codes

### User Management API (`/api/users`)
**File:** `src/app/api/users/route.js`
**Purpose:** User CRUD operations
**Methods:**
- `GET` - Fetch user by UID or email
- `POST` - Create new user
- `PUT` - Update user information

### Product API (`/api/products`)
**File:** `src/app/api/products/route.js`
**Purpose:** Product data management
**Methods:**
- `GET` - Fetch products, categories, subcategories
- `POST` - Create new products

### Admin APIs

#### Admin Products (`/api/admin/products`)
**File:** `src/app/api/admin/products/route.js`
**Purpose:** Admin product management
**Features:**
- Advanced filtering and search
- Pagination support
- Approval status management

#### Admin Customers (`/api/admin/customers`)
**File:** `src/app/api/admin/customers/route.js`
**Purpose:** Customer management for admins
**Features:**
- Customer listing and filtering
- Customer status management

### Customer APIs

#### Customer Products (`/api/customer/products`)
**File:** `src/app/api/customer/products/route.js`
**Purpose:** Customer product browsing
**Features:**
- Public product catalog
- Category-based filtering
- Search functionality

## Component Architecture

### Layout Components
- **DashboardLayout** - Main dashboard wrapper
- **CustomerLayout** - Customer interface wrapper
- **Sidebar** - Navigation sidebar with role-based menus

### Feature Components
- **ProductManagement** - Admin product management
- **VendorProductManagement** - Vendor-specific product management
- **CustomerManagement** - Customer management for admins
- **ProductCatalog** - Customer product browsing
- **OrderHistory** - Customer order tracking
- **CustomerProfile** - Customer profile management

### UI Components
- **LoadingSpinner** - Loading indicators
- **AnimatedButton** - Interactive buttons
- **AnimatedCard** - Card components with animations
- **NotificationSystem** - System notifications

## Navigation Flow

### Authentication Flow
1. **Unauthenticated User** → `/login`
2. **Registration** → `/register` → `/verify` → `/login`
3. **Login Success** → Role-based redirect:
   - ADMIN → `/dashboard`
   - VENDOR → `/vendor-dashboard`
   - CUSTOMER → `/customer`

### Dashboard Navigation
- **Admin Dashboard** → Multiple tabs (Overview, Customers, Products, Vendors, Orders, Settings)
- **Vendor Dashboard** → Product management interface
- **Customer Dashboard** → Shopping interface with tabs (Products, Orders, Favorites, Profile)

### Access Control
- Each page validates user authentication and role
- Automatic redirection for unauthorized access
- Email verification required for all protected routes

## Key Features

### Security
- Firebase Authentication with email verification
- Role-based access control
- Protected API routes
- Input validation and sanitization

### User Experience
- Responsive design for all devices
- Smooth animations and transitions
- Loading states and error handling
- Intuitive navigation

### Scalability
- Modular component architecture
- API-first design
- Database optimization with Prisma
- Role-based feature access

## Development Notes

### File Structure
```
src/app/
├── page.js                 # Root page
├── login/page.js          # Login
├── register/page.js       # Registration
├── verify/page.js         # Email verification
├── dashboard/            # Admin dashboard
├── vendor-dashboard/      # Vendor dashboard
├── customer/             # Customer interface
└── api/                  # API routes
```

### Dependencies
- Next.js 14 with App Router
- Firebase Authentication
- Prisma ORM with MySQL
- Tailwind CSS for styling
- Framer Motion for animations
- Lucide React for icons

This structure provides a comprehensive, scalable POS system with clear separation of concerns and role-based access control.
