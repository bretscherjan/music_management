# Musig Elgg - Vollständige Projektanalyse

> **Projekttyp:** Vereinsverwaltungs-Webanwendung für Musikvereine  
> **Erstellt:** Januar 2026  
> **Technologie-Stack:** Express.js Backend + React/Vite Frontend

---

## 📋 Inhaltsverzeichnis

1. [Projektübersicht](#projektübersicht)
2. [Technologie-Stack](#technologie-stack)
3. [Projektstruktur](#projektstruktur)
4. [Datenbank-Schema](#datenbank-schema)
5. [Backend-Architektur](#backend-architektur)
6. [API-Dokumentation](#api-dokumentation)
7. [Frontend-Architektur](#frontend-architektur)
8. [Benachrichtigungssystem](#benachrichtigungssystem)
9. [Design-System](#design-system)
10. [Deployment](#deployment)

---

## Projektübersicht

**Musig Elgg** ist eine moderne Vereinsverwaltungsanwendung, die speziell für Musikvereine entwickelt wurde. Die Anwendung bietet:

- **Terminverwaltung** mit wiederkehrenden Events und Anwesenheitserfassung
- **Mitgliederverwaltung** mit Registerzuordnung
- **Dateiverwaltung** mit Ordnern und Zugriffsrechten
- **Notenverwaltung** (Sheet Music) mit Setlist-Funktionalität
- **Nachrichtensystem** für Vereinsmitteilungen
- **Push-Benachrichtigungen** und Email-Notifications
- **Erinnerungssystem** mit BullMQ/Redis-Queue
- **Öffentliche Website** mit Kontaktformular

---

## Technologie-Stack

### Backend

| Technologie | Version | Verwendung |
|------------|---------|------------|
| **Node.js** | - | Runtime Environment |
| **Express.js** | ^4.18.2 | Web Framework |
| **Prisma** | ^5.8.0 | ORM für MySQL |
| **MySQL** | - | Datenbank |
| **JWT** | ^9.0.2 | Authentifizierung |
| **bcryptjs** | ^2.4.3 | Passwort-Hashing |
| **BullMQ** | ^5.67.0 | Job Queue für Reminders |
| **ioredis** | ^5.9.2 | Redis-Client |
| **Nodemailer** | ^6.9.8 | Email-Versand |
| **web-push** | ^3.6.7 | Push-Benachrichtigungen |
| **Multer** | ^1.4.5 | Datei-Upload |
| **Zod** | ^3.22.4 | Validierung |
| **Luxon** | ^3.7.2 | Datumsverarbeitung |
| **node-cron** | ^4.2.1 | Cronjobs |
| **rrule** | ^2.7.2 | Wiederkehrende Events |
| **ics** | ^3.8.1 | Kalender-Export |
| **pdfmake** | ^0.3.3 | PDF-Generierung |
| **Helmet** | ^7.1.0 | Sicherheit |

### Frontend

| Technologie | Version | Verwendung |
|------------|---------|------------|
| **React** | ^19.2.0 | UI Framework |
| **Vite** | ^7.2.4 | Build Tool |
| **TypeScript** | ~5.9.3 | Type Safety |
| **TailwindCSS** | ^4.1.18 | Styling |
| **React Router** | ^7.12.0 | Routing |
| **TanStack Query** | ^5.90.16 | Data Fetching |
| **React Hook Form** | ^7.71.0 | Formulare |
| **Radix UI** | diverse | UI Components |
| **Lucide React** | ^0.562.0 | Icons |
| **date-fns** | ^4.1.0 | Datumsverarbeitung |
| **Axios** | ^1.13.2 | HTTP Client |
| **Sonner** | ^2.0.7 | Toast Notifications |
| **dnd-kit** | diverse | Drag & Drop |
| **jspdf** | ^4.0.0 | PDF-Export |

---

## Projektstruktur

```
musig_elgg/
├── 010_backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Datenbank-Schema
│   │   ├── migrations/            # DB-Migrationen
│   │   └── seed.js                # Seed-Daten
│   ├── src/
│   │   ├── controllers/           # Business Logic (13 Controller)
│   │   ├── routes/                # API Routes (14 Route-Files)
│   │   ├── services/              # Services (6 Services)
│   │   ├── middlewares/           # Middleware (4 Middlewares)
│   │   └── validations/           # Zod Schemas (5 Files)
│   ├── uploads/                   # Upload-Verzeichnis
│   ├── server.js                  # Entry Point
│   └── package.json
│
├── 020_frontend/
│   ├── src/
│   │   ├── components/            # UI Components (8 Kategorien)
│   │   ├── pages/                 # Page Components
│   │   │   ├── public/            # Öffentliche Seiten
│   │   │   ├── admin/             # Admin-Seiten
│   │   │   ├── events/            # Event-Seiten
│   │   │   └── files/             # Datei-Seiten
│   │   ├── services/              # API Services (10 Services)
│   │   ├── types/                 # TypeScript Types (8 Files)
│   │   ├── context/               # React Context
│   │   ├── hooks/                 # Custom Hooks
│   │   └── lib/                   # Utilities
│   ├── public/
│   │   └── service-worker.js      # PWA Service Worker
│   └── package.json
│
└── deployment/
    ├── docker-compose.redis.yml   # Redis Container
    ├── musig_elgg-backend.service # Systemd Service
    ├── musig_elgg-frontend.service
    └── README.md
```

---

## Datenbank-Schema

### Entity-Relationship-Übersicht

```mermaid
erDiagram
    User ||--o{ Attendance : has
    User ||--o{ News : creates
    User ||--o{ FileAccess : has
    User ||--o{ FolderAccess : has
    User ||--o{ SheetMusicBookmark : has
    User ||--o| NotificationSettings : has
    User ||--o{ PushSubscription : has
    User }o--|| Register : belongs_to
    
    Event ||--o{ Attendance : has
    Event ||--o{ File : has
    Event ||--o{ EventSheetMusic : has
    Event }o--o{ Register : targets
    
    SheetMusic ||--o{ EventSheetMusic : in_setlist
    SheetMusic ||--o{ SheetMusicBookmark : bookmarked
    
    Folder ||--o{ File : contains
    Folder ||--o{ Folder : parent_of
    Folder ||--o{ FolderAccess : has
    
    File ||--o{ FileAccess : has
    File }o--|| Register : targets
```

### Modelle im Detail

#### User
| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | Int | Primary Key, autoincrement |
| `email` | String | Unique, für Login |
| `password` | String | Bcrypt-gehashtes Passwort |
| `firstName` | String | Vorname |
| `lastName` | String | Nachname |
| `phoneNumber` | String? | Telefonnummer (optional) |
| `profilePicture` | String? | Pfad zum Profilbild |
| `status` | UserStatus | `active` \| `passive` \| `former` |
| `role` | UserRole | `member` \| `admin` |
| `registerId` | Int? | FK zu Register |
| `calendarToken` | String? | Unique Token für iCal-Zugriff |
| `resetToken` | String? | Token für Passwort-Reset |
| `resetTokenExpiry` | DateTime? | Ablaufzeit des Reset-Tokens |

#### Event
| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | Int | Primary Key |
| `title` | String | Titel der Veranstaltung |
| `description` | String? | Beschreibung (Text) |
| `location` | String? | Veranstaltungsort |
| `category` | EventCategory | `rehearsal` \| `performance` \| `other` |
| `visibility` | EventVisibility | `all` \| `register` \| `admin` |
| `date` | DateTime | Datum |
| `startTime` | String | Format "HH:mm" |
| `endTime` | String | Format "HH:mm" |
| `responseDeadlineHours` | Int | Anmeldefrist in Stunden (Standard: 48) |
| `isRecurring` | Boolean | Wiederkehrender Termin? |
| `recurrenceRule` | String? | RRule-String |
| `excludedDates` | Json? | Ausgeschlossene Daten |
| `setlistEnabled` | Boolean | Setlist aktiviert? |
| `isPublic` | Boolean | Auf öffentlicher Website sichtbar? |
| `targetRegisters` | Register[] | Ziel-Register für Sichtbarkeit |

#### Register (Instrumentengruppen)
| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | Int | Primary Key |
| `name` | String | Unique, z.B. "Trompeten", "Klarinetten" |

#### File
| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | Int | Primary Key |
| `filename` | String | Generierter Dateiname auf Disk |
| `originalName` | String | Original-Dateiname |
| `path` | String | Vollständiger Dateipfad |
| `mimetype` | String | MIME-Type |
| `size` | Int | Dateigröße in Bytes |
| `visibility` | FileVisibility | `all` \| `limit` \| `admin` \| `register` |
| `folderId` | Int? | FK zu Folder |

#### Folder
| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | Int | Primary Key |
| `name` | String | Ordnername |
| `parentId` | Int? | FK für Hierarchie |

#### SheetMusic (Notenverwaltung)
| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | Int | Primary Key |
| `title` | String | Titel des Stücks |
| `composer` | String? | Komponist |
| `arranger` | String? | Arrangeur |
| `genre` | String? | Genre/Musikstil |
| `difficulty` | Difficulty | `easy` \| `medium` \| `hard` |
| `publisher` | String? | Verlag/Quelle |
| `notes` | String? | Bemerkungen |

#### NotificationSettings
| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `notifyOnEventCreate` | Boolean | Email bei neuem Event |
| `notifyOnEventUpdate` | Boolean | Email bei Event-Änderung |
| `notifyOnEventDelete` | Boolean | Email bei Event-Löschung |
| `notifyOnFileUpload` | Boolean | Email bei Datei-Upload |
| `notifyOnFileDelete` | Boolean | Email bei Datei-Löschung |
| `reminderSettings` | Json? | Erinnerungs-Einstellungen pro Kategorie |
| `pushNewEvents` | Boolean | Push bei neuem Event |
| `pushEventUpdates` | Boolean | Push bei Event-Änderung |
| `pushEventCancellations` | Boolean | Push bei Absage |
| `pushNewFiles` | Boolean | Push bei neuem File |
| `pushFileDeleted` | Boolean | Push bei Datei-Löschung |

---

## Backend-Architektur

### Middleware-Stack

```
Request → cors → helmet → express.json → Routes → errorHandler → Response
```

| Middleware | Datei | Funktion |
|-----------|-------|----------|
| **authMiddleware** | `auth.middleware.js` | JWT-Validierung, User laden |
| **optionalAuth** | `auth.middleware.js` | Optionale Authentifizierung |
| **adminOnly** | `roleCheck.middleware.js` | Admin-Berechtigung prüfen |
| **validate** | `validate.middleware.js` | Zod-Schema-Validierung |
| **errorHandler** | `errorHandler.middleware.js` | Globaler Error Handler |

### Services

| Service | Datei | Funktion |
|---------|-------|----------|
| **EmailService** | `email.service.js` | Nodemailer, alle E-Mail-Templates |
| **PushService** | `push.service.js` | Web-Push-Benachrichtigungen |
| **NotificationService** | `notification.service.js` | Orchestrierung aller Notifications |
| **ReminderQueueService** | `reminder.queue.service.js` | BullMQ-basierte Reminder-Jobs |
| **RecurrenceService** | `recurrence.service.js` | RRule-Expansion für Events |
| **CronService** | `cron.service.js` | Zeitgesteuerte Jobs |

### Server-Initialisierung

```javascript
// server.js - Startup-Sequenz
1. Express-App erstellen
2. Middleware konfigurieren (helmet, cors, json)
3. Health Check Endpoint (/health)
4. API Routes mounten (/api)
5. 404 Handler
6. Error Handler
7. Server starten
8. Default Settings initialisieren
9. Push Service initialisieren
10. Cron Jobs starten
11. Reminder Queue initialisieren + synchronisieren
```

---

## API-Dokumentation

### Basis-URL
```
http://localhost:3004/api
```

### Authentifizierung
Alle geschützten Routen erfordern einen JWT-Token im Authorization-Header:
```
Authorization: Bearer <token>
```

---

### 🔐 Auth Routes (`/api/auth`)

| Methode | Endpoint | Beschreibung | Auth | Zugriff |
|---------|----------|--------------|------|---------|
| `POST` | `/register` | Neuen Benutzer registrieren | ❌ | Public |
| `POST` | `/login` | Login mit Email/Passwort | ❌ | Public |
| `GET` | `/me` | Aktuellen Benutzer abrufen | ✅ | Member |
| `POST` | `/refresh` | Token erneuern | ✅ | Member |
| `POST` | `/forgot-password` | Passwort-Reset anfordern | ❌ | Public |
| `POST` | `/reset-password/:token` | Passwort mit Token zurücksetzen | ❌ | Public |

#### Request/Response-Beispiele

**POST /api/auth/login**
```json
// Request
{
  "email": "user@example.com",
  "password": "password123"
}

// Response
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "Max",
    "lastName": "Mustermann",
    "role": "member",
    "status": "active",
    "registerId": 1,
    "register": { "id": 1, "name": "Trompeten" }
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

### 📅 Event Routes (`/api/events`)

| Methode | Endpoint | Beschreibung | Auth | Zugriff |
|---------|----------|--------------|------|---------|
| `GET` | `/` | Alle Events abrufen (mit Filter) | Optional | Public/Member |
| `GET` | `/:id` | Event nach ID abrufen | Optional | Public/Member |
| `POST` | `/` | Neues Event erstellen | ✅ | Admin |
| `PUT` | `/:id` | Event aktualisieren | ✅ | Admin |
| `DELETE` | `/:id` | Event löschen | ✅ | Admin |
| `POST` | `/bulk-delete` | Mehrere Events löschen | ✅ | Admin |
| `POST` | `/:id/exclude-date` | Datum von Wiederholung ausschliessen | ✅ | Admin |
| `POST` | `/:id/attendance` | Anwesenheit setzen | ✅ | Member |
| `GET` | `/:id/attendances` | Alle Anwesenheiten für Event | ✅ | Member |
| `POST` | `/:id/send-reminders` | Erinnerungen senden | ✅ | Admin |

**Setlist-Endpunkte:**

| Methode | Endpoint | Beschreibung | Auth | Zugriff |
|---------|----------|--------------|------|---------|
| `POST` | `/:id/setlist` | Item zur Setlist hinzufügen | ✅ | Admin |
| `PUT` | `/:id/setlist/reorder` | Setlist neu ordnen | ✅ | Admin |
| `PUT` | `/:id/setlist/:itemId` | Setlist-Item bearbeiten | ✅ | Admin |
| `DELETE` | `/:id/setlist/:itemId` | Setlist-Item entfernen | ✅ | Admin |

#### Query-Parameter für GET /api/events

| Parameter | Typ | Beschreibung |
|-----------|-----|--------------|
| `startDate` | String | Filter: Startdatum (ISO) |
| `endDate` | String | Filter: Enddatum (ISO) |
| `category` | String | Filter: `rehearsal` \| `performance` \| `other` |
| `expand` | Boolean | Wiederkehrende Events expandieren |

#### Request/Response-Beispiele

**POST /api/events**
```json
// Request
{
  "title": "Probe",
  "description": "Wöchentliche Probe",
  "location": "Probelokal",
  "category": "rehearsal",
  "visibility": "all",
  "date": "2026-02-01",
  "startTime": "19:30",
  "endTime": "22:00",
  "responseDeadlineHours": 24,
  "isRecurring": true,
  "recurrenceRule": "FREQ=WEEKLY;BYDAY=MO",
  "isPublic": false,
  "targetRegisters": [1, 2],
  "defaultAttendanceStatus": "yes"
}

// Response
{
  "message": "Event erstellt",
  "event": { ... }
}
```

**POST /api/events/:id/attendance**
```json
// Request
{
  "status": "yes",  // "yes" | "no" | "maybe"
  "comment": "Komme etwas später"
}
```

---

### 👥 User Routes (`/api/users`)

| Methode | Endpoint | Beschreibung | Auth | Zugriff |
|---------|----------|--------------|------|---------|
| `GET` | `/profile` | Eigenes Profil abrufen | ✅ | Member |
| `PUT` | `/profile` | Eigenes Profil aktualisieren | ✅ | Member |
| `PUT` | `/profile/password` | Passwort ändern | ✅ | Member |
| `PUT` | `/profile/picture` | Profilbild aktualisieren | ✅ | Member |
| `GET` | `/me/notifications` | Benachrichtigungs-Einstellungen | ✅ | Member |
| `PUT` | `/me/notifications` | Benachrichtigungs-Einstellungen ändern | ✅ | Member |
| `POST` | `/` | Neuen Benutzer erstellen | ✅ | Admin |
| `GET` | `/` | Alle Benutzer abrufen | ✅ | Member |
| `GET` | `/stats/attendance` | Anwesenheitsstatistik | ✅ | Admin |
| `GET` | `/:id` | Benutzer nach ID | ✅ | Admin |
| `PUT` | `/:id` | Benutzer aktualisieren | ✅ | Admin |
| `PUT` | `/:id/status` | Benutzer-Status ändern | ✅ | Admin |
| `PUT` | `/:id/role` | Benutzer-Rolle ändern | ✅ | Admin |
| `DELETE` | `/:id` | Benutzer löschen | ✅ | Admin |

---

### 📁 File Routes (`/api/files`)

| Methode | Endpoint | Beschreibung | Auth | Zugriff |
|---------|----------|--------------|------|---------|
| `POST` | `/upload` | Datei hochladen | ✅ | Member |
| `GET` | `/` | Alle Dateien (gefiltert nach Berechtigung) | ✅ | Member |
| `GET` | `/:id` | Datei herunterladen | ✅ | Member |
| `GET` | `/:id/info` | Datei-Metadaten | ✅ | Member |
| `DELETE` | `/:id` | Datei löschen | ✅ | Admin |
| `PUT` | `/:id/access` | Zugriffsrechte ändern | ✅ | Admin |

#### Upload-Format
```
Content-Type: multipart/form-data

file: <binary>
visibility: "all" | "register" | "admin"
folderId: <number> (optional)
```

---

### 📂 Folder Routes (`/api/folders`)

| Methode | Endpoint | Beschreibung | Auth | Zugriff |
|---------|----------|--------------|------|---------|
| `POST` | `/` | Ordner erstellen | ✅ | Admin |
| `PUT` | `/:id` | Ordner umbenennen/ändern | ✅ | Admin |
| `DELETE` | `/:id` | Ordner löschen | ✅ | Admin |
| `GET` | `/:id/contents` | Ordnerinhalt abrufen | ✅ | Member |

---

### 📰 News Routes (`/api/news`)

| Methode | Endpoint | Beschreibung | Auth | Zugriff |
|---------|----------|--------------|------|---------|
| `GET` | `/` | Alle News abrufen | ❌ | Public |
| `GET` | `/:id` | News nach ID | ❌ | Public |
| `POST` | `/` | News erstellen | ✅ | Admin |
| `PUT` | `/:id` | News aktualisieren | ✅ | Admin |
| `DELETE` | `/:id` | News löschen | ✅ | Admin |

---

### 🎺 Register Routes (`/api/registers`)

| Methode | Endpoint | Beschreibung | Auth | Zugriff |
|---------|----------|--------------|------|---------|
| `GET` | `/` | Alle Register abrufen | ✅ | Member |
| `GET` | `/:id` | Register mit Mitgliedern | ✅ | Member |
| `POST` | `/` | Register erstellen | ✅ | Admin |
| `PUT` | `/:id` | Register aktualisieren | ✅ | Admin |
| `DELETE` | `/:id` | Register löschen | ✅ | Admin |

---

### 🎵 Sheet Music Routes (`/api/sheet-music`)

| Methode | Endpoint | Beschreibung | Auth | Zugriff |
|---------|----------|--------------|------|---------|
| `GET` | `/` | Alle Noten (Suche/Filter/Pagination) | ✅ | Member |
| `GET` | `/export-csv` | CSV-Export | ✅ | Admin |
| `GET` | `/export-pdf` | PDF-Export | ✅ | Admin |
| `GET` | `/:id` | Noten nach ID | ✅ | Member |
| `POST` | `/` | Noten erstellen | ✅ | Admin |
| `POST` | `/import-csv` | CSV-Import | ✅ | Admin |
| `POST` | `/:id/bookmark` | Bookmark setzen/entfernen | ✅ | Admin |
| `PUT` | `/:id` | Noten aktualisieren | ✅ | Admin |
| `DELETE` | `/:id` | Noten löschen | ✅ | Admin |

#### Query-Parameter für GET /api/sheet-music

| Parameter | Typ | Beschreibung |
|-----------|-----|--------------|
| `search` | String | Volltextsuche in Titel, Komponist, etc. |
| `genre` | String | Filter nach Genre |
| `difficulty` | String | Filter: `easy` \| `medium` \| `hard` |
| `bookmarked` | Boolean | Nur mit Lesezeichen |
| `sortBy` | String | Sortierfeld |
| `sortOrder` | String | `asc` \| `desc` |
| `page` | Number | Seite (Pagination) |
| `limit` | Number | Einträge pro Seite |

---

### ⚙️ Settings Routes (`/api/settings`)

| Methode | Endpoint | Beschreibung | Auth | Zugriff |
|---------|----------|--------------|------|---------|
| `GET` | `/` | Alle Einstellungen | ✅ | Admin |
| `GET` | `/:key` | Einstellung nach Key | ✅ | Admin |
| `PUT` | `/:key` | Einstellung aktualisieren | ✅ | Admin |

---

### 📬 Contact Routes (`/api/contact`)

| Methode | Endpoint | Beschreibung | Auth | Zugriff |
|---------|----------|--------------|------|---------|
| `POST` | `/` | Kontaktformular absenden | ❌ | Public |

---

### 📆 Calendar Routes (`/api/calendar`)

| Methode | Endpoint | Beschreibung | Auth | Zugriff |
|---------|----------|--------------|------|---------|
| `GET` | `/:token` | iCal-Feed für Benutzer | Token | Via Token |

#### Verwendung
```
webcal://example.com/api/calendar/<userCalendarToken>
```

---

### 🔔 Push Routes (`/api/push`)

| Methode | Endpoint | Beschreibung | Auth | Zugriff |
|---------|----------|--------------|------|---------|
| `GET` | `/vapid-public-key` | VAPID Public Key abrufen | ❌ | Public |
| `POST` | `/subscribe` | Push-Subscription registrieren | ✅ | Member |
| `DELETE` | `/unsubscribe/:id` | Subscription entfernen | ✅ | Member |
| `GET` | `/subscriptions` | Eigene Subscriptions abrufen | ✅ | Member |
| `POST` | `/test` | Test-Notification senden | ✅ | Member |

---

### 🛡️ Admin Routes (`/api/admin`)

| Methode | Endpoint | Beschreibung | Auth | Zugriff |
|---------|----------|--------------|------|---------|
| `GET` | `/reminders` | Reminder-Queue-Status | ✅ | Member |

---

## Frontend-Architektur

### Routing-Struktur

```
/                          → HomePage (Public)
/about                     → AboutPage (Public)
/contact                   → ContactPage (Public)
/login                     → LoginPage (Public)
/forgot-password           → ForgotPasswordPage (Public)
/reset-password/:token     → ResetPasswordPage (Public)

/member                    → Dashboard (Protected)
/member/events             → EventListPage (Protected)
/member/events/:id         → EventDetailPage (Protected)
/member/files              → FileListPage (Protected)
/member/settings           → UserSettingsPage (Protected)
/member/members            → UserManagementPage (Protected)

/member/admin/events/new         → CreateEventPage (Admin)
/member/admin/events/:id/edit    → CreateEventPage (Admin)
/member/admin/registers          → RegisterManagementPage (Admin)
/member/admin/news               → NewsManagementPage (Admin)
/member/admin/events             → EventManagementPage (Admin)
/member/admin/sheet-music        → SheetMusicManagementPage (Admin)
```

### Komponenten-Übersicht

| Kategorie | Komponenten |
|-----------|-------------|
| **admin/** | UserCreateDialog, CalendarTokenDialog, AdminFilters |
| **auth/** | ProtectedRoute |
| **events/** | EventCard, EventFilters, AttendanceSelector, SetlistManager |
| **files/** | FileCard, FileUploadDialog, FolderTree, FileFilters, AccessControl |
| **layout/** | MainLayout, PublicLayout, Header, Sidebar, Footer |
| **news/** | NewsCard |
| **stats/** | AttendanceStats |
| **ui/** | Button, Card, Dialog, Select, Input, Badge, Tooltip, etc. |

### Services (API-Layer)

| Service | Verantwortlich für |
|---------|-------------------|
| `authService.ts` | Login, Register, Passwort-Reset |
| `eventService.ts` | Events CRUD, Attendance, Setlist |
| `userService.ts` | Benutzerverwaltung, Profile |
| `fileService.ts` | Upload, Download, Ordner |
| `newsService.ts` | News CRUD |
| `registerService.ts` | Register-Verwaltung |
| `sheetMusicService.ts` | Notenverwaltung, Import/Export |
| `settingsService.ts` | Globale Einstellungen |
| `pushNotificationService.ts` | Push-Subscriptions |

### State Management

- **React Query** für Server-State (Caching, Invalidierung)
- **AuthContext** für Authentifizierungsstatus
- **Local State** für UI-spezifische States

### PWA-Features

- Service Worker Registration in `App.tsx`
- Push-Notification-Unterstützung
- Offline-fähige Assets (vite-plugin-pwa)

---

## Benachrichtigungssystem

### Architektur-Übersicht

```mermaid
graph LR
    A[Event Trigger] --> B[NotificationService]
    B --> C[EmailService]
    B --> D[PushService]
    E[ReminderQueue] --> B
    F[Cron Jobs] --> E
```

### Auslöser für Benachrichtigungen

| Ereignis | Email | Push | Konfigurierbar |
|----------|-------|------|----------------|
| Neues Event erstellt | ✅ | ✅ | Pro User |
| Event aktualisiert | ✅ | ✅ | Pro User |
| Event gelöscht | ✅ | ✅ | Pro User |
| Neue Datei hochgeladen | ✅ | ✅ | Pro User |
| Datei gelöscht | ✅ | ✅ | Pro User |
| Geplante Erinnerung | ✅ | ✅ | Pro User + Kategorie |

### Reminder-System

Das Erinnerungssystem basiert auf **BullMQ** mit **Redis** als Queue-Backend:

1. **Bei Event-Erstellung**: Jobs werden für jede User-spezifische Erinnerung geplant
2. **Job-Payload**: `{ eventId, userId, intervalMinutes, channels: { email, push } }`
3. **Worker**: Verarbeitet Jobs zum geplanten Zeitpunkt
4. **Sync**: Bei Serverstart werden bestehende Events mit der Queue synchronisiert

### Benutzer-Einstellungen

Jeder Benutzer kann pro Event-Kategorie (rehearsal, performance, other) konfigurieren:
- Email-Benachrichtigungen aktivieren
- Push-Benachrichtigungen aktivieren
- Erinnerungsintervalle (z.B. 60min, 1440min = 24h vorher)
- Nur bei "Teilnahme" oder immer erinnern

---

## Design-System

### Farbpalette

| Variable | Wert | Verwendung |
|----------|------|------------|
| `--musig-primary` | `#BDD18C` | Primär-Farbe (Lime Green) |
| `--musig-contrast` | `#405116` | Kontrast-Farbe (Dark Green) |
| `--musig-cream` | `#F5F5F0` | Hintergrund |
| `--musig-dark` | `#262626` | Text |

### UI-Komponenten (shadcn/ui)

Die Anwendung verwendet eine angepasste Version von **shadcn/ui**:

- Buttons (Primary, Secondary, Destructive, Ghost)
- Cards mit Header/Content/Footer
- Dialoge (Modal)
- Selects und Dropdowns
- Forms mit React Hook Form + Zod
- Tooltips
- Checkboxes und Switches
- Radio Groups
- Badges für Status/Tags

### Responsive Design

- Mobile-First-Ansatz
- Breakpoints via TailwindCSS
- Touch-optimierte Targets (min. 44px)
- Collapsible Sidebar auf Mobile

---

## Deployment

### Systemd Services

**Backend-Service:**
```ini
[Unit]
Description=Musig Elgg Backend
After=network.target mysql.service redis.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/010_backend
ExecStart=/usr/bin/node server.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

**Frontend-Service:**
```ini
[Unit]
Description=Musig Elgg Frontend Dev Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/020_frontend
ExecStart=/usr/bin/npm run preview
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

### Redis via Docker

```yaml
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    container_name: musig_redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
volumes:
  redis_data:
```

### Umgebungsvariablen

**Backend (.env):**
```env
DATABASE_URL="mysql://user:password@localhost:3306/musig_elgg"
JWT_SECRET="your-jwt-secret"
PORT=3004
CORS_ORIGIN="http://localhost:3000"

# Email (Nodemailer)
SMTP_HOST="smtp.example.com"
SMTP_PORT=587
SMTP_USER="noreply@example.com"
SMTP_PASS="password"
SMTP_FROM="Musig Elgg <noreply@example.com>"

# Push Notifications
VAPID_PUBLIC_KEY="..."
VAPID_PRIVATE_KEY="..."
VAPID_SUBJECT="mailto:admin@example.com"

# Redis
REDIS_HOST="localhost"
REDIS_PORT=6379
```

**Frontend (.env):**
```env
VITE_API_URL="http://localhost:3004/api"
```

---

## Zusammenfassung

Das **Musig Elgg**-Projekt ist eine vollständige Vereinsverwaltungslösung mit:

- **68+ API-Endpunkten** für alle CRUD-Operationen
- **13 Datenbank-Modellen** mit komplexen Beziehungen
- **6 Backend-Services** für Benachrichtigungen, Erinnerungen und mehr
- **Moderne Frontend-Architektur** mit React 19, TypeScript, und TanStack Query
- **PWA-Unterstützung** mit Push-Notifications
- **Flexibles Berechtigungssystem** auf Datei-, Ordner- und Event-Ebene
- **Wiederkehrende Events** mit RRule-Unterstützung
- **Notenverwaltung** mit Setlist-Funktionalität für Events

Die Anwendung ist sowohl für öffentliche Besucher (Website mit Events, News, Kontakt) als auch für Vereinsmitglieder (Mitgliederbereich mit allen Verwaltungsfunktionen) konzipiert.
