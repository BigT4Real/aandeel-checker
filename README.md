# Aandeel Checker

**Checklist voor aankoop van een aandeel** — drie simpele checks, één duidelijk oordeel:

1. **Kan het bedrijf omvallen?** (schulden, rente, geldstroom)
2. **Koop je op het verkeerde moment?** (koershoogte, economiegevoeligheid)
3. **Betaal je niet te veel?** (prijs-winst nu vs. normaal, verwachte opbrengst)

In gewone taal, voor gewone beleggers. Met portefeuille (aantal stuks, aankoopprijs, datum), adviesbolletjes (blauw = houden, groen = aankopen, rood = verkopen), volglijst, instelbare grenzen en automatisch ingevulde bedrijfscijfers via gratis API's (VS én Europa).

## Op je eigen pc gebruiken (Windows)

Je hebt alleen **Node.js** nodig (eenmalig installeren via [nodejs.org](https://nodejs.org), kies de LTS-versie).

1. Download deze repository: groene knop **Code → Download ZIP** en pak uit, of:
   ```
   git clone https://github.com/BigT4Real/aandeel-checker.git
   ```
2. Ga in de map staan en installeer eenmalig de onderdelen:
   ```
   npm install
   ```
3. **Snelkoppeling op je bureaublad:** dubbelklik eenmalig op `maak-snelkoppeling.vbs`.
   Er verschijnt een icoontje **Aandeel Checker** op je bureaublad.
4. Daarna: dubbelklik op dat icoontje → de app opent vanzelf in je browser op `http://localhost:8901`.

> De snelkoppeling start `start-aandeel-checker.bat`, die de app lokaal draait met `npm run preview`.
> Je gegevens (portefeuille, volglijst, instellingen) blijven in je eigen browser opgeslagen.

## Zelf bouwen / ontwikkelen

```
npm install
npm run dev      # ontwikkelserver
npm run build    # bouwen naar dist/
npm run preview  # gebouwde app lokaal bekijken
```

## Live koersen en bedrijfscijfers

Zonder API-sleutel werkt de app met Stooq-koersen en voorbeelddata. Voor volautomatisch invullen
(VS + Europa) haal je gratis sleutels en vul je ze in via het tandwiel in de app:

- **Twelve Data** (koersen + cijfers, VS en Europa): [twelvedata.com/apikey](https://twelvedata.com/apikey)
- **Alpha Vantage** (reserve, alleen VS): [alphavantage.co/support/#api-key](https://www.alphavantage.co/support/#api-key)

---

*Deze checklist is educatie, geen beleggingsadvies.*
