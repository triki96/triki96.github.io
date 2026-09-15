---
title: "Nmap Host Discovery"
date: 2026-09-03 00:00:00 +0200
categories: [PT1, 2-nmap]
tags: [nmap, host-discovery, enumeration]
---


## Enumerating targets

Prima ancora di cercare host attivi, è possibile chiedere a Nmap di elencare semplicemente i target che andrebbe a scansionare, senza mandare alcun pacchetto:

```bash
nmap -sL TARGETS
```

`-sL` (List Scan) espande il range/subnet fornito in una lista di IP, e prova a fare una risoluzione DNS inversa su ciascuno — ma **non** invia traffico verso i target. Utile per verificare rapidamente che il range indicato sia quello corretto prima di lanciare una scansione vera.


## Reverse DNS Lookup

Il **reverse DNS lookup** è il processo di risoluzione di un indirizzo IP nel suo hostname associato — l'operazione opposta della normale risoluzione DNS. Invece di chiedere "qual è l'IP di example.com?", si chiede "quale nome di dominio è assegnato a 10.200.6.15?".

Nmap di default fa reverse DNS lookup solo sugli host che risultano attivi. Al netto del comportamento standard, gestisce questa tecnica con due flag:

- **`-R`** — forza la risoluzione DNS inversa su tutti i target specificati, anche quelli che risultano "down" — utile quando si vuole comunque raccogliere informazioni sui nomi host associati a un intero range, indipendentemente dal loro stato
- **`-n`** — disattiva completamente la risoluzione DNS, anche per gli host attivi — utile per velocizzare la scansione quando i nomi host non interessano, dato che le query DNS aggiungono comunque un piccolo overhead

## Host discovery with ARP

L'host discovery si può fare con diversi protocolli, ognuno dei quali agisce a un livello diverso della pila ISO/OSI. Vediamo come fare un host discovery usando il protocollo ARP.

```bash
sudo nmap -PR -sn 192.168.1.0/24

Nmap scan report for 192.168.1.1
Host is up (0.0012s latency).
MAC Address: AA:BB:CC:DD:EE:FF (Router vendor)

Nmap scan report for 192.168.1.15
Host is up (0.0034s latency).
MAC Address: 11:22:33:44:55:66 (Dell Inc.)

Nmap done: 256 IP addresses (5 hosts up) scanned in 2.31 seconds
```



- **`-PR`** — ARP Ping: chiede a Nmap di rilevare host attivi tramite richieste ARP (Address Resolution Protocol)
- **`-sn`** — "no port scan": dice a Nmap di fermarsi all'host discovery, senza scansionare alcuna porta


> Con l'ARP ping si ottiene "gratis" anche l'**indirizzo MAC** e, spesso, il produttore della scheda di rete (ricavato dai primi byte del MAC, l'OUI) — un'informazione utile per farsi già un'idea dei dispositivi presenti.
> {: .prompt-tip }

>**Questo scan funziona solo sulla rete locale**: ARP opera al Livello 2 (Data Link), non al Livello 3 (Network): non è pensato per essere instradato su Internet, quindi funziona solo su sottoreti in cui ci troviamo già dentro.
> {: .prompt-warning }

> **ARP scan è comunque il metodo preferito quando applicabile**: proprio perché opera a un livello così basso, è estremamente affidabile: quasi nessun firewall/host blocca le risposte ARP, perché farlo romperebbe la comunicazione di rete di base — a differenza dell'ICMP, spesso filtrato. È anche molto veloce.
> {: .prompt-tip }



**Utilità in fase di post-exploitation**

L'ARP scan è particolarmente utile durante il post-exploitation e l'enumerazione di reti interne: una volta ottenuto un accesso a un sistema all'interno di una rete, permette di identificare rapidamente e in modo affidabile altri host attivi sullo stesso segmento locale. Poiché ARP opera a Livello 2 e raramente viene filtrato dai firewall, è uno strumento efficace per operazioni red-team e penetration test interni.

## Host discovery with ICMP

A differenza di ARP, ICMP opera al **Livello 3 (Network)**, quindi funziona anche su reti diverse dalla quella su cui stiamo lavorando. Ricordiamo che ICMP non è un protocollo per trasportare dati applicativi, è un protocollo di diagnostica, pensato per far comunicare tra loro dispositivi di rete riguardo allo stato della rete stessa: "questo host è raggiungibile?", "la porta che cercavi è chiusa", e così via. Dato che esistono molti tipi diversi di messaggi che i dispositivi si scambiano, ogni pacchetto ICMP porta con sé un numero (**Type**) che dice esattamente di che messaggio si tratta.

| Type | Nome | A cosa serve |
|------|------|---------------|
| 8 | Echo Request | "Sei raggiungibile?" — il classico `ping` in uscita |
| 0 | Echo Reply | "Sì, sono qui" — la risposta al ping |
| 13 | Timestamp Request | "Che ore sono da te?" |
| 14 | Timestamp Reply | La risposta con l'orario |
| 17 | Address Mask Request | "Qual è la tua subnet mask?" |
| 18 | Address Mask Reply | La risposta con la subnet mask |
| 3 | Destination Unreachable | "Non riesco a raggiungere quella destinazione" (con vari Code, es. "porta chiusa") |
| 11 | Time Exceeded | "Il pacchetto ha superato il numero massimo di hop" (usato da `traceroute`) |


> Se il target si trova sulla stessa sottorete, conviene comunque preferire ARP — perché anche un ping ICMP, prima di raggiungere un target sulla LAN, deve comunque risolvere il suo indirizzo MAC tramite una richiesta ARP; a quel punto si sa già se l'host è attivo, rendendo il passaggio successivo via ICMP ridondante.
> {: .prompt-tip }


### ICMP Type 8 (-PE)

```bash
sudo nmap -PE -sn 10.200.6.0/24
```

`-PE` usa il classico **ICMP Echo Request** (Type 8), aspettandosi come risposta un **ICMP Echo Reply** (Type 0) — lo stesso meccanismo di un normale `ping`.

**Attenzione**: pur essendo l'approccio più intuitivo, non è sempre affidabile. Molti firewall bloccano l'ICMP echo; le versioni più recenti di Windows sono configurate con un firewall host che blocca le richieste ICMP echo di default.

### ICMP Type 14 (-PP)

Poiché le richieste ICMP echo tendono a essere bloccate, si possono usare in alternativa le richieste **ICMP Timestamp** per capire se un sistema è online.

```bash
nmap -PP -sn 10.200.6.0/24
```

Nmap invia una richiesta di tipo **Timestamp** (ICMP Type 13) e verifica se riceve una risposta **Timestamp Reply** (ICMP Type 14, da cui il nome dell'opzione).

### ICMP Type 17 (-PM)

```bash
nmap -PM -sn 10.200.6.0/24
```

Qui Nmap invia una richiesta **Address Mask** (ICMP Type 17) e verifica se riceve una risposta **Address Mask Reply** (ICMP Type 18).


## Host discovery with TCP and UDP

### TCP SYN Ping (-PS)

Invia un pacchetto **TCP SYN** verso il target (con l'idea di iniziare un TCP handshake) senza però completare l'handshake. Se arriva una risposta (SYN-ACK o anche RST), l'host è considerato attivo.


```bash
nmap -PS -sn 10.200.6.0/24
```


Se non si specifica una porta, Nmap bussa alla porta 80.
Si può comunque specificare una o più porte esplicitamente:
```bash
sudo nmap -PS22,80,443 -sn 10.200.6.0/30
```

> Alcuni firewall bloccano questo tipo di richieste. Per capire perchè consideriamo un contesto aziendale, con un firewall piazzato all'ingresso della rete. Normalmente le connessioni che partono dall'interno verso l'esterno (es. un dipendente che visita un sito web) sono permesse, ma le connessioni che arrivano dall'esterno verso l'interno sono bloccate (o fortemente limitate). Quindi quando noi, da fuori, mandiamo un **SYN** verso un server dentro quella rete, quel pacchetto è per definizione un tentativo di aprire una connessione dall'esterno — ed è esattamente il traffico che un firewall di rete perimetrale è configurato per bloccare, a meno che noi non stiamo bussando a una porta specificamente aperta al pubblico.
> {: .prompt-tip }

### TCP ACK Ping (-PA)

```bash
sudo nmap -PA -sn 10.200.6.0/24
```

Invia invece un pacchetto **TCP ACK** — utile perché alcuni firewall stateless bloccano i pacchetti SYN in ingresso (percependoli come tentativi di nuova connessione) ma lasciano passare pacchetti ACK, scambiandoli per il proseguimento di una connessione già esistente.

Anche qui, se non si specifica una porta, viene usata di default la porta 80.

### UDP Ping

```bash
sudo nmap -PU -sn 10.200.6.0/24
```

A differenza del TCP SYN ping, inviare un pacchetto UDP a una porta **aperta** normalmente non produce nessuna risposta. Il trucco sta nel comportamento opposto: se si invia un pacchetto UDP a una porta **chiusa**, ci si aspetta di ricevere un pacchetto **ICMP port-unreachable** — la cui ricezione indica che il sistema target è comunque attivo e raggiungibile, anche se quella specifica porta non è in ascolto.

Se non si specifica una porta, viene usata di default la porta 40125. Questa è una scelta deliberata: 40125 è una porta alta, non standard, con altissima probabilità di essere **chiusa** su qualsiasi sistema target, e pertanto di riconoscere un server attivo.

## Notes

### Perché usare sudo

La maggior parte delle tecniche di host discovery viste sopra (in particolare ARP scan, e la costruzione di pacchetti ICMP/TCP/UDP "grezzi" con flag e tipi specifici) richiede la capacità di creare **raw socket** e di manipolare pacchetti a basso livello, direttamente a livello di Data Link/Network — un'operazione che i sistemi operativi riservano per motivi di sicurezza ai soli utenti con privilegi elevati. Senza `sudo` (o senza essere root), Nmap non ha accesso a queste primitive di rete a basso livello, e deve necessariamente ripiegare su meccanismi meno potenti e meno flessibili basati sulle normali chiamate di sistema disponibili a un utente non privilegiato (in pratica, tentare vere connessioni TCP tramite il socket standard del sistema operativo, invece di costruire pacchetti su misura). Usare `sudo` sblocca quindi l'intero ventaglio di tecniche (ARP, ICMP nelle sue varianti, SYN/ACK/UDP scan personalizzati), oltre a renderle generalmente più veloci e più difficili da individuare rispetto al fallback non privilegiato.

### Che comandi segue Nmap normalmente

Quando non viene specificata esplicitamente alcuna opzione di host discovery, Nmap segue queste regole di default:

- Utente privilegiato, target sulla rete locale (Ethernet) — Nmap usa richieste ARP
- Utente privilegiato, target fuori dalla rete locale — Nmap combina più tecniche insieme: richieste ICMP echo, TCP ACK** verso la porta 80, TCP SYN verso la porta 443, e richieste ICMP timestamp
- Utente non privilegiato, target fuori dalla rete locale** — Nmap ripiega su un 3-way handshake TCP completo, inviando pacchetti SYN verso le porte 80 e 443




## Sum up

| Scan Type | Comando di esempio |
|---|---|
| ARP Scan | `sudo nmap -PR -sn 10.200.6.0/24` |
| ICMP Echo Scan | `sudo nmap -PE -sn 10.200.6.0/24` |
| ICMP Timestamp Scan | `sudo nmap -PP -sn 10.200.6.0/24` |
| ICMP Address Mask Scan | `sudo nmap -PM -sn 10.200.6.0/24` |
| TCP SYN Ping Scan | `sudo nmap -PS22,80,443 -sn 10.200.6.0/30` |
| TCP ACK Ping Scan | `sudo nmap -PA22,80,443 -sn 10.200.6.0/30` |
| UDP Ping Scan | `sudo nmap -PU53,161,162 -sn 10.200.6.0/30` |

Inoltre, aggiungeremo sempre `-sn` se siamo interessati al solo host discovery, senza port scanning. Omettendo `-sn`, Nmap procede di default anche a scansionare le porte degli host trovati attivi.

| Opzione | Scopo |
|---|---|
| `-n` | Nessuna risoluzione DNS |
| `-R` | Risoluzione DNS inversa forzata su tutti gli host |
| `-sn` | Solo host discovery, nessuna scansione porte |
