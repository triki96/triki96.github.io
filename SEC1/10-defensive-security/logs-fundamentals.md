---
title: "Logs Fundamentals"
date: 2026-08-19 09:00:00 +0200
categories: [Cyber Security 101]
tags: [defensive-security, logs, windows-event-log, siem]
description: "Tipi di log, analisi manuale vs SIEM, Event ID Windows chiave e log di accesso Apache."
toc: true
---
## Intro

I log sono le impronte digitali lasciate da qualsiasi attività — è dai log che, nella maggior parte dei casi, si trovano le tracce di un attacco all'interno di un sistema digitale. I log giocano un ruolo centrale in diverse aree chiave: monitoraggio degli eventi di sicurezza, indagine e forensics sugli incidenti, troubleshooting, monitoraggio delle performance, auditing e compliance.

## The different types of logs

I log sono suddivisi in più categorie in base al tipo di informazione che forniscono — così, durante un'indagine, basta consultare il file di log specifico legato al problema, invece di scorrere tutti gli eventi di ogni categoria.

- **System Logs** — utili per il troubleshooting di problemi di funzionamento del sistema operativo
- **Security Logs** — aiutano a rilevare e indagare incidenti legati alla sicurezza; contengono gli eventi di autenticazione e autorizzazione
- **Application Logs** — contengono eventi specifici relativi a una singola applicazione
- **Audit Logs** — forniscono informazioni dettagliate su modifiche al sistema ed eventi legati agli utenti
- **Network Logs** — forniscono informazioni sul traffico di rete in entrata e in uscita
- **Access Logs** — forniscono informazioni dettagliate sull'accesso a diverse risorse

Ad esempio, per investigare i login avvenuti con successo in un certo intervallo di tempo su un sistema Windows, basta consultare i **Security Logs**, senza bisogno di guardare tutti gli altri tipi di log.

## How to analyze logs

Il processo di estrarre informazioni utili dai log è chiamato **log analysis**. Farlo "a occhio" diventa impossibile oltre le 50 righe circa, quindi servono strumenti adeguati:

- **Analisi manuale**, tramite utility a riga di comando come `cat`, `grep`, `less` — adatta a file di dimensioni contenute
- **SIEM**, per volumi di log troppo grandi da gestire manualmente — centralizza e correla automaticamente i log provenienti da più fonti (esattamente lo strumento di cui parlavamo nel documento sui pilastri del SOC)

## Analyzing Windows Event logs

Windows gestisce i log in modo diverso rispetto ai sistemi Linux: invece di semplici file di testo, i log di Windows sono eventi strutturati salvati in **formato binario**. Windows include un visualizzatore integrato, l'**Event Viewer**, che rende la consultazione gestibile.

I tre log principali su Windows sono:

- **Application** — tutto ciò che un programma installato registra: errori, warning, messaggi informativi, utile per capire perché un'applicazione continua ad andare in crash
- **System** — eventi registrati dai componenti di sistema di Windows
- **Security** — eventi come tentativi di login validi/non validi, ed eventi legati all'uso di risorse (creazione, apertura, eliminazione di file o altri oggetti)

**Event ID rilevanti per un'indagine tipica:**

| Event ID | Significato |
|---|---|
| 4624 | A user account successfully logged in |
| 4625 | A user account failed to login |
| 4634 | A user account successfully logged off |
| 4720 | A user account was created |
| 4722 | A user account was enabled |
| 4724 | An attempt was made to reset an account's password |
| 4725 | A user account was disabled |
| 4726 | A user account was deleted |

**Esempio pratico** — ricostruire la timeline di un account compromesso, filtrando l'Event Viewer sui vari Event ID:

1. Filtrare su **4720** per trovare l'ultimo account utente creato sul sistema, e verificare da quale account è stato creato (spesso rivela l'account amministratore compromesso usato per crearlo)
2. Filtrare su **4722** per verificare quando l'account è stato abilitato
3. Filtrare su **4724** per verificare se l'account ha subito anche un reset della password

Un pattern di questo tipo — account amministratore compromesso, usato per creare un nuovo account, abilitarlo e impostarne la password — è una classica mossa di **post-exploitation**: l'attaccante si crea un account persistente da riusare in seguito, ed è tutto visibile nel Security Log.

## Analyzing Web Access logs

Ogni richiesta fatta a un sito web (visitare una pagina, effettuare login, caricare un file) viene registrata dal server e salvata in un file di log — su un server Apache, tipicamente in `/var/log/apache2/access.log`. Questo file contiene tutte le richieste fatte al sito, insieme a informazioni come timeframe, IP richiedente, tipo di richiesta e URL.

**Esempio di riga di log** (formato Apache):

```
10.0.0.1 - - [06/Jun/2024:13:54:44] "GET /contact HTTP/1.1" 500 "-" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36"
```

I campi principali sono: **IP sorgente**, **timestamp**, **metodo e URL della richiesta** (`GET /contact`), **status code** della risposta (`500`), e **User-Agent** del client.

**Analisi manuale con strumenti da riga di comando Linux:**

```bash
cat access.log
```

Per restringere il risultato a un tipo di richiesta specifico, combinare con `grep`:

```bash
cat access.log | grep "GET /contact"
```

Questo mostra solo le richieste GET verso `/contact`, invece di scorrere l'intero file — utile ad esempio per trovare rapidamente l'ultima richiesta GET fatta a un URL specifico, o per isolare tutte le richieste POST fatte da un IP sospetto in un dato momento.

## Osservazioni

I log raccontano solo ciò che è stato effettivamente registrato: se l'auditing non è configurato per un certo tipo di evento (es. logging delle richieste POST disabilitato, o un livello di audit troppo basso su Windows), quell'attività semplicemente non lascerà traccia, indipendentemente da quanto sia stata dannosa. Prima di concludere che "non è successo nulla" dall'assenza di eventi nei log, va sempre verificato cosa il sistema stava effettivamente registrando in quel momento.

I log sono spesso il primo posto in cui cercare durante un'indagine, ma la loro utilità dipende dal sapere dove guardare: riconoscere il tipo di log giusto per la domanda che ci si sta ponendo (Security per l'autenticazione, Access per le richieste web, Network per il traffico) evita di perdersi in migliaia di righe irrilevanti. Per volumi piccoli, `cat`/`grep`/`less` e l'Event Viewer restano strumenti sufficienti e diretti; oltre una certa scala, la correlazione automatica di un SIEM diventa indispensabile — lo stesso principio visto nel documento sui pilastri del SOC.
