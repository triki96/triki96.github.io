---
title: "System Configuration e gli strumenti collegati"
date: 2026-08-08 15:00:00 +0200
categories: [Cyber Security 101, windows-fundamentals]
tags: [windows]
description: "System Configuration (msconfig) e gli strumenti raggiungibili dalla scheda Tools: About Windows, System Properties, UAC settings, Computer Management."
toc: true
---

## System Configuration

### Cos'è

System Configuration (`msconfig`) è uno strumento diagnostico integrato in Windows che permette di controllare cosa si avvia insieme al sistema operativo e in che modalità Windows deve partire — pensato principalmente per il troubleshooting di problemi di avvio.

### Come aprirlo

```batch
:: Dal prompt dei comandi, dalla finestra Esegui (Win+R), o dalla barra di ricerca di Windows
msconfig
```

### Le schede principali

![Le schede principali di System Configuration](/assets/img/posts/msconfig-diagram.svg)
_Struttura schematica delle schede di msconfig: General, Boot, Services, Startup, Tools_

**General (Generale)**
Permette di scegliere tra tre modalità di avvio:
- **Normal startup** — avvia tutti i driver e servizi normalmente
- **Diagnostic startup** — avvia solo i driver e servizi essenziali, utile per isolare la causa di un problema
- **Selective startup** — permette di scegliere manualmente quali servizi/elementi di avvio caricare

**Boot (Avvio)**
Mostra i sistemi operativi installati (se più di uno) e permette di configurare opzioni avanzate di avvio, come il **Safe Boot** (avvio in modalità provvisoria) — utile quando un problema impedisce l'avvio normale del sistema.

**Services (Servizi)**
Elenca tutti i servizi Windows configurati, con la possibilità di disabilitarli temporaneamente per isolare quale servizio sta causando un problema. Include una casella molto utile: **"Hide all Microsoft services"** — nasconde i servizi ufficiali Microsoft per concentrarsi solo su quelli installati da software di terze parti, spesso la fonte più probabile di malfunzionamenti o, in ottica sicurezza, di comportamenti sospetti.

**Startup (Avvio)**
Su versioni moderne di Windows, questa scheda rimanda direttamente al Task Manager, dove si trova l'elenco completo dei programmi configurati per avviarsi automaticamente al login. Molti malware si garantiscono la sopravvivenza ai riavvii registrandosi come voce di avvio automatico o come servizio: controllare le schede **Services** e **Startup** è un modo rapido, anche se non esaustivo, per individuare programmi sospetti che si avviano senza autorizzazione esplicita dell'utente — la casella "Hide all Microsoft services" aiuta a filtrare via il rumore dei servizi legittimi.

**Tools (Strumenti)**
Un elenco di collegamenti rapidi ad altri strumenti diagnostici e amministrativi di Windows, evitando di doverli cercare separatamente. Le voci principali sono trattate nelle sezioni seguenti.



## La sottosezione Tools

![La scheda Tools di System Configuration](/assets/img/posts/msconfig-tools-diagram.svg)
_La scheda Tools_

### About Windows

**About Windows** (`winver`) è la finestra più semplice tra quelle raggiungibili da `msconfig > Tools`: mostra la versione esatta di Windows installata (edizione, build, numero di versione) e le informazioni di licenza/copyright di base.

![About Windows](/assets/img/posts/about-windows-diagram.svg)
_Informazioni di base su edizione e versione di Windows installata_


Conoscere la build esatta di Windows in uso è un primo passo utile in fase di enumerazione: la versione specifica permette di verificare rapidamente se il sistema è vulnerabile a CVE note per quella build, esattamente come avevamo visto a proposito di Shodan che collega automaticamente le versioni software rilevate alle vulnerabilità documentate.

### System properties

**System properties** (`sysdm.cpl`) raccoglie impostazioni di identificazione del computer e configurazioni di basso livello legate a prestazioni, ripristino del sistema, profili utente e variabili d'ambiente.

![Struttura di System Properties e della scheda Advanced](/assets/img/posts/advanced-system-settings-diagram.svg)
_La finestra System Properties ha quattro schede principali; Advanced raggruppa tre pulsanti più le variabili d'ambiente_

La finestra ha quattro schede principali:

- **Computer Name** — nome del computer, gruppo di lavoro/dominio, e il pulsante per modificarli
- **Hardware** — accesso a Device Manager e impostazioni di installazione dispositivi
- **Advanced** — raggruppa pulsanti che aprono finestre separate per configurazioni più profonde (vedi sotto)
- **Remote** — impostazioni per Assistenza remota e Desktop remoto

#### Il tab Advanced in dettaglio

A differenza delle altre schede, Advanced non mostra impostazioni dirette modificabili sul posto: è un elenco di pulsanti, ciascuno dei quali apre una finestra dedicata a un'area specifica.

**Performance → Settings...**
Bilancia l'aspetto grafico di Windows rispetto alle prestazioni, e permette di configurare la **memoria virtuale** (file di paging) — dove e quanto spazio su disco Windows può usare come estensione della RAM.

**User Profiles → Settings...**
Mostra l'elenco dei profili utente presenti sul sistema, con dimensione occupata su disco e tipo (locale o roaming). Permette di eliminare profili non più necessari o copiarli.

**Startup and Recovery → Settings...**
Configura cosa succede all'avvio (se ci sono più sistemi operativi installati) e cosa fare in caso di errore di sistema grave (crash/BSOD): se generare un file di dump, di che tipo, e dove salvarlo.

**Environment Variables...**
Apre la finestra dedicata alle variabili d'ambiente (`%windir%`, `%PATH%`, ecc.), divise in **User variables** (specifiche dell'utente loggato) e **System variables** (valide per tutti gli utenti del sistema).

> A differenza delle altre schede, Advanced raggruppa configurazioni che toccano il comportamento profondo del sistema operativo. Modificarle senza sapere cosa si sta facendo può causare instabilità.
{: .prompt-warning }

Il dettaglio più rilevante in ottica forense è **Startup and Recovery**: sapere se un sistema è configurato per generare un dump della memoria completo su crash è importante, perché quei file possono contenere dati sensibili rimasti in RAM al momento dell'errore, potenzialmente anche credenziali in chiaro. Le **Environment Variables** restano rilevanti anche per tecniche di path hijacking, se una cartella scrivibile compare nel `PATH` di sistema prima di percorsi legittimi come `System32`.

### Change UAC settings

**User Account Control (UAC)** è il meccanismo di sicurezza di Windows che chiede conferma esplicita ogni volta che un'azione richiede privilegi amministrativi — la finestra che oscura lo schermo chiedendo "Vuoi consentire a questa app di apportare modifiche al dispositivo?".

![User Account Control Settings](/assets/img/posts/uac-settings-diagram.svg)
_Il cursore a quattro livelli per regolare la sensibilità delle notifiche UAC_

Anche con un account amministratore, i programmi girano di default con privilegi da **utente standard**. Solo quando un'azione richiede davvero privilegi elevati, Windows lo chiede esplicitamente — invece di dare sempre pieni poteri a tutto ciò che si esegue, come succedeva nelle vecchie versioni di Windows.

#### I quattro livelli

| Livello | Comportamento |
|---|---|
| Non notificare mai | UAC disattivato — nessuna richiesta di conferma (sconsigliato) |
| Notifica solo per le app (senza secure desktop) | Avvisa per le app, non per le modifiche fatte direttamente dall'utente |
| Notifica solo per le app (default) | Come sopra, ma oscura lo schermo (secure desktop) durante la richiesta |
| Notifica sempre | Avvisa anche quando è l'utente a modificare le impostazioni di Windows |

Lo **secure desktop** impedisce a un malware di simulare automaticamente un click su "Sì" o di sovrapporre finestre ingannevoli sopra il prompt reale.

UAC è al centro di una categoria di tecniche di **privilege escalation** nota come **UAC bypass**: non è pensato da Microsoft come un vero confine di sicurezza, ed esistono tecniche documentate (es. il bypass tramite `fodhelper.exe` o la manipolazione del registro dietro `eventvwr.exe`) che sfruttano binari con auto-elevazione concessa per ottenere privilegi elevati senza mai mostrare il prompt di conferma. Un livello UAC abbassato o disattivato, se osservato durante un'analisi, è un forte indicatore di compromissione.

### Computer management

**Computer Management** (`compmgmt.msc`) raggruppa in un'unica console molti degli strumenti amministrativi di Windows — una "plancia di comando" con tre sezioni principali: **System Tools**, **Storage**, **Services and Applications**.

![Computer Management](/assets/img/posts/computer-management-diagram.svg)
_Le tre aree principali: System Tools, Storage, Services and Applications_

#### System Tools

**Task Scheduler** — crea e gestisce attività eseguite automaticamente a orari specifici (l'equivalente Windows di `cron`). **Task Scheduler Library** mostra tutte le attività pianificate, incluso il loro trigger (ricorrente, es. "ogni giorno alle 10:00", oppure singolo, es. "alle 14:50 del 15/6/2025").

**Event Viewer** — mostra gli eventi avvenuti sul computer, un audit trail usato per diagnosticare problemi e investigare azioni eseguite sul sistema. Ha tre pannelli: elenco dei provider di log a sinistra, panoramica del provider selezionato al centro, azioni a destra. I log standard sono sotto **Windows Logs**.

**Shared Folders** — elenco delle cartelle condivise a cui altri possono connettersi, incluse le condivisioni di default (`C$`, `ADMIN$`). **Sessions** mostra gli utenti connessi, **Open Files** i file a cui stanno accedendo.

**Local Users and Groups** — è `lusrmgr.msc`, già trattato in un post dedicato, qui integrato come sotto-sezione.

**Performance** — contiene **Performance Monitor** (`perfmon`), per visualizzare dati sulle prestazioni in tempo reale o da log, utile per il troubleshooting locale o remoto.

**Device Manager** — visualizza e configura l'hardware collegato, incluso disabilitare dispositivi specifici.

#### Storage

**Disk Management** — operazioni avanzate sullo storage: creare una nuova unità, estendere o ridurre una partizione, assegnare o cambiare una lettera di unità.

#### Services and Applications

**Services** — mostra tutti i servizi con il loro stato. Ogni servizio ha un nome visualizzato diverso dal nome tecnico del servizio, oltre al percorso dell'eseguibile. Il campo **Startup type** determina come si avvia: **Automatic** (a ogni avvio), **Manual** (solo su attivazione esplicita), **Disabled** (mai).

**WMI Control** — configura il servizio **WMI (Windows Management Instrumentation)**, che permette a linguaggi di scripting (VBScript, PowerShell) di gestire computer Windows localmente o da remoto. Lo strumento a riga di comando dedicato, **WMIC**, è deprecato da Windows 10 21H1 in poi — PowerShell lo ha sostituito.


Durante un'indagine o un assessment su una macchina Windows, Computer Management è un punto di partenza efficiente perché centralizza gran parte dell'enumerazione: **Local Users and Groups** per capire chi ha accesso e con che privilegi, **Event Viewer** per capire cosa è successo sul sistema, **Services** e **Task Scheduler** come potenziali vettori di persistenza o privilege escalation, **Shared Folders** come possibili punti di accesso di rete non ovvi.

### System Information

**System Information** (`msinfo32`) è lo strumento che dà una fotografia completa e dettagliata della configurazione hardware e software del computer — un unico posto dove trovare informazioni che altrimenti richiederebbero di consultare più pannelli diversi (hardware installato, driver, componenti di sistema, programmi in esecuzione all'avvio, e molto altro).

![System Information](/assets/img/posts/system-information-diagram.svg)
_Un riepilogo tecnico completo della configurazione hardware e software_

Ad alto livello, `msinfo32` risponde alla domanda "cosa c'è esattamente su questo computer?" — un riepilogo tecnico completo pensato principalmente per il supporto tecnico e la diagnostica: quando si contatta l'assistenza per un problema, spesso viene chiesto di esportare proprio questo report, perché contiene in un colpo solo praticamente tutti i dettagli utili a inquadrare la configurazione della macchina.

In fase di enumerazione durante un assessment, `msinfo32` è un modo rapido per farsi un quadro generale del sistema senza dover lanciare comandi separati per ogni singola informazione — utile soprattutto nelle primissime fasi di ricognizione su una macchina appena raggiunta, per capire con cosa si ha a che fare prima di approfondire con strumenti più specifici.

### Resource Monitor

**Resource Monitor** (`resmon`) è lo strumento che mostra in tempo reale come il sistema sta usando le proprie risorse — CPU, memoria, disco e rete — con il dettaglio di **quale processo specifico** sta usando cosa, in un momento preciso.

![Resource Monitor](/assets/img/posts/resource-monitor-diagram.svg)
_Uso di CPU, memoria, disco e rete, con il dettaglio per processo_

Ad alto livello, Resource Monitor risponde alla domanda "cosa sta facendo il computer proprio adesso, e chi lo sta facendo?" — è più dettagliato e mirato del Task Manager: non si ferma a mostrare quanto CPU o RAM sta usando un processo in generale, ma scende nel dettaglio di cosa sta facendo concretamente, ad esempio quali file sta leggendo/scrivendo su disco, o a quali indirizzi di rete sta parlando in quel momento.

Le schede **Disk** e **Network** sono particolarmente utili in un'ottica investigativa: permettono di vedere in tempo reale quale processo sta scrivendo su un file specifico, o quale processo sta comunicando con un IP esterno sospetto — esattamente il tipo di correlazione fatta durante l'esercizio di analisi SOC visto in precedenza, ma osservata dal vivo sull'host invece che a posteriori nei log. È uno strumento utile anche per individuare rapidamente un processo anomalo che sta generando traffico di rete inatteso, un segnale concreto di possibile compromissione o esfiltrazione in corso.

### Command Prompt

Anche il **Prompt dei comandi** (`cmd.exe`) è raggiungibile direttamente dalla scheda Tools di `msconfig`, insieme a tutti gli altri strumenti visti finora — un accesso rapido alla shell testuale di Windows senza doverla cercare separatamente.

![Command Prompt](/assets/img/posts/command-prompt-diagram.svg)
_La shell testuale di Windows, raggiungibile anche da msconfig > Tools_

#### Comandi essenziali

**`whoami`** — mostra l'utente con cui si è collegati (equivalente Windows del comando Linux omonimo).
```batch
whoami
dominio\utente
```

**`hostname`** — mostra il nome del computer.
```batch
hostname
DESKTOP-ABC123
```

**`ipconfig`** — mostra la configurazione di rete (indirizzo IP, subnet mask, gateway) delle interfacce di rete del computer.
```batch
ipconfig
ipconfig /all    :: dettagli estesi, inclusi MAC address e server DNS
```

**`netstat`** — mostra le connessioni di rete attive e le porte in ascolto sul sistema.
```batch
netstat -an       :: tutte le connessioni, con indirizzi/porte numerici invece che nomi risolti
```

Questi quattro comandi sono spesso i primi lanciati in fase di enumerazione su una macchina Windows appena raggiunta: `whoami` e `hostname` per orientarsi rapidamente su chi si è e dove ci si trova, `ipconfig` per capire la posizione di rete della macchina, `netstat` per vedere quali connessioni sono già attive — inclusa l'eventuale presenza di connessioni sospette verso l'esterno, lo stesso tipo di indizio cercato con Resource Monitor ma da riga di comando.

### Registry Editor

Il Registry Editor (Registro di sistema) è la "memoria centrale" di Windows: un unico grande database dove il sistema tiene salvate praticamente tutte le impostazioni — di Windows stesso, dei programmi installati, e delle preferenze di ogni utente.

![Registry Editor](/assets/img/posts/registry-editor-diagram.svg)
_La struttura gerarchica del registro, con i cinque hive principali_

#### Cosa contiene, in sostanza
* Le informazioni su ogni utente del computer
* Quali programmi sono installati e come funzionano
* Come è configurato l'hardware collegato
* Impostazioni di aspetto, comportamento, rete — praticamente di tutto

Pensa a come, quando cambi un'impostazione nel Pannello di controllo, installi un programma, o personalizzi qualcosa nell'interfaccia, quella modifica deve essere ricordata da qualche parte, anche dopo aver spento e riacceso il computer. Il registro è esattamente quel "qualche parte": ogni volta che Windows si avvia o che un programma parte, va a consultare questo database per sapere come deve comportarsi.

Il Registry Editor è lo strumento con cui puoi guardare dentro questo database e, se necessario, modificarlo direttamente — utile per risolvere problemi che non sono raggiungibili tramite le normali impostazioni grafiche di Windows. Ma è anche un'area delicata: dato che tutto Windows dipende da questi valori, una modifica sbagliata può causare malfunzionamenti seri, fino a impedire l'avvio del sistema.

<!-- Il registro contiene informazioni che Windows consulta continuamente durante il funzionamento, tra cui:
- Profili di ciascun utente
- Applicazioni installate sul computer e i tipi di documento che ciascuna può creare
- Impostazioni dei fogli proprietà per cartelle e icone delle applicazioni
- Quale hardware è presente sul sistema
- Le porte in uso

Ad alto livello, il registro è la "memoria di configurazione" di Windows: praticamente ogni impostazione, da quelle che l'utente modifica tramite l'interfaccia grafica a quelle interne usate dai singoli programmi, finisce per essere salvata in questa struttura centralizzata — è il motivo per cui molti degli strumenti visti finora (UAC, avvio dei servizi, profili utente) sono in realtà solo interfacce grafiche più comode per leggere e modificare valori che risiedono tutti nello stesso database sottostante.

Il registro è rilevante sia per la persistenza sia per l'analisi forense: molte tecniche di persistenza malware (incluse quelle di UAC bypass viste in precedenza, come l'abuso di `eventvwr.exe`) agiscono modificando chiavi specifiche del registro, ed è uno dei primi posti da controllare durante un'indagine su un host compromesso. Va anche maneggiato con estrema cautela: una modifica sbagliata al registro può rendere il sistema instabile o impedirne l'avvio, ragione per cui è buona pratica farne sempre un backup prima di modificarlo manualmente. -->

---
**Data:** 8 agosto 2026
