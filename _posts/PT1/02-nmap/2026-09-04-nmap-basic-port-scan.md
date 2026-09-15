---
title: Nmap Basic Port Scan
date: 2026-09-04 00:00:00 +0200
categories: [PT1, 2-nmap]
tags: [nmap, tcp, udp, port-scan, recon]
---

## Nmap Port Scan

Prima di entrare nei dettagli delle tecniche di scansione, è utile capire come Nmap classifica lo stato di una porta. Non si tratta solo di "aperta" o "chiusa": in presenza di firewall e comportamenti di rete variabili, Nmap distingue sei stati possibili.

| Stato | Descrizione |
|---|---|
| **Open** | Un servizio è attivamente in ascolto sulla porta. Esempio: Nmap invia un pacchetto SYN e riceve un `SYN/ACK`: c'è un servizio in ascolto. In una SYN scan, Nmap chiude subito con un `RST` senza completare l'handshake. |
| **Closed** | La porta è raggiungibile, ma nessun servizio risponde. Esempio: La porta è raggiungibile, ma nessun processo ci ascolta sopra. Il kernel risponde con un `RST` immediato. La differenza fondamentale rispetto a *filtered* è che qui l'host ha risposto. |
| **Filtered** | Nmap non riesce a determinare lo stato: un firewall blocca i pacchetti . Esempio: Nmap non riceve nessuna risposta entro il timeout, oppure riceve un ICMP *unreachable*. Non può concludere nulla: sospetta che un firewall stia bloccando i pacchetti in ingresso o le risposte in uscita.|
| **Unfiltered** | La porta è raggiungibile, ma non si riesce a determinare se aperta o chiusa (solo `-sA`). Compare solo con una ACK scan (`-sA`), che serve a mappare le regole di un firewall, non a scoprire servizi. Se Nmap riceve un `RST` in risposta a un `ACK`, sa che il pacchetto è arrivato a destinazione — ma non può dire se dietro c'è un servizio attivo. Per quello serve una SYN scan separata. |
| **Open\|Filtered** | Nmap non distingue tra porta aperta e porta filtrata (tipico UDP). Tipico delle scansioni UDP e di alcune TCP particolari (FIN, NULL, Xmas). Il problema: se una porta UDP è aperta, il servizio spesso non risponde — comportamento identico a quello di un firewall che droppa silenziosamente. Nmap non ha modo di distinguere i due casi. Per sciogliere il dubbio serve un probe applicativo mirato.|
| **Closed\|Filtered** | Nmap non distingue tra porta chiusa e filtrata (tipico `-sI`). Stato raro, quasi esclusivo della IP ID idle scan (`-sI`). La tecnica usa un host "zombie" per scansionare il target in modo anonimo, osservando l'incremento dell'`IP ID` header dello zombie. Se il pattern di incremento è ambiguo, Nmap non riesce a distinguere tra un `RST` di ritorno (porta chiusa) e un pacchetto filtrato prima di arrivare. |



## TCP Flags

L'header TCP contiene (fra i tanti) un campo di 6 bit (i flag "core") dove ogni bit può essere acceso (`1`) o spento (`0`) per segnalare qualcosa sullo stato o sull'intento del segmento. Possono essere combinati nello stesso pacchetto.

**SYN — Synchronize**: Serve ad avviare una connessione e sincronizzare i sequence number tra i due host. È il primo passo del three-way handshake. Se il browser vuole aprire una connessione a un web server sulla porta 443: manda `SYN=1` con un sequence number casuale (es. `seq=1000`). Il server risponde `SYN/ACK` (`seq=5000, ack=1001`). Il client chiude con `ACK` (`ack=5001`). Connessione stabilita.

**ACK — Acknowledgment**: Conferma la ricezione di dati o di un altro pacchetto. Una volta stabilita la connessione, quasi ogni pacchetto ha `ACK=1`. In una ACK scan (`-sA`), Nmap usa questo flag da solo — senza dati — per testare le regole di un firewall, verificando se il pacchetto arriva a destinazione.

**PSH — Push**: Dice allo stack TCP ricevente di non bufferizzare i dati ricevuti, ma di passarli **subito** all'applicazione. Normalmente il TCP accumula byte in un buffer di ricezione e li consegna all'applicazione quando il buffer raggiunge una soglia, oppure quando l'applicazione chiede esplicitamente i dati con una `read()`. Questo è efficiente per trasferimenti bulk, ma pessimo per traffico interattivo. Ad esempio: durante una sessione SSH, ogni tasto premuto genera un pacchetto con `PSH=1, ACK=1`: il singolo byte deve arrivare immediatamente a `sshd`, non rimanere in coda nel buffer. `PSH` agisce solo sull'ultimo tratto del percorso — tra lo stack TCP e l'applicazione ricevente — non modifica nulla nella rete.

**URG — Urgent**: Segnala che una parte dei dati nel pacchetto deve essere processata prioritariamente, indipendentemente dall'ordine normale del flusso. Va di pari passo con il campo *Urgent Pointer* dell'header, che indica dove finiscono i dati urgenti. Raro nei sistemi moderni, lo si vede principalmente nella Xmas scan (`-sX`) di Nmap, dove `URG`, `PSH` e `FIN` vengono accesi tutti insieme per testare come un sistema reagisce a una combinazione di flag anomala.

**RST — Reset**: Interrompe bruscamente una connessione, senza la chiusura ordinata a quattro vie di FIN. Viene usato quando una porta è chiusa, quando si verifica un errore, o quando è necessario abortire immediatamente la sessione. Nella logica di Nmap, ricevere un `RST` in risposta a un `SYN` significa **porta closed**.

**FIN — Finish**: Segnala la volontà di chiudere la connessione in modo ordinato. A differenza di `RST`, fa parte di una chiusura a quattro vie: `FIN → ACK → FIN → ACK`, dove entrambe le parti confermano di aver finito di trasmettere. La FIN scan (`-sF`) di Nmap sfrutta questo flag senza un handshake precedente: su un sistema conforme alla RFC 793, una porta chiusa risponde con `RST`, mentre una porta aperta ignora il pacchetto — da qui lo stato `open|filtered`.



## TCP Connect Scan

```bash
nmap -sT <TARGET>
```

La TCP Connect scan completa l'intero three-way handshake: `SYN → SYN/ACK → ACK`. Una volta stabilita la connessione, Nmap la chiude subito con `RST/ACK`.

```
Client          Server
  │── SYN ──────▶│
  │◀── SYN/ACK ──│   porta open
  │── ACK ───────▶│
  │── RST/ACK ───▶│   Nmap chiude subito
```

Poiché la connessione viene completata, questa tecnica è più probabile che venga loggata dai sistemi di monitoraggio del target. Il vantaggio è che non richiede privilegi di root: se non sei un utente privilegiato, la TCP Connect scan è l'unica opzione disponibile per scoprire porte TCP aperte.



## TCP SYN Scan

```bash
sudo nmap -sS <TARGET>
```

La SYN scan è la modalità di default di Nmap e richiede privilegi di root (o sudo). Non completa il three-way handshake: invia un `SYN`, aspetta la risposta, poi abbatte la connessione con un `RST` senza mai inviare l'`ACK` finale.

```
Client          Server
  │── SYN ──────▶│
  │◀── SYN/ACK ──│   porta open → Nmap risponde RST
  │── RST ───────▶│

  │── SYN ──────▶│
  │◀── RST ───────│   porta closed
```

Poiché la connessione non viene mai stabilita completamente, la scansione è meno probabile che venga loggata rispetto alla Connect scan — molti sistemi registrano solo le connessioni completate.

> **Nota:** La SYN scan è spesso chiamata *half-open scan* o *stealth scan* proprio perché non completa l'handshake.
{: .prompt-info }



## UDP Scan

```bash
sudo nmap -sU <TARGET>
```

UDP è un protocollo connectionless: non esiste handshake, e non si può garantire che un servizio in ascolto risponda ai nostri pacchetti. La logica di Nmap per determinare lo stato di una porta UDP si basa sulla risposta (o sull'assenza di risposta):

- **Nessuna risposta** → `open|filtered` (il servizio potrebbe non rispondere, oppure un firewall droppa il pacchetto)
- **Risposta ICMP "port unreachable" (type 3, code 3)** → `closed` (l'host conferma che nessun servizio ascolta su quella porta)
- **Risposta UDP applicativa** → `open`

> Le scansioni UDP sono significativamente più lente delle TCP: molte porte non rispondono, e Nmap deve attendere il timeout per ciascuna. Limita il range con `-p` o usa `--top-ports` per le porte UDP più comuni.
{: .prompt-warning }



## Fine-tuning

### Selezione porte

| Opzione | Effetto |
|---|---|
| `-p 22,80,443` | Scansiona solo le porte elencate |
| `-p 1-1023` | Scansiona un range specifico |
| `-p-` | Scansiona tutte le 65535 porte |
| `-F` | Le 100 porte più comuni |
| `--top-ports <n>` | Le *n* porte più comuni |
| `-r` | Scansiona le porte in ordine consecutivo (non randomizzato) |

### Timing (-T)

Nmap offre sei profili di timing predefiniti, da `-T0` (paranoid) a `-T5` (insane). Ogni profilo regola internamente timeout, retry, delay tra probe e soglie di parallelismo.

| Profilo | Nome | Uso tipico |
|---|---|---|
| `-T0` | Paranoid | Evasione IDS, estremamente lento |
| `-T1` | Sneaky | Evasione IDS |
| `-T2` | Polite | Riduce il carico sulla rete |
| `-T3` | Normal | Default |
| `-T4` | Aggressive | Reti veloci e affidabili |
| `-T5` | Insane | Velocità massima, possibili risultati inaccurati |

### Rate e parallelismo

Due leve ortogonali per controllare la velocità dello scan:

**`--min-rate` / `--max-rate`** — controllano il *throughput nel tempo*, ovvero quanti pacchetti al secondo escono sul filo. È una misura puramente temporale, indipendente da quante porte o host stai scansionando.

```bash
--max-rate 10    # non più di 10 pacchetti/secondo
--min-rate 15    # non meno di 15 pacchetti/secondo
```

**`--min-parallelism` / `--max-parallelism`** — controllano quante probe sono "in volo" contemporaneamente, ovvero in attesa di risposta nello stesso istante.

```bash
--min-parallelism 100   # almeno 100 probe in parallelo
```

La distinzione è importante: immagina di scansionare 1000 porte con una latenza di rete di 200ms per probe.

- **Parallelismo = 1** (sequenziale): Nmap manda una probe, aspetta 200ms, poi manda la successiva → `1000 × 200ms = 200 secondi`
- **Parallelismo = 100**: Nmap tiene 100 probe in volo contemporaneamente → `10 "ondate" × 200ms = 2 secondi`


## Sum Up

### Tipi di scan

| Tipo | Comando | Privilegi richiesti |
|---|---|---|
| TCP Connect Scan | `nmap -sT <TARGET>` | No |
| TCP SYN Scan | `sudo nmap -sS <TARGET>` | Sì |
| UDP Scan | `sudo nmap -sU <TARGET>` | Sì |

### Opzioni di fine-tuning

| Opzione | Effetto |
|---|---|
| `-p-` | Tutte le porte |
| `-p 1-1023` | Porte da 1 a 1023 |
| `-F` | 100 porte più comuni |
| `-r` | Ordine consecutivo |
| `-T<0-5>` | Profilo timing (0 = lentissimo, 5 = velocissimo) |
| `--max-rate 50` | Rate ≤ 50 pacchetti/sec |
| `--min-rate 15` | Rate ≥ 15 pacchetti/sec |
| `--min-parallelism 100` | Almeno 100 probe in parallelo |
