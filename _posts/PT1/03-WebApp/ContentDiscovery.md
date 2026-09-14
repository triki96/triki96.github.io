SCOPERTA DEI CONTENUTI

cosa sono i contenuti di una pagina web?

OBIETTIVO: ottenere una metologia strutturata di individuazione dei contenuti di una applicazione web

FILE COMUNI:
robots.txt
Il file robots.txt è un file di testo che si trova nella root di un sito web (es. https://esempio.com/robots.txt) e serve a dare istruzioni ai web crawler (i bot dei motori di ricerca come Googlebot, Bingbot, ma anche crawler di altro tipo) su quali parti del sito possono o non possono esplorare/indicizzare.

Le direttive principali sono:

User-agent: *
Disallow: /admin/
Disallow: /backup/
Allow: /public/
Sitemap: https://esempio.com/sitemap.xml
User-agent: specifica a quale bot si applica la regola (* = tutti)
Disallow: percorsi che il bot non dovrebbe crawlare
Allow: eccezioni dentro un percorso disallowed
Sitemap: indica dove trovare la mappa del sito per facilitare l'indicizzazione

A cosa serve realmente (lato sviluppatore/sito)

Evitare che pagine duplicate, di test, o irrilevanti finiscano nei risultati di ricerca
Risparmiare "crawl budget" — cioè evitare che il bot sprechi tempo/risorse su aree poco importanti (carrelli, filtri di ricerca con infinite combinazioni URL, ecc.)
Tenere fuori dagli indici aree come pannelli di login, script interni, file temporanei


OSS: si tratta solo di una linea guida per i bot, non di un controllo di sicurezza, quindi i percorsi con restrizioni potrebbero comunque essere accessibili se visitati direttamente.



IL file sitemap.xml


Il sitemap.xml non è una directory ma un file XML che sta anch'esso tipicamente nella root del sito (es. https://esempio.com/sitemap.xml), spesso referenziato proprio dentro robots.txt con la direttiva Sitemap:.

A cosa serve

Mentre robots.txt dice ai bot cosa non guardare, sitemap.xml fa l'opposto: è una mappa esplicita di tutte (o quasi) le pagine del sito che lo sviluppatore vuole che i motori di ricerca conoscano e indicizzino. Serve soprattutto quando:

il sito ha pagine "orfane" difficili da raggiungere seguendo solo i link interni
il sito è molto grande (e-commerce con migliaia di prodotti)
il sito è nuovo e non ha ancora abbastanza backlink per essere scoperto naturalmente
ci sono contenuti generati dinamicamente (JS-heavy) che i crawler potrebbero non riuscire a seguire


Struttura tipica

xml
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
  ...
</urlset>
loc: l'URL della pagina
lastmod: ultima modifica
changefreq: quanto spesso cambia (aiuta il bot a decidere quando ripassare)
priority: importanza relativa della pagina (0.0–1.0)


È letteralmente l'opposto di robots.txt in termini di utilità offensiva: mentre robots.txt a volte rivela involontariamente path sensibili tramite Disallow, sitemap.xml elenca deliberatamente e pubblicamente ogni pagina che il proprietario del sito considera "ufficiale" — quindi è un'ottima fonte per:

Mappare rapidamente la struttura del sito senza dover fare crawling manuale/con gobuster
Scoprire endpoint che magari non sono linkati visibilmente nella UI ma sono ancora raggiungibili
Capire la struttura degli URL (parametri, pattern di routing) per orientare poi test più mirati (es. IDOR, path traversal)

Quindi in un workflow di recon vale sempre la pena controllare entrambi i file: robots.txt per cosa "non vogliono far vedere" e sitemap.xml per cosa "vogliono far vedere" — a volte tra i due si scopre più superficie di attacco di quanta se ne troverebbe con un semplice browsing manuale del sito.


INTESTAZIONI HTTP
ES: curl <IP_address> -I 

STRUTTURA DELLO STACK
(analizziamo lo stack)

USARE GLI OPERATORI DI RICERCA DI GOOGLE
Filtro	Esempio	Descrizione
site	site:tryhackme.com	Restituisce risultati solo dal dominio specificato
inurl	inurl:admin	Restituisce i risultati contenenti la parola specificata nell'URL
filetype	filetype:pdf	Restituisce i risultati di un tipo di file specifico
intitle	intitle:admin	Restituisce i risultati che contengono la parola specificata nel titolo della pagina.
intext	intext:password	Restituisce i risultati contenenti la parola specificata nel corpo
cache	cache:tryhackme.com	Mostra la versione della pagina memorizzata nella cache di Google

mettere esempi

Il Google Dorking (o Google Hacking) è una tecnica di OSINT/reconnaissance passiva: non tocchi mai direttamente il target, ma sfrutti il fatto che Google ha già fatto il crawling del sito per te, e usi i suoi operatori di ricerca avanzata per filtrare tra tutto quello che ha indicizzato e trovare cose che non dovrebbero essere pubbliche.

Il concetto chiave: perché funziona

Google indicizza tutto ciò che riesce a raggiungere seguendo i link e i sitemap — inclusi file, pagine e directory che gli sviluppatori pensavano fossero "nascosti" solo perché non linkati visibilmente nella UI (quello che si chiama security through obscurity, un anti-pattern). Se una pagina non è protetta da autenticazione e Google riesce ad arrivarci, la indicizza. Punto.

Combinare gli operatori (il vero potere del dorking)

I singoli filtri che hai elencato sono utili, ma la potenza reale emerge quando li combini. Alcuni esempi pratici:

site:esempio.com inurl:admin

→ Pannelli di login/admin specifici del dominio target

site:esempio.com filetype:pdf intext:"confidential"

→ Documenti PDF pubblici che contengono la parola "confidential" — spesso report interni caricati per errore

site:esempio.com inurl:login intext:"password"

→ Pagine di login che magari espongono errori con credenziali di default nel testo

site:esempio.com ext:sql | ext:env | ext:log

→ File di configurazione, backup di database o log lasciati accidentalmente accessibili (ext: è sinonimo di filetype:)

Altri operatori utili che non hai elencato

Operatore	Funzione
- (minus)	Esclude un termine (es. site:esempio.com -inurl:www per sottodomini diversi)
"frase esatta"	Match esatto di una stringa
OR / |	Match di uno tra più termini
link:	(deprecato/limitato oggi) trovava pagine che linkavano a un URL
related:	Siti simili a uno dato

WAPPALIZER


WAYBACK MACHINE
La Wayback Machine (gestita dalla no-profit Internet Archive) è, in sostanza, una "macchina del tempo" per il web: ogni tanto i suoi bot (chiamati crawler, simili concettualmente a Googlebot) visitano milioni di siti e ne salvano uno snapshot — una copia fedele di come appariva quella pagina in quel preciso momento — mantenendo tutti gli snapshot storici, non solo l'ultimo.

Perché è rilevante per noi in fase di recon

Il punto chiave, diverso da robots.txt/sitemap.xml/Google dorking (che riflettono lo stato attuale del sito), è che la Wayback Machine ci dà accesso alla storia del sito. E la storia spesso rivela cose che nel presente sono state "ripulite" ma che restano comunque interessanti:

Endpoint API dimenticati: magari nel 2019 il sito aveva /api/v1/users esposto senza autenticazione, poi è stato messo dietro auth o rimosso dal codice attuale — ma se sappiamo che è esistito, possiamo verificare se è ancora raggiungibile (a volte il codice cambia ma il routing vecchio resta attivo per retrocompatibilità)
Vecchie pagine di login: form di autenticazione precedenti, magari con meccanismi di validazione più deboli di quelli attuali, che potrebbero ancora essere raggiungibili se il path non è stato davvero rimosso dal server ma solo "scollegato" dai link visibili
Commenti nel codice sorgente HTML: vecchi snapshot spesso contengono commenti degli sviluppatori (<!-- TODO: rimuovere prima del prod -->, credenziali di test dimenticate, path interni) che nella versione attuale sono stati puliti
File di configurazione o documenti che erano temporaneamente pubblici prima che qualcuno si accorgesse dell'errore e li rimuovesse — ma lo snapshot li ha già catturati



S3 BUCKET
Gli S3 bucket sono lo "storage" cloud di Amazon Web Services: pensali come cartelle/contenitori dove le aziende salvano file di qualsiasi tipo — immagini, backup di database, log, documenti, asset statici di un sito, persino interi siti web statici. Sono estremamente diffusi perché sono economici, scalabili e AWS è il provider cloud più usato al mondo.

Perché finiscono nel radar di un pentest

Ogni bucket ha un nome univoco a livello globale (non solo per account, ma su tutto AWS — nessun altro può creare un bucket con lo stesso nome) e l'URL segue un formato prevedibile:

https://{nome-bucket}.s3.amazonaws.com

oppure, formato alternativo:

https://s3.amazonaws.com/{nome-bucket}

Chi crea il bucket imposta i permessi (chi può leggere, scrivere, listare il contenuto). Il problema, molto comune nella pratica, è che spesso vengono lasciati pubblicamente leggibili per errore — magari durante lo sviluppo qualcuno li rende pubblici "temporaneamente" per fare un test rapido e poi se ne dimentica


GOBUSTER

ogni file serve a far funzionare una delle due modalità di Gobuster.

resolv-dnsmasq → serve alla modalità gobuster dns

I sottodomini si risolvono via DNS. Perché tu possa enumerarli con gobuster dns, il tuo AttackBox deve poter interrogare un DNS che sa rispondere per la zona example.thm — cosa che i DNS pubblici normali non possono fare, perché example.thm non esiste su Internet.

Configurando nameserver 10.112.146.134 come upstream di dnsmasq, stai dicendo al tuo resolver locale: "per i domini di questa room, chiedi al DNS server che gira sul target". Senza questo, gobuster dns -d example.thm ... non avrebbe nessun server DNS in grado di confermare o smentire l'esistenza di un sottodominio: ogni query fallirebbe o darebbe NXDOMAIN a prescindere.

