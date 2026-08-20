---
title: "FlareVM"
date: 2026-08-20 10:00:00 +0200
categories: [Cyber Security 101]
tags: [flarevm-arsenal-of-tools, flarevm, malware-analysis]
description: "Gli strumenti principali di FlareVM per l'analisi malware (Procmon, Process Explorer, HxD, Wireshark, CFF Explorer, PEStudio, FLOSS) e un esempio pratico di analisi su cobaltstrike.exe."
toc: true
---

## Intro

FlareVM è una distribuzione Windows per l'analisi malware e il reverse engineering, sviluppata dal team FLARE (FireEye/Mandiant). Non è una VM già pronta da scaricare: è uno script di provisioning che installa decine di tool su una VM Windows pulita e isolata dalla rete.

Questo post riprende gli strumenti "base" presentati nella room TryHackMe *FlareVM: Arsenal of Tools*, e li mostra in azione su un caso reale della stanza: l'analisi del file `cobaltstrike.exe`.

## Gli strumenti

| Tool | A cosa serve |
|---|---|
| **Procmon** (Process Monitor) | Registra in tempo reale tutto quello che succede sul sistema: file aperti, chiavi di registro modificate, connessioni di rete. Utile per capire cosa fa davvero un programma mentre gira. |
| **Process Explorer** | Mostra i processi come un "albero genealogico" (chi ha lanciato chi), quali DLL ogni processo ha caricato e da dove, e le sue connessioni di rete attive. |
| **HxD** | Editor esadecimale: apre un file mostrando i byte grezzi. Permette di ispezionare o modificare un file senza eseguirlo. |
| **Wireshark** | Cattura e analizza il traffico di rete pacchetto per pacchetto. Serve a vedere con chi comunica un programma e come. |
| **CFF Explorer** | Editor per file eseguibili Windows (PE). Genera hash per verificare l'integrità di un file e ispezionarne la struttura interna. |
| **PEStudio** | Analisi statica: esamina un eseguibile senza lanciarlo, guardando stringhe sospette, funzioni importate e metadati. |
| **FLOSS** | Estrae automaticamente le stringhe da un file, comprese quelle offuscate/criptate che un semplice "strings" non troverebbe. |

Procmon e Process Explorer guardano il comportamento **a runtime** (mentre il programma gira), HxD / CFF Explorer / PEStudio / FLOSS fanno analisi **statica** (senza eseguire nulla), Wireshark guarda la **rete**.

## Esempio pratico: analisi di cobaltstrike.exe

*(esempio basato sulla room TryHackMe "FlareVM: Arsenal of Tools")*

Sul desktop della VM troviamo un file sospetto: `cobaltstrike.exe`. L'obiettivo è capire cosa fa, usando più strumenti insieme per confermare ogni informazione — mai fidarsi di un solo tool.

### Passo 1 — Process Explorer: chi lo ha lanciato, con chi parla

Eseguiamo il file e apriamo Process Explorer. Vediamo subito la relazione padre-figlio: `explorer.exe` è il padre, `cobaltstrike.exe` è il figlio (PID 4756). Con tasto destro → **Properties** → tab **TCP/IP** scopriamo che il processo comunica con l'IP **47.120.46.210** sulla porta **81** — un indirizzo esterno sconosciuto, su una porta non standard.

![Process Explorer: albero processi e tab TCP/IP](/assets/img/posts/flarevm-process-explorer.svg)
_Il tab TCP/IP mostra la connessione in uscita verso l'IP sospetto_

### Passo 2 — Procmon: verifichiamo con un secondo strumento

Chiudiamo il processo e apriamo **Procmon**. Il log mostra *tutta* l'attività del sistema, quindi filtriamo per nome processo (`cobalt`). Rilanciando il file, vediamo un evento **TCP Connect** verso lo stesso indirizzo, **47.120.46.210:81**. Stesso risultato di Process Explorer, ma confermato da uno strumento diverso.

![Procmon: filtro e log dell'evento TCP Connect](/assets/img/posts/flarevm-procmon-filter.svg)
_Filtrando per nome processo, l'evento TCP Connect conferma quanto visto in Process Explorer_

### Passo 3 — Wireshark: guardiamo il traffico reale

Apriamo la cattura di rete e filtriamo con `ip.addr == 47.120.46.210`. Il traffico è **TLS cifrato**: coerente con un malware che comunica con un server di comando e controllo (C2) in modo criptato, per non farsi leggere facilmente.

![Wireshark: traffico TLS filtrato per indirizzo IP](/assets/img/posts/flarevm-wireshark-tls.svg)
_Il contenuto è cifrato, ma la destinazione del traffico resta visibile_

### Passo 4 — HxD: controlliamo l'header del file

Apriamo `cobaltstrike.exe` con HxD e guardiamo i primi byte. Un eseguibile Windows legittimo inizia sempre con i "magic bytes" **4D 5A** (`MZ`), la firma dell'header DOS. Il file li ha: è quindi un vero eseguibile Windows, non un file rinominato o corrotto.

![HxD: header MZ del file](/assets/img/posts/flarevm-hxd-header.svg)
_I byte 4D 5A confermano che si tratta di un vero eseguibile Windows (formato PE)_

### Passo 5 — FLOSS: proviamo a estrarre le stringhe

Lanciamo FLOSS sul file per cercare stringhe interessanti (URL, comandi, chiavi). Il risultato: 189 stringhe statiche, ma **0 stringhe decodificate**. È un segnale in sé: il malware nasconde le sue stringhe con una tecnica di offuscamento che FLOSS non riesce a smontare — serve un altro strumento (es. un debugger) per andare più a fondo.

![FLOSS: stringhe statiche trovate vs stringhe decodificate](/assets/img/posts/flarevm-floss-output.svg)
_Zero stringhe decodificate è di per sé un indizio di offuscamento avanzato_

## Utilizzo

Il punto centrale di questo esempio non è "quale tool usare", ma che un'analisi seria non si fida mai di un solo strumento: ogni tool conferma (o mette in dubbio) quello che ha detto l'altro. Process Explorer e Procmon confermano a vicenda l'IP e la porta di destinazione, Wireshark conferma che il traffico è reale ed è cifrato, HxD conferma che il file è un vero eseguibile Windows, e FLOSS rivela che il malware nasconde le sue stringhe. Alla fine, l'analista ottiene un risultato verificato da più fonti: un IP e una porta sospetti, pronti da passare al team di incident response per bloccarli sul firewall e cercarli nei log di rete — il tipo di lavoro difensivo per cui FlareVM è pensata.
