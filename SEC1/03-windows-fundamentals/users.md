---
title: "Users"
date: 2026-08-08 15:00:00 +0200
categories: [Cyber Security 101]
tags: [windows-fundamentals, windows, users, sam]
description: "lusrmgr.msc, tipi di account locali su Windows e RID fissi (Administrator/Guest)."
toc: true
---

## Cos'è lusrmgr.msc

`lusrmgr.msc` è la console di gestione **Utenti e gruppi locali** di Windows — uno strumento grafico integrato che permette di visualizzare, creare, modificare e disabilitare account utente e gruppi locali sulla macchina, senza dover passare dalla riga di comando.

## Come aprirlo

```batch
:: Dal prompt dei comandi, dalla finestra Esegui (Win+R), o dalla barra di ricerca di Windows
lusrmgr.msc
```

Digitando semplicemente `lusrmgr.msc` in una qualsiasi di queste posizioni si apre direttamente la console — non serve eseguirlo come amministratore per la sola visualizzazione, ma è necessario per apportare modifiche.

La finestra è divisa in due sezioni principali, visibili nel pannello a sinistra:

- **Users** — elenco di tutti gli account utente locali della macchina, inclusi account di sistema normalmente nascosti nell'interfaccia standard di Windows (es. l'account `Administrator` integrato, spesso disabilitato di default ma presente)
- **Groups** — elenco di tutti i gruppi locali (es. `Administrators`, `Users`, `Remote Desktop Users`), con i rispettivi membri


## Utilizzo

`lusrmgr.msc` è uno strumento comune sia in fase di amministrazione legittima di un sistema Windows sia in fase di enumerazione durante un assessment: verificare rapidamente quali account esistono, quali sono disabilitati, e chi appartiene al gruppo `Administrators` è uno dei primi passi per capire la superficie di attacco locale di una macchina — un account con privilegi amministrativi mal configurato o con password debole è spesso la via più diretta per la privilege escalation.


## Extra

Un account utente su Windows è l'identità con cui un sistema autentica una persona (o un servizio) e determina cosa può fare. A livello locale, ogni account è identificato non solo dal nome ma da un **SID** (Security Identifier) univoco, la cui parte finale — il **RID** (Relative Identifier) — è fissa per gli account integrati, indipendentemente dal nome visualizzato.

- Due account built-in esistono su ogni installazione, con RID fisso:
  - **Administrator** — RID `500`, controllo completo, disabilitato di default dalla configurazione moderna
  - **Guest** — RID `501`, accesso minimo/anonimo, disabilitato di default
- Gli account creati dall'utente partono da RID `1000` e salgono in sequenza.
- Rinominare "Administrator" cambia solo il nome visualizzato: il RID `500` resta lo stesso, quindi resta identificabile enumerando gli account per RID invece che per nome.
- L'appartenenza a gruppi (es. `Administrators`, `Users`, `Remote Desktop Users`) determina i privilegi effettivi, non il nome dell'account in sé.

### Esempio pratico

```batch
:: Elenca tutti gli account locali
net user

:: Dettagli su un account specifico (gruppi, scadenza password, stato)
net user Administrator
```

```powershell
# Enumera utenti locali con relativo SID (il RID è l'ultimo blocco del SID)
Get-LocalUser | Select-Object Name, SID, Enabled
```

L'ultimo numero del SID (dopo l'ultimo trattino) è il RID: un account con SID che termina in `-500` è l'Administrator integrato, qualunque sia il nome mostrato.

Disabilitare Administrator e Guest riduce la superficie d'attacco, ma non elimina il rischio: l'account Administrator integrato **può essere riabilitato** (`net user Administrator /active:yes`) da chiunque ottenga privilegi sufficienti, ed è comunque sempre presente e identificabile tramite il suo RID fisso, anche da disabilitato o rinominato. Il controllo reale non è "l'account non esiste", ma "chi ha i privilegi per riabilitarlo o modificarlo" — la protezione dipende dal resto del modello di permessi, non dal solo stato disabled/enabled.

## Utilizzo

Da prospettiva **offensiva**, l'enumerazione degli account locali (`net user`, `Get-LocalUser`, o via RID con strumenti come PowerView) è uno dei primi passi di ricognizione su un host Windows: identificare chi è amministratore, se Guest è attivo, quali account hanno password che non scadono mai — sono tutti indizi per pianificare un attacco a dizionario o un percorso di privilege escalation, incluso il targeting diretto del RID 500 anche se l'account è stato rinominato.

Da prospettiva **difensiva**, il controllo periodico degli account locali (stato enabled/disabled, appartenenza a `Administrators`, ultimo accesso) fa parte dell'hardening di base: un account Administrator riattivato inaspettatamente, o un nuovo account con RID alto creato senza autorizzazione, sono segnali che vale la pena far loggare e monitorare attivamente, non solo controllare a mano una tantum.