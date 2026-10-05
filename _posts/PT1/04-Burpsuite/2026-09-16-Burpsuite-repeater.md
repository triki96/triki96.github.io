---
title: "Burp Suite Repeater"
date: 2026-09-16 00:00:00 +0200
categories: [PT1, 4-burpsuite]
tags: [burp, burpsuite, repeater]
---

In questa sezione approfondiremo le funzionalità del modulo **Repeater**. Impareremo a manipolare e reinviare le richieste acquisite, ed esploreremo le diverse opzioni e funzionalità disponibili in questo strumento.

---

## Cosa fa il modulo Repeater?

Burp Suite Repeater ci consente di **modificare e reinviare le richieste intercettate** verso una destinazione a nostra scelta.

In pratica, ci permette di prendere le richieste catturate con il modulo **Proxy**, manipolarle e inviarle ripetutamente secondo necessità. In alternativa, possiamo creare manualmente le richieste da zero, in modo analogo all'utilizzo di uno strumento da riga di comando come `cURL`.

Sebbene la creazione manuale sia un'opzione valida, il flusso più comune è il seguente:

1. Catturiamo una richiesta tramite il modulo **Proxy**
2. La trasferiamo al **Repeater**
3. La modifichiamo e la reinviamo quante volte necessario

---

## Quando usare il Repeater?

Il Repeater è particolarmente adatto per attività che richiedono l'**invio ripetitivo di richieste simili**, in genere con piccole variazioni tra un tentativo e l'altro.

Alcuni casi d'uso tipici:

- Test manuali per vulnerabilità di tipo **SQL Injection**
- Tentativi di **bypass dei filtri** di un Web Application Firewall (WAF)
- Modifica dei parametri in una **form submission**
