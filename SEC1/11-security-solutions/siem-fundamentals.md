---
title: "SIEM Fundamentals"
date: 2026-08-20 09:00:00 +0200
categories: [Cyber Security 101]
tags: [security-solutions, siem]
description: "..."
toc: true
---

## Contesto

Ogni componente della rete (computer, server, firewall, sito web) genera log — registrazioni di cosa succede. Questi log si dividono in due categorie logiche:

- **Log "host-centric"** — eventi legati a un singolo dispositivo, come i Windows Event Log, Sysmon, Osquery — esempi: un utente che accede a un file, un utente che tenta di autenticarsi, un'attività di esecuzione di un processo
- **Log di rete** — generati quando gli host comunicano tra loro o accedono a Internet per visitare un sito web

Immaginiamo una rete con più computer, un server dati, un sito web — ogni componente può avere una o più fonti di log che generano log diversi. Il problema è pratico: gli ambienti IT moderni generano milioni di eventi di log al giorno — tentativi di autenticazione, connessioni di rete, accessi a file, errori applicativi. La vera sfida è: come identificare i 5 eventi malevoli nascosti tra 5 milioni di eventi legittimi?

Se ogni log source resta isolato (guardato separatamente, senza nessun collegamento con gli altri), un analista dovrebbe:

- Controllare manualmente decine di sistemi diversi, uno per uno
- Non avere modo di collegare eventi correlati che avvengono su macchine diverse (es. un login fallito su un server e, pochi secondi dopo, un login riuscito su un altro — segno di un attacco in corso, ma invisibile se si guardano i due log separatamente)
- Perdere completamente la scala del problema quando i volumi di log crescono

![Log isolati vs visibilità centralizzata](/assets/img/posts/isolated-vs-siem.svg)
_Log isolati vs visibilità centralizzata_

Qui entra in gioco il SIEM. **SIEM** sta per **Security Information and Event Management** — è uno strumento che raccoglie dati da vari endpoint/dispositivi di rete in tutta la rete, li archivia in un posto centralizzato, e ci esegue una correlazione sopra. Il SIEM viene usato per fornire correlazione sui dati raccolti per rilevare le minacce. Una volta rilevata una minaccia, o superata una certa soglia, viene generato un alert — che permette agli analisti di intraprendere azioni adeguate basate sull'indagine. Il SIEM ha un ruolo importante nel dominio della cybersecurity e aiuta a rilevare e proteggere dalle minacce più recenti in modo tempestivo.

## Le funzionalità principali di un SIEM

I sistemi SIEM sono il pilastro di un moderno Security Operations Center (SOC) — forniscono:

- **Centralizzazione** — portare i log da fonti diverse in un unico posto
- **Normalizzazione** — convertire i log in un formato standard per facilitare la ricerca
- **Correlazione** — collegare automaticamente eventi correlati provenienti da fonti diverse per rilevare attacchi complessi
- **Alerting** — notificare gli analisti di attività sospette in base a regole predefinite
- **Dashboard e Reportistica** — visualizzare i trend di sicurezza e generare report

Un esempio di regola di correlazione tipica, per rendere concreto il concetto: SE più login falliti dallo stesso IP sorgente (più di 10, entro 5 minuti) E un login riuscito dallo stesso IP sorgente, ALLORA genera un alert "Attacco brute force - possibile account compromesso". Questo pattern classico — l'attaccante prova molte password (fallendo) e poi ci riesce — sarebbe invisibile guardando un singolo log isolato, ma diventa evidente correlando gli eventi insieme.

### Windows — Event Viewer

Windows registra un'enorme quantità di informazioni su login, accesso a file e sistema, modifiche alla configurazione, tracciamento dei processi — un evento è un'attività osservabile che avviene sul sistema, e il servizio di log di Windows può registrare cinque tipi diversi di record: Error, Warning, Information, Success Audit, e Failure Audit.

Questi log possono essere salvati localmente, oppure **Windows Event Forwarding (WEF)** può inviarli a un sistema Windows remoto dedicato. Microsoft fornisce accesso ai dati tramite l'applicazione integrata **Event Viewer** e tramite cmdlet PowerShell che permettono query anche in remoto attraverso la rete. Da lì, i log possono anche essere centralizzati verso una soluzione SIEM di terze parti per l'aggregazione e l'analisi.

Sono gli stessi tre log principali (Application, System, Security) visti nel documento sui log — è esattamente da qui che il SIEM li va a prendere.

### Linux — file di testo semplici in /var/log/

A differenza di Windows (dati binari strutturati letti tramite un'app dedicata), Linux tiene i log come **semplici file di testo**, leggibili direttamente con `cat`/`grep`/`less`:

- **`/var/log/httpd`** — contiene le richieste/risposte HTTP e i log degli errori del web server
- **`/var/log/cron`** — eventi relativi ai cron job
- **`/var/log/auth.log`** (Debian/Ubuntu) e **`/var/log/secure`** (RHEL/CentOS) — log relativi all'autenticazione (login, sudo, SSH)
- **`/var/log/kern`** — eventi relativi al kernel

Questa semplicità (testo semplice, un file per categoria) è anche il motivo per cui Linux si appoggia storicamente a un protocollo dedicato per l'inoltro — il **syslog**, descritto più sotto.

### Web server

I log del web server (che su Linux finiscono tipicamente proprio in `/var/log/httpd` o equivalenti per Nginx) registrano ogni richiesta HTTP/HTTPS ricevuta — lo stesso formato Apache visto nel documento sui log (IP, timestamp, GET/POST, status code, User-Agent). Sono fondamentali per il SIEM perché spesso rivelano tentativi di exploit, scansioni automatizzate, o richieste anomale verso endpoint sensibili — proprio il tipo di attività che una regola di correlazione può intercettare.

## Tipi di log source e la loro ingestione nel SIEM

Riprendendo la distinzione iniziale, alcuni esempi concreti di cosa il SIEM ingerisce:

- **Server**: Linux syslog, Windows Event Log
- **Applicazioni**: web server (Apache, Nginx), database (PostgreSQL, MySQL)
- **Dispositivi di rete**: firewall, router, switch
- **Strumenti di sicurezza**: antivirus, IDS/IPS
- **Servizi cloud**: AWS CloudTrail, Azure Activity Logs, Google Cloud Audit Logs

Tutti questi formati diversi tra loro vengono normalizzati in uno schema unificato — è esattamente il passaggio di "normalizzazione" visto sopra: senza di esso, un log Windows e un log Apache resterebbero incomparabili tra loro, rendendo la correlazione impossibile.

## Come questi log arrivano al SIEM

Ogni dispositivo della rete genera log ogni volta che viene svolta un'attività — un utente che visita un sito, si connette via SSH, effettua il login sulla propria workstation. Il SIEM deve raccoglierli tutti da fonti così diverse (Windows, Linux, web server) — ci sono tre metodi principali:

**1. Agent / Forwarder**

Le soluzioni SIEM forniscono uno strumento leggero chiamato agent (in Splunk si chiama forwarder), installato direttamente sull'endpoint. Viene configurato per catturare tutti i log importanti e inviarli al server SIEM.

Sul lato pratico, per Windows questo significa installare l'agent e specificare quali canali di log inviare — tipicamente si abilitano esplicitamente i canali `WinEventLog://Application`, `WinEventLog://Security`, `WinEventLog://System`, così l'agent sa cosa raccogliere e inoltrare.

**2. Syslog**

Syslog è un protocollo molto diffuso per raccogliere dati da vari sistemi come web server, database, ecc., inviando dati in tempo reale verso una destinazione centralizzata. È il metodo "nativo" per Linux — dato che i log Linux sono già testo semplice organizzato per categoria (come i file in `/var/log/` visti sopra), syslog li spedisce così come sono verso il SIEM, spesso senza bisogno di un agent dedicato pesante.

**3. Manual Upload**

Alcune soluzioni SIEM, come Splunk, ELK, ecc., permettono di caricare dati offline per un'analisi rapida — utile per analisi puntuali o forensi su un dump di log già raccolto, non per il monitoraggio continuo.

![Dai log source all'alert](/assets/img/posts/log-sources-to-siem-flow.svg)

## Il processo di alerting e analisi degli alert

L'alerting è il processo di rilevare potenziali incidenti in base a regole di correlazione predefinite — usando espressioni logiche per identificare pattern sospetti (es. più tentativi di login falliti seguiti da uno riuscito), spesso arricchite con feed di threat intelligence (es. informazioni su indirizzi IP noti per essere associati a malware).

Una volta generato l'alert, inizia il lavoro dell'analista — l'analisi valida se l'alert è un vero positivo o un falso positivo (lo stesso concetto visto nel documento sull'incident response). Da lì, se confermato come vero positivo, il processo prosegue con contenimento, eradicazione e recupero — lo stesso iter SANS/NIST già visto.

## Osservazioni

Windows tende a usare agent/forwarder dedicati (data la natura binaria e strutturata dei suoi log, serve un traduttore che sappia leggerli correttamente), Linux si appoggia storicamente al protocollo syslog nativo (i suoi log sono già testo semplice, facile da spedire così com'è), mentre i log dei web server possono arrivare tramite l'uno o l'altro metodo a seconda di come è configurato il server stesso. In tutti i casi, il risultato finale è lo stesso: tutti questi log, arrivati con metodi diversi, finiscono normalizzati nello stesso schema dentro il SIEM — è solo a quel punto che la correlazione tra un tentativo di login fallito su Windows e una richiesta sospetta sul web server, magari avvenuti sulla stessa rete a pochi secondi di distanza, diventa possibile.

Un SIEM è solo utile quanto i dati che riceve e le regole che applica: se una fonte di log smette di inviare dati (un agent si blocca, un servizio syslog va giù) senza che nessuno se ne accorga, quella parte della rete diventa un punto cieco — anche se il SIEM continua a funzionare perfettamente su tutto il resto. Allo stesso modo, regole di correlazione mal calibrate generano falsi positivi in massa, tanto che un analista può iniziare a ignorarli — vanificando l'intero scopo dell'alerting.

Il valore del SIEM sta nel trasformare log sparsi e isolati — Windows Event Viewer, i file di testo in `/var/log/` su Linux, i log del web server — in un'unica fonte centralizzata e correlata, indipendentemente da come ciascuna fonte arriva effettivamente al sistema (agent/forwarder, syslog, o caricamento manuale). Capire da dove vengono i log e come vengono trasportati è il primo passo per interpretare correttamente un alert: sapere che un dato allarme nasce dalla correlazione tra un Security Log di Windows e un log di accesso web aiuta a capire subito che tipo di indagine serve, prima ancora di aprire il dettaglio dell'evento.
