# Broken Record Store API – Technical Challenge

This repository contains my solution for the **Broken Record Store API Challenge**.  
The focus was not only to implement the requested features, but to improve performance, data consistency, scalability, and testability of the system.

---

## 🧩 Challenge Summary

The original API allowed:

- Creating records
- Editing records
- Filtering records

However, it had the following problems:

- Poor performance with large datasets (~100k records)
- No integration with MusicBrainz to enrich records
- No atomic stock control for orders
- Limited test coverage and scalability concerns

---

## 🚀 Implemented Improvements

### 1️⃣ Search Performance & Scalability

**What was done**

- Added proper MongoDB indexes on frequently filtered fields:
  - `artist`
  - `album`
  - `format`
  - `category`
  - `mbid`
- Implemented stable pagination to avoid large memory scans.
- Ensured queries are handled at database level instead of in-memory filtering.

**Why**

- With 100k+ records, unindexed queries become O(n) scans.
- Indexes reduce query time dramatically.
- Stable pagination prevents inconsistent results when data changes.

**What could be improved**

- Cursor-based pagination could be introduced for extremely large datasets.
- Caching (e.g., Redis) could be added for frequently accessed queries.

---

### 2️⃣ Record Creation with MBID (MusicBrainz Integration)

**What was done**

- When a record is created with a valid `mbid`:
  - The API calls MusicBrainz using the XML format.
  - Parses the response.
  - Extracts and stores the album tracklist directly into the record.

**Why**

- The MBID is a universal identifier.
- Automatically enriching records removes manual data entry and improves consistency.
- XML parsing follows the challenge requirement exactly.

**How it is tested**

- End-to-end tests using `nock` to mock the external MusicBrainz API.
- Ensures that valid MBIDs populate the tracklist.

**What could be improved**

- Caching MusicBrainz responses to avoid repeated external calls.
- Adding fallback behavior if MusicBrainz is temporarily unavailable.

---

### 3️⃣ Record Editing with MBID

**What was done**

- When updating a record:
  - If the `mbid` **has changed**, the API re-fetches track data from MusicBrainz.
  - If the `mbid` is unchanged, no external call is made.

**Why**

- Prevents unnecessary API calls.
- Keeps the tracklist always consistent with the current MBID.

**What could be improved**

- Background refresh jobs to periodically validate stored metadata.

---

### 4️⃣ Order Creation with Atomic Stock Control

**What was done**

- Implemented order creation using:
  - `recordId`
  - `quantity`
- Stock is decremented using **atomic database operations**.
- If requested quantity exceeds available stock:
  - The API returns **409 Conflict**.

**Why**

- Prevents race conditions.
- Guarantees data consistency in concurrent order scenarios.

**How it is tested**

- End-to-end tests validate:
  - Successful stock decrement.
  - Rejection of over-purchase attempts.

---

## 🧪 Testing Strategy

### Unit Tests

- Controllers are tested in isolation.
- DTOs, schemas, and enums reach **100% coverage**.
- Focused on request/response correctness.

### End-to-End Tests

- Validate full system behavior:
  - Record creation
  - Filtering
  - MBID integration
  - MBID updates
  - Order creation with atomic stock control
- External API calls (MusicBrainz) are mocked using `nock`.

### Coverage

- DTOs, schemas, and enums: **100%**
- Controllers: **~65–75%**
- Services: lower coverage by design (see below)

---

## 🧠 Architectural Decisions

### Why lower unit coverage on services?

Instead of over-mocking internal logic, I chose to:

- Validate business rules through **end-to-end tests**.
- Ensure:
  - Database integration
  - External API calls
  - Atomic updates
  - Error handling

This prioritizes **behavioral correctness over internal implementation details**.

**Trade-off**

- Lower unit coverage on services.
- Higher confidence that the system behaves correctly in real scenarios.

---

## 🛠 Tech Stack

- **NestJS**
- **MongoDB (Mongoose)**
- **Jest** (Unit & E2E)
- **Supertest**
- **Nock** (external API mocking)
- **Swagger/OpenAPI** (full API documentation)
- **class-validator** (DTO validation with UUID validation for MBID)

---

## 🧾 Conclusion

This solution:

- Improves performance with proper indexing and query design.
- Ensures data enrichment via MusicBrainz.
- Guarantees atomic stock handling.
- Provides robust automated test coverage focused on real system behavior.
- Implements comprehensive input validation (DTOs with UUID validation for MBID).
- Full Swagger/OpenAPI documentation for all endpoints.
- Proper HTTP status codes (404 for not found, 409 for conflicts).

It is designed with **scalability, correctness, and maintainability** in mind, while respecting the scope of a technical challenge.

**Note:** The MusicBrainz API has rate limiting (1 request/second). In production, implement retry logic with exponential backoff if needed.

---
