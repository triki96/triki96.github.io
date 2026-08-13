---
title: "TcpDump"
date: 2026-08-11 15:00:00 +0200
categories: [Cyber Security 101]
tags: [networking, tcpdump]
description: ""
toc: true
---
## Cos'è

**tcpdump** è l'analizzatore di traffico a riga di comando su cui si basa Wireshark stesso — usa la stessa libreria di cattura (`libpcap`) e la stessa sintassi dei capture filter (BPF) già vista con Wireshark, ma senza interfaccia grafica.

### Il rapporto con Wireshark

Il campo "Capture filter" di Wireshark, con sintassi tipo `host 1.2.3.4` o `port 80`, **è** la sintassi di tcpdump — Wireshark la eredita direttamente, perché entrambi si appoggiano alla stessa libreria sottostante.

## Uso base

```bash
sudo tcpdump -i eth0
```

Cattura tutto il traffico sull'interfaccia `eth0` e lo stampa in tempo reale a schermo.

### I flag principali

```bash
tcpdump -i eth0                    # specifica l'interfaccia
tcpdump -i any                     # cattura su TUTTE le interfacce contemporaneamente
tcpdump -n                          # non risolvere nomi (host/porte), solo IP/numeri — più veloce e chiaro
tcpdump -c 50                       # cattura solo 50 pacchetti e si ferma
tcpdump -w cattura.pcap             # scrive su file invece di stampare a schermo (stesso formato .pcap di Wireshark)
tcpdump -r cattura.pcap             # rilegge un file .pcap già salvato
tcpdump -A                          # mostra il payload in ASCII (utile per traffico testuale come HTTP)
tcpdump -X                          # mostra il payload in esadecimale + ASCII
tcpdump -v / -vv / -vvv             # livelli crescenti di verbosità
```

### Applicare filtri di base

```bash
tcpdump host 192.168.1.10                # solo traffico da/verso quell'IP
tcpdump port 80                           # solo traffico sulla porta 80
tcpdump tcp                               # solo traffico TCP
tcpdump host 192.168.1.10 and port 443    # combinazione di condizioni
tcpdump src 192.168.1.10                  # solo come sorgente
tcpdump dst 192.168.1.10                  # solo come destinazione
```

**Filtri per lunghezza del pacchetto:**
```bash
tcpdump greater 1000        # pacchetti con lunghezza >= 1000 byte
tcpdump less 100             # pacchetti con lunghezza <= 100 byte
```

Utile per isolare pacchetti "pesanti" (probabile trasferimento dati) da quelli "leggeri" (probabile solo controllo, tipo ACK puri). Per approfondire tutte le opzioni di filtro disponibili, la manpage di riferimento è `man pcap-filter`.

## Filtrare byte specifici dell'header

Prima di poter filtrare sui **bit** di un header serve conoscere tre operazioni logiche di base.

### Filtrare per i flag TCP

Questo è il caso pratico più utile: `tcp[tcpflags]` fa riferimento specificamente al campo che contiene i flag TCP.

```
tcp-syn      SYN (Synchronize)
tcp-ack      ACK (Acknowledge)
tcp-fin      FIN (Finish)
tcp-rst      RST (Reset)
tcp-push     PSH (Push)
```

```bash
# Pacchetti con SOLO il flag SYN impostato (tutti gli altri disattivati)
tcpdump "tcp[tcpflags] == tcp-syn"

# Pacchetti con ALMENO il flag SYN impostato (anche insieme ad altri)
tcpdump "tcp[tcpflags] & tcp-syn != 0"

# Pacchetti con ALMENO SYN o ACK impostato
tcpdump "tcp[tcpflags] & (tcp-syn|tcp-ack) != 0"
```

Questi filtri sono molto pratici per isolare fasi specifiche di una connessione, collegandosi direttamente al three-way handshake TCP già visto:

```bash
# Solo i pacchetti SYN puri: vedi solo i tentativi di NUOVA connessione
tcpdump "tcp[tcpflags] == tcp-syn"

# Solo i RST: utile per individuare connessioni interrotte/rifiutate
# (lo stesso tipo di pacchetto usato negli attacchi RST spoofing già visti)
tcpdump "tcp[tcpflags] & tcp-rst != 0"
```

## Un esempio pratico completo

```bash
sudo tcpdump -i eth0 -n port 80 -A
```

Cattura in tempo reale solo il traffico sulla porta 80 (HTTP), senza risoluzione dei nomi, mostrando il contenuto in ASCII — utile per vedere al volo richieste/risposte HTTP in chiaro, come "Follow HTTP Stream" in Wireshark ma direttamente da terminale.

## tcpdump vs Wireshark

**Vantaggi di tcpdump**: leggero (nessuna interfaccia grafica, poche risorse consumate — perfetto su server remoti senza desktop), scriptabile (si integra in script bash, cron job, automazioni), disponibile quasi ovunque su sistemi Linux/Unix.

**Vantaggi di Wireshark**: interfaccia grafica per esplorare/filtrare/seguire stream visivamente, decodifica automatica di centinaia di protocolli, funzionalità avanzate come Follow Stream, Export Objects, decifratura TLS.

### Il workflow che li combina entrambi

Una pratica comune in ambito pentesting/SOC: catturare con tcpdump su un server remoto (dove non c'è GUI, o si vuole minimizzare l'impatto sulle risorse), salvando su file con `-w`, e poi analizzare con Wireshark trasferendo il file `.pcap` sul proprio computer.

```bash
# Sul server remoto (via SSH)
sudo tcpdump -i eth0 -w cattura.pcap

# Trasferisci il file
scp utente@server:/percorso/cattura.pcap ./

# Apri cattura.pcap in Wireshark sul computer locale
```

## Utilizzo

Un filtro come `tcp[tcpflags] == tcp-syn` è esattamente lo strumento con cui si potrebbe osservare in tempo reale un port scan tipo SYN scan (`nmap -sS`) diretto verso una macchina — un'ondata di pacchetti SYN puri verso porte diverse, senza mai completare l'handshake, è la firma caratteristica di quella tecnica di scansione.
