---
title: "Networking Essentials"
date: 2026-08-11 12:00:00 +0200
categories: [Cyber Security 101, networking]
tags: [networking-essentials]
description: ""
toc: true
---

## Il modello ISO/OSI

Il modello **ISO/OSI** descrive il funzionamento di una rete suddividendolo in **7 livelli**, ciascuno con una responsabilità specifica e ben definita.

![Modello ISO/OSI vs TCP/IP](/assets/img/posts/osi-tcpip-diagram.svg)
_I 7 livelli OSI, i 4 livelli TCP/IP, e il nome dell'unità dati a ciascun livello_

| Livello | Nome | Funzione principale | Protocolli/standard di esempio |
|---|---|---|---|
| 7 | Application | Fornisce servizi e interfacce alle applicazioni | HTTP, FTP, DNS, POP3, SMTP, IMAP |
| 6 | Presentation | Codifica, cifratura e compressione dei dati | Unicode, MIME, JPEG, PNG, MPEG |
| 5 | Session | Stabilisce, mantiene e sincronizza le sessioni | NFS, RPC |
| 4 | Transport | Comunicazione end-to-end e segmentazione dei dati | UDP, TCP |
| 3 | Network | Indirizzamento logico e instradamento tra reti | IP, ICMP, IPSec |
| 2 | Data Link | Trasferimento dati affidabile tra nodi adiacenti | Ethernet (802.3), Wi-Fi (802.11) |
| 1 | Physical | Trasmissione fisica dei dati sul mezzo | Segnali elettrici, ottici, wireless |

### Il nome dell'unità dati cambia a ogni livello

Man mano che i dati scendono attraverso i livelli per essere trasmessi, ogni livello **incapsula** quello superiore aggiungendo il proprio header — e il nome con cui si chiama quel "pacchetto di dati" cambia a seconda del livello:

- **Livello Application**: semplicemente **dati** (data)
- **Livello Transport**: **Segment** se il protocollo è TCP, **Datagram** se è UDP
- **Livello Network**: **Packet**
- **Livello Data Link**: **Frame**

Questa distinzione terminologica non è solo formale: è utile per essere precisi quando si descrive un problema di rete — dire "il pacchetto non arriva" (livello 3) è diverso da dire "il frame viene scartato" (livello 2), e indica dove guardare per il troubleshooting.

## Il modello TCP/IP

Il modello **TCP/IP** è quello effettivamente implementato e usato su internet, ed è più semplice del modello OSI teorico: comprime i 7 livelli OSI in **4 livelli**:

- **Application** — unisce Application, Presentation e Session di OSI in un solo livello
- **Transport** — corrisponde esattamente al livello Transport di OSI (TCP, UDP)
- **Internet** — corrisponde al livello Network di OSI (IP, ICMP)
- **Network Access** — unisce Data Link e Physical di OSI in un solo livello

### La differenza principale con OSI

OSI è un **modello teorico/di riferimento**, creato per descrivere concettualmente come dovrebbe funzionare una rete in modo generico, indipendente da un'implementazione specifica. TCP/IP è invece il modello **pratico**, nato insieme ai protocolli che effettivamente fanno funzionare internet oggi — per questo ha meno livelli: alcuni confini teorici di OSI (come la separazione netta tra Session, Presentation e Application) non hanno un corrispondente pratico distinto nei protocolli reali, che tendono a gestire quelle funzioni tutte insieme a livello applicativo.

Nella pratica quotidiana (e nel resto di questi appunti) si parla quasi sempre in termini semplificati simili al modello TCP/IP, mentre OSI resta utile soprattutto come **linguaggio comune** per descrivere e localizzare problemi di rete con precisione (es. "è un problema di livello 2" o "di livello 3").

## Indirizzi IP, maschere e sottoreti

Un dispositivo di rete espone i propri indirizzi tramite comandi come `ifconfig` (Linux) — riprendendo un output già visto:

```
wlo1: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 192.168.66.89  netmask 255.255.255.0  broadcast 192.168.66.255
        inet6 fe80::73e1:ca5e:3f93:b1b3  prefixlen 64  scopeid 0x20<link>
        ether cc:5e:f8:02:21:a7  txqueuelen 1000  (Ethernet)
```

- **`inet`** è l'indirizzo **IPv4** — abbreviazione storica di "internet", nome ereditato dalla famiglia di indirizzi `AF_INET` usata nelle Berkeley Sockets, l'API di rete nata negli anni '80 su cui si basano ancora oggi i sistemi operativi moderni
- **`netmask 255.255.255.0`** è la **subnet mask**

### Come si legge la subnet mask

La subnet mask dice quanti bit dell'indirizzo IP identificano la **rete** e quanti identificano il singolo **host** (dispositivo) all'interno di quella rete:

```
IP:      192.168.66.89
Mask:    255.255.255.0
         └──────┬──────┘└┬┘
          rete (24 bit)   host (8 bit)
```

Con questa mask, tutti gli indirizzi da `192.168.66.0` a `192.168.66.255` appartengono alla stessa rete locale — 256 indirizzi in totale.

> All'interno di ogni subnet, **due indirizzi sono riservati** e non assegnabili a un dispositivo: il **primo** (es. `192.168.1.0`) identifica la rete stessa (network address), e l'**ultimo** (es. `192.168.1.255`) è l'indirizzo di **broadcast**, usato per inviare un pacchetto a tutti i dispositivi della subnet contemporaneamente. Su una subnet `/24` da 256 indirizzi totali, quindi, solo 254 sono effettivamente assegnabili a dispositivi reali.
{: .prompt-tip }

### La notazione CIDR: /24

La stessa informazione della mask `255.255.255.0` si può esprimere in modo più compatto con la notazione **CIDR**, scrivendo semplicemente il numero di bit dedicati alla rete dopo una barra:

```
192.168.66.89/24
```

`/24` significa esattamente "255.255.255.0" — i primi 24 bit sono di rete, i restanti 8 di host. Le due notazioni sono perfettamente equivalenti, solo scritte in modo diverso; CIDR è generalmente preferita perché più compatta, soprattutto quando si parla di blocchi di rete più grandi o più piccoli (es. `/16`, `/28`).

### Perché la subnet conta: comunicazione diretta o tramite gateway

Il motivo pratico per cui un dispositivo deve conoscere la propria subnet è decidere, per ogni pacchetto che deve inviare, se la destinazione è **raggiungibile direttamente** sulla rete locale o se serve passare dal **gateway** (router):

```
Destinazione: 192.168.66.50  → stessa rete (192.168.66.x) → invio DIRETTO
Destinazione: 8.8.8.8        → rete diversa → passa dal GATEWAY
```

> **Un dettaglio importante da non confondere**: quando due dispositivi sulla stessa rete locale comunicano tra loro, il traffico **non passa dal router** — passa attraverso lo **switch** (via cavo) o l'**access point** (via Wi-Fi), che lavorano a livello 2 (indirizzi MAC) e si limitano a inoltrare i frame senza fare alcuna decisione di instradamento. Il **router** lavora invece a livello 3 e viene coinvolto **solo** quando la destinazione è fuori dalla subnet locale. Nella pratica di casa, router e access point Wi-Fi sono spesso lo stesso dispositivo fisico (la scatola con le antenne), il che genera confusione: il traffico passa sempre attraverso quella scatola fisicamente, ma solo la parte "router" viene davvero coinvolta quando la comunicazione esce dalla rete locale — se resta dentro la stessa subnet, sta funzionando solo la parte switch/access point.
{: .prompt-tip }

Il computer calcola questo confronto (un AND bit a bit tra IP e mask) per ogni pacchetto che deve inviare, e se la destinazione non è nella propria subnet, risolve prima il MAC address del gateway tramite ARP e gli invia il pacchetto perché lo instradi altrove.

## DHCP

Ogni volta che un dispositivo vuole accedere a una rete, come minimo servono queste configurazioni:
- Indirizzo IP insieme alla subnet mask
- Router (o gateway)
- Server DNS

Configurare manualmente queste impostazioni è un'opzione valida, specialmente per i server — un server non si sposta da una rete all'altra, e altri dispositivi devono poterlo trovare sempre allo stesso indirizzo IP fisso. Ma per la maggior parte dei dispositivi (laptop, smartphone, dispositivi che cambiano rete spesso), farlo manualmente ogni volta sarebbe estremamente scomodo.

**DHCP (Dynamic Host Configuration Protocol)** è il protocollo che automatizza questa configurazione: quando un dispositivo si collega a una rete, il server DHCP gli assegna automaticamente un indirizzo IP libero, la subnet mask, il gateway e i server DNS da usare, senza che l'utente debba inserire nulla manualmente.

### La sequenza DORA

![Sequenza DHCP: Discover, Offer, Request, Acknowledge](/assets/img/posts/dhcp-dora-diagram.svg)
_Le prime due fasi sono broadcast, perché il client non ha ancora un indirizzo IP proprio_

L'assegnazione avviene tramite uno scambio di quattro messaggi, noto con l'acronimo **DORA**:

1. **Discover** — il client, non avendo ancora un IP, manda un messaggio in **broadcast** sulla rete locale: "c'è un server DHCP in ascolto?"
2. **Offer** — il server DHCP risponde proponendo un indirizzo IP libero, insieme a subnet mask, gateway e DNS
3. **Request** — il client conferma, di nuovo in broadcast, che vuole effettivamente quell'indirizzo (questo passaggio serve anche perché potrebbero esserci più server DHCP che hanno risposto, e il client comunica a tutti quale offerta ha accettato)
4. **Acknowledge (ACK)** — il server conferma definitivamente l'assegnazione, e da questo momento il client può usare quella configurazione

**A che livello lavora**: DHCP opera al **livello Application** (livello 7 OSI / livello Application in TCP/IP), pur trasportando informazioni che riguardano la configurazione dei livelli inferiori (IP, livello 3). Usa UDP come protocollo di trasporto, sulle porte 67 (server) e 68 (client).

## ARP

![Come funziona ARP](/assets/img/posts/arp-diagram.svg)
_Richiesta in broadcast a tutta la rete, risposta solo dal proprietario dell'IP cercato_

**ARP (Address Resolution Protocol)** risolve un problema specifico: un dispositivo conosce l'indirizzo **IP** (livello 3) di un altro dispositivo sulla stessa rete locale, ma per inviargli davvero un frame a livello 2 ha bisogno del suo indirizzo **MAC**. ARP fa esattamente questo: traduce un indirizzo IP nell'indirizzo MAC corrispondente, chiedendo "a chi appartiene questo IP?" in broadcast sulla rete locale, e ricevendo la risposta dal dispositivo proprietario di quell'IP.

**A che livello lavora**: ARP è considerato di livello 2 perché si occupa di indirizzi MAC. Altri sosterrebbero che faccia parte del livello 3, perché supporta le operazioni di IP. L'essenziale da sapere è che ARP permette la traduzione dall'indirizzamento di livello 3 a quello di livello 2 — si trova esattamente al confine tra i due livelli, ed è per questo che la sua classificazione genera dibattito.

## ICMP

**ICMP (Internet Control Message Protocol)** è un protocollo che i dispositivi di rete usano per scambiarsi messaggi di controllo e diagnostica — non trasporta dati applicativi come fanno TCP o UDP, ma serve a comunicare informazioni sullo stato della rete: errori, problemi di raggiungibilità, o semplici test di connettività. Opera allo stesso livello di IP (livello di rete, livello 3).

### ping e traceroute: i due strumenti basati su ICMP

**`ping`** — invia un messaggio ICMP di tipo **Echo Request**, e se il dispositivo di destinazione è raggiungibile, risponde con un **Echo Reply**. È il test di connettività più semplice che esiste.
```bash
ping 8.8.8.8
```

**`tracert`/`traceroute`** — sfrutta un altro tipo di messaggio ICMP: **Time Exceeded**, generato automaticamente da ogni router quando un pacchetto arriva con TTL a 0, il meccanismo che rende possibile ricostruire il percorso di rete hop per hop.

![Come funziona traceroute](/assets/img/posts/traceroute-diagram.svg)
_Il TTL aumenta di 1 a ogni tentativo, facendo "scadere" il pacchetto a un router diverso ogni volta_

### I principali tipi di messaggio ICMP

| Tipo | Nome | A cosa serve |
|---|---|---|
| 0 | Echo Reply | Risposta a un ping |
| 8 | Echo Request | Richiesta di ping |
| 3 | Destination Unreachable | La destinazione non è raggiungibile |
| 11 | Time Exceeded | Il TTL del pacchetto è arrivato a 0 (usato da traceroute) |
| 5 | Redirect | Un router suggerisce un percorso migliore per raggiungere una destinazione |

A differenza di TCP e UDP, ICMP **non usa porte** — non ha bisogno di distinguere tra applicazioni diverse sullo stesso host, perché non trasporta dati applicativi.

### Rilevanza per il pentesting

ICMP è rilevante in fase di reconnaissance per diversi motivi:
- **Host discovery**: prima di scansionare una rete con `nmap`, spesso si fa un ping sweep per capire quali host sono online — anche se un firewall può far sembrare "spento" un host che in realtà è solo configurato per ignorare ICMP
- **Firewall/network mapping**: osservare dove nel percorso un `traceroute` smette di ricevere risposte ICMP può rivelare la presenza e la posizione approssimativa di dispositivi di sicurezza lungo il tragitto
- **ICMP tunneling**: nascondere dati dentro pacchetti ICMP (spesso meno controllati di TCP/UDP da alcuni firewall) per esfiltrare dati o mantenere un canale C2 nascosto

## NAT

**NAT (Network Address Translation)** è il meccanismo che permette a molti dispositivi con indirizzi IP **privati** (validi solo dentro una rete locale) di condividere un unico indirizzo IP **pubblico** per comunicare con internet.

![Come funziona il NAT](/assets/img/posts/nat-diagram.svg)
_Più dispositivi della LAN condividono un solo IP pubblico, distinti per numero di porta_

### Il problema che risolve

Gli indirizzi IPv4 pubblici sono un numero limitato e ormai quasi esaurito (circa 4,3 miliardi in totale, molti meno di quanti dispositivi esistano al mondo). NAT permette a un'intera rete locale — casa, ufficio, un'intera azienda — di condividere un **solo** indirizzo IP pubblico assegnato dal provider, mentre internamente ogni dispositivo ha un indirizzo IP **privato** (tipicamente nei range `192.168.x.x`, `10.x.x.x`, `172.16.x.x`–`172.31.x.x`, riservati appositamente per uso locale e mai instradati su internet).

### Come funziona

Il router che fa da NAT mantiene una **tabella di traduzione**: quando un dispositivo interno invia una richiesta verso internet, il router sostituisce l'indirizzo IP privato del dispositivo con il proprio indirizzo IP pubblico, **ricordandosi** (nella tabella) quale dispositivo interno e quale porta corrispondono a quella specifica traduzione. Quando arriva la risposta da internet, il router consulta la tabella e la inoltra al dispositivo interno corretto.

```
192.168.1.10:51422  →  85.34.12.7:40001   (traduzione NAT)
192.168.1.11:51500  →  85.34.12.7:40002   (traduzione NAT)
```

Il numero di **porta** è ciò che permette al router di distinguere tra le connessioni di dispositivi diversi che condividono lo stesso IP pubblico — questa variante specifica di NAT, che sfrutta le porte per moltiplicare le connessioni possibili su un singolo IP pubblico, si chiama tecnicamente **PAT (Port Address Translation)** o NAT overload, ed è la forma di NAT più comune nelle reti domestiche.

### Rilevanza per la sicurezza

NAT ha un effetto collaterale di sicurezza spesso frainteso come "protezione": dato che i dispositivi interni non hanno un indirizzo IP pubblico proprio, non sono direttamente raggiungibili dall'esterno senza una regola di inoltro esplicita (port forwarding) — questo nasconde parzialmente la topologia della rete interna a un osservatore esterno. Non va però considerato un vero meccanismo di sicurezza (il firewall resta la protezione effettiva): è più corretto pensarlo come un effetto collaterale utile della scarsità di indirizzi IPv4, non come una funzionalità di sicurezza progettata come tale.

Durante un assessment, se il target ha un solo IP pubblico visibile ma il committente indica di avere molte macchine interne, è un segnale che dietro c'è NAT — e la vera enumerazione della rete interna richiederà un punto d'appoggio (foothold) dentro la rete locale, non sarà visibile dall'esterno.
