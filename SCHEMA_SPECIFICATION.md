# Database Schema Specification

## Updated: 2026-05-12

This document details the complete Prisma schema including all requirements for Item, Delivery Logic, and Booking models.

---

## ✅ Requirements Implementation

### 1. Item Model - New Fields Added

```prisma
model Item {
  // ... existing fields ...
  
  // ✅ NEW REQUIRED FIELDS:
  quantity    Int      @default(1)        // Quantity of items available
  description String?                     // Item description
  lat         Float?                       // Latitude for geo-location
  lng         Float?                       // Longitude for geo-location
  address     String?                      // Physical address
  
  // ... relationships ...
}
```

**Details:**
- `quantity`: Integer field to track available inventory (default: 1)
- `description`: Text field for detailed item information
- `lat` & `lng`: Float fields for GPS coordinates (nullable for flexibility)
- `address`: String field for full address information

---

### 2. Delivery Logic - New Fields Added

```prisma
model Item {
  // ... existing fields ...
  
  // ✅ DELIVERY LOGIC FIELDS:
  allowCollection Boolean @default(true)  // Customer can pick up
  allowDelivery   Boolean @default(true)  // Item can be delivered
  deliveryFee     Float   @default(0)     // Delivery fee amount
  
  // ... relationships ...
}
```

**Details:**
- `allowCollection`: Boolean to enable/disable customer collection option (default: true)
- `allowDelivery`: Boolean to enable/disable delivery service (default: true)
- `deliveryFee`: Float to store the delivery charge (default: 0 for no fee)

**Business Logic Examples:**
```typescript
// Example 1: Item only available for delivery
{ allowCollection: false, allowDelivery: true, deliveryFee: 50.00 }

// Example 2: Item available both ways, free collection, paid delivery
{ allowCollection: true, allowDelivery: true, deliveryFee: 50.00 }

// Example 3: Local pickup only, no delivery
{ allowCollection: true, allowDelivery: false, deliveryFee: 0 }
```

---

### 3. Booking Model - Status Enum Added

```prisma
// ✅ BOOKING STATUS ENUM:
enum BookingStatus {
  PENDING      // Initial state after booking creation
  PAID         // Payment received successfully
  FROZEN       // Temporarily suspended (payment issue, dispute, etc.)
  COMPLETED    // Rental period finished successfully
  CANCELLED    // Booking was cancelled by user or system
}

model Booking {
  id        String         @id @default(cuid())
  
  // Booking details
  userId    String
  itemId    String
  status    BookingStatus  @default(PENDING)  // ✅ NEW STATUS ENUM
  
  // ... rest of fields ...
}
```

**Status Workflow:**
```
PENDING
  ↓
  ├→ PAID → COMPLETED
  ├→ CANCELLED
  └→ FROZEN → PAID → COMPLETED
```

**Status Descriptions:**
- **PENDING**: Booking created but payment not yet processed
- **PAID**: Payment successful, booking confirmed
- **FROZEN**: Booking on hold (payment declined, dispute, etc.)
- **COMPLETED**: Rental period fulfilled
- **CANCELLED**: Booking cancelled by renter or marked as not needed

---

## Complete Item Model Schema

```prisma
model Item {
  id          String   @id @default(cuid())
  title       String
  description String?                  // ✅ NEW
  category    String
  condition   String
  
  // ✅ LOCATION FIELDS (NEW)
  quantity    Int      @default(1)     // ✅ NEW
  lat         Float?                   // ✅ NEW
  lng         Float?                   // ✅ NEW
  address     String?                  // ✅ NEW
  
  // ✅ DELIVERY LOGIC (NEW)
  allowCollection Boolean @default(true)  // ✅ NEW
  allowDelivery   Boolean @default(true)  // ✅ NEW
  deliveryFee     Float   @default(0)     // ✅ NEW
  
  // Core fields
  price       Float
  image       String?
  userId      String
  
  // Timestamps
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relationships
  user        User     @relation(fields: [userId], references: [id])
  bookings    Booking[]
  reviews     Review[]
  rentalAgreements RentalAgreement[]
  
  @@index([userId])
}
```

---

## Complete Booking Model Schema

```prisma
enum BookingStatus {
  PENDING
  PAID
  FROZEN
  COMPLETED
  CANCELLED
}

model Booking {
  id        String   @id @default(cuid())
  
  // References
  userId    String
  itemId    String
  
  // ✅ STATUS WITH ENUM (NEW)
  status    BookingStatus @default(PENDING)  // ✅ NEW
  
  // Rental period
  startDate DateTime
  endDate   DateTime
  
  // Financial details
  totalPrice Float
  platformFee Float @default(0)
  deliveryFee Float @default(0)
  
  // Additional info
  notes     String?
  
  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relationships
  user      User     @relation(fields: [userId], references: [id])
  item      Item     @relation(fields: [itemId], references: [id])
  
  @@index([userId])
  @@index([itemId])
}
```

---

## Data Validation Rules

### Item Model Validations:
- `quantity`: Must be ≥ 1
- `lat` & `lng`: If provided, must be valid coordinates (-90 to 90 for lat, -180 to 180 for lng)
- `address`: Should be non-empty string if provided
- `deliveryFee`: Must be ≥ 0
- At least one of `allowCollection` or `allowDelivery` should be true

### Booking Model Validations:
- `startDate` < `endDate`: Rental period must be valid
- `totalPrice` > 0: Booking must have positive total
- Status transitions must follow the defined workflow
- `deliveryFee` > 0 only if item has `allowDelivery: true`

---

## Query Examples

### Find items by location:
```typescript
const itemsNearby = await prisma.item.findMany({
  where: {
    lat: { gte: minLat, lte: maxLat },
    lng: { gte: minLng, lte: maxLng },
  },
});
```

### Find items with delivery available:
```typescript
const deliverableItems = await prisma.item.findMany({
  where: {
    allowDelivery: true,
  },
});
```

### Get pending bookings for a user:
```typescript
const pendingBookings = await prisma.booking.findMany({
  where: {
    userId: "user-id",
    status: "PENDING",
  },
});
```

### Update booking status after payment:
```typescript
const updatedBooking = await prisma.booking.update({
  where: { id: "booking-id" },
  data: { status: "PAID" },
});
```

---

## Migration Path

### Step 1: Create `.env.local` with DATABASE_URL
```env
DATABASE_URL="postgresql://user:password@localhost:5432/boleka_db"
```

### Step 2: Initialize Prisma
```bash
npx prisma generate
```

### Step 3: Create initial migration
```bash
npx prisma migrate dev --name init
```

### Step 4: Verify in Prisma Studio
```bash
npx prisma studio
```

---

## Notes

1. **Backwards Compatibility**: The schema can coexist with existing Firebase setup
2. **Optional Fields**: `description`, `lat`, `lng`, `address` are nullable for flexibility
3. **Defaults**: Sensible defaults ensure existing code compatibility
4. **Indexes**: Created on `userId` and foreign keys for query performance
5. **Enum Safety**: BookingStatus enum prevents invalid status values

---

## Summary of All Changes

| Component | Field | Type | Default | Purpose |
|-----------|-------|------|---------|---------|
| **Item** | quantity | Int | 1 | Stock availability |
| **Item** | description | String? | null | Item details |
| **Item** | lat | Float? | null | Location latitude |
| **Item** | lng | Float? | null | Location longitude |
| **Item** | address | String? | null | Physical address |
| **Item** | allowCollection | Boolean | true | Enable pickup option |
| **Item** | allowDelivery | Boolean | true | Enable delivery option |
| **Item** | deliveryFee | Float | 0 | Delivery cost |
| **Booking** | status | BookingStatus enum | PENDING | Booking state |

---

## Support

For questions about the schema:
- Check `PRISMA_SETUP.md` for setup instructions
- Refer to [Prisma Documentation](https://www.prisma.io/docs/)
- Review type definitions in `src/types/` for integration examples

