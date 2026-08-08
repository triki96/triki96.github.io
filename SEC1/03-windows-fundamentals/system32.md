---
title: "The System32 Folder"
date: 2026-08-08 13:00:00 +0200
categories: [Cyber Security 101]
tags: [windows-fundamentals, windows]
description: "Cos'è la cartella System32, perché è così importante, e le variabili di sistema come %windir%."
toc: true
---

## Cos'è questa cartella

`C:\Windows\System32` è la cartella che contiene i file principali del sistema operativo Windows — eseguibili critici, librerie (DLL), driver, file di configurazione — tutto ciò che serve a Windows per funzionare, avviarsi e far girare qualsiasi programma.

Un dettaglio che confonde quasi tutti: nonostante il "32" nel nome, su un sistema Windows a 64 bit moderno `System32` contiene le librerie a **64 bit**, non a 32 bit come il nome suggerirebbe. Il nome è rimasto per pura compatibilità: quando Windows è passato dai 32 ai 64 bit, moltissimi sviluppatori avevano scritto quel percorso letteralmente nel codice dei propri programmi, invece di chiederlo al sistema operativo nel modo corretto. Rinominare la cartella avrebbe rotto tutti quei programmi già in circolazione, quindi Microsoft ha scelto di mantenere il nome anche per i file a 64 bit, sacrificando la coerenza logica pur di non rompere la retrocompatibilità — un principio che Windows segue da decenni, spesso preferendolo all'eleganza tecnica.

## Perché è importante

`System32` è il cuore operativo di Windows: è la cartella dove vivono i componenti senza i quali il sistema operativo non può funzionare, avviarsi o far girare qualsiasi programma. Ogni volta che si apre un'applicazione, che Windows disegna una finestra, che gestisce la rete o la stampante, sta usando componenti che vivono proprio lì dentro — non è una cartella tra le tante, è una delle fondamenta su cui poggia tutto il resto.

Le conseguenze pratiche di questa importanza:

- Se manca o si danneggia un file critico al suo interno, Windows può smettere di avviarsi — è il motivo dietro il classico "scherzo" (da non fare mai) di dire a qualcuno inesperto di eliminare quella cartella
- È protetta da permessi molto restrittivi: un utente normale non può modificarla liberamente, serve accesso da amministratore
- È un bersaglio prezioso per un attaccante: chi riesce a scrivere o modificare qualcosa lì dentro ottiene un controllo molto profondo sul sistema, perché quei file vengono eseguiti con la massima fiducia dal sistema operativo stesso

> Se il sistema operativo fosse un corpo umano, System32 sarebbe qualcosa come gli organi vitali — si può vivere senza un braccio (un programma qualsiasi), ma non senza cuore o polmoni.
{: .prompt-tip }

## Variabili di sistema

Le variabili di sistema (o variabili d'ambiente) sono valori con nome che il sistema operativo tiene sempre disponibili, e che programmi e script possono usare al posto di scrivere percorsi o valori fissi. Invece di dover sapere l'esatto percorso di installazione di Windows, un programma può chiedere "dov'è la cartella di Windows?" e ottenere sempre la risposta giusta, qualunque sia la configurazione della macchina.

**`%windir%`** contiene il percorso della cartella di installazione di Windows — quasi sempre `C:\Windows`, ma non è garantito: alcune installazioni personalizzate potrebbero usare un'unità o un percorso diverso.

```batch
echo %windir%
C:\Windows
```

Le percentuali `%...%` sono la sintassi con cui il Prompt dei comandi (`cmd.exe`) riconosce e sostituisce una variabile con il suo valore reale.

**Perché è utile invece di scrivere `C:\Windows` direttamente:**

```batch
:: Fragile: funziona solo se Windows è installato sull'unità C
cd C:\Windows\System32

:: Robusto: funziona sempre, indipendentemente da dove è installato Windows
cd %windir%\System32
```

---
**Modulo:** Windows Fundamentals
**Room:** 
**Data:** 8 agosto 2026
