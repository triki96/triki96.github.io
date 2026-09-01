---
title: "Active Reconnaissance"
date: 2026-08-31 8:00:00 +0200
categories: [PT1, reconnaissance]
tags: [recon]
description: "Tecniche di reconnaissance attiva contro un target: browser e dev tools, ping e TTL per il fingerprinting OS, traceroute, banner grabbing con telnet e netcat."
toc: true
---

## Intro

Con la reconnaissance attiva andiamo oltre quello che le fonti pubbliche possono dirci: verifichiamo direttamente se il target è raggiungibile (`ping`), mappiamo la strada che i nostri pacchetti percorrono per arrivarci (`traceroute`), e ci affacciamo direttamente ai suoi servizi per leggerne i banner (`telnet`, `netcat`) o ispezionarne il comportamento lato client (browser). Il prezzo da pagare è la **rilevabilità**, e le tecniche attive possono comparire come:

- voci nei **log** del server
- **alert** generati da un IDS (Intrusion Detection System)
- **blocchi** da parte di un WAF (Web Application Firewall)
- trigger su eventuali **honeypot**

>*OSS*: un **honeypot** è, in parole semplici, una trappola: un sistema che finge di essere un target reale e vulnerabile (un server, un servizio, un file), ma che in realtà non ha nessuno scopo produttivo — esiste solo per attirare un attaccante e osservare cosa fa. Poiché nessun utente legittimo ha motivo di interagire con un honeypot, **qualsiasi interazione con esso è automaticamente sospetta**. I difensori lo usano per:
>- rilevare un attaccante nelle prime fasi (spesso proprio durante la reconnaissance)
>- studiarne le tecniche in un ambiente controllato e isolato
>- far perdere tempo prezioso all'attaccante su un bersaglio finto
>
>Per noi, come pentester, questo significa che dobbiamo essere consapevoli che non tutto ciò che sembra un target reale lo è davvero — e che ogni azione attiva può, in teoria, farci scoprire.


In questo documento vediamo cinque strumenti fondamentali per la reconnaissance attiva:

- **Browser web** (con i Developer Tools) → rivela tecnologie, header, file JavaScript, certificati
- **ping** → verifica se il target è raggiungibile e ci dà indizi sul suo sistema operativo tramite il TTL
- **traceroute** → mappa il percorso di rete verso il target, rivelando i router intermedi
- **telnet** → banner grabbing "legacy", utile ma insicuro
- **netcat (nc)** → banner grabbing, port probing, comunicazione client-server semplice



## Browser Web

Il browser è uno degli strumenti più comodi e **meno sospetti** per fare reconnaissance attiva. È presente praticamente su ogni sistema, e il suo traffico si confonde perfettamente con quello di un normale utente che naviga — questo rende molto difficile per un difensore distinguere la nostra attività di ricognizione da una visita qualsiasi al sito.

Usiamo i **Developer Tools** del browser (F12, o tasto destro → Ispeziona) per andare oltre quello che vediamo a schermo.

### Network tab

La tab **Network** ci mostra tutte le richieste HTTP che il browser fa mentre carichiamo una pagina: ogni file, ogni chiamata API, ogni header di richiesta/risposta.

A cosa ci serve per la recon:
- vediamo **endpoint API** che il sito chiama in background (spesso non documentati pubblicamente)
- leggiamo gli **header di risposta** (es. `Server`, `X-Powered-By`) che rivelano tecnologie e versioni
- individuiamo **cookie** e come vengono gestiti (utile per capire meccanismi di sessione)
- scopriamo risorse caricate da **domini terzi** (CDN, servizi esterni collegati)

### Console tab

La tab **Console** ci mostra errori ed eventuali messaggi di log generati dal JavaScript della pagina, e ci permette di eseguire noi stessi comandi JavaScript.

A cosa ci serve per la recon:
- gli **errori JavaScript** a volte rivelano percorsi di file interni, stack trace, o messaggi di debug che gli sviluppatori hanno dimenticato di rimuovere
- possiamo interrogare variabili globali lasciate accidentalmente esposte (es. configurazioni, chiavi, versioni di librerie)

### Sources tab

La tab **Sources** ci mostra tutti i file sorgente (JavaScript, CSS, HTML) caricati dalla pagina, spesso organizzati nella stessa struttura di cartelle usata dagli sviluppatori.

A cosa ci serve per la recon:
- possiamo leggere il codice JavaScript per trovare **endpoint nascosti**, commenti dei developer, o addirittura credenziali/chiavi API lasciate hardcoded per errore
- se sono presenti i **source map**, possiamo risalire al codice sorgente "non minificato" originale, molto più leggibile
- capiamo la struttura interna dell'applicazione, utile per orientarci in fasi successive del test

### Estensioni del browser

Alcune estensioni trasformano il browser in una piattaforma di reconnaissance molto più potente:

- **FoxyProxy**: gestisce rapidamente più configurazioni di proxy (utile per instradare il traffico attraverso Burp Suite, ad esempio)
- **User-Agent Switcher and Manager**: cambia la stringa User-Agent per farci passare per browser, sistemi operativi o dispositivi diversi — utile per scoprire endpoint specifici per mobile o comportamenti diversi su versioni di browser più vecchie
- **Wappalyzer**: identifica automaticamente le tecnologie usate dal sito (CMS, web server, framework JavaScript, strumenti di analytics, CDN, database) mentre navighiamo — uno dei metodi più rapidi per un fingerprinting tecnologico immediato



## Ping

Con `ping` mandiamo un piccolo pacchetto di test verso un host remoto e aspettiamo una risposta. Questo scambio, semplicissimo, ci dice se il target è raggiungibile ed è online.

`ping` usa il protocollo **ICMP**: mandiamo un pacchetto **Echo Request** (Type 8), e se il target è raggiungibile e autorizzato a rispondere, ci restituisce un **Echo Reply** (Type 0). Questo scambio è leggerissimo e veloce — proprio per questo `ping` è diventato il primo controllo standard prima di investire tempo in scansioni più dettagliate.

### Uso base

Su Linux e macOS usiamo `-c` per specificare quanti pacchetti mandare:

```bash
ping -c 5 10.114.188.59
```

Possiamo anche fare ping di un hostname, nel qual caso avviene prima una risoluzione DNS:

```bash
ping -c 5 tryhackme.com
```

Su Windows il flag equivalente è `-n`:

```bash
ping -n 5 10.114.188.59
```

Possiamo forzare una versione IP specifica con `-4` e `-6`:

```bash
ping -4 -c 5 10.114.188.59
ping -6 -c 5 MACHINE_IPV6
```

### Esempio di output con TTL

```
$ ping -c 4 10.114.188.59
PING 10.114.188.59 (10.114.188.59) 56(84) bytes of data.
64 bytes from 10.114.188.59: icmp_seq=1 ttl=63 time=0.412 ms
64 bytes from 10.114.188.59: icmp_seq=2 ttl=63 time=0.389 ms
64 bytes from 10.114.188.59: icmp_seq=3 ttl=63 time=0.401 ms
64 bytes from 10.114.188.59: icmp_seq=4 ttl=63 time=0.395 ms

--- 10.114.188.59 ping statistics ---
4 packets transmitted, 4 received, 0% packet loss, time 3005ms
```

### Il campo TTL: cosa ci dice davvero

Il **TTL (Time To Live)** merita attenzione particolare. Nonostante il nome contenga la parola "Time", il TTL in realtà rappresenta **il numero massimo di router (hop) che un pacchetto può attraversare** prima di essere scartato. Ogni router lungo il percorso decrementa il TTL di 1.

Il valore iniziale del TTL è impostato dal sistema operativo di origine, e questo lo rende un indizio utile per il **fingerprinting del sistema operativo**:

- **Linux** parte tipicamente da TTL **64**
- **Windows** parte tipicamente da TTL **128**

Attenzione però: i router intermedi decrementano questo valore prima che arrivi a noi. Un TTL di **58** in una risposta indica probabilmente un sistema **Linux** che si trova a **sei hop di distanza** (64 - 58 = 6), non un sistema operativo diverso. È importante tenerlo a mente quando interpretiamo i risultati — dobbiamo sempre ragionare in termini di "valore iniziale più probabile meno hop percorsi", non prendere il numero alla lettera.

### Esempio in cui il target non risponde

```
$ ping -c 4 10.114.188.200
PING 10.114.188.200 (10.114.188.200) 56(84) bytes of data.

--- 10.114.188.200 ping statistics ---
4 packets transmitted, 0 received, 100% packet loss, time 3070ms
```

Nessuna risposta, nessun errore esplicito — solo perdita di pacchetti al 100%. Questo è un risultato molto comune e **non significa necessariamente che il target sia spento**.

### Perché possiamo non ricevere risposta

Ci sono diverse ragioni comuni:
- la macchina del lab è spenta, si è bloccata, o è ancora in fase di avvio
- un router o firewall lungo il percorso blocca le richieste ICMP Echo
- il target è dietro un NAT che scarta l'ICMP
- il Windows Firewall blocca il ping di default sulla maggior parte delle versioni
- firewall aziendali, cloud provider come AWS/Azure/GCP, e WAF/CDN moderni bloccano spesso l'ICMP completamente
- la nostra stessa rete/macchina potrebbe bloccare l'ICMP in uscita

### Guida rapida all'interpretazione

| Risultato | Significato più probabile | Prossimo passo |
|---|---|---|
| Risposte veloci, poca o nessuna perdita | Il target è online e permette ICMP | Procediamo con il port scanning |
| "Destination Host Unreachable" | Il target è spento o non esiste una rotta | Verifichiamo se la macchina è accesa |
| 100% di perdita, nessun messaggio d'errore | ICMP filtrato/bloccato | Proviamo host discovery TCP/UDP con Nmap |
| Latenza alta o forte perdita | Congestione di rete, distanza, o filtraggio | Approfondiamo il percorso con traceroute |


## Traceroute

Il comando `traceroute` traccia il percorso che i pacchetti seguono dal nostro sistema fino al target. Il suo scopo è scoprire gli indirizzi IP dei router (hop) lungo il percorso e capire quanti se ne trovano tra noi e la destinazione. Questa informazione è utile per capire la topologia di rete, individuare dove si verificano filtraggi o latenza, e mappare l'infrastruttura.

Su Linux e macOS il comando è:
```bash
traceroute 10.114.188.59
```
Su Windows:
```bash
tracert 10.114.188.59
```
Per IPv6:
```bash
traceroute -6 MACHINE_IPV6
```

### Come funziona, in breve

`traceroute` sfrutta lo stesso campo **TTL** di cui parlavamo per `ping`. Il meccanismo è semplice:

1. Mandiamo un primo pacchetto con **TTL = 1**. Il primo router che lo riceve decrementa il TTL a 0, lo scarta, e ci rimanda indietro un messaggio ICMP "Time Exceeded" — da questo messaggio ricaviamo l'IP del primo hop.
2. Mandiamo un secondo pacchetto con **TTL = 2**. Questa volta supera il primo router (TTL diventa 1), ma viene scartato dal secondo router — otteniamo l'IP del secondo hop.
3. Ripetiamo aumentando il TTL di 1 ogni volta, finché un pacchetto non raggiunge finalmente la destinazione finale (che risponde direttamente, invece di scartare il pacchetto).

In pratica, costruiamo la mappa del percorso un hop alla volta, sfruttando il fatto che ogni router "si tradisce" quando scarta un pacchetto con TTL scaduto.

### Quando un hop appare come `*`

Alcuni router sono configurati per **non inviare** i messaggi ICMP "Time Exceeded" — una scelta comune in ambienti che vogliono proteggersi proprio dalla reconnaissance. Questi router compaiono nell'output come `*`, cioè un hop "invisibile" di cui non conosciamo l'IP, anche se sappiamo che esiste (perché gli hop successivi continuano a rispondere normalmente).

### UDP, TCP o ICMP: tre modi di tracciare il percorso

Su Linux, `traceroute` manda **datagrammi UDP** di default (verso porte alte, tipicamente a partire dalla 33434) — a differenza di Windows, dove `tracert` usa ICMP di default.

```bash
traceroute 10.114.188.59
```

Per passare al tracciamento basato su **TCP**, utile per bypassare filtri UDP:

```bash
traceroute -T 10.114.188.59
```

Con `-T`, `traceroute` manda pacchetti TCP (tipicamente SYN, come se stesse tentando di aprire una connessione). Questo è utile perché molti firewall bloccano UDP ma lasciano passare TCP, specialmente su porte comuni come 80 o 443.

Per il tracciamento basato su **ICMP** (lo stesso protocollo di `ping`):

```bash
traceroute -I 10.114.188.59
```

Il messaggio di fondo è che **reti diverse filtrano protocolli diversi**. Se il percorso sembra "interrompersi" con un metodo, spesso non è la fine reale del percorso, ma un firewall che silenzia proprio quel protocollo. Conviene quindi provare più varianti per ottenere un quadro più completo.

### Riepilogo

| Comando | Protocollo usato | Quando è utile |
|---|---|---|
| `traceroute IP` | UDP (default su Linux) | Caso standard |
| `traceroute -T IP` | TCP (SYN) | Se UDP è filtrato, spesso passa su reti che permettono traffico web |
| `traceroute -I IP` | ICMP (come ping) | Se UDP/TCP sono filtrati ma ICMP è permesso |

Per un monitoraggio del percorso in tempo reale e continuo, possiamo usare anche `mtr` (una combinazione di `traceroute` e `ping` che aggiorna i risultati live):

```bash
mtr 10.114.188.59
```


## Telnet

Il protocollo **TELNET** (Teletype Network) è stato sviluppato nel 1969 per comunicare con un sistema remoto tramite interfaccia a riga di comando. Il comando `telnet` usa questo protocollo per l'amministrazione remota, con porta di default **23**.

Dal punto di vista della sicurezza, `telnet` manda tutti i dati **in chiaro**, comprese username e password — questo rende banale per chiunque abbia accesso al canale di comunicazione intercettare le credenziali. L'alternativa sicura è **SSH** (Secure Shell), che cifra tutto il traffico ed è oggi lo standard per l'accesso remoto da riga di comando.

### Perché lo usiamo comunque per la reconnaissance

Nonostante i suoi limiti di sicurezza, il client `telnet` ha una proprietà utile per noi: siccome opera sopra **TCP**, possiamo usarlo per connetterci a **qualsiasi porta TCP** e osservare la risposta del server. Questa tecnica si chiama **banner grabbing**: ci connettiamo a un servizio e leggiamo la risposta iniziale — il "banner" — che il server ci manda. I banner rivelano spesso il nome del software e la sua versione esatta.

### Esempio pratico

```bash
telnet 10.114.188.59 80
```
```
Trying 10.114.188.59...
Connected to 10.114.188.59.
Escape character is '^]'.
GET / HTTP/1.1
Host: 10.114.188.59

HTTP/1.1 200 OK
Server: nginx/1.6.2
Date: Tue, 17 Aug 2021 11:13:25 GMT
Content-Type: text/html
Content-Length: 867
Last-Modified: Tue, 17 Aug 2021 11:12:16 GMT
Connection: keep-alive
ETag: "611b9990-363"
Accept-Ranges: bytes
```

Ci siamo connessi manualmente alla porta 80 e abbiamo scritto a mano una richiesta HTTP grezza (`GET / HTTP/1.1` seguito dall'header `Host` e una riga vuota). Quello che vediamo dopo non è un errore né un'informazione regalata per sbaglio: sono gli **header HTTP**, i metadati che ogni risposta HTTP include per definizione del protocollo, mandati sempre prima del contenuto vero e proprio (la pagina HTML).

Il dettaglio più prezioso per noi è `Server: nginx/1.6.2`: sapendo nome e versione esatta del software, possiamo già iniziare a cercare CVE note per quella versione specifica.

### La stessa tecnica funziona su altri protocolli

Il banner grabbing funziona identicamente contro qualsiasi servizio basato su TCP:

- connettendoci a un server di posta useremmo comandi **SMTP** o **POP3** invece di HTTP
- connettendoci a un server **FTP** sulla porta 21, il server tipicamente manda il proprio banner **immediatamente** alla connessione, senza bisogno di alcun comando

Il principio di fondo resta sempre lo stesso: ci connettiamo alla porta, leggiamo cosa il server ci manda, ed eventualmente inviamo comandi specifici del protocollo per estrarre ulteriori informazioni.


## Netcat

La tecnica di banner grabbing vista con `telnet` funziona in modo identico con **netcat (`nc`)**, spesso considerato il "coltellino svizzero" delle reti. La sintassi è:

```bash
nc 10.114.172.54 PORT
```

### Esempio pratico

```bash
nc 10.114.172.54 80
```
```
GET / HTTP/1.1
Host: 10.114.172.54

HTTP/1.1 200 OK
Server: nginx/1.6.2
Date: Tue, 17 Aug 2021 11:39:49 GMT
Content-Type: text/html
Content-Length: 867
Last-Modified: Tue, 17 Aug 2021 11:12:16 GMT
Connection: keep-alive
ETag: "611b9990-363"
Accept-Ranges: bytes
```

Anche qui, dopo la connessione digitiamo manualmente la richiesta HTTP e leggiamo la risposta — stesso principio del banner grabbing visto con `telnet`, ma con uno strumento pensato appositamente per essere più flessibile e leggero.

### Stesso approccio, qualsiasi servizio TCP

Come per `telnet`, questo stesso approccio si applica a qualsiasi servizio basato su TCP:

- connettendoci a un server **FTP** sulla porta 21 (`nc 10.114.172.54 21`) otteniamo tipicamente un banner immediato con software e versione del server FTP, senza bisogno di comandi
- connettendoci a un server **SMTP** sulla porta 25 otteniamo un banner che identifica il server di posta

Il principio resta coerente in ogni caso: ci connettiamo, leggiamo il banner, ed eventualmente inviamo comandi specifici del protocollo.

## Guida rapida ai comandi

| Comando | Esempio |
|---|---|
| ping | `ping -c 10 10.114.172.54` (Linux/macOS) |
| ping | `ping -n 10 10.114.172.54` (Windows) |
| ping (IPv6) | `ping -6 MACHINE_IPV6` o `ping6 MACHINE_IPV6` |
| traceroute | `traceroute 10.114.172.54` (Linux/macOS) |
| tracert | `tracert 10.114.172.54` (Windows) |
| traceroute (IPv6) | `traceroute -6 MACHINE_IPV6` o `traceroute6 MACHINE_IPV6` |
| mtr | `mtr 10.114.172.54` (monitoraggio in tempo reale) |
| telnet (legacy) | `telnet 10.114.172.54 PORT_NUMBER` |
| netcat come client | `nc 10.114.172.54 PORT_NUMBER` |
| netcat come server | `nc -lvnp PORT_NUMBER` |
| netcat (IPv6) | `nc -6 MACHINE_IPV6 PORT_NUMBER` |
| curl per banner HTTP | `curl -I http://10.114.172.54` o `curl -I https://10.114.172.54` |
