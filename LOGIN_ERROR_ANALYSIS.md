# Login Error Analysis – Alle möglichen Fehlerfälle

## Problem
User sieht beim Einloggen die Fehlermeldung mit **dreifachem Logging** und es ist unklar, ob nur die Credentials falsch sind oder ob ein Code-Fehler vorliegt.

---

## 🔍 Alle möglichen Fehlerquellen beim Login

### 1️⃣ **User nicht gefunden** (User not found)
**Ursache:** E-Mail in der Datenbank nicht vorhanden  
**Log:** `LOGIN_FAILED – User not found`  
**Status:** ✅ Normal, kein Code-Fehler  
**Zu prüfen:**
- DB-Abfrage mit `email.toLowerCase()` – sollte konsistent sein
- Benutzer wurde nicht registriert

---

### 2️⃣ **Account deaktiviert** (Deactivated account)
**Ursache:** User existiert, aber `status = 'former'`  
**Log:** `LOGIN_BLOCKED – Account deactivated`  
**Status:** ✅ Normal, Sicherheitsfeature  
**Zu prüfen:**
- User wurde manuell deaktiviert
- keine weiteren Logins möglich, bis Admin reaktiviert

---

### 3️⃣ **Password Hash fehlt oder ist NULL** (Missing hash in database)
**Ursache:** User.password ist NULL oder leer  
**Log:** `LOGIN_ERROR – Password hash missing from database`  
**Status:** ⚠️ **Code-/Daten-Problem**  
**Zu prüfen:**
- DB-Migration schiefgelaufen (password-Spalte nicht befüllt)
- User wurde mit Seed-Daten erstellt, ohne Passwort zu hashen
- Datentyp ist zu klein (password-Spalte sollte `VARCHAR(255)` min. sein)

**DB-Check:**
```sql
SELECT id, email, status, password FROM User 
WHERE password IS NULL OR password = '' 
LIMIT 10;
```

---

### 4️⃣ **Bcrypt Hash beschädigt oder ungültiges Format** (Corrupted hash)
**Ursache:** `user.password` ist nicht null, aber kein gültiger bcrypt-Hash  
**Log:** `BCRYPT_HASH_ERROR – Password hash validation failed`  
**Status:** ⚠️ **Code-/Daten-Problem**  
**Zu prüfen:**
- Hash wurde nicht richtig mit bcrypt gehashed (z.B. plain-text gespeichert)
- Hash wurde manuell geändert
- Datenbank-Encoding Problem (utf-8 vs. Latin1)
- Hash ist gekürzt/verstümmelt

**Symptom:** Fehler ist `Invalid hash` oder `Invalid argument` in bcrypt  

**DB-Check:**
```sql
-- Gültige bcrypt-Hashes beginnen mit $2a$ oder $2b$
SELECT id, email, status, SUBSTR(password, 1, 10) FROM User 
WHERE password NOT LIKE '$2%' 
LIMIT 10;
```

---

### 5️⃣ **Falsches Passwort eingegeben** (Invalid credentials)
**Ursache:** User existiert, Hash ist OK, aber `bcrypt.compare()` gibt false zurück  
**Log:** `LOGIN_FAILED – Invalid credentials`  
**Status:** ✅ Normal, Benutzer-Fehler  
**Zu prüfen:**
- Benutzer hat Passwort vergessen
- Caps Lock ist an
- Benutzer kopiert Passwort mit Whitespace (Browser sollte trimmen)

---

### 6️⃣ **Bcrypt.compare() wirft Exception** (Bcrypt internal error)
**Ursache:** bcrypt-Funktion schlägt unerwartet fehl  
**Log:** `BCRYPT_HASH_ERROR – [...stack trace...]`  
**Status:** ⚠️ **Code-/bcrypt-Problem**  
**Zu prüfen:**
- bcrypt-Version inkompatibel
- Node.js-Version problem (bcrypt braucht native Module)
- Memory-Problem während Comparison
- Hash ist sehr lange Zeichenkette (> 60 Zeichen normal bei bcrypt)

**Symptome:**
```
Error: Invalid argument count
Error: Password string required
Error: Hash string required
```

---

### 7️⃣ **Passwort-Encoding Problem** (Encoding mismatch)
**Ursache:** Passwort wird in unterschiedlichen Encodings behandelt  
**Log:** `LOGIN_FAILED – Invalid credentials` (aber sollte passen)  
**Status:** ⚠️ **Wahrscheinlich nicht, wenn UTF-8 durchgehend**  
**Zu prüfen:**
- HTML-Form mit falschem charset
- Frontend sendet nicht-UTF-8
- MySQL charset ist nicht utf8mb4
- Password-Feld hat Trigram/Spezialzeichen

**DB-Check:**
```sql
-- MySQL charset überprüfen
SHOW CREATE TABLE User;
-- sollte: `utf8mb4` oder `utf8` sein
```

---

### 8️⃣ **JWT Signing fehlgeschlagen** (JWT generation error)
**Ursache:** Credentials OK, aber JWT.sign() schlägt fehl  
**Log:** `SERVER_ERROR – [JWT error message]`  
**Status:** ⚠️ **Code-/Konfiguration-Problem**  
**Zu prüfen:**
- `JWT_SECRET` ist nicht gesetzt oder leer
- `JWT_SECRET` ist falsch formatiert
- `JWT_EXPIRES_IN` ist ungültiges Format

---

### 9️⃣ **Datenbank-Fehler beim findUnique** (Database error)
**Ursache:** Prisma-Abfrage schlägt fehl  
**Log:** `SERVER_ERROR – [Prisma error]`  
**Status:** ⚠️ **Datenbank-Problem**  
**Zu prüfen:**
- MySQL Connection fehlgeschlagen
- User-Tabelle nicht erreichbar
- Timeout bei DB-Abfrage

---

### 🔟 **Userdata Update fehlgeschlagen** (Non-blocking)
**Ursache:** `lastLoginAt` / `lastSeenAt` Update schlägt fehl  
**Log:** Wird geloggt, aber nicht geworfen (`.catch(() => {})`)  
**Status:** ✅ Normal, Login-Success wird nicht blockiert  
**Impact:** Minimal, login ist erfolgreich

---

## 📊 Logging-Redundanzen (behoben)

Vorher wurden **3 Logs für einen Fehler** geschrieben:

```
WARN  Email:xxx - LOGIN_FAILED (Wrong password for 'xxx')
ERROR Email:xxx - LOGIN_ERROR (Ungültige E-Mail oder Passwort; ...)
ERROR Email:xxx - REQUEST_ERROR (POST /api/auth/login – Ungültige ...)
```

**Ursache:**
- `LOGIN_FAILED` wird im login-Handler geworfen
- catch-Block des login-Handlers loggt als `LOGIN_ERROR`
- errorHandler loggt nochmals als `REQUEST_ERROR`

**Lösung:**
- Nur unerwartete Fehler im catch-Block loggen (nicht AppError)
- errorHandler überspringt bereits geloggte operational errors

**Ergebnis:** Jetzt wir d nur **1 Log** pro operationalen Fehler geschrieben.

---

## 🛠️ Debugging-Checklist

### Wenn `LOGIN_FAILED – Invalid credentials`:
```bash
# 1. Passwort korrekt eingegeben?
# 2. Caps Lock prüfen?
# 3. Whitespace im Passwort? (Frontend-Issue)
# 4. Passwort >= 8 Zeichen, min. 1 Großbuchstabe, 1 Kleinbuchstabe, 1 Ziffer?
```

### Wenn `BCRYPT_HASH_ERROR`:
```bash
# 1. User-Passwort in DB überprüfen:
SELECT id, email, HEX(password) as hash FROM User WHERE email = 'user@example.com';

# 2. Hash sollte mit 24322461 oder 24322462 beginnen (hex für $2a$ oder $2b$)
# 3. Hash-Länge sollte exakt 60 oder 61 Zeichen sein

# 4. bcrypt-Version überprüfen:
npm list bcryptjs
# sollte >= 2.4.3 sein

# 5. Test in Node:
const bcrypt = require('bcryptjs');
const hash = '...aus-DB...';
bcrypt.compare('test-password', hash).then(r => console.log(r));
```

### Wenn `LOGIN_ERROR – Password hash missing`:
```bash
# Fehlende Passwörter in DB überprüfen:
SELECT COUNT(*) FROM User WHERE password IS NULL OR password = '';

# Falls vorhanden: Migrieren oder User neu-erstellen
```

### Wenn Dreifaches Logging:
```bash
# Sollte jetzt nicht mehr auftreten, aber falls doch:
# - Check: errorHandler.js loggt nicht beide AppErrors und RequestErrors
# - Check: login-Handler hat nur ERROR für nicht-AppErrors
```

---

## 📝 Summary

| Fehler | Ursache | Status | Action |
|--------|---------|--------|--------|
| User nicht gefunden | E-Mail nicht in DB | ✅ Normal | User muss registrieren |
| Account deaktiviert | status='former' | ✅ Normal | Admin muss reaktivieren |
| Falsches Passwort | bcrypt.compare=false | ✅ Normal | Benutzer: Passwort-Vergessen nutzen |
| Hash fehlt (NULL) | DB-Migration Problem | ⚠️ Fix nötig | Admin: User re-hash oder re-create |
| Hash beschädigt | Kein gültiger bcrypt-Hash | ⚠️ Fix nötig | Admin: User-Password in DB prüfen |
| Hash ungültiges Format | Plaintext oder gekürzt | ⚠️ Fix nötig | Admin: Re-hash mit bcrypt |
| Bcrypt Exception | bcrypt/Node.js Fehler | ⚠️ Fix nötig | Dev: bcrypt-Version/build überprüfen |
| Encoding-Problem | Charset-Mismatch | ⚠️ Sehr selten | Dev: DB-Charset zu utf8mb4 ändern |
| JWT Error | JWT_SECRET fehlt/falsch | ⚠️ Fix nötig | Admin: Env-Var überprüfen |
| DB-Timeout | Connection-Problem | ⚠️ Fix nötig | Ops: MySQL Uptime prüfen |

---

## ✨ Neue Log-Actions

```javascript
LOGIN_FAILED       // WARN  – Credentials falsch (Normal)
LOGIN_BLOCKED      // WARN  – Account deaktiviert (Normal)
LOGIN_ERROR        // ERROR – Password hash fehlt (Code-Problem)
BCRYPT_HASH_ERROR  // ERROR – Hash ungültig/beschädigt (Data-Problem)
SERVER_ERROR       // ERROR – JWT/DB Fehler (5xx)
REQUEST_ERROR      // ERROR – 4xx HTTP Error (nur wenn nicht operational)
```

