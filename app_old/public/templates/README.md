# Import-mallar för GravitySeries - The HUB

Denna mapp innehåller CSV-mallar för att importera resultat till systemet.

## 📋 Obligatoriska fält (alla format)

| Fält | Beskrivning | Exempel |
|------|-------------|---------|
| `position` | **Placering PER KLASS** (inte global!) | 1, 2, 3, ... |
| `first_name` / `förnamn` / `firstname` | Förnamn | Erik |
| `last_name` / `efternamn` / `lastname` | Efternamn | Andersson |
| `class` / `klass` / `category` | Klass | Elite Men, Elite Women, Junior Men, etc. |
| `status` | Status | FIN, DNF, DNS, DSQ |

### ⚠️ VIKTIGT: Placering per klass

**Placeringen ska alltid vara per klass, INTE global!**

**Exempel - RÄTT:**
```csv
position,first_name,last_name,class
1,Erik,Andersson,Elite Men     <- 1:a i Elite Men
2,Johan,Svensson,Elite Men      <- 2:a i Elite Men
3,Marcus,Berg,Elite Men         <- 3:a i Elite Men
1,Anna,Karlsson,Elite Women     <- 1:a i Elite Women
2,Lisa,Johansson,Elite Women    <- 2:a i Elite Women
1,Oscar,Nilsson,Junior Men      <- 1:a i Junior Men
```

**Exempel - FEL:**
```csv
position,first_name,last_name,class
1,Erik,Andersson,Elite Men     <- 1:a globalt
2,Johan,Svensson,Elite Men      <- 2:a globalt
3,Anna,Karlsson,Elite Women     <- 3:a globalt (FELAKTIGT - ska vara 1 i sin klass!)
4,Marcus,Berg,Elite Men         <- 4:a globalt (FELAKTIGT - ska vara 3 i sin klass!)
```

Varje klass har sin egen placering 1, 2, 3 osv.

## 🔧 Valfria fält (alla format)

| Fält | Beskrivning | Exempel |
|------|-------------|---------|
| `club` / `klubb` / `team` | Klubb | Järvsö CK |
| `uci_id` / `uci` | UCI ID | SWE19920315 |
| `bib_number` | Startnummer | 101 |
| `total_time` / `tid` / `totaltid` | Total tid | 00:02:34.567 |

## 🏔️ DH Format 1: Seedning/Kval + Final

### Seedning/Kval (`DH_Seedning_Kval.csv`)
**Används för:** Seedning och kval-runs som ger kvalpoäng

**Extra fält:**
- `run_type` - **MÅSTE** vara `seeding` eller `qualification`
- `split1`, `split2`, `split3`, `split4` - Upp till 4 splittider

**Exempel:**
```csv
position,first_name,last_name,club,class,uci_id,bib_number,total_time,split1,split2,split3,split4,status,run_type
1,Erik,Andersson,Järvsö CK,Elite Men,SWE19920315,101,00:02:34.567,00:00:45.123,00:00:52.234,00:00:35.678,00:00:21.532,FIN,seeding
```

**Kvalpoäng:** Tilldelas enligt seedning-mall (t.ex. 100p för 1:a plats, 90p för 2:a, etc.)

### Final (`DH_Final.csv`)
**Används för:** Final run som ger placering och kvalpoäng

**Extra fält:**
- `run_type` - **MÅSTE** vara `final`
- `split1`, `split2`, `split3`, `split4` - Upp till 4 splittider

**Exempel:**
```csv
position,first_name,last_name,club,class,uci_id,bib_number,total_time,split1,split2,split3,split4,status,run_type
1,Erik,Andersson,Järvsö CK,Elite Men,SWE19920315,101,00:02:32.123,00:00:44.567,00:00:51.234,00:00:35.234,00:00:21.088,FIN,final
```

**Kvalpoäng:** Tilldelas enligt final-mall (t.ex. UCI standard: 500p för 1:a plats, 450p för 2:a, etc.)

---

## 🏔️ DH Format 2: Två åk (bästa räknas)

### Två åk (`DH_Tva_Ak.csv`)
**Används för:** DH där båda åk körs och snabbaste åket ger placering

**Extra fält:**
- `run_number` - **MÅSTE** vara `1` eller `2`
- `run_type` - **MÅSTE** vara `run1` eller `run2`
- `split1`, `split2`, `split3`, `split4` - Upp till 4 splittider

**VIKTIGT:**
- Varje åkare ska ha **TVÅ rader** i CSV:n (en för varje åk)
- `position` är samma för båda raderna (baserat på snabbaste åk)
- Systemet kommer att lagra båda åk men endast tilldela kvalpoäng för snabbaste

**Exempel:**
```csv
position,first_name,last_name,club,class,uci_id,bib_number,run_number,total_time,split1,split2,split3,split4,status,run_type
1,Erik,Andersson,Järvsö CK,Elite Men,SWE19920315,101,1,00:02:34.567,00:00:45.123,00:00:52.234,00:00:35.678,00:00:21.532,FIN,run1
1,Erik,Andersson,Järvsö CK,Elite Men,SWE19920315,101,2,00:02:32.123,00:00:44.567,00:00:51.234,00:00:35.234,00:00:21.088,FIN,run2
```

**Kvalpoäng:** Tilldelas enligt DH final-mall för snabbaste åk

---

## 🚵 Enduro Format

### Enduro (`Enduro.csv`)
**Används för:** Enduro-tävlingar med upp till 15 stages

**Extra fält:**
- `stage1` till `stage15` - Tid för varje stage (sträcka)
- Lämna tomma kolumner om färre än 15 stages används

**Exempel:**
```csv
position,first_name,last_name,club,class,uci_id,bib_number,total_time,stage1,stage2,stage3,stage4,stage5,stage6,stage7,stage8,stage9,stage10,stage11,stage12,stage13,stage14,stage15,status
1,Erik,Andersson,Järvsö CK,Elite Men,SWE19920315,101,00:45:23.567,00:04:12.234,00:03:45.678,00:05:23.456,00:04:56.789,00:03:34.567,00:05:45.234,00:04:23.678,00:03:56.234,00:04:34.789,00:03:12.456,,,,,FIN
```

**Kvalpoäng:** Tilldelas enligt enduro-mall (t.ex. UCI standard eller Svenska Serien)

**VIKTIGT:**
- `total_time` bör vara summan av alla stage-tider
- Stages som inte genomfördes (DNF) lämnas tomma
- Om status är DNF, ange vilka stages som kördes innan avbrott

---

## ⏱️ Tidsformat

Alla tider ska anges i formatet: `HH:MM:SS.mmm` eller `MM:SS.mmm`

**Exempel:**
- `00:02:34.567` = 2 minuter, 34 sekunder, 567 millisekunder
- `00:00:45.123` = 45 sekunder, 123 millisekunder
- `00:45:23.567` = 45 minuter, 23 sekunder, 567 millisekunder

---

## 📝 Status-koder

| Kod | Beskrivning |
|-----|-------------|
| `FIN` | Målgång (Finished) |
| `DNF` | Brutit (Did Not Finish) |
| `DNS` | Startade ej (Did Not Start) |
| `DSQ` | Diskvalificerad (Disqualified) |

---

## 🔄 Import-process

1. **Välj tävling** i Admin-panelen
2. **Ladda upp CSV-fil** med rätt format
3. **Förhandsgranska** de första 5 raderna
4. **Importera** - systemet kommer att:
   - Skapa/hitta cyklister baserat på UCI ID eller namn
   - Skapa klasser om de inte finns
   - Lagra alla splittider/stages i JSONB-format
   - Beräkna kvalpoäng baserat på tävlingens poängmall

---

## 📊 Kolumn-mapping

Systemet stödjer både svenska och engelska kolumnnamn:

| Svenska | Engelska alternativ |
|---------|-------------------|
| förnamn, fornamn | first_name, firstname |
| efternamn | last_name, lastname |
| klubb | club, team |
| klass, kategori | class, category |
| plac, placering, pos | position |
| tid, totaltid | time, total_time |
| uci, uciid, uci-id | uci_id |

---

## 💡 Tips

1. **Delimiter:** CSV-filen kan använda komma (`,`), semikolon (`;`) eller tab (`\t`) som separator
2. **UCI ID:** Om UCI ID anges kommer systemet att matcha mot befintliga cyklister och undvika dubbletter
3. **Automatisk klass-skapning:** Om en klass inte finns skapas den automatiskt
4. **Splittider:** Lagras som JSONB för flexibilitet och framtida analys
5. **Flera imports:** Du kan importera samma tävling flera gånger (t.ex. först seedning, sen final)

---

## ⚠️ Felhantering

Om import misslyckas kommer systemet att visa:
- Antal lyckade importer
- Antal fel
- Första felets rad och meddelande

Vanliga fel:
- Saknade obligatoriska kolumner (position, förnamn, efternamn)
- Ogiltigt tidsformat
- Dubbletter (samma cyklist, tävling, klass, run_number)
