# Prisma Schema Setup

## Overview
This document describes the Prisma schema structure for the eboleka (boleka-web) rental platform. The schema includes models for Items, Bookings, Reviews, Rental Agreements, and User Rewards.

## Installation

1. **Install Prisma CLI** (if not already installed):
```bash
npm install -D prisma
```

2. **Create the prisma directory** and move schema.prisma:
```bash
mkdir prisma
mv schema.prisma prisma/schema.prisma
```

3. **Configure Database URL** in `.env.local`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/boleka_db"
```

4. **Initialize Prisma Client**:
```bash
npx prisma generate
```

5. **Run Migrations** (after setting up database):
```bash
npx prisma migrate dev --name init
```

## Schema Models

### 1. **User Model**
Base user model for platform users (renters and item owners).

**Fields:**
- `id`: Unique identifier
- `email`: Unique email address
- `name`: User's full name
- `phone`: Contact phone number
- `createdAt`: Account creation timestamp
- `updatedAt`: Last update timestamp

**Relationships:**
- `items`: Items owned by the user
- `bookings`: Bookings made by the user
- `reviews`: Reviews given by the user
- `rentalAgreements`: Rental agreements involving the user
- `rewards`: Associated rewards record (one-to-one)

---

### 2. **Item Model** ✨ *Updated with new requirements*

Represents rental items on the platform with full delivery and location support.

**Core Fields:**
- `id`: Unique identifier
- `title`: Item title
- `description`: Item description
- `category`: Item category
- `condition`: Item condition
- `price`: Rental price
- `image`: Item image URL
- `userId`: Owner ID (foreign key)

**New Required Fields:**
- `quantity` (Int): Available quantity of the item (default: 1)
- `lat` (Float): Latitude for item location
- `lng` (Float): Longitude for item location
- `address` (String): Physical address of item

**Delivery Logic Fields:**
- `allowCollection` (Boolean): Whether customer can collect item (default: true)
- `allowDelivery` (Boolean): Whether item can be delivered (default: true)
- `deliveryFee` (Float): Delivery fee amount (default: 0)

**Relationships:**
- `user`: Owner of the item
- `bookings`: Bookings for this item
- `reviews`: Reviews for this item
- `rentalAgreements`: Rental agreements for this item

---

### 3. **Booking Model** ✨ *Updated with status enum*

Represents a booking/rental transaction between a renter and item owner.

**Fields:**
- `id`: Unique identifier
- `userId`: Renter ID (foreign key)
- `itemId`: Item ID (foreign key)
- `startDate`: Rental start date
- `endDate`: Rental end date
- `totalPrice`: Total booking price
- `platformFee`: Platform fee (default: 0)
- `deliveryFee`: Delivery fee amount (default: 0)
- `notes`: Additional booking notes
- `createdAt`: Booking creation timestamp
- `updatedAt`: Last update timestamp

**Status Enum** ✨ *New - as per requirements*:
```typescript
enum BookingStatus {
  PENDING      // Initial state, awaiting confirmation
  PAID         // Payment received
  FROZEN       // Temporarily on hold
  COMPLETED    // Rental period completed
  CANCELLED    // Booking cancelled
}
```

**Relationships:**
- `user`: The renter
- `item`: The rented item

---

### 4. **Review Model**

User reviews for completed bookings.

**Fields:**
- `id`: Unique identifier
- `rating`: Rating (1-5 stars)
- `comment`: Review comment
- `reviewType`: Type of review ('renter_to_owner' or 'owner_to_renter')
- `userId`: Reviewer ID (foreign key)
- `itemId`: Item ID (foreign key)
- `bookingId`: Associated booking ID (optional)
- `createdAt`: Review creation timestamp
- `updatedAt`: Last update timestamp

**Relationships:**
- `user`: The reviewer
- `item`: The reviewed item

---

### 5. **RentalAgreement Model**

Formal rental agreement documents for transactions.

**Fields:**
- `id`: Unique identifier
- `agreementNumber`: Unique agreement number
- `userId`: User ID (foreign key)
- `itemId`: Item ID (foreign key)
- `bookingId`: Associated booking ID (optional)
- `status`: Agreement status ('draft', 'pending_signatures', 'signed', 'active', 'completed', 'terminated')
- `startDate`: Rental start date
- `endDate`: Rental end date
- `dailyRate`: Daily rental rate
- `totalAmount`: Total agreement amount
- `securityDeposit`: Security deposit amount (default: 0)
- `platformFee`: Platform fee (default: 0)
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp
- `signedAt`: Signature timestamp (optional)
- `terminatedAt`: Termination timestamp (optional)
- `terminationReason`: Reason for termination (optional)

**Relationships:**
- `user`: Associated user
- `item`: Associated item

---

### 6. **UserRewards Model**

Loyalty and rewards tracking for users.

**Points System:**
- `totalPoints`: Total points earned
- `availablePoints`: Points available for redemption
- `redeemedPoints`: Points already redeemed
- `pendingPoints`: Points awaiting confirmation
- `usedPoints`: Points used for discounts

**Performance Metrics:**
- `onTimeReturnStreak`: Current on-time return streak
- `maxStreak`: Maximum streak achieved
- `totalRentals`: Total rental transactions
- `onTimeReturns`: Count of on-time returns
- `lateReturns`: Count of late returns
- `reliabilityScore`: Overall reliability score

**Reward Tier:**
- `rewardLevel`: Current level ('Bronze', 'Silver', 'Gold', 'Platinum')
- `tier`: Alias for rewardLevel
- `pointsToNextLevel`: Points needed to reach next tier

**Discounts & Benefits:**
- `totalSavings`: Total amount saved through discounts
- `discountsUsed`: Count of discounts used
- `discountsEarned`: Count of discounts earned

**Relationships:**
- `user`: Associated user (one-to-one)

---

## Database Indexes

Indexes are created on frequently queried foreign keys:
- `Item.userId`
- `Booking.userId`
- `Booking.itemId`
- `Review.userId`
- `Review.itemId`
- `RentalAgreement.userId`
- `RentalAgreement.itemId`
- `UserRewards.userId` (unique index)

---

## Environment Configuration

Create a `.env.local` file with the following:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/boleka_db"

# Prisma
PRISMA_HIDE_UPDATE_MESSAGE=true
```

---

## Common Prisma Commands

```bash
# Generate Prisma Client
npx prisma generate

# Create a new migration
npx prisma migrate dev --name <migration_name>

# View database in GUI
npx prisma studio

# Reset database (development only)
npx prisma migrate reset

# Format schema
npx prisma format

# Validate schema
npx prisma validate
```

---

## Integration Notes

This schema is designed to:
1. ✅ Support the existing Firebase-based TypeScript types
2. ✅ Work with PostgreSQL database
3. ✅ Include all required delivery and location fields
4. ✅ Support complex booking workflows with status tracking
5. ✅ Enable comprehensive reward and loyalty system

The schema can coexist with the current Firebase setup or replace it based on your migration strategy.

---

## Next Steps

1. Install PostgreSQL (or use a cloud provider like Supabase, Heroku, Railway)
2. Configure DATABASE_URL in `.env.local`
3. Run migrations: `npx prisma migrate dev --name init`
4. Generate Prisma Client: `npx prisma generate`
5. Update application code to use Prisma Client instead of Firebase (optional migration)

