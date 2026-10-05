---
title: "SSRF"
date: 2026-09-16 00:00:00 +0200
categories: [PT1, 5-Web-App-Vulnerabilities-1]
tags: [ssrf]
---


La Server-Side Request Forgery (SSRF) è una vulnerabilità che consente a un utente malintenzionato di far sì che l'applicazione lato server effettui richieste HTTP dirette a una destinazione scelta dall'attaccante.
Questa vulnerabilità sfrutta la fiducia che i sistemi interni ripongono nel server applicativo: i servizi di backend, i database e l'infrastruttura cloud spesso accettano richieste dal server senza ulteriore autenticazione, poiché presumono che qualsiasi richiesta proveniente da un indirizzo IP interno attendibile sia legittima.
Un attaccante in grado di controllare dove il server invia le proprie richieste eredita di fatto tale fiducia.

Esistono due categorie di vulnerabilità SSRF, e la distinzione influisce sul modo in cui si affronta lo sfruttamento.

Tipo|	Risposta visibile?	|Descrizione|
---|---|---|
Regular SSRF|	SÌ	|La risposta proveniente dalla richiesta back-end viene restituita nella risposta front-end dell'applicazione. L'attaccante può leggere direttamente l'output.|
Blind SSRF	|NO|	L'applicazione effettua la richiesta al back-end ma non restituisce la risposta. L'attaccante deve utilizzare metodi indiretti per confermare lo sfruttamento della vulnerabilità.
