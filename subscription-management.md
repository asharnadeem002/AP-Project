# Subscription Management and User Deactivation

This document outlines the implementation of two major features in the SnapTrace application:

1. Subscription approval workflow
2. User account deactivation system

## 1. Subscription Approval Workflow

### Overview

The subscription approval system includes:

- Users can request to subscribe to a plan
- Admins review and either approve or reject subscription requests
- Email notifications are sent to users about the status of their subscription

### Implementation Details

#### Database Changes
- Updated Subscription model to include:
  - Status field (PENDING, ACTIVE, CANCELED, EXPIRED)
  - Rejection reason field

#### API Endpoints
- Modified `/api/subscriptions/subscribe.ts` to set subscriptions to PENDING status
- Created `/api/admin/approve-subscription.ts` for admins to approve subscription requests
- Created `/api/admin/reject-subscription.ts` for admins to reject subscription requests with optional reason

#### Email Notifications
- Created email templates:
  - `subscriptionApproved.html` - Sent when admin approves a subscription
  - `subscriptionRejected.html` - Sent when admin rejects a subscription with optional reason

#### Admin UI
- Updated admin subscription management page to:
  - Display pending subscriptions
  - Add approve and reject buttons
  - Show a rejection reason modal

## 2. User Account Deactivation System

### Overview

The user deactivation system includes:

- Admins can deactivate user accounts with optional reason
- Deactivated users cannot log in and are redirected to a reactivation request page
- Users can request reactivation of their account
- Admins can approve reactivation requests

### Implementation Details

#### Database Changes
- Updated User model to include:
  - isActive field (default: true)
  - reactivationRequested field
  - deactivationReason field
  - reactivationRequestedAt field

#### API Endpoints
- Created `/api/admin/deactivate-user.ts` for admins to deactivate accounts
- Created `/api/admin/reactivate-user.ts` for admins to reactivate accounts
- Created `/api/users/request-reactivation.ts` for users to request reactivation

#### Authentication Changes
- Updated middleware.ts to check if a user is active
- Updated login verification to block deactivated users
- Redirects deactivated users to the reactivation request page

#### UI Components
- Updated admin user management page with deactivation/reactivation features
- Created `/request-reactivation.tsx` page for deactivated users

#### Email Notifications
- Created email templates:
  - `accountDeactivated.html` - Sent when admin deactivates an account
  - `accountReactivated.html` - Sent when admin reactivates an account

## Key Features

1. **Subscription Approval**
   - Admin review of subscription requests
   - Email notifications for subscription status changes

2. **User Management**
   - Account deactivation with reason
   - Reactivation request workflow
   - Email notifications for account status changes

3. **Security**
   - Middleware prevents deactivated users from accessing protected routes
   - Authentication system is updated to check account status
   - Admins cannot be deactivated

## Testing

To test these features:

1. **Subscription Flow**
   - Register a regular user account
   - Request a subscription
   - Log in as admin and approve/reject the subscription
   - Verify the user receives appropriate emails

2. **Deactivation Flow**
   - Log in as admin and deactivate a user account
   - Try to log in with the deactivated account
   - Request reactivation as the deactivated user
   - Log in as admin and approve the reactivation request

## Error Handling

The implementation includes comprehensive error handling:

- Input validation for all API endpoints
- Meaningful error messages for users
- Server-side validation of permissions and statuses
- Graceful error recovery if email sending fails 