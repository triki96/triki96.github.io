---
title: "DIRB"
date: 2026-08-07 12:00:00 +0200
categories: [Cyber Security 101]
tags: [a-journey-into-cybersecurity, enumerazione, dirb]
description: "Enumerazione di directory e file su un web server"
toc: true
---

## Cos'è

DIRB è uno strumento per la **directory/file enumeration** su un web server: cerca risorse "nascoste" (cartelle, file, endpoint) che non sono linkate visibilmente dalla pagina, provando sistematicamente un elenco di nomi comuni presi da una wordlist.

## Come funziona

DIRB legge una lista di parole (**wordlist**) — nomi comuni di cartelle/file usati tipicamente nei siti web (`admin`, `backup`, `login.php`, `config`, `uploads`, ecc.) — e per ognuna prova a fare una richiesta HTTP `GET` verso `http://target.com/parola`.

In base al codice di stato HTTP restituito, capisce se quella risorsa esiste davvero, anche se non è mai stata linkata da nessuna parte visibile nel sito:

```
Wordlist → DIRB costruisce GET /parola → Web server risponde → 
DIRB classifica in base al codice HTTP → ripete per la parola successiva
```

### Come interpretare i risultati

| Codice | Significato pratico |
|---|---|
| **200** | Risorsa trovata e accessibile — la scopri e la visiti |
| **301/302** | Redirect, spesso indica che il nome corrisponde a una directory (es. `/admin` reindirizza a `/admin/`) — DIRB di solito la esplora ricorsivamente in automatico |
| **403** | Risorsa esiste ma l'accesso è negato — informazione comunque preziosa: sai che c'è qualcosa lì, magari da tentare di bypassare |
| **404** | Non esiste, scartato — è il caso più comune |

### Esempio pratico

```bash
dirb http://target.com /usr/share/wordlists/dirb/big.txt -X .php,.txt,.bak
```
- `/usr/share/wordlists/dirb/big.txt` — wordlist più ampia della default (`common.txt`), per una copertura maggiore a costo di tempo
- `-X .php,.txt,.bak` — aggiunge quelle estensioni ad ogni parola testata (prova sia `admin` che `admin.php`, `admin.txt`, ecc.), utile quando si sospetta un linguaggio backend specifico

Altri flag utili: `-r` disattiva la ricorsione automatica nelle sottodirectory trovate, `-o risultati.txt` salva l'output su file.

## Un limite importante da conoscere

> DIRB è **lento** rispetto ad alternative più moderne, perché di default esegue le richieste in sequenza, una alla volta. Per wordlist grandi, strumenti come `gobuster` o `ffuf` sono ordini di grandezza più veloci perché parallelizzano le richieste.
{: .prompt-warning }

```bash
# Equivalente approssimativo con gobuster, molto più veloce
gobuster dir -u http://target.com -w /usr/share/wordlists/dirb/common.txt
```

## Utilizzo

DIRB è uno strumento offensivo, usato in fase di reconnaissance durante un assessment, tipicamente subito dopo aver scoperto un web server con una scansione delle porte, prima di iniziare a testare vulnerabilità specifiche. Un `/admin`, `/backup.zip` o `/.git` trovato con DIRB può essere l'apertura decisiva su una macchina: spesso la superficie d'attacco reale non è nella pagina principale del sito, ma in risorse non linkate che restano accessibili per errore di configurazione o dimenticanza dello sviluppatore.

---
**Modulo:** A Journey into Cybersecurity
**Room:** 
**Data:** 7 agosto 2026
