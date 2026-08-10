---
title: "Windows Command Line"
date: 2026-08-10 12:00:00 +0200
categories: [Cyber Security 101]
tags: [command-line, windows-command-line]
description: ""
toc: true
---

## Introduzione

La **shell** di Windows è l'interfaccia testuale con cui si impartiscono comandi al sistema operativo, senza passare dall'interfaccia grafica — lo stesso concetto già visto parlando di `cmd.exe` come strumento raggiungibile dalla scheda Tools di `msconfig`. Invece di cliccare tra menu e finestre, si digitano comandi diretti, spesso molto più veloci da eseguire e da automatizzare rispetto ai passaggi equivalenti via mouse.

## Caratteristiche

### Lower resource usage

Un'interfaccia testuale richiede molte meno risorse di sistema (CPU, memoria, elaborazione grafica) rispetto a un'interfaccia grafica completa: non ci sono finestre da disegnare, animazioni da renderizzare, icone da caricare. Questo la rende particolarmente adatta a server, macchine virtuali con risorse limitate, o connessioni remote su reti lente, dove ogni byte e ogni ciclo di CPU contano.

### Automation

I comandi da shell possono essere combinati in **script** (file `.bat` o `.ps1`) per automatizzare sequenze di operazioni ripetitive, esattamente come già visto con Task Scheduler e gli script eseguiti automaticamente a orari programmati. Un'operazione che richiederebbe decine di click nell'interfaccia grafica può essere eseguita con un singolo script, in modo identico e ripetibile ogni volta.

### Remote management

La shell permette di amministrare un computer **da remoto**, senza bisogno di un'interfaccia grafica trasmessa in rete (molto più pesante da un punto di vista di banda). Strumenti come SSH o WinRM (Windows Remote Management) permettono di aprire una sessione shell su una macchina remota e impartire comandi esattamente come se ci si trovasse davanti fisicamente — la stessa modalità con cui, durante una CTF, ci si collega a una macchina target dopo aver ottenuto accesso.

## Comandi

### Base

**`ver`** — mostra la versione del sistema operativo Windows in esecuzione.
```batch
ver
Microsoft Windows [Versione 10.0.19045.3086]
```

**`systeminfo`** — mostra informazioni dettagliate sulla configurazione del sistema: versione OS, data di installazione, produttore, memoria fisica installata, hotfix applicati, e molto altro — un output molto più esteso di `ver`, concettualmente simile a quanto visto con `msinfo32`, ma da riga di comando.
```batch
systeminfo
```

### Per la rete

**`ipconfig`** — mostra la configurazione di rete delle interfacce del computer (indirizzo IP, subnet mask, gateway).
```batch
ipconfig
ipconfig /all    :: dettagli estesi: MAC address, server DNS, data di scadenza del lease DHCP
```

**`ping`** — verifica la raggiungibilità di un host inviando pacchetti ICMP Echo e misurando il tempo di risposta.
```batch
ping 8.8.8.8
```

**`tracert`** — mostra il percorso (i router intermedi) attraversato dai pacchetti per raggiungere una destinazione, incrementando progressivamente il TTL a ogni tentativo.
```batch
tracert google.com
```

**`nslookup`** — interroga un server DNS per risolvere un nome a dominio nel suo indirizzo IP corrispondente (o viceversa), lo stesso tipo di risoluzione DNS già visto in dettaglio parlando di come funziona il DNS.
```batch
nslookup google.com
```

**`netstat`** — mostra le connessioni di rete attive e le porte in ascolto sul sistema.
```batch
netstat -abon
```
> `-a` mostra tutte le connessioni e le porte in ascolto, `-b` mostra l'eseguibile responsabile di ogni connessione, `-o` mostra il PID (Process ID) del processo associato, `-n` mostra indirizzi e porte in forma numerica invece di risolvere i nomi. Combinati insieme (`-abon`), danno una vista completa di chi sta comunicando con chi sulla rete e con quale processo — molto utile in fase di enumerazione o di analisi di un host sospetto, sullo stesso principio già visto con Resource Monitor.
{: .prompt-tip }

### Per la gestione file

| Comando | Cosa fa |
|---|---|
| `dir` | Elenca il contenuto della directory corrente |
| `cd` | Cambia directory corrente (`cd ..` per risalire di un livello) |
| `mkdir` (o `md`) | Crea una nuova directory |
| `rmdir` (o `rd`) | Rimuove una directory (`rmdir /s` per rimuoverla insieme al suo contenuto) |
| `copy` | Copia uno o più file |
| `move` | Sposta o rinomina un file o una directory |
| `del` (o `erase`) | Elimina uno o più file |
| `ren` | Rinomina un file o una directory |
| `type` | Mostra il contenuto di un file di testo |

```batch
mkdir progetto
cd progetto
copy C:\file.txt .
ren file.txt documento.txt
del documento.txt
cd ..
rmdir progetto
```

### Per la gestione dei processi

**`tasklist`** — elenca i processi attualmente in esecuzione sul sistema, con nome, PID, sessione e utilizzo di memoria.
```batch
tasklist
tasklist /FI "IMAGENAME eq chrome.exe"    :: filtra per un processo specifico
```
> Il flag `/FI` (filter) permette di restringere l'elenco secondo un criterio — utile quando si cercano istanze specifiche di un processo invece di scorrere manualmente un elenco lungo.
{: .prompt-tip }

**`taskkill`** — termina uno o più processi in esecuzione, specificati per PID o per nome immagine.
```batch
taskkill /PID 4532
```

## Utilizzo

Questi comandi sono il vocabolario di base per muoversi ed enumerare rapidamente un sistema Windows, sia in fase di amministrazione legittima sia durante un assessment: i comandi di rete (`ipconfig`, `netstat`) per orientarsi sulla posizione e le connessioni della macchina, quelli di gestione processi (`tasklist`, `taskkill`) per capire cosa sta girando ed eventualmente interromperlo, quelli di gestione file per muoversi nel filesystem e trasferire strumenti — la stessa base di comandi vista negli esempi di enumerazione post-accesso già discussi nel percorso.
