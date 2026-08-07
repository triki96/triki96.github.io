---
title: "VirusTotal"
date: 2026-08-07 14:00:00 +0200
categories: [Cyber Security 101]
tags: [a-journey-into-cybersecurity, threat-intelligence, virustotal]
description: "Analisi aggregata di file, URL e IP contro decine di motori antivirus."
toc: true
---

## Cos'è

VirusTotal è un servizio che analizza file, URL, domini e indirizzi IP passandoli attraverso decine di motori antivirus e sistemi di threat intelligence diversi contemporaneamente, restituendo un verdetto aggregato — invece di doversi fidare di un solo antivirus, si vede cosa ne pensano tutti insieme.

## Come funziona

1. Si carica (o si cerca via hash) il campione
2. VirusTotal lo distribuisce in parallelo a tutti i motori antivirus partner integrati nella piattaforma
3. Ogni motore risponde con il proprio verdetto (pulito, malevolo, e spesso anche il nome della famiglia di malware rilevata)
4. VirusTotal aggrega tutto e mostra anche metadati aggiuntivi: hash del file, dimensione, tipo, comportamento osservato in sandbox (se disponibile), relazioni con altri campioni noti (Indicatori di Compromissione — IOC)


### Cosa si può analizzare

- **File**: si carica un file sospetto (eseguibile, documento, script) e viene scansionato da decine di motori antivirus diversi contemporaneamente
- **URL**: verifica se un link è associato a phishing, malware, siti malevoli noti
- **Hash**: se si ha già l'hash (MD5/SHA1/SHA256) di un file senza volerlo caricare fisicamente, si può cercarlo direttamente — utile per non condividere il file stesso, o se si sospetta sia già stato analizzato da altri
- **Dominio/IP**: verifica la reputazione di un dominio o indirizzo IP, storico DNS associato, certificati SSL visti

### Il punteggio "X / Y motori"

Il risultato tipico è un punteggio tipo `45/70` — significa che 45 motori antivirus su 70 totali interrogati hanno segnalato quel file/URL come malevolo. Non è un verdetto binario assoluto: motori diversi hanno criteri, database di firme e tecniche di rilevamento (signature-based, euristico, comportamentale) differenti, quindi è normale vedere disaccordo tra loro.



## Un limite importante da conoscere

Caricare un file su VirusTotal lo rende pubblicamente visibile a chiunque nella piattaforma (inclusi altri ricercatori e, potenzialmente, gli stessi autori del malware, se lo cercano). Questo significa due cose pratiche:

- Non caricare mai file contenenti dati sensibili/privati (documenti aziendali reali, ecc.) — solo campioni sospetti da far analizzare
- Se si sta analizzando un malware personalizzato/mirato in un contesto di red team o durante un'indagine riservata, caricarlo su VirusTotal potrebbe allertare l'attaccante che il suo strumento è stato scoperto (molti threat actor monitorano VirusTotal per i propri campioni) — in quei casi si preferisce l'analisi in sandbox isolate offline.
{: .prompt-warning }

## Utilizzo

VirusTotal è uno strumento tipico della fase di threat intelligence e OSINT, non di attacco diretto: aggrega dati raccolti da altri (i verdetti di decine di motori antivirus) per offrire in un colpo solo un'informazione che richiederebbe altrimenti dozzine di scansioni separate. È utile sia in fase di analisi di un incidente (es. verificare un hash sospetto trovato su un host compromesso) sia in fase di reconnaissance passiva (verificare la reputazione di un IP o dominio esterno).

---
**Modulo:** A Journey into Cybersecurity
**Room:** 
**Data:** 7 agosto 2026
