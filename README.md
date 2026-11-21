# Neckartenzlingen Live

Web-App für das iPhone: Liveticker, Wochenübersicht, Tabelle und Spielplan der Handballjugend des
**TSV Neckartenzlingen** (Standard: gemischte D-Jugend, Bezirksklasse Staffel 1).
Die Daten kommen direkt vom Handy aus den öffentlichen Handball4All-Schnittstellen.
Es gibt keinen Server, keine Werbung und kein Tracking. Details stehen in [`SPEZIFIKATION.md`](SPEZIFIKATION.md).

## Funktionen

- **Woche:** alle Spiele der Spielwoche (Filter *Meine* / *Jugend* / *Alle*), laufende Spiele oben mit ● LIVE, Blättern durch die Saison
- **Liveticker:** erscheint automatisch, sobald Handball4All ihn für ein Spiel freigibt. Großer Spielstand, laufende Uhr, Halbzeit, Verlauf und Statistik (nur Trikotnummern, keine Kindernamen)
- **Staffel:** Tabelle und kompletter Saisonspielplan (springt zum nächsten Spiel)
- „Bildschirm an lassen“, Teilen, Offline-Anzeige des letzten Stands, Hell- und Dunkelmodus
- Aktualisierung: Ticker alle 15 s, Wochenübersicht alle 60 s während eines Spiels; im Hintergrund und nach Spielende gibt es keine Abrufe

## Auf dem iPhone nutzen

1. Seite veröffentlichen (siehe unten) und in **Safari** öffnen.
2. **Teilen → „Zum Home-Bildschirm“**. Danach startet sie wie eine App im Vollbild.
3. Ein Ticker-Link eines anderen Spiels lässt sich auf der Startseite unter „Ticker eines anderen Spiels öffnen“ einfügen.
   Alternativ kann man die Seite direkt mit `…/?token=<TOKEN>` aufrufen.

**Demo ohne laufendes Spiel:** `…/?demo=1` spielt das Spiel vom 21.11.2026 (TSV – SG Hegensberg-Liebersbronn, 24:20) im 30-fachen Zeitraffer ab.

## Veröffentlichen mit GitHub Pages (kostenlos)

1. Im Repository auf GitHub: **Settings → Pages**.
2. *Source*: „Deploy from a branch“. Den Branch mit diesem Code wählen, Ordner `/ (root)`, dann **Save**.
3. Nach ein bis zwei Minuten ist die Seite unter `https://<benutzername>.github.io/<repository>/` erreichbar.

Die Seite braucht HTTPS. GitHub Pages liefert das automatisch, und nur damit funktionieren der Offline-Modus und „Bildschirm an“.

> Die Seite ist dann öffentlich erreichbar. Für den privaten Gebrauch im Elternkreis die Adresse nur dort teilen.
> Bei einer öffentlichen Verbreitung vorher Handball4All bzw. den BWHV fragen (siehe Spezifikation, Kapitel 9).

## Lokal starten und testen

```bash
npm start          # http://localhost:8080 (Python-Webserver)
npm test           # Parser- und Uhr-Tests gegen echte, bereinigte Antworten (Node 20+)
```

## Anderer Verein oder andere Mannschaft

In `config.js` folgende Werte anpassen:
- `orgId` und `clubId`: aus dem Handball4All-Portal-Link (`…#/club?ogId=216&cId=260`)
- `clubName`, `clubShortMatch`
- `favoriteClassId`: Staffel-ID, z. B. aus der Staffelansicht `#/staffel/<id>`

## Aufbau

```
index.html, styles/app.css, manifest.webmanifest, sw.js, icons/
config.js                 Verein, Staffel, Takte
src/h4a.js                Abrufe + lokaler Zwischenspeicher
src/parse-*.js, clock.js  Auswertung (ohne DOM, getestet)
src/views/*.js            Woche, Spiel/Ticker, Staffel
src/demo.js               Demo-Modus aus tests/fixtures
tests/                    node:test + echte Antworten (ohne Personennamen)
```

Daten: Handball4All AG. Dies ist kein offizielles Angebot des Vereins, des Verbands oder von Handball4All.
