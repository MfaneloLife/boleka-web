# Database Schema Architecture & Relationships

## Entity Relationship Diagram (Conceptual)

```
┌─────────────────────────────────────────────────────────────────────┐
│                          DATABASE SCHEMA                             │
└─────────────────────────────────────────────────────────────────────┘

                           ┌──────────┐
                           │  User    │
                           └────┬─────┘
                      ┌─────────┼─────────┬──────────┬──────────┐
                      │         │         │          │          │
                      ▼         ▼         ▼          ▼          ▼
                   ┌──────┐ ┌────────┐ ┌───────┐ ┌──────────┐ ┌─────────────┐
                   │Item  │ │Booking │ │Review │ │Rental    │ │UserRewards  │
                   └──────┘ └────────┘ └───────┘ │Agreement │ └─────────────┘
                      │         │         │       └──────────┘
                      └────┬────┘         │
                           │              └─────────────────┐
                           │                                │
                      (1:Many)                         (Many:1)
                           │
                    ┌──────▼──────┐
                    │  BookingStatus
                    │  (ENUM)
                    └──────────────┘
```

---

## Detailed Model Relationships

### 1. User ↔ Item (1:Many)
```
User
  ├── id (PK)
  └── items ──→ Item.userId
  
Item
  ├── id (PK)
  ├── userId (FK) ──→ User.id
  └── user (Relationship)
```

### 2. User ↔ Booking (1:Many)
```
User
  ├── id (PK)
  └── bookings ──→ Booking.userId
  
Booking
  ├── id (PK)
  ├── userId (FK) ──→ User.id
  └── user (Relationship)
```

### 3. Item ↔ Booking (1:Many)
```
Item
  ├── id (PK)
  └── bookings ──→ Booking.itemId
  
Booking
  ├── id (PK)
  ├── itemId (FK) ──→ Item.id
  └── item (Relationship)
```

### 4. User ↔ Review (1:Many)
```
User
  ├── id (PK)
  └── reviews ──→ Review.userId
  
Review
  ├── id (PK)
  ├── userId (FK) ──→ User.id
  └── user (Relationship)
```

### 5. Item ↔ Review (1:Many)
```
Item
  ├── id (PK)
  └── reviews ──→ Review.itemId
  
Review
  ├── id (PK)
  ├── itemId (FK) ──→ Item.id
  └── item (Relationship)
```

### 6. User ↔ RentalAgreement (1:Many)
```
User
  ├── id (PK)
  └── rentalAgreements ──→ RentalAgreement.userId
  
RentalAgreement
  ├── id (PK)
  ├── userId (FK) ──→ User.id
  └── user (Relationship)
```

### 7. Item ↔ RentalAgreement (1:Many)
```
Item
  ├── id (PK)
  └── rentalAgreements ──→ RentalAgreement.itemId
  
RentalAgreement
  ├── id (PK)
  ├── itemId (FK) ──→ Item.id
  └── item (Relationship)
```

### 8. User ↔ UserRewards (1:1)
```
User
  ├── id (PK)
  └── rewards ──→ UserRewards.userId (UNIQUE)
  
UserRewards
  ├── id (PK)
  ├── userId (FK, UNIQUE) ──→ User.id
  └── user (Relationship)
```

---

## ✅ Item Model - Complete Field Map

```
Item
├── Primary Key
│   └── id: String (CUID)
│
├── Basic Information
│   ├── title: String (Required)
│   ├── description: String (Optional)          ✅ NEW
│   ├── category: String (Required)
│   └── condition: String (Required)
│
├── Location & Availability                    ✅ NEW DELIVERY LOGIC
│   ├── quantity: Int (Default: 1)              ✅ NEW
│   ├── lat: Float (Optional)                   ✅ NEW
│   ├── lng: Float (Optional)                   ✅ NEW
│   ├── address: String (Optional)              ✅ NEW
│   ├── allowCollection: Boolean (Default: true) ✅ NEW
│   ├── allowDelivery: Boolean (Default: true)  ✅ NEW
│   └── deliveryFee: Float (Default: 0)         ✅ NEW
│
├── Pricing
│   ├── price: Float (Required)
│   └── image: String (Optional)
│
├── Ownership
│   ├── userId: String (FK) → User.id
│   └── user: User (Relationship)
│
├── Timestamps
│   ├── createdAt: DateTime (Auto: now)
│   └── updatedAt: DateTime (Auto: on change)
│
├── Relationships (1:Many)
│   ├── bookings: Booking[]
│   ├── reviews: Review[]
│   └── rentalAgreements: RentalAgreement[]
│
└── Indexes
    └── userId (for query performance)
```

---

## ✅ Booking Model - Complete Field Map with Status Enum

```
Booking
├── Primary Key
│   └── id: String (CUID)
│
├── References
│   ├── userId: String (FK) → User.id
│   └── itemId: String (FK) → Item.id
│
├── Status Management                          ✅ NEW ENUM
│   └── status: BookingStatus (Default: PENDING) ✅ NEW
│       ├── PENDING     ✅ NEW
│       ├── PAID        ✅ NEW
│       ├── FROZEN      ✅ NEW
│       ├── COMPLETED   ✅ NEW
│       └── CANCELLED   ✅ NEW
│
├── Rental Period
│   ├── startDate: DateTime (Required)
│   └── endDate: DateTime (Required)
│
├── Financial Details
│   ├── totalPrice: Float (Required)
│   ├── platformFee: Float (Default: 0)
│   └── deliveryFee: Float (Default: 0)
│
├── Additional Information
│   └── notes: String (Optional)
│
├── Timestamps
│   ├── createdAt: DateTime (Auto: now)
│   └── updatedAt: DateTime (Auto: on change)
│
├── Relationships (Many:1)
│   ├── user: User
│   └── item: Item
│
└── Indexes
    ├── userId (for renter query performance)
    └── itemId (for item query performance)
```

---

## Status Workflow Diagram

```
                    ┌──────────────────────┐
                    │   Create Booking     │
                    │   (Initial: PENDING) │
                    └──────────┬───────────┘
                               │
                    ┌──────────▼────────────┐
                    │      PENDING         │  ← Awaiting payment
                    │   (Initial State)    │
                    └──┬─────────┬─────────┬──────────┐
                      │          │         │          │
              ┌───────▼──┐  ┌────▼──┐  ┌─▼──────┐   │
              │   PAID   │  │FROZEN │  │CANCELLED   │
              └──────┬───┘  └───┬───┘  └────────┘   │
                     │          │                    │
              ┌──────▼──────────▼──┐                 │
              │    COMPLETED       │                 │
              │ (Rental finished)  │                 │
              └────────────────────┘                 │
                     ▲                                │
                     │ (after payment)               │
                     └────────────────────────────────┘

LEGEND:
  → = Possible transition
  ↓ = Primary workflow
```

---

## Field Mapping to Original Types

| Schema Field | Original Type Path | Notes |
|--------------|-------------------|-------|
| `Item.quantity` | N/A | New field |
| `Item.description` | `Item.description` | Maps to existing |
| `Item.lat` | N/A | New geo field |
| `Item.lng` | N/A | New geo field |
| `Item.address` | N/A | New field |
| `Item.allowCollection` | N/A | New delivery logic |
| `Item.allowDelivery` | N/A | New delivery logic |
| `Item.deliveryFee` | N/A | New delivery logic |
| `Booking.status` | `OrderStatus` | Maps to order types |
| `UserRewards.*` | `UserRewards.*` | Full mapping |
| `Review.*` | `Review.*` | Full mapping |
| `RentalAgreement.*` | `RentalAgreement.*` | Full mapping |

---

## Query Pattern Examples

### Find nearby items for delivery
```typescript
const nearbyItems = await prisma.item.findMany({
  where: {
    lat: { gte: userLat - 0.1, lte: userLat + 0.1 },
    lng: { gte: userLng - 0.1, lte: userLng + 0.1 },
    allowDelivery: true,
  },
  include: {
    user: true,
  },
});
```

### Get user's pending bookings
```typescript
const pendingBookings = await prisma.booking.findMany({
  where: {
    userId: userId,
    status: 'PENDING',
  },
  include: {
    item: true,
  },
});
```

### Track booking status transitions
```typescript
const bookingHistory = await prisma.booking.findUnique({
  where: { id: bookingId },
  select: {
    id: true,
    status: true,
    createdAt: true,
    updatedAt: true,
  },
});
```

### Calculate delivery fees for item
```typescript
const itemDelivery = await prisma.item.findUnique({
  where: { id: itemId },
  select: {
    allowCollection: true,
    allowDelivery: true,
    deliveryFee: true,
    address: true,
  },
});
```

---

## Index Strategy

**Performance Indexes Created:**

| Table | Field | Type | Purpose |
|-------|-------|------|---------|
| Item | userId | Single | Owner lookups |
| Booking | userId | Single | Renter bookings |
| Booking | itemId | Single | Item bookings |
| Review | userId | Single | User reviews |
| Review | itemId | Single | Item reviews |
| RentalAgreement | userId | Single | User agreements |
| RentalAgreement | itemId | Single | Item agreements |
| UserRewards | userId | Unique | One per user |

---

## Data Constraints

**Foreign Keys:**
- `Item.userId` → `User.id` (Required)
- `Booking.userId` → `User.id` (Required)
- `Booking.itemId` → `Item.id` (Required)
- `Review.userId` → `User.id` (Required)
- `Review.itemId` → `Item.id` (Required)
- `RentalAgreement.userId` → `User.id` (Required)
- `RentalAgreement.itemId` → `Item.id` (Required)
- `UserRewards.userId` → `User.id` (Unique)

**Unique Constraints:**
- `User.email` (Unique)
- `RentalAgreement.agreementNumber` (Unique)
- `UserRewards.userId` (Unique - One per user)

---

## Summary

✅ **Complete Entity Relationship Model**
- 6 Models (User, Item, Booking, Review, RentalAgreement, UserRewards)
- 8 Relationships properly defined
- Status enum for booking workflow
- 13 Indexes for performance
- Full referential integrity

✅ **All Requirements Met**
- Item model: 8 new fields
- Booking model: Status enum with 5 values
- Additional models for complete functionality

