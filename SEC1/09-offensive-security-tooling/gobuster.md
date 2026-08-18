---
title: "Gobuster"
date: 2026-08-18 08:00:00 +0200
categories: [Cyber Security 101]
tags: [offensive-security-tooling, gobuster]
description: ""
toc: true
---


## Intro

Gobuster è uno strumento di enumerazione — ci serve per "scoprire cose che esistono ma non sono immediatamente visibili" su un sito o un dominio. È uno strumento offensivo open-source scritto in Golang, ed enumera directory web, sottodomini DNS, virtual host, bucket Amazon S3 e Google Cloud Storage tramite brute force, usando wordlist specifiche e gestendo le risposte in arrivo.

Per quanto riguarda le wordlists:

- **SecLists** è la raccolta più usata in assoluto — wordlist pronte per ogni scopo (directory comuni, sottodomini comuni, password comuni come `rockyou.txt` che abbiamo già usato), spesso preinstallate su Kali in `/usr/share/wordlists/` e `/usr/share/seclists/`
- Possiamo anche crearne di personalizzate, mirate al contesto specifico (es. se sappiamo che il sito è a tema "beach bar jukebox" come nel boot2root, potremmo costruire una piccola wordlist con parole a tema, invece di usarne una generica)

Una wordlist troppo piccola rischia di non trovare nulla (perdiamo risultati validi che semplicemente non erano nella lista); una wordlist troppo grande rende la scansione lentissima e più rumorosa/rilevabile. Il compromesso giusto dipende dal contesto — per un primo giro veloce usiamo liste "small/medium", per un'enumerazione più approfondita passiamo a liste più grandi solo se il primo giro dà pochi risultati.




### Flag comuni a più modalità

**`-k` / `--no-tls-validation`**
Salta il controllo del certificato quando si usa HTTPS. Capita spesso in eventi CTF o room di test come quelle di TryHackMe, dove viene usato un certificato self-signed — questo causerebbe altrimenti un errore durante il controllo TLS.

**`-r` / `--followredirect`**
Configura Gobuster per seguire un redirect ricevuto come risposta alla richiesta inviata. Un codice di stato HTTP di redirect (es. 301 o 302) viene usato per reindirizzare il client verso un URL diverso.

**`-x` / `--extensions`**
Specifica quali estensioni di file cercare, es. `.php`, `.js`.

---

## Caso 1: Directory and File Enumeration

È l'uso più comune di Gobuster — scopriamo pagine/cartelle che esistono sul server ma non sono linkate da nessuna parte visibile (non compaiono nel menu del sito, ma sono comunque raggiungibili se conosciamo l'URL esatto).

```bash
gobuster dir -u http://10.113.132.14 -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt
```

- **`dir`** — modalità enumerazione directory/file
- **`-u`** — l'URL target
- **`-w`** — la wordlist da usare

Proviamo così ogni parola della lista come se fosse un percorso (`http://10.113.132.14/admin`, `http://10.113.132.14/backup`, `http://10.113.132.14/login`...) e otteniamo quali esistono davvero, in base al codice di risposta HTTP (200, 301, 403, ecc.).

**Cercare anche file con estensioni specifiche**

```bash
gobuster dir -u http://10.113.132.14 -w wordlist.txt -x php,txt,html
```

Così proviamo anche `admin.php`, `backup.txt`, ecc., non solo cartelle nude — esattamente il flag `-x`/`--extensions` visto sopra.

---

## Caso 2: Subdomain Enumeration

Un dominio principale (es. `example.thm`) spesso ha sottodomini collegati (`api.example.thm`, `dev.example.thm`, `staging.example.thm`) che magari non sono pubblicizzati ma sono comunque attivi — a volte ambienti di test/sviluppo dimenticati, spesso meno protetti del sito principale.

La sintassi per la modalità `dns` è:

```bash
gobuster dns -d example.thm -w /path/to/wordlist
```

I flag `-d` e `-w` sono entrambi obbligatori per far funzionare l'enumerazione dei sottodomini con Gobuster. Un esempio pratico:

```bash
gobuster dns -d example.thm -w /usr/share/wordlists/SecLists/Discovery/DNS/subdomains-top1million-5000.txt
```

- **`gobuster dns`** — enumera i sottodomini sul dominio configurato
- **`-d example.thm`** — imposta il target sul dominio `example.thm`
- **`-w ...subdomains-top1million-5000.txt`** — imposta la wordlist. Gobuster usa ogni voce della lista per costruire una nuova query DNS: se la prima voce della lista fosse `all`, la query risultante sarebbe `all.example.thm`

---

## Caso 3: Vhost Enumeration

Questo è concettualmente diverso e un po' più sottile — riguarda i casi in cui un solo server web, con un solo indirizzo IP, ospita più siti diversi (virtual hosting), distinguendoli in base all'header `Host` della richiesta HTTP, non in base all'URL o al DNS.

Per lanciare la modalità `vhost`:

```bash
gobuster vhost -u "http://example.thm" -w /path/to/wordlist
```

Un esempio più completo, con i flag aggiuntivi utili:

```bash
gobuster vhost -u "http://10.113.138.166" --domain example.thm -w /usr/share/wordlists/SecLists/Discovery/DNS/subdomains-top1million-5000.txt --append-domain --exclude-length 250-320
```

- **`gobuster vhost`** — istruisce Gobuster a enumerare i virtual host
- **`-u "http://10.113.138.166"`** — imposta l'URL su cui navigare
- **`-w ...subdomains-top1million-5000.txt`** — configura la wordlist da usare. Gobuster aggiunge ogni voce della wordlist al dominio configurato. Se non viene impostato esplicitamente un dominio con `--domain`, Gobuster lo estrae dall'URL (es. `test.example.thm`, `help.example.thm`, ecc.). Se vengono trovati sottodomini, Gobuster li segnala nel terminale
- **`--domain example.thm`** — imposta il dominio di primo e secondo livello nella parte `Hostname:` della richiesta, su `example.thm`
- **`--append-domain`** — aggiunge il dominio configurato a ogni voce della wordlist. Se questo flag non viene configurato, l'hostname impostato sarebbe solo `www`, `blog`, ecc. — questo farebbe funzionare il comando in modo scorretto e mostrerebbe falsi positivi
- **`--exclude-length`** — filtra le risposte ottenute dalle richieste web inviate. Con questo flag possiamo escludere i falsi positivi. Eseguendo il comando senza questo flag, si ottengono spesso molti falsi positivi tipo `Found: Orion.example.thm Status: 404 [Size: 279]` o `Found: pm.example.thm Status: 404 [Size: 276]` — questi falsi positivi hanno tipicamente una dimensione di risposta simile, quindi possiamo usarla per filtrarli. Ci aspettiamo di ottenere una risposta `200 OK` per avere un vero positivo (esistono comunque delle eccezioni)

In questo caso, l'IP resta lo stesso, ma proviamo a cambiare l'header `Host:` nella richiesta (es. `Host: admin.example.thm`, `Host: intranet.example.thm`), verificando se il server risponde con un contenuto diverso per qualcuno di questi nomi — segno che dietro quello stesso IP si nasconde un altro sito/applicazione non raggiungibile navigando "normalmente".

## Extra: Sottodomini Vs Vhost

Nella pratica quotidiana i due spesso "sembrano" la stessa cosa, ma la differenza tecnica è importante.

Quando cerchiamo sottodomini, stiamo verificando se esiste un record DNS che fa puntare `qualcosa.esempio.com` a un indirizzo IP. Ogni sottodominio, in genere, ha una propria voce nel DNS, e spesso (anche se non sempre) punta a un IP diverso — magari `api.esempio.com` è su un server, `blog.esempio.com` su un altro.

```
api.esempio.com     → DNS record → 203.0.113.10
blog.esempio.com    → DNS record → 203.0.113.25
```

Qui il punto di partenza è il nome — proviamo tanti nomi (`api`, `dev`, `blog`, `staging`...) davanti a `esempio.com` e chiediamo al DNS "questo esiste?".

per i Virtual host la distinzione avviene a livello di applicazione, sullo stesso server. Qui conosciamo già un solo IP (magari perché stiamo attaccando direttamente una macchina, senza nemmeno passare da un dominio) e ci chiediamo: *"questo stesso server, dietro le quinte, sta ospitando più siti/applicazioni diverse, distinguendole in base a un nome che io scrivo manualmente nella richiesta?"*

```
Richiesta 1: GET / HTTP/1.1
             Host: esempio.com          → il server mostra il Sito A

Richiesta 2: GET / HTTP/1.1
             Host: admin.esempio.com    → STESSO IP, ma il server mostra il Sito B (magari un pannello admin)
```

Non c'è nessun record DNS coinvolto in questo secondo caso — è il server web stesso (Apache, Nginx, IIS) configurato per dire "se ricevi una richiesta con questo header Host, servi questi file/questa applicazione invece di quella di default". Potremmo scrivere qualsiasi cosa nell'header Host (anche un nome che non esiste da nessuna parte nel DNS pubblico) e il server risponderebbe comunque in modo diverso, se quel nome è stato configurato lato server.

Il punto chiave della differenza è riassunto di seguito.

| | Sottodomini | Virtual Host |
|---|---|---|
| **Cosa verifichiamo** | Se esiste un record DNS | Se il server riconosce un certo header Host |
| **Dove avviene la verifica** | Interrogando il DNS (nessun collegamento reale al server necessario per scoprirlo) | Mandando richieste dirette al server, cambiando manualmente l'header Host |
| **Un IP diverso per ognuno?** | Spesso sì, ma non sempre | No — è lo stesso identico IP/server, cambia solo cosa restituisce in base all'header |
| **Perché può sfuggire a un'enumerazione "normale"** | Perché non è pubblicizzato nei DNS pubblici, ma comunque esiste come record | Perché non esiste proprio nessun DNS pubblico che lo colleghi — se non proviamo esplicitamente quell'header Host, non lo scopriremmo mai, nemmeno guardando tutto il DNS del mondo |

### Esempio

Immaginiamo che un'azienda abbia configurato `intranet.esempio.com` solo come virtual host sul proprio server (senza pubblicare un record DNS pubblico per quel nome, magari perché lo usano solo internamente con un DNS interno/privato). Se proviamo a enumerare i sottodomini (`gobuster dns`), non lo troveremmo mai, perché DNS pubblicamente non esiste. Ma se già conosciamo l'IP del server e proviamo l'enumerazione vhost (`gobuster vhost`), scopriremmo che il server risponde diversamente quando gli mandiamo `Host: intranet.esempio.com` — anche senza che quel nome sia mai stato registrato pubblicamente da nessuna parte.

Questo è esattamente il motivo per cui i due metodi sono complementari, non intercambiabili — uno scopre "nomi ufficialmente registrati", l'altro scopre "configurazioni nascoste nel server stesso".


## Riassunto

Gobuster è lo strumento standard per la fase di enumerazione web, tra la ricognizione iniziale e lo scanning vero e proprio: ci permette di scoprire pagine, sottodomini e virtual host che non sono visibili navigando normalmente il sito. Le tre modalità (`dir`, `dns`, `vhost`) rispondono a domande diverse — cosa esiste su questo server, cosa esiste nel DNS del dominio, cosa esiste dietro questo IP se cambio l'header Host — e vanno scelte in base a cosa stiamo effettivamente cercando, non usate a caso. Come per ogni tool basato su wordlist, il risultato dipende tanto dal comando quanto dalla qualità e pertinenza della lista scelta.
