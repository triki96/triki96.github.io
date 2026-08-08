---
title: "NTFS"
date: 2026-08-08 12:00:00 +0200
categories: [Cyber Security 101]
tags: [windows-fundamentals, windows, ntfs, filesystem]
description: "Differenze da FAT e le sue feature principali."
toc: true
---


## Differenza con FAT16 e FAT32

FAT16 e FAT32 sono filesystem più vecchi e semplici, pensati originariamente per dischi floppy e sistemi a singolo utente, poi rimasti in uso per la loro compatibilità universale tra dispositivi diversi (chiavette USB, schede SD). NTFS è invece il filesystem moderno di Windows, progettato per sistemi multiutente e uso serio, e introduce diverse funzionalità che FAT16/FAT32 non hanno affatto.

La differenza non è solo di prestazioni: FAT16/FAT32 non hanno il concetto di proprietario del file, di permessi per utente, di journaling o di crittografia integrata — chiunque abbia accesso fisico o di rete al file può leggerlo/scriverlo, senza distinzioni. Formattare un disco in FAT32 significa perdere completamente la possibilità di usare tutte le feature elencate qui sotto, perché sono immagazzinate fisicamente nella struttura dati del filesystem stesso, non sono una funzione del sistema operativo in astratto.

## I permessi (ACL)

![I sei permessi NTFS](/assets/img/posts/ntfs-permessi-diagram.svg)
_I permessi sono gerarchici: ogni livello include le capacità di quelli sottostanti, tranne Write_

Su NTFS si possono impostare permessi che concedono o negano l'accesso a file e cartelle. I permessi disponibili sono:

- **Full Control** — controllo totale, incluse le autorizzazioni stesse e l'ownership
- **Modify** — modifica, elimina, crea, ma non può cambiare i permessi
- **Read & Execute** — legge ed esegue programmi
- **List folder contents** — solo per cartelle: vede i nomi dei file contenuti
- **Read** — visualizza contenuto e attributi
- **Write** — crea nuovi file/sottocartelle, modifica attributi (indipendente dagli altri, si combina liberamente)

I primi cinque permessi sono gerarchici: ogni livello include automaticamente le capacità di quelli sottostanti (Full Control → Modify → Read & Execute → List folder contents → Read). Write è l'eccezione, un permesso a sé che si combina con gli altri.

A differenza del modello Linux classico (tre livelli fissi: proprietario/gruppo/altri, con tre permessi rwx ciascuno), NTFS usa **ACL (Access Control List)**: si può assegnare uno qualsiasi di questi sei permessi a un numero qualsiasi di utenti o gruppi specifici sullo stesso file — un modello molto più granulare.

Tecnicamente, NTFS mantiene per ogni file un **Security Descriptor**, che include il proprietario, una **DACL** (Discretionary Access Control List, la lista dei permessi vera e propria) e una **SACL** (System Access Control List, usata per l'auditing — quali azioni su quel file vanno registrate nei log di sicurezza).

> **Nota — lo stesso bisogno esiste anche su Linux.** Un utente Linux può appartenere a più gruppi contemporaneamente (un gruppo primario più quanti gruppi secondari servono, es. `groups=triki96,sudo,docker,developers`), ma i permessi classici `rwxrwxrwx` permettono di assegnare accesso a un **solo gruppo per file**. Se serve che più gruppi diversi abbiano permessi diversi sullo stesso file, il modello classico non basta — proprio il problema che le ACL NTFS risolvono nativamente. Su Linux la soluzione è la stessa idea, ma come funzionalità opzionale da attivare (`setfacl`/`getfacl`), non il meccanismo unico di base come su NTFS.
{: .prompt-tip }

## Journal System

![Come funziona il journaling](/assets/img/posts/ntfs-journaling-diagram.svg)
_Prima si scrive nel journal, poi si applicano i dati reali — in caso di crash, il journal permette di ripristinare uno stato coerente_

NTFS è un filesystem journaled: tiene un registro (journal) delle modifiche che sta per fare, **prima** di applicarle effettivamente al disco. Se il sistema si blocca durante una scrittura (blackout, crash), al riavvio il filesystem legge il journal e completa o annulla l'operazione in modo coerente, invece di lasciare dati corrotti a metà.

Il costo di questo meccanismo è scrivere due volte ogni modifica (prima nel journal, poi sui dati reali), un piccolo overhead di prestazioni in cambio di affidabilità molto maggiore — lo stesso compromesso adottato da filesystem Linux journaled come ext4.

> Il journaling è una funzionalità indipendente dai permessi ACL: risolve un problema diverso (integrità dei dati nel tempo, non controllo degli accessi). Un filesystem può avere l'uno senza l'altro — ext3/ext4 su Linux sono journaled ma usano di default il modello Unix classico, non ACL granulari.
{: .prompt-tip }

## ADS (Alternate Data Streams)

![Alternate Data Streams su NTFS](/assets/img/posts/ntfs-ads-diagram.svg)
_Il file appare identico dall'esterno: la dimensione mostrata include solo lo stream principale, non quelli nascosti_

Ogni file su NTFS ha uno stream principale (`$DATA`, il contenuto normale) ma può avere, oltre a quello, ulteriori stream nascosti, ciascuno identificato da un nome. Il file appare identico dall'esterno — stesso nome, e la dimensione mostrata da Esplora Risorse o `dir` include solo lo stream principale, non quelli nascosti.

```batch
:: Creare uno stream alternativo dentro documento.txt
echo dati segreti > documento.txt:segreto.txt

:: Leggerlo (serve specificare esplicitamente il nome dello stream)
more < documento.txt:segreto.txt

:: Nascondere un intero eseguibile dentro un file innocuo
type malware.exe > documento.txt:malware.exe
```

Lo scopo originale non era malevolo: ADS serve principalmente per compatibilità con il vecchio filesystem HFS di Macintosh, e Windows lo usa legittimamente ancora oggi per marcare i file scaricati da internet (lo stream `Zone.Identifier`, dietro l'avviso "Questo file proviene da un altro computer").

**Rilevamento con PowerShell:**
```powershell
# Elenca tutti gli stream di un file
Get-Item documento.txt -Stream *
```

## Encrypted File System (EFS)

EFS è la funzionalità di crittografia integrata in NTFS, che permette di cifrare singoli file o cartelle in modo trasparente per l'utente proprietario: chi ha creato/cifrato il file continua a vederlo e modificarlo normalmente (Windows decifra e cifra automaticamente in background), mentre chiunque altro acceda allo stesso disco (es. rimuovendolo e collegandolo a un altro computer) trova solo dati illeggibili.

Tecnicamente, EFS usa crittografia a chiave pubblica legata all'account utente di Windows: la chiave privata necessaria per decifrare è custodita nel profilo dell'utente (protetta a sua volta dalla password di accesso). Questo significa che il file resta protetto anche se qualcuno ottiene accesso fisico al disco, ma è anche un rischio pratico: se il profilo utente o la chiave vengono persi/danneggiati senza un backup del certificato di recupero, i dati cifrati diventano irrecuperabili anche per l'amministratore di sistema.

---
**Modulo:** Windows Fundamentals
**Room:** 
**Data:** 8 agosto 2026
