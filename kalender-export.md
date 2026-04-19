# Kalender-Export und automatische Kalenderintegration

## Zweck

Mit dem Kalender-Export kann jede Benutzerin und jeder Benutzer den eigenen Musig-Elgg-Terminplan in den privaten Kalender einbinden. Dabei gibt es zwei Varianten:

- Automatische Synchronisation per Kalender-Link
- Manueller Export einzelner Termine als `.ics`-Datei

Fuer den Alltag ist die automatische Synchronisation die empfohlene Variante. Der Kalender wird dabei nicht nur einmal importiert, sondern als abonnierter Kalender eingebunden und spaeter vom Kalenderprogramm selbst wieder aktualisiert.

## Unterschied zwischen Abo-Link und manuellem Export

### Automatische Synchronisation per Link

- Der Kalender wird per persoenlichem Link abonniert.
- Neue, geaenderte oder entfernte Termine werden spaeter automatisch im eigenen Kalender nachgezogen.
- Es ist kein erneuter Export noetig.
- Diese Variante ist fuer Apple Kalender, Outlook, Google Kalender und viele mobile Kalender-Apps geeignet.

### Manueller Export als `.ics`

- Es wird eine statische Datei heruntergeladen.
- Die Datei enthaelt nur den Stand zum Zeitpunkt des Exports.
- Spaetere Aenderungen im Musig-Elgg-Kalender erscheinen nicht automatisch im eigenen Kalender.
- Diese Variante eignet sich nur fuer Einmalimporte oder zum Teilen einer festen Terminliste.

## Wo die Funktion im System zu finden ist

Im Frontend gibt es im Bereich Termine den Dialog Kalender Export. Dort werden zwei Wege angeboten:

- Automatische Synchronisation mit persoenlichem Link
- Manueller Export von ausgewaehlten Terminen als PDF oder `.ics`

Die automatische Variante ist im Dialog explizit als empfohlen markiert.

## So funktioniert die automatische Kalenderintegration

### Grundprinzip

Jeder Benutzer erhaelt einen persoenlichen Kalender-Link. Dieser Link zeigt auf einen dynamisch erzeugten ICS-Feed. Das Kalenderprogramm abonniert diesen Feed und prueft ihn in regelmaessigen Abstaenden erneut.

Wichtig ist der Unterschied:

- Importieren bedeutet einmalige Uebernahme
- Abonnieren bedeutet dauerhafte Verknuepfung mit automatischer Aktualisierung

Nur beim Abonnieren funktionieren spaetere Updates automatisch.

### Technischer Ablauf im Projekt

Die Implementierung arbeitet aktuell wie folgt:

- Der Feed ist ueber den Backend-Endpunkt `/api/calendar/:token` erreichbar.
- Der Link ist oeffentlich erreichbar, aber durch einen persoenlichen Token in der URL geschuetzt.
- Das Frontend erzeugt aus der API-URL einen Kalender-Link und ersetzt dabei `http` durch `webcal`.
- Beim Oeffnen des Benutzerprofils wird ein `calendarToken` automatisch erzeugt, falls fuer den Benutzer noch keiner existiert.
- Das Backend erzeugt beim Abruf dynamisch eine ICS-Datei aus den sichtbaren Terminen.
- Die Termine werden mit stabilen `uid`-Werten ausgeliefert, damit Kalenderprogramme Aenderungen besser wiedererkennen koennen.

### Welche Termine im Feed enthalten sind

Der Kalender-Feed liefert nicht einfach alles ungefiltert aus, sondern richtet sich nach dem Benutzerkontext:

- Admin-Benutzer sehen alle Termine.
- Nicht-Admin-Benutzer erhalten aktuell Termine mit Sichtbarkeit `all` und `register`.
- Termine werden ab drei Monaten in der Vergangenheit bis in die Zukunft ausgeliefert.

Damit bleibt der Feed kompakt und enthaelt trotzdem die relevanten vergangenen und kommenden Termine.

## Kalender-Link verwenden

### Link im System kopieren

1. Terminbereich oeffnen.
2. Kalender Export anklicken.
3. Im Abschnitt Automatische Synchronisation den angezeigten Link kopieren.
4. Diesen Link im persoenlichen Kalender als Kalender-Abonnement hinzufuegen.

### Format des Links

Im Frontend wird der Link typischerweise als `webcal://...` angezeigt. Viele Kalenderprogramme erkennen dieses Format direkt als abonnierbaren Kalender.

Falls ein Dienst `webcal://` nicht akzeptiert, kann derselbe Link in vielen Faellen auch mit `https://` verwendet werden. Dabei bleibt der Rest der URL unveraendert.

Beispiel:

```text
webcal://example.ch/api/calendar/DEIN_TOKEN
```

Falls noetig:

```text
https://example.ch/api/calendar/DEIN_TOKEN
```

## Schritt-fuer-Schritt fuer gaengige Kalender

### Apple Kalender auf macOS

1. Kalender-App oeffnen.
2. Im Menue Ablage den Punkt Neues Kalenderabonnement waehlen.
3. Den kopierten Link einfuegen.
4. Mit Abonnieren bestaetigen.
5. Aktualisierungsintervall auswaehlen, falls Apple dies anbietet.
6. Optional Farbe und Name anpassen.

Ergebnis: Der Musig-Elgg-Kalender wird als abonnierten Kalender eingebunden und spaeter automatisch aktualisiert.

### Apple Kalender auf iPhone oder iPad

1. Link kopieren.
2. In Safari einfuegen oder an das Geraet senden.
3. Wenn iOS den Link direkt erkennt, Kalenderabonnement bestaetigen.
4. Alternativ unter Einstellungen, Kalender, Accounts, Account hinzufuegen, Andere, Kalenderabo hinzufuegen den Link einfuegen.

Ergebnis: Der Kalender wird als Abo eingebunden und von iOS periodisch aktualisiert.

### Google Kalender

Google Kalender arbeitet bei Kalender-Abos ueblicherweise mit URL-basierten Kalendern. Hier sollte in der Regel die `https://`-Variante des Links verwendet werden.

1. Google Kalender im Browser oeffnen.
2. Bei Weitere Kalender auf das Plus-Symbol klicken.
3. Per URL waehlen.
4. Den Kalender-Link einfuegen, wenn noetig als `https://...` statt `webcal://...`.
5. Mit Kalender hinzufuegen bestaetigen.

Ergebnis: Google uebernimmt den Feed als abonnierten Kalender.

Wichtig: Google aktualisiert abonnierte externe Kalender nicht sofort. Je nach Google-Intervall kann es dauern, bis Aenderungen sichtbar werden.

### Outlook fuer Windows oder Outlook im Web

1. Outlook oeffnen.
2. Kalenderbereich wechseln.
3. Kalender hinzufuegen oder Aus dem Internet abonnieren waehlen.
4. Den kopierten Link einfuegen.
5. Falls erforderlich `https://` statt `webcal://` verwenden.
6. Speichern oder abonnieren.

Ergebnis: Outlook bindet den Kalender als Internetkalender ein und aktualisiert ihn spaeter automatisch.

### Android-Kalender

Auf Android haengt die genaue Vorgehensweise von der Kalender-App ab. Viele Apps nutzen entweder Google Kalender im Hintergrund oder unterstuetzen Internetkalender direkt.

Typischer Ablauf:

1. Kalender-App oder Google Kalender oeffnen.
2. Kalender hinzufuegen.
3. Internetkalender oder Kalender per URL waehlen.
4. Link einfuegen.
5. Falls noetig `https://` statt `webcal://` verwenden.

Wenn die lokale Kalender-App keine URL-Abos unterstuetzt, den Kalender ueber Google Kalender im Browser abonnieren. Danach erscheint er meist automatisch auch auf dem Android-Geraet.

## Wie die automatische Aktualisierung funktioniert

### Was automatisch passiert

Wenn ein Kalenderprogramm den Musig-Elgg-Kalender als Abo eingebunden hat, fragt es den Link spaeter erneut ab. Dabei wird nicht eine lokal gespeicherte alte Datei verwendet, sondern der aktuelle Feed vom Server geladen.

Dadurch werden folgende Aenderungen uebernommen:

- neue Termine
- geaenderte Titel
- geaenderte Daten oder Uhrzeiten
- geaenderte Orte
- geaenderte Beschreibungen
- entfernte Termine, soweit das Kalenderprogramm diese Aenderung korrekt uebernimmt

### Wann Aktualisierungen sichtbar werden

Die Aktualisierung wird nicht direkt durch Musig Elgg gepusht, sondern vom jeweiligen Kalenderdienst abgeholt. Der Zeitpunkt haengt deshalb vom Kalenderprogramm ab.

Das bedeutet in der Praxis:

- Apple Kalender aktualisiert oft relativ regelmaessig.
- Outlook aktualisiert nach seinem eigenen Intervall.
- Google Kalender kann deutlich verzoegert sein.
- Einzelne Mobile-Apps aktualisieren nur bei App-Start oder in groesseren Abstaenden.

Deshalb ist automatische Synchronisation nicht gleichbedeutend mit Echtzeit. Sie bedeutet, dass keine manuelle Neu-Import-Aktion mehr noetig ist.

## Sicherheit und Datenschutz

### Der Link ist persoenlich

Der Kalender-Link enthaelt einen persoenlichen Token. Dieser Link ist funktional ein Leseschluessel fuer den persoenlichen Kalender-Feed.

Deshalb gilt:

- Den Link nicht oeffentlich weitergeben.
- Den Link nicht in Gruppen-Chats oder frei zugaenglichen Dokumenten teilen.
- Wer den Link kennt, kann den Kalender-Feed abrufen.

### Keine zusaetzliche Anmeldung beim Abruf

Der Feed-Endpunkt ist bewusst ohne normale Session-Anmeldung aufrufbar, weil externe Kalenderprogramme in der Regel keinen normalen App-Login mittragen. Der Zugriff wird daher ausschliesslich ueber den Token in der URL abgesichert.

## Personalisierte Tokens im Detail

### Was ist der personalisierte Token

Jeder Benutzer hat einen individuellen Kalender-Token. Dieser Token ist der Schluessel im persoenlichen Feed-Link und wird im Pfad der URL verwendet:

```text
/api/calendar/:token
```

Wenn ein Kalenderprogramm diesen Link aufruft, identifiziert das Backend den Benutzer ueber genau diesen Token.

### Wo der Token gespeichert wird

Der Token wird in der User-Tabelle der Datenbank gespeichert:

- Feld: `User.calendarToken`
- Typ: `String` (nullable)
- Constraint: `@unique`

Damit ist sichergestellt, dass derselbe Token nicht bei mehreren Benutzern vorkommt.

Die zugehoerige Datenbankmigration legt dafuer eine eigene Spalte und einen Unique-Index an.

### Wie der Token erzeugt wird

Aktuell gibt es drei Stellen im Ablauf:

1. Registrierung:
	Beim Anlegen eines neuen Benutzers wird direkt ein zufaelliger Token erzeugt (`crypto.randomBytes(32).toString('hex')`).
2. Lazy-Erzeugung in `GET /auth/me`:
	Falls ein alter Benutzer noch keinen Token hat, wird beim Laden der eigenen Benutzerdaten automatisch ein neuer Token erstellt und gespeichert.
3. Manuelle Rotation:
	Ueber `POST /api/users/me/calendar/rotate-token` kann der Benutzer einen neuen Token erzeugen und den alten sofort ungueltig machen.

### Token-Laenge und Entropie

Die aktuelle Erzeugung nutzt 32 zufaellige Bytes und kodiert diese als Hex-String.

- Rohwert: 32 Byte
- Entspricht: 256 Bit Zufall
- Darstellung: 64 Hex-Zeichen

Das ist fuer URL-basierte Secret-Links grundsaetzlich stark und ausreichend.

### Wie der Token beim Feed-Abruf verwendet wird

Beim Request auf `/api/calendar/:token` passiert intern:

1. Token aus dem URL-Pfad lesen.
2. Benutzer ueber `calendarToken` suchen.
3. Falls kein Treffer: `404 Invalid calendar token`.
4. Falls Treffer: Benutzerkontext und gespeicherte Kalenderpraeferenzen laden.
5. Event-Query aus Sichtbarkeit + Filtern aufbauen.
6. ICS dynamisch erzeugen und ausliefern.

Wichtig: Ohne gueltigen Token wird kein Feed erstellt.

### Was bei einer Token-Rotation passiert

Beim Zuruecksetzen des Links wird der alte Token in der Datenbank ersetzt.

Folgen:

- Alte Kalender-Links funktionieren sofort nicht mehr.
- Externe Kalender, die noch den alten Link abonniert haben, erhalten danach keinen gueltigen Feed mehr.
- Der Benutzer muss den neuen Link in seinen Kalenderdiensten erneut abonnieren oder die URL dort aktualisieren.

### Gespeicherte Kalenderpraeferenzen und Zusammenspiel mit Token

Neben `calendarToken` gibt es pro Benutzer ein JSON-Feld `calendarPreferences`.

Darin werden Filter und Erinnerungsoptionen gespeichert:

- `onlyConfirmed`
- `categories`
- `reminderMinutes`

Der Feed kann diese Werte verwenden. Query-Parameter im Link haben dabei Vorrang vor den gespeicherten Defaults.

Beispiel:

- Im Benutzerprofil gespeichert: `onlyConfirmed=false`
- Im Link angegeben: `?onlyConfirmed=true`
- Effektiver Feed: nur zugesagte Termine

### Sicherheitsimplikationen der aktuellen Speicherung

Der Token wird aktuell im Klartext in der Datenbank gespeichert (nicht gehasht). Das ist fuer URL-Secret-Feeds technisch ueblich, aber mit klaren Konsequenzen:

- Bei Datenbank-Leak sind alle aktiven Kalender-Links direkt nutzbar.
- Token sollten deshalb als sensible Zugangsdaten behandelt werden.

Praktische Schutzmassnahmen:

- Link nur ueber TLS (`https`) verteilen.
- Keine Ausgabe des kompletten Tokens in Logs.
- Bei Verdacht sofort Token rotieren.
- Optional spaeter: gehashte Token-Speicherung mit getrenntem Lookup-Mechanismus.

### Lebenszyklus-Zusammenfassung

1. Benutzer wird erstellt oder ruft `auth/me` auf.
2. Token existiert und wird im Profil bereitgestellt.
3. Frontend baut daraus den persoenlichen Kalender-Link.
4. Kalender-App abonniert den Link.
5. Backend validiert Token bei jedem Abruf und liefert aktuelle ICS-Daten.
6. Bei Rotation wird alter Link sofort ungueltig.

## Technische Referenz

### Frontend

- Der Kalender-Link wird im Kalender-Export-Dialog angezeigt.
- Die URL basiert auf `VITE_API_URL`.
- Fuer abonnierbare Links wird das Schema von `http` oder `https` auf `webcal` umgestellt.

### Backend

- Route: `/api/calendar/:token`
- Oeffentliche Route mit Token in der URL
- Feed-Ausgabe als `text/calendar; charset=utf-8`
- Dateiname in der Antwort: `musig_elgg.ics`

### Token-Erzeugung

- Das Benutzerobjekt enthaelt ein Feld `calendarToken`.
- Falls noch kein Token existiert, wird beim Laden der Benutzerdaten automatisch ein neuer Token erzeugt und gespeichert.
- Der Token ist pro Benutzer eindeutig.

## Empfehlungen fuer die Kommunikation an Endbenutzer

Folgende Kurzform eignet sich gut fuer eine Hilfeseite oder einen Hinweistext im UI:

```text
Fuer laufend aktuelle Termine bitte den Kalender-Link abonnieren und nicht die .ics-Datei einmalig importieren. Nur das Kalender-Abo aktualisiert sich spaeter automatisch.
```

Eine etwas ausfuehrlichere Variante:

```text
Verwende fuer deinen privaten Kalender den persoenlichen Kalender-Link im Bereich Kalender Export. Wenn du den Link als Kalender-Abonnement hinzufuegst, werden spaetere Termin-Aenderungen automatisch aktualisiert. Ein einmaliger .ics-Import ist nur eine statische Momentaufnahme.
```

## Typische Probleme und Loesungen

### Der Kalender wird nur einmal importiert, aber nicht aktualisiert

Ursache:

- Der Kalender wurde als Datei importiert statt als URL abonniert.

Loesung:

- Den persoenlichen Link verwenden.
- Den Kalender im Zielsystem als Internetkalender oder Kalender-Abonnement hinzufuegen.

### Der Link wird vom Kalenderprogramm nicht akzeptiert

Ursache:

- Das Zielsystem erwartet `https://` statt `webcal://`.

Loesung:

- Das Schema manuell auf `https://` aendern und erneut einfuegen.

### Termin-Aenderungen erscheinen nicht sofort

Ursache:

- Das externe Kalenderprogramm hat den Feed noch nicht erneut abgerufen.

Loesung:

- Abwarten oder im Zielsystem eine manuelle Aktualisierung anstossen, falls diese Funktion vorhanden ist.
- Beachten, dass insbesondere Google Kalender nicht sofort synchronisiert.

### Es fehlen Termine im Feed

Moegliche Ursachen:

- Der Benutzer ist kein Admin und sieht daher nicht alle internen Termine.
- Der Termin liegt weiter als drei Monate in der Vergangenheit.
- Die Sichtbarkeit des Termins ist eingeschraenkt.

### Der Link wurde weitergegeben

Risiko:

- Dritte koennen den persoenlichen Kalender abrufen.

Empfohlene Massnahme:

- Token rotieren oder einen neuen Token erzeugen lassen, falls diese Funktion spaeter im UI oder Admin-Bereich angeboten wird.
- Bis dahin sollte der betroffene Link als kompromittiert betrachtet werden.

## Fazit

Fuer eine dauerhaft aktuelle Kalenderintegration soll immer der persoenliche Kalender-Link verwendet und als Abo in der eigenen Kalender-App hinterlegt werden. Der manuelle `.ics`-Export ist nur fuer Einmalimporte gedacht.

Die automatische Aktualisierung funktioniert, weil das Kalenderprogramm den persoenlichen Feed spaeter erneut vom Server abruft. Wann diese Aktualisierung sichtbar wird, bestimmt jedoch das jeweilige Kalenderprogramm oder der jeweilige Kalenderdienst.