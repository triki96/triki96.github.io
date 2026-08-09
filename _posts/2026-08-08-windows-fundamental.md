---
title: "Windows Fundamentals"
date: 2026-08-08 17:00:00 +0200
categories: [Cyber Security 101]
tags: [windows-fundamentals, windows]
description: "Windows Update, Windows Security (Virus & Threat Protection, Firewall, App & browser control, Device security), BitLocker/TPM e VSS."
toc: true
---

## Windows Update

Windows Update è il servizio integrato in Windows che scarica e installa automaticamente aggiornamenti per il sistema operativo — patch di sicurezza, correzioni di bug, nuove funzionalità, e aggiornamenti ai driver.

![Windows Update](/assets/img/posts/windows-update-diagram.svg)
_Gli aggiornamenti cumulativi e di sicurezza vengono scaricati e installati automaticamente_

### Perché è rilevante per la sicurezza

Windows Update è probabilmente il meccanismo di difesa più importante e sottovalutato: molte delle vulnerabilità che abbiamo incontrato studiando (es. l'exploit RCE su PHP 8.1.0-dev della room "Agent T") esistono e vengono sfruttate proprio perché un sistema non è stato aggiornato in tempo. In un contesto di pentesting, verificare se una macchina target ha aggiornamenti mancanti è uno dei primi passi di enumerazione, perché spesso rivela esattamente quali CVE note potrebbero funzionare contro quel sistema.

## Windows Security

![Windows Security](/assets/img/posts/windows-security-diagram.svg)
_Le quattro sezioni principali del pannello Windows Security_

### Virus & Threat Protection

È la sezione che gestisce **Microsoft Defender Antivirus**, l'antivirus integrato in Windows: esegue scansioni (rapide, complete, personalizzate) alla ricerca di malware, offre protezione in tempo reale che controlla i file mentre vengono aperti o scaricati, e mostra la cronologia delle minacce rilevate e messe in quarantena. Da qui si gestiscono anche le esclusioni (file o cartelle che l'antivirus non deve scansionare) e gli aggiornamenti delle definizioni dei virus, che avvengono tipicamente insieme a Windows Update.

### Firewall & network protection

Firewall & network protection è la sezione di Windows Security che gestisce il firewall integrato di Windows — il componente che controlla quale traffico di rete può entrare e uscire dal computer, decidendo cosa bloccare e cosa permettere.

![Firewall & network protection](/assets/img/posts/firewall-network-diagram.svg)
_I tre profili di rete, ciascuno con il proprio livello di protezione_

**Il concetto centrale: tre profili di rete distinti.** Windows non applica un'unica configurazione firewall fissa — usa tre profili separati, ciascuno con le proprie regole, e passa automaticamente dall'uno all'altro in base al tipo di rete a cui il computer è connesso in quel momento.

| Profilo | Quando si applica | Livello di protezione tipico |
|---|---|---|
| **Domain** | Quando il computer è connesso a una rete aziendale con un controller di dominio (Active Directory) | Meno restrittivo — la rete aziendale è considerata già gestita e fidata dall'amministratore IT |
| **Private** | Quando l'utente indica esplicitamente che una rete è "privata" e fidata (es. la rete di casa) | Livello intermedio — permette più condivisioni (file, stampanti) tra dispositivi sulla stessa rete |
| **Public** | Rete considerata sconosciuta o non fidata (es. Wi-Fi di un bar, aeroporto, hotel) | Il più restrittivo — blocca la scopribilità del dispositivo e la maggior parte delle connessioni in entrata |

**Come Windows sceglie il profilo.** Quando ci si connette a una rete nuova (via Wi-Fi o cavo), Windows chiede — o decide automaticamente in base al contesto (es. se rileva un dominio Active Directory) — quale livello di fiducia assegnarle. Da quel momento, ogni volta che ci si riconnette a quella stessa rete, viene applicato automaticamente il profilo corrispondente.

> In fase di pentesting/hardening, un errore comune da controllare è una rete classificata erroneamente come Private quando in realtà è Public (es. un utente che clicca distrattamente "Sì, rendi visibile questo PC" su un Wi-Fi pubblico) — questo espone il sistema a un livello di rischio molto più alto di quanto l'utente creda.
{: .prompt-warning }

### App & browser control

Questa sezione gestisce le protezioni contro app ed exploit malevoli, principalmente attraverso **SmartScreen** — il sistema che controlla la reputazione di app, file e siti web prima di eseguirli/aprirli, avvisando se qualcosa è sconosciuto o segnalato come pericoloso.

Le aree principali:
- **Reputation-based protection** — SmartScreen per app/file scaricati da internet e per Microsoft Edge, blocca o avvisa su contenuti riconosciuti come malevoli o non attendibili
- **Isolated browsing** (Application Guard, dove disponibile) — apre siti non fidati in un ambiente isolato virtualizzato, separato dal resto del sistema
- **Exploit protection** — mitigazioni a basso livello contro tecniche comuni di exploitation (DEP, ASLR, protezioni sullo stack) — configurabili per singola app o a livello di sistema

### Device security

Questa sezione riguarda le protezioni basate su hardware, non solo software — il livello più profondo di difesa, integrato direttamente nel chip del dispositivo.

Le aree principali:
- **Core isolation** — usa la virtualizzazione per isolare processi critici del sistema operativo dal resto della macchina (Memory Integrity, nello specifico, impedisce a codice non firmato/malevolo di inserirsi nei processi core di Windows)
- **Security processor** (TPM — Trusted Platform Module) — un chip dedicato che gestisce chiavi crittografiche, usato ad esempio per la crittografia del disco (BitLocker) e per verificare l'integrità dell'avvio del sistema
- **Secure boot** — verifica che, all'avvio, venga caricato solo software firmato e fidato, impedendo che malware si inserisca prima ancora che Windows parta

> App & browser control protegge principalmente a livello software/applicativo (cosa si esegue, cosa si apre), mentre Device security scende a livello hardware/firmware (cosa può girare nel processore stesso, come viene verificato l'avvio) — sono due strati di difesa complementari, dal più superficiale al più profondo, coerenti con l'approccio a più livelli già visto con i tre profili del firewall.
{: .prompt-tip }

## BitLocker e TPM

**BitLocker** è la funzionalità di Windows che cifra interamente un'unità disco, proteggendo i dati anche se il disco viene rimosso fisicamente e collegato a un altro computer — a differenza di EFS (già visto parlando di NTFS), che cifra singoli file/cartelle, BitLocker cifra l'intero volume.

![BitLocker e TPM](/assets/img/posts/bitlocker-tpm-diagram.svg)
_Il TPM custodisce la chiave, con l'aggiunta opzionale di un PIN o di una chiave USB_

Il **TPM (Trusted Platform Module)** è il chip dedicato che custodisce la chiave crittografica usata da BitLocker, verificando anche che il processo di avvio non sia stato manomesso prima di rilasciare la chiave e sbloccare il disco.

Oltre al TPM, BitLocker può bloccare il normale processo di avvio finché l'utente non fornisce un **PIN** personale o inserisce un dispositivo rimovibile che contiene una **chiave di avvio** — un livello di protezione aggiuntivo oltre alla sola verifica del TPM, utile a impedire l'avvio del sistema anche a chi ha accesso fisico al computer ma non conosce il PIN o non possiede la chiave USB.

## VSS (Volume Shadow Copy Service)

VSS crea "istantanee" (shadow copies) di un disco in un momento preciso, permettendo di recuperare versioni precedenti dei file anche mentre il sistema è in uso — è alla base di funzioni come "Ripristina versioni precedenti" e i punti di ripristino di Windows.

![Volume Shadow Copy Service](/assets/img/posts/vss-diagram.svg)
_Le shadow copy salvano solo i blocchi modificati dopo la creazione dello snapshot (copy-on-write)_

```batch
vssadmin list shadows
```

È rilevante per la sicurezza per un motivo semplice: gli attaccanti (soprattutto il ransomware) cercano di cancellare le shadow copies prima di cifrare i file, per impedire che la vittima recuperi tutto semplicemente ripristinando una versione precedente.

```batch
vssadmin delete shadows /all /quiet
```

Vedere un comando come questo nei log di un sistema è un forte segnale d'allarme di un attacco ransomware in corso o già avvenuto.

---
**Modulo:** Windows Fundamentals
**Room:**
**Data:** 8 agosto 2026
