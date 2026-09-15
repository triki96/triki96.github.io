---
title: "Content Discovery"
description: "Scoperta dei contenuti di una pagina web"
date: 2026-09-14 00:00:00 +0200
categories: [PT1, 3-web-app]
tags: [content-discovery, robots-txt, sitemap, http-headers, google-dorking, wappalyzer, wayback-machine, s3-bucket, gobuster]
---

Con questo documento ci proponiamo di ottenere una metodologia strutturata di individuazione dei contenuti di un'applicazione web. In particolare, vedremo come:

- individuare manualmente i contenuti nascosti utilizzando `robots.txt` e `sitemap.xml`, intestazioni HTTP e analisi del framework
- utilizzare strumenti OSINT, tra cui Google dorking, Wappalyzer, Wayback Machine ed enumerazione dei bucket S3
- utilizzare Gobuster per forzare directory, sottodomini e host virtuali

## Il file robots.txt

Il file `robots.txt` è un file di testo che si trova nella root di un sito web (es. `https://esempio.com/robots.txt`) e serve a dare istruzioni ai web crawler (i bot dei motori di ricerca come Googlebot, Bingbot, ma anche crawler di altro tipo) su quali parti del sito possono o non possono esplorare/indicizzare.
Le direttive principali sono:

```
User-agent: *
Disallow: /admin/
Disallow: /backup/
Allow: /admin/public/
Sitemap: https://esempio.com/sitemap.xml
```

- `User-agent`: specifica a quale bot si applica la regola (`*` = tutti)
- `Disallow`: percorsi che il bot non dovrebbe crawlare
- `Allow`: eccezioni dentro un percorso disallowed
- `Sitemap`: indica dove trovare la mappa del sito per facilitare l'indicizzazione

### A cosa serve realmente (lato sviluppatore/sito)

- evitare che pagine duplicate, di test, o irrilevanti finiscano nei risultati di ricerca
- risparmiare "crawl budget" — cioè evitare che il bot sprechi tempo/risorse su aree poco importanti
- tenere fuori dagli indici aree come pannelli di login, script interni, file temporanei

> Si tratta solo di una linea guida per i bot, non di un controllo di sicurezza: i percorsi con restrizioni potrebbero comunque essere accessibili se visitati direttamente.

### Perché ci interessa in fase di recon

Il file elenca esplicitamente i percorsi che il proprietario non vuole vengano indicizzati — che spesso coincidono con i percorsi più interessanti:

```
User-agent: *
Disallow: /admin/
Disallow: /backup/
Disallow: /cgi-bin/test.cgi
Disallow: /internal-api/v2/
```

Chi lo scrive ragiona in termini di "nascondere dai motori di ricerca" e finisce per pubblicare una mappa dei punti sensibili. È un classico caso di security through obscurity che si autosabota: nel tentativo di nascondere qualcosa, se ne crea un elenco pubblico e comodo.

## Il file sitemap.xml

Il `sitemap.xml` è un file XML che vive  tipicamente nella root del sito (es. `https://esempio.com/sitemap.xml`), spesso referenziato proprio dentro `robots.txt` con la direttiva `Sitemap:`.

### A cosa serve

Mentre `robots.txt` dice ai bot cosa non guardare, `sitemap.xml` fa l'opposto: è una mappa esplicita di tutte (o quasi) le pagine del sito che lo sviluppatore vuole che i motori di ricerca conoscano e indicizzino. Serve soprattutto quando:

- il sito ha pagine "orfane" difficili da raggiungere seguendo solo i link interni
- il sito è molto grande (e-commerce con migliaia di prodotti)
- il sito è nuovo e non ha ancora abbastanza backlink per essere scoperto naturalmente
- ci sono contenuti generati dinamicamente (JS-heavy) che i crawler potrebbero non riuscire a seguire

### Struttura tipica

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://esempio.com/</loc>
    <lastmod>2026-01-15</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://esempio.com/prodotti/scarpe</loc>
    <lastmod>2026-02-01</lastmod>
  </url>
</urlset>
```

- `loc`: l'URL della pagina
- `lastmod`: ultima modifica
- `changefreq`: quanto spesso cambia (aiuta il bot a decidere quando ripassare)
- `priority`: importanza relativa della pagina (0.0–1.0)

È letteralmente l'opposto di `robots.txt` in termini di utilità offensiva: mentre `robots.txt` a volte rivela involontariamente path sensibili tramite `Disallow`, `sitemap.xml` elenca deliberatamente e pubblicamente ogni pagina che il proprietario del sito considera "ufficiale" — quindi è un'ottima fonte per:

- mappare rapidamente la struttura del sito senza dover fare crawling manuale/con Gobuster
- scoprire endpoint che magari non sono linkati visibilmente nella UI ma sono ancora raggiungibili
- capire la struttura degli URL (parametri, pattern di routing) per orientare poi test più mirati (es. IDOR, path traversal)

Vale quindi sempre la pena controllare entrambi i file: `robots.txt` per cosa "non vogliono far vedere" e `sitemap.xml` per cosa "vogliono far vedere" — a volte tra i due si scopre più superficie di attacco di quanta se ne troverebbe con un semplice browsing manuale del sito.

## Intestazioni HTTP

Quando un server web risponde a una richiesta, include intestazioni HTTP che possono rivelare utili dettagli tecnici. Intestazioni come `Server` e `X-Powered-By` spesso espongono il software del server web e il linguaggio o il framework su cui è in esecuzione l'applicazione.

```shell-session
curl <IP_address> -I

HTTP/1.1 404 Not Found
Server: nginx/1.18.0 (Ubuntu)
Date: Tue, 15 Sep 2026 07:38:08 GMT
Content-Type: text/html; charset=UTF-8
Connection: keep-alive
X-FLAG: THM{HEADER_FLAG}
X-Powered-By: THM-Framework
```

## Struttura dello stack

Una volta identificato il framework (tramite le intestazioni o esaminando il codice sorgente della pagina alla ricerca di commenti e avvisi di copyright), possiamo visitare il sito web ufficiale del framework per saperne di più. Le pagine di documentazione spesso descrivono la struttura predefinita delle directory, i percorsi del pannello di amministrazione e le credenziali predefinite.

## Google dorking

Il Google Dorking (o Google Hacking) è una tecnica di OSINT/reconnaissance passiva: non si tocca mai direttamente il target, ma si sfrutta il fatto che Google ha già fatto il crawling del sito, usando i suoi operatori di ricerca avanzata per filtrare tra tutto quello che ha indicizzato e trovare cose che non dovrebbero essere pubbliche.

Google indicizza tutto ciò che riesce a raggiungere seguendo i link e i sitemap — inclusi file, pagine e directory che gli sviluppatori pensavano fossero "nascosti" solo perché non linkati visibilmente nella UI (security through obscurity). Se una pagina non è protetta da autenticazione e Google riesce ad arrivarci, la indicizza.

### Operatori principali

| Filtro | Esempio | Descrizione |
|---|---|---|
| `site` | `site:tryhackme.com` | Restituisce risultati solo dal dominio specificato |
| `inurl` | `inurl:admin` | Restituisce risultati contenenti la parola specificata nell'URL |
| `filetype` | `filetype:pdf` | Restituisce risultati di un tipo di file specifico |
| `intitle` | `intitle:admin` | Restituisce risultati con la parola specificata nel titolo della pagina |
| `intext` | `intext:password` | Restituisce risultati contenenti la parola specificata nel corpo |
| `cache` | `cache:tryhackme.com` | Mostra la versione della pagina memorizzata nella cache di Google |

### Combinare gli operatori

La potenza reale emerge quando li si combina:

```
site:esempio.com inurl:admin
```
→ pannelli di login/admin specifici del dominio target

```
site:esempio.com filetype:pdf intext:"confidential"
```
→ documenti PDF pubblici che contengono la parola "confidential" — spesso report interni caricati per errore

```
site:esempio.com inurl:login intext:"password"
```
→ pagine di login che magari espongono errori con credenziali di default nel testo

```
site:esempio.com ext:sql | ext:env | ext:log
```
→ file di configurazione, backup di database o log lasciati accidentalmente accessibili (`ext:` è sinonimo di `filetype:`)

### Altri operatori utili

| Operatore | Funzione |
|---|---|
| `-` (minus) | Esclude un termine (es. `site:esempio.com -inurl:www` per sottodomini diversi) |
| `"frase esatta"` | Match esatto di una stringa |
| `OR` / `\|` | Match di uno tra più termini |
| `link:` | (deprecato/limitato oggi) trovava pagine che linkavano a un URL |
| `related:` | Siti simili a uno dato |

## Wappalyzer

Wappalyzer è un tool di technology fingerprinting: visiti un sito e lui ti dice con cosa è costruito.

### Cosa rileva

Quando si apre una pagina web, il browser riceve molto più di quello che si vede. Wappalyzer analizza tutti questi segnali e li incrocia con un database di firme note:

- header HTTP — il server può annunciarsi (`Server: nginx/1.18`, `X-Powered-By: PHP/8.1`)
- HTML e meta tag — un `<meta name="generator" content="WordPress 6.5">` è una firma esplicita
- percorsi di file — caricare `/wp-content/themes/...` tradisce WordPress anche senza meta tag
- cookie — nomi come `JSESSIONID` indicano Java, `PHPSESSID` indica PHP, `csrftoken` spesso indica Django
- pattern JavaScript — variabili globali, librerie incluse, chiamate specifiche

Da tutto questo produce un report: "questo sito usa WordPress, PHP 8.1, nginx, jQuery 3.6, Google Analytics, Cloudflare".

### Come si usa

Il modo più immediato è l'estensione browser (Chrome, Firefox): la si installa, si naviga normalmente, e per ogni sito visitato l'icona mostra le tecnologie rilevate. Nessun comando da lanciare, nessuna configurazione. Esiste anche una versione CLI e delle API a pagamento, ma per la ricognizione manuale l'estensione basta.

### Perché ci interessa

In fase di recon, sapere che un sito gira su WordPress 6.2 con PHP 7.4 dietro Apache dà subito una superficie d'attacco concreta: si possono cercare CVE specifiche per quelle versioni, plugin noti vulnerabili, misconfigurazioni tipiche di quello stack. Senza fingerprinting si andrebbe alla cieca.

Il punto chiave è che Wappalyzer fa tutto questo in modo passivo — analizza solo ciò che il browser riceve normalmente, senza mandare probe aggiuntive o richieste sospette. Dal punto di vista del target, è indistinguibile da un visitatore qualunque.

## Wayback Machine

La Wayback Machine è, in sostanza, una "macchina del tempo" per il web: i suoi bot (crawler, simili concettualmente a Googlebot) visitano periodicamente milioni di siti e ne salvano uno snapshot — una copia fedele di come appariva quella pagina in quel preciso momento — mantenendo tutti gli snapshot storici, non solo l'ultimo.

### Perché è rilevante in fase di recon

Il punto chiave, diverso da `robots.txt`/`sitemap.xml`/Google dorking (che riflettono lo stato attuale del sito), è che la Wayback Machine dà accesso alla storia del sito. E la storia spesso rivela cose che nel presente sono state "ripulite" ma che restano comunque interessanti:

- endpoint API dimenticati: magari nel 2019 il sito aveva `/api/v1/users` esposto senza autenticazione, poi è stato messo dietro auth o rimosso dal codice attuale — ma se si sa che è esistito, si può verificare se è ancora raggiungibile (a volte il codice cambia ma il routing vecchio resta attivo per retrocompatibilità)
- vecchie pagine di login: form di autenticazione precedenti, magari con meccanismi di validazione più deboli di quelli attuali, che potrebbero ancora essere raggiungibili se il path non è stato davvero rimosso dal server ma solo "scollegato" dai link visibili
- commenti nel codice sorgente HTML: vecchi snapshot spesso contengono commenti degli sviluppatori (`<!-- TODO: rimuovere prima del prod -->`, credenziali di test dimenticate, path interni) che nella versione attuale sono stati puliti
- file di configurazione o documenti che erano temporaneamente pubblici prima che qualcuno si accorgesse dell'errore e li rimuovesse — ma lo snapshot li ha già catturati

## S3 bucket

Gli S3 bucket (Simple Storage Service) sono lo storage cloud di Amazon Web Services: cartelle/contenitori dove le aziende salvano file di qualsiasi tipo — immagini, backup di database, log, documenti, asset statici di un sito, persino interi siti web statici. Sono estremamente diffusi perché economici e scalabili.

Le aziende li usano per tutto ciò che è "file da conservare":

- asset statici di un sito (immagini, CSS, JavaScript)
- backup — spesso backup di database, quindi dump SQL che contengono tutti i dati strutturati esportati in un file
- log applicativi
- documenti interni (report, fogli di calcolo, PDF)
- file caricati dagli utenti (avatar, allegati, documenti d'identità)

### Perché finiscono nel radar di un pentest

Ogni bucket ha un nome univoco a livello globale (non solo per account, ma su tutto AWS — nessun altro può creare un bucket con lo stesso nome) e l'URL segue un formato prevedibile:

```
https://{nome-bucket}.s3.amazonaws.com
```

oppure, formato alternativo:

```
https://s3.amazonaws.com/{nome-bucket}
```

Chi crea il bucket imposta i permessi (chi può leggere, scrivere, listare il contenuto). Il problema, molto comune nella pratica, è che spesso vengono lasciati pubblicamente leggibili per errore — magari durante lo sviluppo qualcuno li rende pubblici "temporaneamente" per fare un test rapido e poi se ne dimentica. Un bucket pubblico per errore è come un archivio aziendale con la porta aperta su strada — e con l'indirizzo scritto sull'insegna.

### Esempio

Il nome del bucket è spesso intuibile. Se l'azienda si chiama Acme Corp, le prime ipotesi sono banali:

```
acme-backup
acme-prod
acme-assets
acmecorp-dev
acme-internal
```

Non serve nemmeno indovinare a mano: strumenti come GoBuster, ffuf o tool dedicati come cloud_enum automatizzano il processo, provando migliaia di combinazioni in pochi minuti. Se il bucket esiste e risponde, si ha già un punto d'ingresso.

### Cosa succede quando un bucket è aperto

Un bucket mal configurato può esporre tre operazioni che dovrebbero essere riservate:

- **Listing** — si possono elencare tutti i file nel bucket. Basta una richiesta GET all'URL e il server restituisce un XML con nomi, dimensioni e date di ogni oggetto. A quel punto si sa esattamente cosa c'è dentro.
- **Read** — si possono scaricare i file. Backup di database, credenziali, chiavi API, documenti interni, dati personali di utenti. Tutto quello che l'azienda ha salvato lì pensando fosse privato.
- **Write** — nel caso peggiore si possono anche caricare o sovrascrivere file. Se il bucket serve asset statici per un sito web (JavaScript, CSS, immagini), un attaccante può sostituire un file `.js` con una versione malevola e colpire ogni visitatore del sito.

### In fase di recon

Cercare bucket S3 è un passo standard della ricognizione, con costo quasi zero e potenziale altissimo: si trova il nome del target, si generano varianti plausibili, si provano — e se un bucket risponde con un listing XML invece di un 403, si è trovata una misconfiguration reale che potrebbe valere da sola l'intero engagement.

## Gobuster

Lo conosciamo già. Utile per scoprire sottodomini e host virtuali.
