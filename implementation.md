**User Story: Gastbenutzer mit einzeln gesetzten Berechtigungen**

Als Administrator möchte ich einen Gastbenutzer erstellen und für diesen Benutzer einzelne Berechtigungen gezielt aktivieren oder deaktivieren können, damit externe Personen (z. B. Aushilfen, Gäste, Fotografen, Noten-Viewer) nur exakt die Funktionen sehen und nutzen können, die sie wirklich brauchen.

**Business Value**
- Minimiert Sicherheitsrisiken durch Least-Privilege-Prinzip.
- Erleichtert temporäre Zusammenarbeit ohne Vollzugriff.
- Reduziert Supportaufwand, weil Rechte transparent und fein granuliert sind.

**Akzeptanzkriterien (Vorschlag)**
1. Admin kann im Benutzer-Dialog den Typ `Gastbenutzer` auswählen.
2. Beim Gastbenutzer kann Admin pro Berechtigung ein-/ausschalten (kein festes Rollenpaket nötig).
3. Ein Gastbenutzer erhält standardmäßig nur Minimalrechte (z. B. Login + eigenes Profil sehen).
4. UI blendet nicht erlaubte Funktionen aus oder deaktiviert sie eindeutig.
5. Backend prüft Rechte serverseitig für jeden geschützten Endpoint.
6. Rechteänderungen wirken sofort (spätestens nach Token-Refresh).
7. Admin kann Gastbenutzer deaktivieren oder Ablaufdatum setzen.
8. Alle Änderungen an Gast-Rechten werden protokolliert (wer, wann, was geändert).
9. API liefert bei fehlender Berechtigung konsistent `403 Forbidden`.
10. Bestehende Rollen (Admin, Mitglied etc.) funktionieren unverändert.

---

**Scope-Schnitt (MVP)**
- Gastbenutzer anlegen
- Einzelrechte setzen (Checkbox-Liste)
- Serverseitige Enforcement-Checks
- UI-Sichtbarkeit anhand Rechte
- Audit-Log für Rechteänderung

Später:
- Rechte-Vorlagen (Templates)
- zeitgesteuerte Rechte
- Delegation/Freigabe-Workflow

---

**Domänenmodell (konzeptionell)**
- `User`
  - `type`: `REGULAR | GUEST`
  - `isActive`
  - optional `expiresAt`
- `Permission`
  - Schlüssel, z. B. `calendar.read`, `setlist.write`, `cms.gallery.manage`
- `UserPermission`
  - direkte Zuordnung User ↔ Permission
  - optional `grantedBy`, `grantedAt`
- `AuditLog`
  - Event `guest_permissions_updated`, inkl. Diff alt/neu

Wichtig: Für Gäste direkte Berechtigungen priorisieren, keine impliziten breiten Rollen.

---

**Implementation Plan**

1. **Fachliche Rechte-Matrix definieren**
- Alle Feature-Bereiche als Permission-Keys festlegen.
- Für jede Permission klar beschreiben: Lesen, Schreiben, Löschen, Admin.
- Ergebnis als zentrale Konstante (Backend + Frontend geteilt oder synchron gehalten).

2. **Backend Datenmodell erweitern (Prisma)**
- `User.type`, `User.expiresAt` ergänzen.
- Neue Tabellen/Modelle für direkte User-Rechte.
- Migration + Seed für initiale Permission-Keys.
- Guard gegen Löschung von Permissions, die produktiv genutzt werden.

3. **AuthN/AuthZ Layer anpassen**
- Beim Login Rechte in Claims/Session laden.
- Helper wie `requirePermission('cms.gallery.read')`.
- Einheitliche 401/403-Fehlerstruktur.
- Middleware auf kritische Endpoints anwenden.

4. **Admin-API für Gastbenutzer**
- `POST /admin/users/guest` (anlegen)
- `PATCH /admin/users/:id/permissions` (Einzelrechte setzen)
- `PATCH /admin/users/:id/status` (aktiv/deaktiviert, Ablauf)
- Validierung: nur bekannte Permission-Keys, keine Duplikate.

5. **Frontend Admin UI**
- Im User-Management Option „Gastbenutzer erstellen“.
- Rechte-Editor mit Gruppen:
  - Kalender
  - Setlist
  - Dateien/Noten
  - CMS/Galerie
  - Kommunikation
- Suche/Filter in Rechte-Liste bei vielen Permissions.
- Speichern mit Diff-Anzeige („+3 / -1 Rechte“).

6. **Feature-Gating im Frontend**
- Zentraler Hook/Utility `can(permission)`.
- Navigation, Buttons, Actions dynamisch nach Rechte.
- Kein reines UI-Gating: Backend bleibt führend.

7. **Audit & Monitoring**
- Rechteänderungen mit Admin-ID, User-ID, altem/neuem Zustand loggen.
- Optional: täglicher Report „aktive Gastkonten“.
- Warnung bei abgelaufenen aber noch aktiven Sessions.

8. **Tests**
- Backend:
  - Unit: Permission-Resolver
  - Integration: 403 bei fehlendem Recht
  - Migration-Test
- Frontend:
  - UI-Tests für Sichtbarkeit/Disablement
- E2E:
  - Gastkonto mit minimalen Rechten
  - Rechte ändern, sofortige Wirkung prüfen

9. **Rollout**
- Hinter Feature-Flag `guest_user_permissions`.
- Erst Staging mit 2-3 realen Gast-Szenarien.
- Dokumentation für Admins (welches Recht macht was).
- Danach produktiv schalten.

---

**Technische Risiken und Gegenmaßnahmen**
- Inkonsistente Rechte zwischen Frontend/Backend:
  - Single Source of Truth für Permission-Keys.
- Zu grobe Berechtigungen:
  - früh in Read/Write/Admin aufteilen.
- Legacy-Endpunkte ohne AuthZ:
  - Endpoint-Inventur + Pflicht-Checkliste in PR-Template.
- Token-Caching-Effekte:
  - kurze TTL oder Refresh nach Rechteänderung.

---

**Definition of Done**
- Admin kann Gastbenutzer vollständig anlegen und fein granular berechtigen.
- Alle relevanten Endpoints prüfen Berechtigung serverseitig.
- UI verhält sich korrekt für mindestens 3 Gastprofile.
- Audit-Log vorhanden und nachvollziehbar.
- Tests grün, Doku aktualisiert.
