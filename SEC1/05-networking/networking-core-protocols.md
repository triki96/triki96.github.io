---
title: "Networking Core Protocols"
date: 2026-08-11 13:00:00 +0200
categories: [Cyber Security 101]
tags: [networking, networking-core-protocols]
description: ""
toc: true
---

## DNS

Il DNS (Domain Name System) traduce i nomi a dominio leggibili dall'uomo (es. `esempio.com`) negli indirizzi IP che i computer usano davvero per comunicare. Ogni dominio può avere diversi tipi di **record** DNS associati, ciascuno con uno scopo specifico.

### I principali tipi di record

| Record | A cosa serve |
|---|---|
| **A** | Associa un nome a dominio a un indirizzo **IPv4** |
| **AAAA** | Associa un nome a dominio a un indirizzo **IPv6** |
| **MX** | Indica quale server gestisce la **posta elettronica** per quel dominio |
| **CNAME** | Alias: fa puntare un nome a dominio a **un altro nome a dominio**, invece che direttamente a un IP |

### Esempio pratico con nslookup

```bash
$ nslookup esempio.com
Server:         192.168.1.1
Address:        192.168.1.1#53

Non-authoritative answer:
Name:   esempio.com
Address: 93.184.216.34
```

Questo interroga il server DNS configurato sul sistema (`192.168.1.1`, tipicamente il router di casa che inoltra a sua volta la richiesta) e restituisce il record **A** del dominio — l'indirizzo IPv4 corrispondente.

Si può anche interrogare un tipo di record specifico:
```bash
$ nslookup -type=MX esempio.com
esempio.com     mail exchanger = 10 mx1.esempio.com.
esempio.com     mail exchanger = 20 mx2.esempio.com.
```

Il numero prima del nome del server (`10`, `20`) è la **priorità** — più basso è il numero, più quel server viene preferito per la consegna della posta; il secondo server (priorità `20`) viene usato solo se il primo non è raggiungibile.

```bash
$ nslookup -type=CNAME www.esempio.com
www.esempio.com        canonical name = esempio.com.
```

Questo dice che `www.esempio.com` non ha un proprio indirizzo IP diretto, ma è semplicemente un **alias** che punta a `esempio.com` — chi risolve `www.esempio.com` viene automaticamente reindirizzato a risolvere `esempio.com` al suo posto.

## WHOIS

**WHOIS** è un protocollo (e il comando corrispondente) che interroga un database pubblico per ottenere informazioni sulla **registrazione** di un dominio: chi lo possiede, quando è stato registrato, quando scade, quali sono i server DNS autoritativi (nameserver) associati.

```bash
$ whois esempio.com
Domain Name: ESEMPIO.COM
Registrar: Esempio Registrar Inc.
Creation Date: 2015-03-12T10:00:00Z
Registry Expiry Date: 2027-03-12T10:00:00Z
Name Server: NS1.ESEMPIO.COM
Name Server: NS2.ESEMPIO.COM
```

### Rilevanza per l'OSINT

WHOIS è uno strumento classico di **reconnaissance passiva**: informazioni come il nome del registrante, l'organizzazione, l'indirizzo email di contatto (quando non protetti da privacy) possono rivelare dettagli utili sull'infrastruttura o l'organizzazione target, senza mai contattare direttamente i sistemi del target — esattamente lo stesso principio di OSINT già visto con Shodan e Certificate Transparency. Molti registrar oggi offrono un servizio di **privacy/proxy** che nasconde i dati reali del proprietario dietro informazioni generiche del registrar stesso, riducendo l'utilità pratica di questa tecnica rispetto al passato.

## HTTP

HTTP (HyperText Transfer Protocol) è il protocollo su cui si basa il web. Le richieste HTTP usano diversi **metodi**, ciascuno con un significato semantico preciso:

| Metodo | A cosa serve |
|---|---|
| **GET** | Richiede una risorsa (es. una pagina web), senza modificarla |
| **POST** | Invia dati al server, tipicamente per crearne di nuovi (es. inviare un form) |
| **PUT** | Crea o sostituisce interamente una risorsa esistente |
| **DELETE** | Elimina una risorsa specifica |

### Ottenere una pagina web con telnet

Essendo HTTP un protocollo testuale (come SMTP, FTP, POP3 visti più sotto), si può interagire manualmente con un server web usando telnet:

![HTTP grezzo tramite telnet](/assets/img/posts/http-telnet-diagram.svg)
_La richiesta HTTP scritta a mano, con la riga vuota obbligatoria a chiudere gli header_

```
$ telnet esempio.com 80
Trying 93.184.216.34...
Connected to esempio.com.
Escape character is '^]'.
GET / HTTP/1.1
Host: esempio.com
Connection: close

HTTP/1.1 200 OK
Content-Type: text/html
Content-Length: 1256

<html>...</html>
```

Due dettagli importanti da ricordare quando lo si fa a mano:
- L'header **`Host:`** è obbligatorio in HTTP/1.1 — è ciò che permette al server di sapere a quale sito virtuale rispondere, se ospita più domini sullo stesso IP (il meccanismo di virtual hosting già visto in dettaglio)
- Dopo l'ultimo header serve una **riga vuota** (`\r\n\r\n` in totale) per segnalare al server che la richiesta è terminata — dimenticarla lascia la connessione in attesa indefinita

## FTP

FTP (File Transfer Protocol) serve a trasferire file da/verso un server. I comandi principali già visti in dettaglio:

```
get file.txt          # scarica un file dal server
type binary            # modalità binaria: nessuna conversione dei byte
type ascii              # modalità testo: converte i caratteri di fine riga (\r\n vs \n) in base al sistema di destinazione
```

> Trasferire un file binario (immagine, eseguibile, archivio) in modalità `ascii` corrompe il file, perché FTP tenta di "correggere" sequenze di byte che nel binario non sono affatto caratteri di fine riga. La regola pratica: file di testo → `ascii`, tutto il resto → `binary`.
{: .prompt-warning }

## SMTP, POP3 e IMAP

Questi tre protocolli gestiscono l'invio e la ricezione di email — **SMTP** per inviare, **POP3** e **IMAP** per leggere/scaricare, con filosofie diverse tra loro.

### SMTP — inviare email

```
$ telnet mailserver.esempio.com 25
220 mailserver.esempio.com ESMTP Postfix
HELO client.esempio.com
250 mailserver.esempio.com
MAIL FROM:<mittente@esempio.com>
250 2.1.0 Ok
RCPT TO:<destinatario@esempio.com>
250 2.1.5 Ok
DATA
354 End data with <CR><LF>.<CR><LF>
Subject: Prova

Questo è il corpo del messaggio.
.
250 2.0.0 Ok: queued as A1B2C3D4
QUIT
221 2.0.0 Bye
```

- **`HELO`** — il client si presenta al server
- **`MAIL FROM`** — dichiara il mittente
- **`RCPT TO`** — dichiara il destinatario
- **`DATA`** — apre l'inserimento del corpo del messaggio, che termina con una riga contenente solo un punto (`.`)
- **`QUIT`** — chiude la sessione

Le righe numeriche (`220`, `250`, `354`, `221`) sono i codici di risposta del server, che indicano successo o richiesta di ulteriori dati.

### POP3 — scaricare email (e rimuoverle dal server)

```
$ telnet mailserver.esempio.com 110
+OK POP3 server ready
USER nomeutente
+OK
PASS password
+OK Logged in
STAT
+OK 3 4820
LIST
+OK 3 messages
1 1520
2 1830
3 1470
.
RETR 1
+OK 1520 octets
Subject: Prova
...corpo del messaggio...
.
QUIT
+OK Bye
```

- **`USER`**/**`PASS`** — autenticazione (in chiaro, se non si usa TLS)
- **`STAT`** — mostra il numero di messaggi e la dimensione totale della casella
- **`LIST`** — elenca i messaggi con il loro numero e dimensione
- **`RETR 1`** — scarica il messaggio numero 1

POP3 tipicamente **scarica e rimuove** le email dal server dopo il download — pensato per un'epoca in cui la posta si controllava da un solo dispositivo.

### IMAP — sincronizzare email su più dispositivi

A differenza di POP3, IMAP lascia le email **sul server**, sincronizzando solo lo stato (letto/non letto, cartelle) con ogni dispositivo che accede alla stessa casella — è lo standard di fatto oggi per la maggior parte dei servizi email moderni (Gmail, Outlook), proprio perché permette di controllare la stessa posta da telefono, PC e tablet senza che le email vengano "consumate" dal primo dispositivo che le scarica.

| | POP3 | IMAP |
|---|---|---|
| Dove vivono le email | Scaricate localmente | Restano sul server |
| Multi-dispositivo | Problematico | Nativo |
| Porta di default | 110 (995 con TLS) | 143 (993 con TLS) |

### Rilevanza per il pentesting

Essendo tutti protocolli testuali interagibili a mano via telnet/netcat, SMTP/POP3/IMAP sono comuni bersagli di enumerazione: comandi come `VRFY` su SMTP possono rivelare se un account email esiste realmente sul dominio, e server che accettano autenticazione senza cifratura TLS espongono credenziali in chiaro a chiunque intercetti il traffico — un bersaglio classico anche per attacchi di brute force sulle credenziali.
