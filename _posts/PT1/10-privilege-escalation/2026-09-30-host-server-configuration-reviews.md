---
title: Host-Server Configuration Reviews
date: 2026-09-30 16:40:00 +0200
categories: [PT1, 10-privilege-escalation]
tags: [host-server-configuration-reviews, configuration-review, privilege-escalation, post-exploitation, linux, windows]
# description:
---

Durante un penetration test, ottenere una shell su un host è raramente il punto di arrivo: quasi sempre l'account compromesso ha privilegi limitati. La **revisione della configurazione** (configuration review) è il processo sistematico con cui si esamina l'host alla ricerca di errori di configurazione che permettano di elevare quei privilegi.

## Due categorie di escalation dei privilegi

![Le due categorie di escalation dei privilegi](/assets/img/privesc-categorie.svg){: w="700" }
_Escalation basata sulle vulnerabilità vs basata sulla configurazione_

| Categoria | Cosa sfrutta | Esempi |
|---|---|---|
| Basata sulle vulnerabilità | Bug nel software | Vulnerabilità del kernel, buffer overflow nelle applicazioni installate, CVE noti nei servizi in esecuzione |
| Basata sulla configurazione | Errori nella configurazione del sistema | Permessi di file eccessivamente permissivi, configurazioni di servizio non sicure, credenziali in chiaro in posizioni accessibili |

La differenza sta nella domanda di fondo:

- lo **sfruttamento** si chiede: *"cosa c'è di sbagliato in questo software?"*
- la **revisione della configurazione** si chiede: *"cosa è configurato in modo errato su questo sistema?"*

## Quando avviene

La revisione della configurazione avviene in genere nella **fase post-sfruttamento**, dopo aver ottenuto l'accesso iniziale a un host. Una volta ottenuta una shell sul target, l'obiettivo successivo è di solito elevare i privilegi, e la revisione della configurazione è il modo sistematico per trovare come farlo.

## Standard e strumenti

La conformità viene normalmente verificata facendo riferimento a standard come **CIS** (Center for Internet Security benchmarks) o **DISA STIGs**. Esistono strumenti che automatizzano questi controlli:

| Strumento | Scopo |
|---|---|
| Nessus | Difensivo |
| Lynis | Difensivo |
| OpenSCAP | Difensivo |
| CIS-CAT | Difensivo |
| LinPEAS, WinPEAS, PowerUp | Offensivo |

## Categorie di errata configurazione

### Configurazione di utenti e gruppi

Tra gli errori più comuni: utenti assegnati senza necessità a gruppi amministrativi, account di servizio con privilegi eccessivi, account predefiniti del sistema operativo non disabilitati o rimossi, criteri di password deboli o assenti che permettono di indovinare facilmente le credenziali.

Un attaccante che compromette un account già appartenente a un gruppo amministrativo può avere privilegi elevati senza bisogno di ulteriore sfruttamento.

### Permessi di file e directory

I permessi controllano chi può leggere, scrivere o eseguire file specifici. Linux e Windows implementano meccanismi diversi nei dettagli, ma una configurazione di base sicura prevede permessi rigorosi su file sensibili, binari di sistema e directory di configurazione.

Problemi comuni:

- script o binari **world-writable** eseguiti da processi privilegiati
- file sensibili come `/etc/shadow` o chiavi private SSH con permessi di lettura troppo ampi
- impostazione impropria del bit **SUID**

### Configurazioni dei servizi

Servizi in esecuzione con account troppo privilegiati, oppure con binari o file di configurazione modificabili da utenti non privilegiati.

### Attività pianificate e processi cron

Le attività pianificate eseguite con privilegi elevati che richiamano script o binari modificabili da un utente non privilegiato sono un vettore di escalation diretto. Lo script o binario eseguito da un'attività privilegiata deve essere protetto da permessi appropriati, e la configurazione dell'attività non deve essere modificabile da utenti non autorizzati.

### Archiviazione delle credenziali

Amministratori e utenti spesso lasciano credenziali in posizioni accessibili ad altri account.

| Sistema | Posizioni comuni |
|---|---|
| Linux | `~/.bash_history`, variabili d'ambiente, file di configurazione con stringhe di connessione al database o chiavi API, chiavi private SSH con permessi di lettura eccessivi |
| Windows | Gestione credenziali (`cmdkey /list`), credenziali salvate con `runas /savecred`, password in chiaro nel registro, file di distribuzione (`Unattend.xml`, Sysprep), cronologia dei comandi PowerShell, `web.config` |

### Configurazione di rete

Porte in ascolto, interfacce associate e regole del firewall. Rilevante soprattutto per il movimento laterale più che per l'escalation locale, ma utile per capire la postura complessiva dell'host.

## Metodologia per un'enumerazione strutturata

### Fase 1 - Situational Awareness

Prima di tutto va capito dove ci si trova:

- identità e privilegi dell'account corrente, incluse le appartenenze ai gruppi
- sistema operativo, versione e architettura
- nome host e ruolo nella rete (workstation, web server, database server, domain controller)
- se l'host è aggiunto a un dominio, perché ciò cambia i percorsi di escalation disponibili

### Fase 2 - Enumerazione per categoria

| Categoria | Cosa verificare |
|---|---|
| Utenti e gruppi | Tutti gli account e le loro appartenenze; account con accesso admin/root; account predefiniti che dovevano essere disabilitati; criteri password, se accessibili |
| Permessi di file e directory | Linux: binari SUID/SGID, file e directory world-writable, file sensibili con ampi permessi di lettura. Windows: ACL sulle directory nel PATH, sulle directory di installazione dei programmi e sulle chiavi di registro dei servizi |
| Configurazioni dei servizi | Servizi in esecuzione, account con cui girano, scrivibilità di binari e configurazioni. Windows: percorsi di servizio senza virgolette (*unquoted service path*) e descrittori di sicurezza dei servizi |
| Attività pianificate e cron | Job pianificati, quali girano con privilegi elevati, permessi di script e binari referenziati. Linux: crontab di sistema e per utente. Windows: Utilità di pianificazione |
| Credenziali | Cronologia della shell, variabili d'ambiente, file di configurazione, registro, credential store, file di distribuzione |
| Rete | Porte in ascolto, interfacce, regole firewall, servizi esposti inutilmente |

{: .prompt-tip }
> L'archiviazione delle credenziali è spesso il percorso più diretto verso l'escalation dei privilegi: conviene controllarla presto.

### Fase 3 - Prioritizzazione e sfruttamento

Dopo l'enumerazione si ordinano i risultati per facilità e impatto, e si sfruttano per primi quelli più affidabili.

## Un limite importante da conoscere

Gli strumenti automatici (LinPEAS, WinPEAS, PowerUp) producono molto output e segnalano anche falsi positivi: non sostituiscono la comprensione di cosa si sta cercando. Le categorie sopra servono proprio a dare struttura all'enumerazione manuale e a interpretare correttamente i risultati.

## Utilizzo

La revisione della configurazione si applica subito dopo l'accesso iniziale a un host: si parte dalla situational awareness, si enumera categoria per categoria, e si sfruttano le configurazioni errate trovate per elevare i privilegi. Gli stessi standard (CIS, DISA STIGs) e gli stessi strumenti che il difensore usa per verificare la conformità indicano all'attaccante dove cercare.

---

**Modulo:** _da completare_
**Room:** Host-Server Configuration Reviews
**Data:** 30 settembre 2026
