---
title: "Protocolli di Rete e Attacchi Comuni"
date: 2026-09-02 8:00:00 +0200
categories: [PT1, 1-reconnaissance]
tags: [telnet, http, ftp, smtp, pop3, imap, tls, ssh, sniffing, mitm, password-attack]
description: "Protocolli di rete storici (Telnet, HTTP, FTP, SMTP, POP3, IMAP, SSH) e le loro versioni cifrate con TLS; attacchi comuni contro di essi (sniffing, MITM, password attack) e relative mitigazioni."
toc: true
---


Normalmente usiamo protocolli come HTTP, FTP, SMTP tramite un'interfaccia grafica (Firefox, FileZilla, Gmail...). Ora vediamo cosa succede "dietro le quinte", interagendo direttamente con questi protocolli tramite `telnet`, per capire davvero come funzionano — e perché molti di essi sono considerati insicuri per gli standard odierni.



## PROTOCOLLI STORICI

### Telnet (porta 23)

Telnet è un protocollo per connettersi al terminale di un'altra macchina da remoto ed eseguire comandi come se fossimo seduti davanti a quel computer. Storicamente era lo strumento standard per l'amministrazione remota. Il problema fondamentale è che  **tutta la comunicazione viaggia in chiaro**, credenziali comprese. Chiunque sia in ascolto sulla rete (sniffing) può leggere username e password.

```
telnet 10.114.174.217
Trying 10.114.174.217...
Connected to 10.114.174.217.
bento login: frank
Password: D2xc9CgD
frank@bento:~$
```

Per questo motivo, Telnet è stato sostituito quasi ovunque da **SSH**, che cifra l'intera sessione.

> Perchè in principio si usava Telnet per trasferire le credenziali in chiaro?
> {: .prompt-tip }

### HTTP (porta 80)

HTTP è il protocollo per trasferire pagine web. Essendo anch'esso un protocollo testuale e in chiaro, possiamo "fare da browser" a mano con telnet, scrivendo noi stessi le richieste.

```
telnet 10.114.174.217 80
GET / HTTP/1.1
Host: telnet

HTTP/1.1 200 OK
Server: nginx/1.18.0 (Ubuntu)
...
```

> Un dettaglio importante in fase di ricognizione: l'header `Server` rivela software e versione del web server (e a volte il sistema operativo). Queste informazioni aiutano a restringere il campo dei possibili vettori di attacco (es. cercare CVE note per quella versione specifica).
{: .prompt-tip }

 I server HTTP più diffusi sono **Nginx**, **Apache** e, in ambienti Windows, **IIS**.


### FTP (porte 20/21)

FTP (File Transfer Protocol) serve a trasferire file tra sistemi diversi. Come Telnet e HTTP, invia sia le credenziali sia i dati **in chiaro**. Lo troviamo ancora oggi in sistemi legacy, reti interne non aggiornate, dispositivi embedded, oppure server configurati male dove non è stata attivata la cifrazione. Trovare un server FTP durante un pentest — soprattutto se consente l'accesso anonimo — è un risultato significativo.

**FTP anonimo:**
```
ftp> USER anonymous
331 Please specify the password.
ftp> PASS anything@example.com
230 Login successful.
```


**Comandi principali:**

| Comando | Descrizione |
|---|---|
| `USER` / `PASS` | Login |
| `SYST` | Info sul sistema operativo del server |
| `PASV` | Attiva modalità passiva per il canale dati |
| `TYPE A` | Trasferimento in modalità ASCII (testo) |
| `TYPE I` | Trasferimento in modalità binaria (image/binary) |

>**ASCII vs Binary:** in modalità ASCII, FTP converte automaticamente i caratteri di fine riga tra sistemi diversi (Windows usa `\r\n`, Unix/Linux solo `\n`), utile per file di testo puro. In modalità binaria (`TYPE I`) i byte vengono trasferiti così come sono, senza alcuna conversione: obbligatoria per eseguibili, immagini, archivi e qualunque file non testuale, altrimenti il file arriva corrotto.
{: .prompt-info }


Server FTP comuni: **vsftpd**, **ProFTPD**, **Pure-FTPd** (Linux), IIS (Windows).
Client ftp: il comando `ftp` da terminale, oppure **FileZilla** con GUI.


> **TELNET e FTP:** Da notare che, a differenza di HTTP, ora telnet può interagire con FTP solo in parte: il trasferimento vero e proprio di un file non può essere completato, perché FTP apre una connessione dati separata (porta 20) rispetto al canale di controllo (porta 21); questo succedeva perchè l'idea, negli anni '70, era permettere di inviare comandi mentre un altro trasferimento era ancora in corso su un canale separato. Quando usiamo telnet per parlare con un server FTP sulla porta 21, stiamo aprendo **solo il canale di controllo**. Se digiti un comando come:
>```
>RETR nomefile.txt
>```
>il server FTP risponde dicendo che sta per iniziare il trasferimento, ma **il contenuto del file non arriva su quella stessa connessione telnet** — il server tenta di aprire (o aspetta che tu apra, in modalità passiva) una **seconda connessione TCP separata** dedicata solo ai dati.
Telnet, però, gestisce **una sola connessione alla volta** e non sa fare automaticamente questa "danza" a due canali: non apre autonomamente la seconda connessione dati, non gestisce la negoziazione della porta (`PASV`), e quindi non può ricevere il contenuto del file.

### Protocolli per le Mail

Vediamo i protocolli più usati per lo scambio di mail.

#### SMTP (porte 25, 587)

SMTP è il protocollo usato per inviare email. Utilizza due porte diverse che separano due fasi diverse del percorso di una mail:
-   Porta **587**: è dove il client (Outlook, Thunderbird...) si connette per inviare una mail.
-   Porta **25**: è usata per il traffico server-to-server, quando un server di posta inoltra il messaggio verso il server del destinatario.

Esempio con telnet:
```
telnet 10.114.174.217 25
220 bento.localdomain ESMTP Postfix (Ubuntu)
helo telnet
250 bento.localdomain
mail from:
250 2.1.0 Ok
rcpt to:
250 2.1.5 Ok
data
354 End data with .
subject: Sending email with Telnet
Hello Frank,
I am just writing to say hi!
.
250 2.0.0 Ok: queued as C3E7F45F06
quit
```

Cosa fanno i comandi: `HELO` si presenta al server; `MAIL FROM` e `RCPT TO` indicano rispettivamente mittente e destinatario; `DATA` apre il corpo del messaggio, che termina con una riga contenente solo un punto (`.`).

> **Email spoofing:** nell'esempio, il campo "from" viene specificato manualmente e il server lo accetta senza verificare che il mittente controlli davvero quell'indirizzo. SMTP è stato progettato in un'epoca di reti "fidate" e non ha meccanismi nativi per verificare l'identità del mittente — è esattamente per questo che le email di phishing possono sembrare provenire da indirizzi legittimi.
{: .prompt-warning }

#### POP3 (porta 110)

POP3 serve a **scaricare** le email dal server sul client. Il comportamento di default è "scarica ed elimina": una volta scaricata, l'email risiede solo sul dispositivo locale, e i vari client non sono sincronizzati tra loro.

**Comandi principali:**

| Comando | Descrizione |
|---|---|
| `USER` / `PASS` | Autenticazione |
| `STAT` | Numero messaggi e dimensione totale |
| `LIST` | Elenca i messaggi con relative dimensioni |
| `RETR n` | Scarica il messaggio n |
| `DELE n` | Marca il messaggio n per l'eliminazione |
| `QUIT` | Chiude la sessione (ed elimina i messaggi marcati) |

```
telnet 10.114.129.32 110
+OK 10.114.129.32 Mail Server POP3 ...
USER frank
+OK frank
PASS D2xc9CgD
+OK 1 messages (179) octets
RETR 1
+OK
...
```

Il limite pratico di POP3: usarlo da più dispositivi contemporaneamente non è comodo, perché ogni client scarica la propria copia senza sincronizzazione — per questo è stato in gran parte soppiantato da IMAP.

#### IMAP (porta 143)

IMAP è più sofisticato di POP3: le email restano **sul server** e vengono sincronizzate tra tutti i dispositivi/client. Stato di lettura, cartelle ed etichette sono condivisi ovunque, e cancellare un messaggio su un dispositivo lo rimuove ovunque.

**Comandi principali** (ognuno preceduto da un tag univoco, es. `c1`, `c2`...):

| Comando | Descrizione |
|---|---|
| `LOGIN user pass` | Autentica l'utente |
| `LIST "" "*"` | Elenca tutte le cartelle |
| `SELECT folder` | Apre una cartella in lettura/scrittura |
| `EXAMINE folder` | Apre una cartella in sola lettura |
| `FETCH n BODY[]` | Recupera il messaggio n |
| `SEARCH criteri` | Cerca messaggi che soddisfano un criterio |
| `LOGOUT` | Termina la sessione |


Esempio con telnet:

```
telnet 10.114.129.32 143
c1 LOGIN frank D2xc9CgD
c1 OK LOGIN Ok.
c2 LIST "" "*"
...
c4 LOGOUT
```

> Come per POP3, le credenziali viaggiano **in chiaro** (`LOGIN frank D2xc9CgD`). Ma la cosa più grave + che l'intera cronologia resta sul server: un attaccante con accesso IMAP può leggere anni di comunicazioni, cercare email di reset password per compromettere altri account, e mantenere accesso persistente nel tempo (a differenza di POP3, dove le nuove email arrivano solo finché il client non le scarica ed elimina).
{: .prompt-danger }

**Il flusso completo di un'email**, per chiarire i ruoli coinvolti:

```
MUA (client invio)
   │
   ▼
MSA (porta 587, autenticazione)
   │
   ▼
MTA (porta 25, relay tra server, uno o più hop)
   │
   ▼
MDA (deposita in mailbox) ──► POP3 (110/995) o IMAP (143/993)
                                    │
                                    ▼
                              MUA (client lettura)
```

- **MUA** (Mail User Agent): il client che usiamo noi (Outlook, Thunderbird...)
- **MSA** (Mail Submission Agent): riceve l'email dal MUA e **autentica** il mittente prima di accettarla per l'invio (SMTP, porta 587)
- **MTA** (Mail Transfer Agent): trasporta l'email da server a server fino a destinazione (SMTP, porta 25)
- **MDA** (Mail Delivery Agent): deposita l'email nella mailbox del destinatario (processo interno, nessuna porta esterna)

### TLS

**SSL** (Secure Sockets Layer) è il nome storico, nato quando il web ha iniziato a gestire dati sensibili (es. pagamenti online). Oggi tutti i sistemi moderni usano **TLS**, il suo successore diretto — quando qualcuno dice "SSL" nel linguaggio comune, quasi sempre intende TLS.

TLS è il meccanismo con cui i protocolli "storici" visti sopra vengono **aggiornati per cifrare** il traffico:

| Protocollo | Porta | Versione cifrata | Porta con TLS |
|---|---|---|---|
| HTTP | 80 | HTTPS | 443 |
| FTP | 21 | FTPS | 990 |
| SMTP | 25 | SMTPS | 465 |
| POP3 | 110 | POP3S | 995 |
| IMAP | 143 | IMAPS | 993 |

**Due modi di applicare TLS:**

- **Implicit TLS**: la cifratura parte subito, su una porta dedicata (es. 443 per HTTPS, 993 per IMAPS).
- **STARTTLS**: il client si connette sulla porta normale in chiaro (es. 25 per SMTP) e poi invia un comando per "aggiornare" la connessione a TLS sulla stessa porta.

>L'Implicit TLS è generalmente preferito, perché STARTTLS può essere vulnerabile a **downgrade attack**: un attaccante in MITM può "strippare" il comando STARTTLS dalla comunicazione, forzando la connessione a restare in chiaro.
{: .prompt-warning }

**DNS può essere cifrato allo stesso modo**, tramite due approcci:

- **DoT (DNS over TLS)**: query DNS incapsulate in una sessione TLS dedicata, porta **853**. Facile da riconoscere e bloccare a livello di rete (basta filtrare quella porta).
- **DoH (DNS over HTTPS)**: query DNS incapsulate dentro normali richieste HTTPS, porta **443** — si mescola indistinguibile dal resto del traffico web, rendendolo molto più difficile da bloccare selettivamente.

Entrambi evitano che chi osserva il traffico (es. un ISP) possa vedere quali siti stiamo visitando tramite le query DNS in chiaro.

> *Domanda: se un ISP vede che sto facendo una richiesta HTTPS a un server noto di DNS (es 1.1.1.1), non può assumere che quella sia una DoH e bloccarmela in automatico?*
>  Con la premesa che non tutti i provider DoH sono noti, e che chiunque può ospitare un resolver DoH proprio, su un IP qualsiasi, e che pertanto una blocklist basata su IP noti funziona solo in modo molto limitato, rispondiamo comunque alla domanda.
> Innanzitutto  `1.1.1.1` è un caso "facile" perché è un IP dedicato solo al DNS, quindi si potrebbe bloccare. Tuttavia, molti resolver DoH (incluso lo stesso Cloudflare) possono girare dietro la stessa infrastruttura che serve anche milioni di altri siti web normali. Se un ISP blocca quell'IP a livello di rete, rischia di bloccare anche traffico HTTPS legittimo non-DNS che passa per lo stesso IP.

### SSH (porta 22)

SSH (Secure Shell) è il sostituto sicuro di Telnet per l'amministrazione remota: cifra l'intera sessione, comprese le credenziali.

**Metodi di autenticazione:**
- **Password**: il client si connette, il server chiede username e password, il client le invia (dentro il canale già cifrato da SSH), il server le verifica contro le credenziali locali del sistema (es. `/etc/shadow` su Linux).
- **Chiave pubblica**: si genera una coppia di chiavi (`ssh-keygen -t ed25519`), la privata resta protetta (idealmente con passphrase) sul client, la pubblica viene copiata sul server in `~/.ssh/authorized_keys` (es. con `ssh-copy-id`)
	```bash
	ssh-keygen -t ed25519 -C "your_email@example.com"
	```

	Questo comando genera due file:

	-   **Chiave privata** (`~/.ssh/id_ed25519`): resta sempre e solo sul tuo computer, non va mai condivisa, idealmente protetta da una passphrase.
	-   **Chiave pubblica** (`~/.ssh/id_ed25519.pub`): viene condivisa sul server, nel file `~/.ssh/authorized_keys` (con `ssh-copy-id <user>@<IP>`, che automatizza questo passaggio

	Quando ci connettiamo, il server genera una **sfida casuale** e ce la manda, cifrata con la nostra chiave pubblica. Solo chi possiede la chiave privata corrispondente può decifrare quella sfida e rispondere correttamente. Il server verifica la risposta usando la chiave pubblica che ha in `authorized_keys`; se torna, siamo autenticati.

	> L'autenticazione a chiave pubblica non è attaccabile con Hydra/bruteforce nello stesso modo: non stiamo indovinando una stringa breve, stiamo cercando di fattorizzare/indovinare una chiave crittografica (praticamente impossibile con la potenza di calcolo attuale). Inoltre, anche se qualcuno intercetta tutto il traffico di rete, non ottiene nulla di utile per autenticarsi di nuovo

- **Basata su certificati**:  Concettualmente è un'evoluzione dell'autenticazione a chiave pubblica.
	Con la semplice chiave pubblica, se abbiamo 500 server e 50 dipendenti, dovremmo distribuire/gestire manualmente la chiave pubblica di ogni utente su ogni server (dentro authorized_keys), e se un dipendente lascia l'azienda dobbiamo rimuoverla ovunque, il che è **ingestibile su larga scala**.
- **MFA** (multi-factor authentication)

> Alla prima connessione verso un server, dobbiamo confermare il **fingerprint** della chiave pubblica del server SSH: questo previene attacchi MITM, perché in SSH — a differenza di HTTPS — di solito non c'è un'autorità terza a garantire la validità della chiave. La verifica va fatta manualmente.
{: .prompt-tip }

**Opzioni utili:**

```bash
# Porta non standard
ssh -p 2222 mark@10.114.170.77

# Chiave privata specifica
ssh -i ~/.ssh/custom_key mark@10.114.170.77

# Salto attraverso un bastion host
ssh -J bastion.example.com mark@internal-server

# Port forwarding locale
ssh -L 8080:localhost:80 mark@10.114.170.77

# Proxy SOCKS dinamico
ssh -D 9050 mark@10.114.170.77
```

**Trasferimento file sicuro:**
- **SFTP** (porta 22): oggi lo standard consigliato, stessa autenticazione/cifratura di SSH
- **SCP**: anch'esso su SSH, ma in fase di dismissione a favore di SFTP
- **FTPS**: attenzione, è un protocollo diverso — FTP + TLS (porta 990), non ha nulla a che vedere con SSH nonostante il nome simile



## ATTACCHI

Quando parliamo di attacchi verso questi protocolli, facciamo sempre riferimento alla **triade CIA** (Confidenzialità, Integrità, Disponibilità) e a quale proprietà viene violata.

### Sniffing

Consiste nel **catturare passivamente** il traffico di rete per leggerne il contenuto — viola la **confidenzialità**. Funziona particolarmente bene contro tutti i protocolli in chiaro visti sopra (Telnet, HTTP, FTP, SMTP, POP3, IMAP), perché credenziali e dati sono leggibili senza bisogno di decifrare nulla.

Strumenti tipici: **tcpdump**, **Wireshark**, **Tshark**.

```bash
# Cattura traffico su una porta specifica (-A stampa i risultati in ASCII)
sudo tcpdump port 110 -A

# Cattura traffico da/verso un host specifico
sudo tcpdump host 10.20.30.148 -A

# Cattura traffico FTP (credenziali in chiaro)
sudo tcpdump port 21 -A

# Salva su file per analisi successiva
sudo tcpdump -w capture.pcap

# Legge un file di cattura
tcpdump -r capture.pcap -A
```

**Mitigazione principale:** aggiungere un livello di cifratura (TLS) sopra il protocollo, oppure sostituire il protocollo con la sua alternativa sicura (es. Telnet → SSH).

### Man in the Middle (MITM)

L'attaccante si posiziona **tra due parti** che comunicano, intercettando (e potenzialmente modificando) il traffico — viola l'**integrità**.

**Tecniche comuni per posizionarsi in mezzo:**

- **ARP Spoofing**: invio di messaggi ARP falsificati per associare il proprio MAC address all'IP del gateway o di un altro target, sulla stessa rete locale
- **DNS Spoofing**: risposte DNS false per reindirizzare la vittima verso server controllati dall'attaccante
- **Rogue Access Point**: un finto punto d'accesso Wi-Fi (spesso con nome simile a uno legittimo) che fa transitare tutto il traffico della vittima attraverso l'attaccante
- **BGP Hijacking**: a livello di routing internet, l'attaccante annuncia rotte BGP false — attacco più sofisticato, tipicamente mirato

**Bettercap** è uno strumento molto usato per condurre attacchi MITM (es. ARP spoofing, sniffing, injection) — vedi la sezione dedicata su come invocarlo.

**MITM contro traffico cifrato:**
- **SSL Stripping**: l'attaccante instaura una connessione HTTPS legittima col server ma serve alla vittima contenuto HTTP in chiaro — la vittima potrebbe non notare l'assenza del lucchetto
- **Certificati falsi**: l'attaccante presenta un proprio certificato, funziona se la vittima ignora l'avviso di certificato non valido
- **CA compromesse o fraudolente**: se un attaccante controlla (o inganna) una Certificate Authority fidata, può generare certificati validi per qualsiasi dominio

**Difese moderne:**
- **HSTS**: dice al browser di connettersi solo via HTTPS per un certo periodo, prevenendo lo SSL stripping
- **Certificate Transparency**: log pubblici e auditabili di tutti i certificati emessi
- **Certificate Pinning**: l'app specifica esattamente quali certificati/chiavi accettare
- **DANE**: usa DNSSEC per pubblicare informazioni sui certificati via DNS, come percorso di fiducia alternativo alle CA

Nonostante queste difese, il MITM resta possibile quando: gli utenti ignorano gli avvisi di certificato, le applicazioni non validano correttamente i certificati, il target usa protocolli in chiaro, l'attaccante compromette una CA fidata, o la rete interna non è cifrata.

### Password Attack

Attacchi mirati a violare la **confidenzialità** ottenendo credenziali valide.

| Tipo di attacco | Descrizione |
|---|---|
| **Password guessing** | Basato su informazioni note sul target (nome del cane, anno di nascita...) |
| **Dictionary attack** | Prova parole comuni da una wordlist |
| **Brute force** | Prova tutte le combinazioni possibili — esaustivo ma efficace su password corte |
| **Credential stuffing** | Riusa coppie username/password trapelate da altre violazioni |
| **Password spraying** | Prova poche password comuni su moltissimi account, per evitare i lockout |
| **Hybrid attack** | Combina parole di dizionario con pattern comuni (es. `Summer2024`, `P@ssw0rd`) |

**Hydra** è lo strumento principale per automatizzare questi attacchi contro servizi di rete (FTP, SSH, IMAP, POP3, SMTP, HTTP...):

Esempio:

```bash
hydra -l username -P wordlist.txt server service

# Esempio: attacco FTP
hydra -l mark -P /usr/share/wordlists/rockyou.txt 10.114.170.77 ftp

# Esempio: attacco SSH
hydra -l frank -P /usr/share/wordlists/rockyou.txt 10.114.170.77 ssh

# Con lista di username multipli
hydra -L users.txt -P passwords.txt 10.114.170.77 ssh
```
Comandi di Hydra:
| Opzione | Descrizione |
|---|---|
| `-l` / `-L` | Username singolo / file con lista di username |
| `-p` / `-P` | Password singola / file con lista di password |
| `-s PORT` | Porta non standard |
| `-t n` | Numero di connessioni parallele |
| `-f` | Ferma al primo risultato valido |
| `-V` / `-vV` | Output verboso |


## Tabella riassuntiva delle porte

| Protocollo | Porta | Applicazione | Sicurezza dati |
|---|---|---|---|
| FTP | 21 | Trasferimento file | Cleartext |
| FTPS | 990 | Trasferimento file | Cifrato (implicit TLS) |
| HTTP | 80 | Web | Cleartext |
| HTTPS | 443 | Web | Cifrato (implicit TLS) |
| Telnet | 23 | Accesso remoto | Cleartext |
| SSH | 22 | Accesso remoto / file transfer | Cifrato |
| SMTP | 25 | Email (MTA) | Cleartext |
| SMTP Submission | 587 | Email (MTA, submission) | STARTTLS |
| SMTPS | 465 | Email (MTA) | Cifrato (implicit TLS) |
| POP3 | 110 | Email (MDA) | Cleartext |
| POP3S | 995 | Email (MDA) | Cifrato (implicit TLS) |
| IMAP | 143 | Email (MDA) | Cleartext |
| IMAPS | 993 | Email (MDA) | Cifrato (implicit TLS) |
