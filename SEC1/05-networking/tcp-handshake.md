---
title: "TCP Handshake"
date: 2026-08-08 23:30:00 +0200
categories: [Cyber Security 101]
tags: [networking, tcp]
description: "Il three-way handshake TCP, lo scambio dei numeri di sequenza, e i due principali attacchi che lo sfruttano: RST attack e connection hijacking."
toc: true
---

## Il three-way handshake

Prima di scambiare qualsiasi dato, TCP richiede uno scambio di tre pacchetti per stabilire la connessione: `SYN`, `SYN-ACK`, `ACK`. Questo garantisce che entrambe le parti siano pronte a comunicare e sincronizza i numeri di sequenza che useranno per tracciare l'ordine dei pacchetti scambiati.

## Lo scambio dei numeri di sequenza

![Scambio dei numeri di sequenza nel TCP handshake](/assets/img/posts/tcp-seq-diagram.svg)
_Client e server generano ciascuno il proprio ISN, indipendente da quello dell'altro_

### Due numeri di sequenza indipendenti, non uno condiviso

Ogni lato della connessione genera il **proprio** numero di sequenza iniziale (**ISN — Initial Sequence Number**), scelto in modo casuale. Client e server non concordano mai su un numero comune: hanno ciascuno la propria numerazione indipendente, e se la scambiano reciprocamente durante l'handshake.

### I tre passaggi, nel dettaglio

**1. SYN — il client si presenta**
```
Client → Server:  SYN, seq=1000
```
Il client genera casualmente il proprio ISN (qui `1000` per semplicità, in realtà un numero a 32 bit quasi casuale) e lo comunica: "i miei byte, da qui in poi, li conto a partire da 1000".

**2. SYN-ACK — il server risponde e si presenta a sua volta**
```
Server → Client:  SYN, seq=5000, ACK, ack=1001
```
Il server fa due cose in un solo pacchetto: genera il **proprio** ISN indipendente (`5000`) e lo comunica al client, e conferma di aver ricevuto il SYN del client scrivendo nel campo `ACK` il valore `1001` — l'ISN del client + 1.

**3. ACK — il client conferma di aver ricevuto l'ISN del server**
```
Client → Server:  ACK, seq=1001, ack=5001
```
Il client conferma a sua volta, scrivendo `5001` (l'ISN del server + 1) nel campo `ACK`.

### Perché si usa "+1" e non il numero esatto

Il campo `ACK` non conferma "ho ricevuto il numero X" — conferma "mi aspetto il prossimo byte a partire dal numero X". Il pacchetto SYN stesso, pur non trasportando dati applicativi, consuma virtualmente un numero di sequenza (per poter essere confermato in modo univoco) — per questo l'ACK successivo è sempre "ISN ricevuto + 1", non l'ISN stesso.

## Attacchi al TCP handshake

TCP si fida implicitamente che chi manda un pacchetto con un certo IP sorgente sia davvero quel mittente — non c'è autenticazione integrata a questo livello. Questa fiducia implicita è alla base di due attacchi distinti.

### TCP RST Attack (connection reset)

Un attaccante invia un pacchetto **RST (Reset)** contraffatto — con IP/porta sorgente falsificati per sembrare provenire dal server legittimo — al client. Il sistema operativo del client, ricevendolo, **chiude immediatamente** la connessione, prima ancora che l'handshake si completi o anche a connessione già stabilita.

```
Client → Server: SYN, seq=1000        (in viaggio)
Attaccante → Client: RST, ack=1001    (arriva prima, o comunque valido)
                                       ↓
Client: "connessione rifiutata/interrotta", abbandona
```

Un dettaglio tecnico rilevante: per un pacchetto RST, molte implementazioni TCP sono più permissive sulla verifica del numero di sequenza rispetto a un normale pacchetto dati — spesso basta che il `seq` ricada in una finestra ragionevole accettata, rendendo il RST spoofing relativamente più facile da eseguire con successo.

Questo è un attacco di **disponibilità**, non di riservatezza: non compromette la sicurezza di un'eventuale sessione TLS successiva (che, se arrivasse a completarsi, resterebbe cifrata e autenticata normalmente) — impedisce semplicemente che la comunicazione avvenga.

**Esempio reale: il Great Firewall cinese.** La censura di rete cinese usa esattamente questa tecnica su scala nazionale: quando rileva una connessione verso un dominio bloccato (osservando l'SNI in chiaro durante il TLS handshake), inietta pacchetti RST contraffatti verso entrambe le parti per interrompere la connessione, senza dover bloccare fisicamente il traffico.

### TCP Connection Hijacking (spoofing del SYN-ACK)

Se un attaccante riesce a **rispondere al posto del server** prima che arrivi la risposta legittima, può dirottare l'intera connessione fin dal primo scambio. In questo caso l'attaccante non deve indovinare il proprio numero di sequenza (lo sceglie lui stesso, dato che lo sta generando), ma deve comunque conoscere o indovinare correttamente l'ISN del **client** per costruire un campo `ACK` valido:

```
Client → SYN (seq=1000) → [in viaggio verso il server]
Attaccante intercetta/vede il SYN, e RISPONDE per primo:
Attaccante → SYN-ACK (seq=99999, ack=1001) → Client
```

Se questo pacchetto arriva al client prima di quello vero del server, il client lo accetta come un normale SYN-ACK legittimo — dirottando l'intera comunicazione successiva.

**Esempio storico: l'attacco di Kevin Mitnick contro Tsutomu Shimomura (1994).** All'epoca molti sistemi generavano gli ISN in modo **prevedibile** (es. incrementandoli di un valore fisso ogni tot millisecondi), rendendo possibile per un attaccante off-path calcolare in anticipo il prossimo ISN del client, senza nemmeno dover vedere il traffico reale.

## On-path vs off-path: la condizione che cambia tutto

| | Cosa serve fare | Difficoltà oggi |
|---|---|---|
| **Attaccante on-path** (stessa rete, router/ISP compromesso, ARP spoofing riuscito sulla LAN) | Vede i numeri di sequenza reali nel traffico intercettato | Facile: nessun numero da indovinare |
| **Attaccante off-path** (non vede il traffico, conosce solo IP/porte) | Deve indovinare alla cieca il numero di sequenza corretto | Molto difficile oggi: gli ISN moderni sono generati in modo crittograficamente casuale (32 bit), a differenza delle implementazioni prevedibili sfruttate nell'attacco Mitnick/Shimomura |

TCP non cifra i propri header, nemmeno sopra TLS — TLS cifra solo il payload applicativo, non l'header TCP che lo trasporta. Un attaccante on-path vede quindi sempre i numeri di sequenza in chiaro, indipendentemente da cosa viaggia sopra la connessione.

## Utilizzo

Questi attacchi restano rilevanti oggi principalmente in scenari **on-path**: censura di rete su scala nazionale (Great Firewall), reti locali non fidate (Wi-Fi pubblici, dopo un ARP spoofing riuscito), o infrastrutture di rete compromesse lungo il percorso. Il caso off-path, storicamente reale (Mitnick/Shimomura), è oggi in gran parte mitigato dalla generazione casuale degli ISN nelle implementazioni TCP moderne — ma il principio di fondo (TCP non autentica il mittente a livello di protocollo) resta valido, ed è lo stesso motivo strutturale per cui tecniche come l'ARP spoofing continuano a funzionare: un'associazione o un numero non verificato crittograficamente può sempre, in linea di principio, essere contraffatto da chi riesce a inserirsi nel percorso della comunicazione.

---
**Modulo:** A Journey into Cybersecurity
**Room:** 
**Data:** 8 agosto 2026
