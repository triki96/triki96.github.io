---
title: "CyberChef"
date: 2026-08-19 12:00:00 +0200
categories: [Cyber Security 101]
tags: [security-solutions, cyberchef]
description: "..."
toc: true
---

## Cos'è CyberChef

**CyberChef** è uno strumento web (gratuito, sviluppato da GCHQ, l'agenzia di intelligence britannica) che serve a **trasformare dati** — codificarli, decodificarli, cifrarli, decifrarli, comprimerli, analizzarli — tutto tramite un'interfaccia grafica, senza scrivere codice. Viene spesso soprannominato **"il coltellino svizzero del cyber"** proprio per la varietà di operazioni che riesce a fare.

Si usa direttamente dal browser, su [gchq.github.io/CyberChef](https://gchq.github.io/CyberChef/) (o installato in locale per lavorare offline con dati sensibili).

## L'idea di base — una "ricetta"

Il concetto centrale di CyberChef è la **Recipe** (ricetta): invece di applicare un'unica trasformazione, si costruisce una **sequenza di operazioni** che i dati attraversano una dopo l'altra, come una catena di montaggio.

```
Input → Operazione 1 → Operazione 2 → Operazione 3 → Output
```

Ogni operazione prende l'output di quella precedente come proprio input — è per questo che l'ordine in cui si mettono le operazioni conta moltissimo. Ad esempio, per decifrare un testo cifrato con AES e poi codificato in Base64 (come visto nell'esempio della password `SunsetSpritz2024!`), la ricetta deve essere:

```
From Base64 → AES Decrypt
```

e non il contrario — bisogna prima togliere il "contenitore" (Base64) per arrivare ai byte cifrati veri, e solo dopo decifrarli con AES.

## Le quattro aree dell'interfaccia

- **Operations** (a sinistra) — l'elenco di tutte le operazioni disponibili, centinaia in totale, organizzate per categoria (Data format, Encryption, Compression, Networking...) e cercabili con una barra di ricerca
- **Recipe** (al centro) — dove si trascinano le operazioni scelte, nell'ordine in cui devono essere eseguite
- **Input** (in alto a destra) — dove si incolla il dato di partenza (testo, numeri, byte)
- **Output** (in basso a destra) — il risultato finale dopo che l'input ha attraversato tutta la ricetta

## Cosa può fare, con qualche esempio concreto

**Codifica e decodifica** — trasformare dati binari in testo stampabile e viceversa

- **From/To Base64** — la codifica più comune, usata per rendere dati binari "trasportabili" come testo
- **From/To Base85** — simile a Base64 ma più efficiente, usa un alfabeto più ampio (85 caratteri invece di 64)
- **URL Decode/Encode** — per stringhe incorporate in URL (es. `%40` che rappresenta `@`)
- **From/To Hex** — rappresentazione esadecimale dei byte

**Crittografia** — cifrare e decifrare dati

- **AES Decrypt/Encrypt** — per cifrari a blocchi come quello usato nell'esempio con chiave hardcoded
- **XOR** — un'operazione molto semplice ma diffusissima in malware e CTF

**Hashing**

- **MD5, SHA1, SHA256...** — per generare o verificare hash (utile anche solo per controllare l'integrità di un file)

**Analisi e parsing**

- **Extract IP addresses**, **Extract URLs**, **Extract Email addresses** — utili per analizzare rapidamente log o file di grandi dimensioni
- **JSON Beautify**, **XML Beautify** — per rendere leggibili dati strutturati compressi su una riga

**Compressione**

- **Gzip/Gunzip**, **Zlib Inflate/Deflate** — per comprimere o decomprimere dati

## Perché è utile in ambito cybersecurity

CyberChef torna utile ogni volta che ci si trova davanti a dati che "non si leggono direttamente" — una stringa sospetta trovata in un file di log, il contenuto di un cookie di sessione, un payload offuscato in un malware, una password cifrata in un file di configurazione. Invece di scrivere uno script ad hoc ogni volta, si costruisce una ricetta visuale, si può salvare e riusare, e si vede subito il risultato di ogni singolo passaggio — utile anche solo per capire *come* è stato costruito un dato, provando operazioni diverse finché l'output non torna leggibile.


CyberChef è utile ogni volta che serve trasformare dati in modo interattivo e visuale, senza scrivere codice ogni volta da zero: che si tratti di decodificare Base64/Base85 annidati, decifrare un payload AES con una chiave nota, o semplicemente estrarre IP e URL da un file di log ingombrante. Il punto di forza è la possibilità di costruire una sequenza di operazioni (la ricetta) e vedere il risultato di ogni passaggio in tempo reale, il che lo rende tanto utile per un'analisi rapida quanto per capire, per tentativi, come un dato sconosciuto è stato effettivamente codificato.
