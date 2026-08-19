---
title: "SOC Fundamentals"
date: 2026-08-18 09:00:00 +0200
categories: [Cyber Security 101]
tags: [defensive-security, soc, blue-team]
description: "I tre pilastri di un SOC (people, process, technology) e i ruoli tipici in un team SOC."
toc: true
---

## Cos'è un SOC

Un **SOC** (Security Operations Center) è una struttura in cui un team dedicato di sicurezza lavora 24/7 per monitorare e proteggere l'ambiente IT di un'organizzazione. I SOC moderni si concentrano su **detection** (rilevamento) e **response** (risposta) con l'obiettivo di prevenire danni identificando e rispondendo tempestivamente ad attività sospette.

### Detection

Le responsabilità del team SOC in fase di rilevamento comprendono:

- **Rilevare vulnerabilità** — pur non essendo l'unica responsabilità del SOC, il team è fortemente coinvolto nell'identificare e affrontare debolezze del sistema che potrebbero essere sfruttate da un attaccante
- **Rilevare attività non autorizzate** — monitorare tentativi di login sospetti o accessi non autorizzati alla rete e alle risorse dell'organizzazione
- **Rilevare violazioni di policy**
- **Rilevare intrusioni**

Ad esempio, se il team SOC scopre che un utente non autorizzato sta tentando di accedere a un account, questa è una capacità di **detection**.

### Response

Oltre al rilevamento, il SOC supporta il **team di incident response** nell'esecuzione dei passaggi necessari a contenere e risolvere un incidente. Avere le persone e i processi giusti non basterebbe mai senza soluzioni di sicurezza per detection e response — è qui che entra in gioco il terzo pilastro, la tecnologia (vedi sotto).

## I 3 Pilastri

Un SOC diventa maturo ed efficace nel rilevare e rispondere ai diversi incidenti grazie a tre pilastri, che coesistono e si sostengono a vicenda: **People**, **Process** e **Technology**. Un team di professionisti che lavora con strumenti di sicurezza all'avanguardia, in presenza di processi adeguati, è ciò che rende maturo un ambiente SOC.

### People

Indipendentemente da quanto si evolva l'automazione della maggior parte dei task di sicurezza, le persone in un SOC restano sempre fondamentali — una soluzione di sicurezza può generare numerosi alert in un ambiente SOC, causando molto "rumore" che richiede comunque giudizio umano per essere interpretato correttamente.

I ruoli tipici in un team SOC, in ordine crescente di seniority/specializzazione:

- **SOC Analyst (Level 1)** — i primi a rispondere, si occupano del **triage** e del **reporting** degli alert
- **SOC Analyst (Level 2)** — svolgono indagini più approfondite e correlano i dati tra loro
- **SOC Analyst (Level 3)** — cacciano proattivamente le minacce (threat hunting) e assistono l'incident response
- **Security Engineer** — distribuisce e configura le soluzioni di sicurezza
- **Detection Engineer** — lavora dedicandosi alla creazione di regole per generare alert nelle soluzioni di sicurezza
- **SOC Manager** — gestisce i processi e aggiorna la leadership dell'organizzazione

### Process

I processi sono le procedure formalizzate e i flussi di lavoro che guidano le operazioni quotidiane del SOC — senza processi chiari, ripetibili e solidi, il SOC manca di una guida e produce risultati incoerenti. Le attività principali comprendono:

**Triage** — analizzare e dare priorità agli alert usando i **5 Ws**: *What, When, Where, Who, Why* (cosa, quando, dove, chi, perché). Ad esempio, se un'indagine rivela che un dipendente ha tentato di rubare dati dal sistema, questo risponde al **"Who"** (chi); se invece si rileva una grande quantità di esfiltrazione dati, questo risponde al **"What"** (cosa).

**Reporting** — segnalare/escalare gli alert dannosi confermati verso i livelli o i team competenti, così da poter procedere con la risposta.

**Incident Response** — l'insieme dei passaggi presi per contenere, eradicare e recuperare da un incidente confermato, con il SOC che supporta attivamente il team di incident response in questo percorso.

### Technology

La componente tecnologica dei pilastri SOC si riferisce alle soluzioni di sicurezza. Questi strumenti riducono efficacemente lo sforzo manuale del team SOC nel rilevare e rispondere alle minacce: la rete di un'organizzazione è composta da molti dispositivi e applicazioni, e rilevare/rispondere individualmente alle minacce su ciascuno richiederebbe sforzo e risorse enormi. Le soluzioni di sicurezza centralizzano tutte le informazioni provenienti da dispositivi e applicazioni presenti nella rete, automatizzando le capacità di detection e response.

Le tecnologie chiave comprendono:

- **SIEM (Security Information and Event Management)** — uno strumento molto diffuso in quasi ogni ambiente SOC, che si concentra principalmente sul rilevare e generare alert sugli incidenti di sicurezza, centralizzando i log provenienti da tutta la rete
- **EDR (Endpoint Detection and Response)** — monitora e risponde alle minacce a livello di singolo endpoint (workstation, server), dando visibilità su processi, file e comportamenti sospetti sul singolo dispositivo
- **Firewall** — monitora il traffico di rete in entrata e in uscita, applicando le policy di accesso alla rete
