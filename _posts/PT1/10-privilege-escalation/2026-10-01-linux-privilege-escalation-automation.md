---
title: "Linux Privilege Escalation: Automation"
date: 2026-10-01 17:00:00 +0200
categories: [PT1, 10-privilege-escalation]
tags: [linux, privilege-escalation, exploit, enumeration, linpeas]
description: "Metodologia per usare exploit pubblici in modo sicuro e panoramica degli script di enumerazione automatica (LinPEAS, LinEnum, LES) per trovare percorsi di privilege escalation su Linux."
toc: true
---

## Metodologia per l'uso di exploit pubblici

Utilizzare un exploit pubblico non significa semplicemente scaricare il codice ed eseguirlo. Esiste una procedura da seguire: saltare dei passaggi è il modo migliore per mandare in crash la macchina o sprecare ore su exploit che non avrebbero mai funzionato. Il flusso di lavoro generale è:

1. **Enumerazione** — Identifica il software installato e le versioni in esecuzione. Elementi chiave da annotare: versione del kernel, versione della distribuzione e qualsiasi binario SUID o servizio in esecuzione come root.
2. **Ricerca** — Prendi ciò che hai trovato e cerca vulnerabilità note. Esiste un CVE per quella versione? È disponibile un exploit pubblico? Corrisponde all'architettura e alla distribuzione del target?
3. **Valutazione** — Non tutti gli exploit funzioneranno. Leggi il codice, comprendi cosa fa, verifica i requisiti: serve `gcc` sul sistema di destinazione? Funziona solo su specifiche versioni del kernel? Può mandare in crash il sistema?
4. **Sfruttamento** — Trasferisci l'exploit sul sistema di destinazione, compilalo se necessario ed eseguilo.
5. **Verifica** — Conferma di avere privilegi elevati: controlla `whoami` e `id`, e prova ad accedere a qualcosa a cui prima non potevi accedere.

## Enumerazione automatizzata

Script che automatizzano la fase di enumerazione e segnalano i possibili percorsi di escalation:

| Strumento | Cosa fa |
|---|---|
| **LinPEAS** | Script che evidenzia i percorsi di privilege escalation nel sistema: configurazioni errate, permessi deboli, credenziali e altro. |
| **LinEnum** | Enumerazione locale basata su script; genera un report leggibile con informazioni di sistema, utenti, processi cron e binari SUID. |
| **LES (Linux Exploit Suggester)** | Confronta la versione del kernel con le CVE note e suggerisce exploit locali applicabili. |
| **Linux Smart Enumeration (lse)** | Enumerazione con livelli di verbosità regolabili: parte silenziosa e rivela più dettagli man mano che il livello aumenta. |
| **Linux Priv Checker** | Elenca le informazioni di sistema e controlla automaticamente le opportunità comuni di escalation, segnalando i problemi in linea. |

## Un limite importante da conoscere

Gli strumenti automatici sono rumorosi e generano moltissimo output: tendono a segnalare falsi positivi e un EDR può rilevarne l'esecuzione. Vanno usati come punto di partenza, non come sostituti dell'enumerazione manuale: ogni segnalazione va comunque verificata a mano prima di lanciare un exploit, perché un exploit sbagliato può mandare in crash il target.

## Dove trovare gli exploit

- **Metasploit** — moduli di local privilege escalation integrati.
- **GitHub** — proof-of-concept e repository di exploit pubblici.
- **Exploit-DB** — database di exploit indicizzati per CVE/versione.

## Utilizzo

Prospettiva **offensiva** (red team / PT1): questa fase è il cuore della post-exploitation su Linux. In un assessment reale l'enumerazione automatica velocizza la ricerca del percorso di escalation, ma la valutazione manuale dell'exploit è ciò che distingue un test professionale da un'esecuzione alla cieca che rischia di buttare giù un sistema di produzione.

---
**Modulo:** Privilege Escalation (PT1)
**Room:** Linux Privilege Escalation
**Data:** 2026-10-01
