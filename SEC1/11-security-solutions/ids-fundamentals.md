---
title: "IDS Fundamentals"
date: 2026-08-20 09:30:00 +0200
categories: [Cyber Security 101]
tags: [security-solutions, ids]
#description: "..."
toc: true
---

## Cos'è un IDS

Se un attaccante riesce a bypassare con successo un firewall e svolge attività malevole dentro la rete, deve esserci qualcosa in grado di rilevarlo tempestivamente — questa soluzione è nota come **Intrusion Detection System (IDS)**.

Un IDS è concettualmente diverso da un firewall: mentre il firewall blocca attivamente il traffico in base a regole, un IDS è una **soluzione di monitoraggio passiva** — analizza il traffico per individuare possibili attività malevole/pattern, incidenti anomali e violazioni di policy, generando un **alert** per ogni evento sospetto. È fondamentale sapere che un IDS **non può prevenire** la minaccia dopo averla rilevata: si limita a notificare gli amministratori, che devono poi decidere autonomamente la risposta appropriata.

## Tipi di IDS

Un IDS si classifica principalmente in base a due criteri: dove viene posizionato e come rileva le minacce.

### Dove viene posizionato

**Network Intrusion Detection System (NIDS)**
Viene posizionato in un punto strategico della rete per monitorare il traffico da e verso tutti i dispositivi collegati — analizza il traffico che attraversa l'intera subnet, offrendo una vista centralizzata delle potenziali minacce su tutta la rete.

**Host-based Intrusion Detection System (HIDS)**
Gira su un singolo host o dispositivo — monitora solo i pacchetti in entrata e in uscita da quel dispositivo, offrendo una visione locale molto più dettagliata, ma richiedendo una gestione per-host (un HIDS separato su ogni macchina da proteggere).

![NIDS vs HIDS — dove vengono posizionati](/assets/img/posts/nids-vs-hids-deployment.svg)
_Il NIDS osserva tutto il traffico da un unico punto della rete, l'HIDS vive su ogni singolo host_

### Come rileva le minacce

**Signature-based IDS**
Rileva le minacce confrontando il traffico di rete con un database di pattern di attacco conosciuti (le "firme"). Queste firme vengono conservate dall'IDS nei propri database, così che se lo stesso attacco si ripete in futuro venga rilevato dalla sua firma e segnalato agli amministratori. Più solido è il database delle firme, più efficacemente l'IDS rileva le minacce conosciute — ma un IDS signature-based **non è in grado di rilevare attacchi zero-day**, dato che non hanno firme pregresse salvate nel database.

**Anomaly-based IDS**
Prima apprende il comportamento di base (baseline) della rete o del sistema — la normale attività — e poi rileva qualsiasi deviazione da quella baseline. È efficace nell'identificare attacchi nuovi/mai visti prima, ma può generare più falsi positivi, dato che anche attività legittime ma insolite possono somigliare a un'anomalia.

**Hybrid IDS**
Combina le tecniche di detection signature-based e anomaly-based per sfruttare i vantaggi di entrambe. Se una minaccia nota ha già una firma nel database, l'IDS ibrido usa il meccanismo di detection signature-based; se invece incontra una minaccia nuova, può ricorrere al meccanismo anomaly-based.

## IDS Example: Snort

**Snort** è una delle soluzioni IDS open-source più diffuse, sviluppata nel 1998, capace di detection sia signature-based che anomaly-based per identificare minacce conosciute. Queste vengono definite nei file di regole (rule files) dello strumento — Snort include diversi file di regole preinstallati, contenenti una varietà di pattern di attacco già noti. È comunque possibile configurare Snort per rilevare tipi specifici di traffico non coperti dai file di regole di default, creando regole personalizzate in base alle proprie esigenze — così come disabilitare regole predefinite che non risultano rilevanti per il proprio sistema/rete.

**Le modalità di Snort:**

- **Packet Sniffer Mode** — cattura e mostra passivamente il traffico di rete, senza nessuna analisi. Usata dai team di rete per il troubleshooting e il monitoraggio delle performance.
- **Packet Logging Mode** — registra il traffico di rete in tempo reale e gli alert in file PCAP (il formato standard di cattura pacchetti) per una revisione successiva. Utile per supportare indagini forensi, fornendo log di traffico per l'analisi delle cause profonde.
- **Network Intrusion Detection System (NIDS) Mode** — la modalità principale di Snort: monitora attivamente il traffico, lo confronta con le firme di attacco, e genera alert.

Ogni regola Snort ha una struttura composta da diversi campi:

- **Action** — specifica quale azione intraprendere quando la regola scatta (es. `alert`)
- **Protocol** — il protocollo a cui la regola fa riferimento (es. `tcp`)
- **Source/Destination IP & Port** — determina l'origine e la destinazione del traffico
- **Rule metadata** — informazioni aggiuntive definite tra parentesi, come il messaggio da mostrare nell'alert (`msg`) e l'identificativo univoco della regola (`sid`)

![Anatomia di una regola Snort](/assets/img/posts/snort-rule-anatomy.svg)
_Una regola Snort si divide in header (action, protocol, IP/porta, direzione) e corpo con opzioni/metadata_


## Esempi

###  Esempio 1

Creiamo una regola Snort che rilevi i ping (traffico ICMP) verso la nostra macchina.

Esploriamo la configurazione di Snort:

```bash
ls /etc/snort
rules/  snort.lua  lua/  builtin_rules/  so_rules/  preproc_rules/
```

- **`rules/`** — la cartella dove vivono i file di regole, incluso quello dove scriveremo la nostra regola personalizzata
- **`snort.lua`** — il file di configurazione principale (in Snort 3 la configurazione è in Lua invece che nel vecchio `snort.conf`)

Scriviamo una regola personalizzata:

```bash
sudo nano /etc/snort/rules/local.rules
```

Dentro l'editor, aggiungiamo questa riga:

```
alert icmp any any -> $HOME_NET any (msg:"ICMP Ping rilevato"; sid:1000001; rev:1;)
```

Scomponendo la regola:
- **`alert`** — action: genera un alert
- **`icmp`** — protocol: traffico ICMP (quello usato da `ping`)
- **`any any`** — source IP/port: da qualsiasi IP, qualsiasi porta
- **`->`** — direction: traffico diretto verso...
- **`$HOME_NET any`** — destination IP/port: verso la nostra rete/host, qualsiasi porta
- **`msg:"ICMP Ping rilevato"`** — il messaggio mostrato quando la regola scatta
- **`sid:1000001`** — l'identificativo univoco della regola (i numeri sotto 1.000.000 sono riservati alle regole ufficiali Snort, quindi per le regole personalizzate si parte da 1.000.000 in su)
- **`rev:1`** — numero di revisione della regola

Salviamo e usciamo (`Ctrl+O`, Invio, `Ctrl+X`).

Avviamo Snort in modalità NIDS, in ascolto sull'interfaccia locale

```bash
sudo snort -q -l /var/log/snort -i lo -A alert_fast -c /etc/snort/snort.lua
```

- **`-q`** — modalità silenziosa (quiet), non stampa il banner iniziale di Snort
- **`-l /var/log/snort`** — specifica la cartella dove salvare i log generati
- **`-i lo`** — ascolta sull'interfaccia **loopback** (`lo`), cioè il traffico locale della macchina stessa (127.0.0.1) — utile per testare senza bisogno di traffico proveniente da un'altra macchina
- **`-A alert_fast`** — formato di alert "veloce", una riga sintetica per ogni evento rilevato, stampata direttamente a schermo
- **`-c /etc/snort/snort.lua`** — il file di configurazione, che include anche il riferimento al file `local.rules` appena modificato

A questo punto Snort resta in ascolto, senza stampare nulla finché non intercetta traffico che corrisponde a una regola.

Generiamo il traffico che dovrebbe far scattare la regola

```bash
ping 127.0.0.1
```

Non appena il ping parte, nel terminale dove Snort è in esecuzione vediamo:

```
08/19-14:32:07.183921 [**] [1:1000001:1] ICMP Ping rilevato [**] [Priority: 0] {ICMP} 127.0.0.1 -> 127.0.0.1
08/19-14:32:08.184532 [**] [1:1000001:1] ICMP Ping rilevato [**] [Priority: 0] {ICMP} 127.0.0.1 -> 127.0.0.1
```

Un alert per ogni pacchetto ICMP rilevato — conferma che la regola personalizzata funziona correttamente. Questo è il flusso standard per verificare qualsiasi nuova regola: scriverla, avviare Snort in ascolto, generare il traffico che dovrebbe attivarla, e osservare se l'alert compare davvero.

### Esempio 2

Analizziamo un file PCAP già catturato. A differenza dell'esempio precedente, qui analizziamo traffico già catturato in precedenza e salvato in un file `.pcap` — lo scenario tipico di un'indagine forense, dove il traffico da esaminare non è più "in corso" ma va ricostruito a posteriori.

```bash
ubuntu@tryhackme:~$ sudo snort -q -l /var/log/snort -r Task.pcap -A alert_fast -c /etc/snort/snort.lua
```

La differenza chiave rispetto al comando precedente è il flag:

- **`-r Task.pcap`** — sostituisce `-i lo`: invece di ascoltare un'interfaccia di rete in tempo reale, Snort **legge (read)** il traffico dal file `Task.pcap` già presente sul disco, e lo confronta con le stesse regole caricate da `/etc/snort/snort.lua` (inclusa quella personalizzata creata in `local.rules`)

Tutti gli altri flag mantengono lo stesso significato visto sopra: `-q` per l'output silenzioso, `-l /var/log/snort` per salvare i log, `-A alert_fast` per il formato di alert sintetico, `-c` per il file di configurazione.

In questo caso, Snort elabora l'intero file PCAP in un colpo solo e stampa a schermo un alert per ogni pacchetto contenuto nel file che corrisponde a una regola attiva — utile per rispondere a domande investigative tipo "quali tentativi di attacco sono avvenuti in questa cattura di traffico?" senza dover rigenerare o rieseguire l'attacco stesso.

Come già visto in precedenza, si può combinare l'output con `grep` per concentrarsi su un servizio particolare, ad esempio per isolare solo gli alert relativi a tentativi di connessione SSH (porta 22):

```bash
sudo snort -q -l /var/log/snort -r Task.pcap -A alert_fast -c /etc/snort/snort.lua | grep ":22"
```
