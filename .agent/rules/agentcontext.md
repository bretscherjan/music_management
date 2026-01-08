---
trigger: always_on
---

### PROJECT: Musig Elgg Association OS
**Core Goal:** Hybrid platform (Public Website + Internal ERP) for music associations.
**Development Stack:**
- Frontend: Vite/React/TypeScript, Tailwind CSS.
- Backend: ASP.NET REST API (.NET 9/10), MySQL via EF Core.
- API Documentation: Swagger/OpenAPI.
- Frontend Client: Generated via NSwag.

**Coding Standards & Flow:**
1. UI/UX: Strictly follow the Musig Elgg color palette (#801010, #C5A059, #F9F7F2).
2. Data Flow: Page.tsx -> useComponentHelper.ts (Logic/State) -> apiServiceHelper.ts (Calls) -> ApiClient.ts (NSwag).
3. [cite_start]Backend: Use DTOs for all API responses[cite: 171, 253].
4. [cite_start]Security: Implement Role-Based Access Control (Admin, Member, Public)[cite: 207].

**Feature Scope (based on Konzertmeister Analysis):**
- [cite_start]Event Management (Templates, Series, Attendance with QR-Code)[cite: 23, 38, 80].
- [cite_start]Task Management ("Assign it!" Module)[cite: 98, 102].
- [cite_start]Music Library (Metadata, PDF/MP3 storage)[cite: 153, 154].
- [cite_start]Member/Association Management (Register limits, Dashboard)[cite: 59, 211].