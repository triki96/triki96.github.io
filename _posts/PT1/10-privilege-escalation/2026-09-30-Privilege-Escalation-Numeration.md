---
title: Linux Privilege Escalation - Enumeration
date: 2026-09-30 18:40:00 +0200
categories: [PT1, 10-privilege-escalation]
tags: [linux-privilege-escalation-enumeration, enumeration, linux, privilege-escalation, find, netstat, cron, suid]
# description:
---

Manuale di riferimento per l'**enumerazione manuale** di un host Linux dopo l'accesso iniziale. L'enumerazione è la fase più critica dell'escalation dei privilegi: prima di sfruttare qualcosa bisogna capire cosa gira, chi lo esegue e cosa è configurato male. Kernel, applicazioni installate, linguaggi disponibili e password di altri utenti determinano il percorso verso la root shell.

Il documento è organizzato in quattro blocchi: **sistema operativo**, **utenti**, **rete**, **file**. In fondo c'è una tabella riassuntiva da usare come cheat sheet.

## 1. Enumerazione del sistema operativo

### Panoramica

| Comando | Cosa restituisce | Perché serve |
|---|---|---|
| `hostname` | Nome dell'host | Può rivelare il ruolo nella rete (es. `SQL-PROD-01`), ma è facilmente modificabile |
| `uname -a` | Sistema operativo, hostname, versione del kernel | Cercare vulnerabilità del kernel |
| `cat /proc/version` | Versione del kernel, compilatore e macchina di build | Completa `uname -a` |
| `cat /etc/issue` | Distribuzione e versione | Identificare il sistema operativo |
| `ps` | Processi in esecuzione | Capire cosa gira e con quale utente |
| `cat /etc/crontab` | Attività pianificate di sistema | Trovare job privilegiati modificabili |
| `dpkg -l` | Pacchetti installati e versioni | Cercare binari vulnerabili con exploit noti |

{: .prompt-info }
> Qualsiasi file che contiene informazioni di sistema può essere personalizzato o modificato. Per avere un quadro chiaro conviene consultarli tutti e confrontarli.

### uname

```bash
uname -a
```

```text
Linux home 6.8.0-41-generic
```

- **Linux**: sistema operativo
- **home**: hostname
- **6.8.0-41-generic**: versione del kernel

### /proc/version

Il filesystem `proc` (procfs) espone informazioni sui processi di sistema ed è presente su molte distribuzioni. `/proc/version` indica la versione del kernel e il compilatore usato per crearlo.

```bash
cat /proc/version
```

```text
Linux version 6.8.0-41-generic (buildd@lcy02-amd64-077) (x86_64-linux-gnu-gcc-13 (Ubuntu 13.2.0-23ubuntu4) 13.2.0, GNU ld (GNU Binutils for Ubuntu) 2.42)
```

| Elemento | Significato |
|---|---|
| `6.8.0-41-generic` | Versione del kernel |
| `buildd@lcy02-amd64-077` | Macchina che ha compilato il kernel |
| `x86_64-linux-gnu-gcc-13` | Compilatore usato |
| `GNU ld (GNU Binutils for Ubuntu) 2.42` | Linker usato nella build |

### /etc/issue

```bash
cat /etc/issue
```

```text
Ubuntu 22.04.1 LTS \n \l
```

Indica la versione della distribuzione (qui Ubuntu 22.04.1 LTS).

### ps

`ps` senza opzioni mostra solo i processi della shell corrente. Le colonne sono:

| Colonna | Significato |
|---|---|
| PID | ID univoco del processo |
| TTY | Terminale usato dall'utente |
| TIME | Tempo di CPU consumato (**non** da quanto tempo gira) |
| CMD | Comando o eseguibile (senza parametri) |

Le opzioni utili:

| Comando | Significato |
|---|---|
| `ps aux` | `a` processi di tutti gli utenti, `u` mostra l'utente che li ha lanciati, `x` include i processi senza terminale |
| `ps axjf` | `a` tutti gli utenti, `x` senza terminale, `j` formato job, `f` vista ad albero (forest) |

```bash
ps axjf
```

```text
  1  1039  1039  1039 ?           -1 Ss       0   0:00 /usr/sbin/sshd -D
1039  1854  1854  1854 ?           -1 Ss       0   0:00  \_ sshd: karen [priv]
1854  1890  1854  1854 ?           -1 S     1001   0:00      \_ sshd: karen@pts/0
1890  1891  1891  1891 pts/0     1975 Ss    1001   0:00          \_ -sh
1891  1975  1975  1891 pts/0     1975 R+    1001   0:00              \_ ps axjf
```

### Cron

Cron è lo scheduler a tempo di Linux: esegue comandi o script a intervalli stabiliti (backup, rotazione dei log, manutenzione). Se un job gira con un utente privilegiato e lo script che esegue è modificabile, diventa un vettore di escalation.

```bash
cat /etc/crontab
ls -la /var/spool/cron/
ls -la /etc/cron.d/
```

Esempio di riga:

```text
30 2 * * 1 root /home/ubuntu/clear-mail.sh
```

| Campo | Significato | Valori |
|---|---|---|
| 1 | Minuto | 0-59 |
| 2 | Ora | 0-23 |
| 3 | Giorno del mese | 1-31 |
| 4 | Mese | 1-12 |
| 5 | Giorno della settimana | 0-7 (0 e 7 = domenica) |
| 6 | Utente che esegue il task | |
| 7 | Comando o script da eseguire | |

La riga sopra esegue `/home/ubuntu/clear-mail.sh` **ogni lunedì alle 2:30** come **root**.

{: .prompt-tip }
> In `/etc/crontab` guardare sempre il sesto campo (l'utente) e i permessi dello script indicato: root + script scrivibile = escalation diretta.

### dpkg

```bash
dpkg -l
```

Elenca tutti i pacchetti installati con la loro versione. Utile per cercare binari vulnerabili con exploit noti (vale per sistemi Debian/Ubuntu).

## 2. Enumerazione degli utenti

| Comando | Cosa fa |
|---|---|
| `id` | Livello di privilegio dell'utente corrente e appartenenza ai gruppi |
| `id <utente>` | Stesse informazioni per un altro utente |
| `env` | Variabili d'ambiente |
| `history` | Comandi eseguiti in precedenza |
| `sudo -l` | Comandi che l'utente può eseguire con sudo |
| `cat /etc/passwd` | Utenti presenti nel sistema |

### id

```bash
id
id matt
```

```text
uid=1001(john) gid=1001(john) groups=1001(john),100(users)
uid=1002(matt) gid=1002(matt) groups=1002(matt),27(sudo),116(admin)
```

Nell'esempio `matt` appartiene ai gruppi `sudo` e `admin`: è un candidato interessante.

### env

Mostra le variabili d'ambiente. In `PATH` si può trovare un compilatore o un linguaggio di scripting (es. Python) utilizzabile per eseguire codice sul target.

### history

Rivela i comandi precedenti e dà un'idea di come viene usato il sistema. Raramente contiene password o nomi utente, ma vale sempre la pena controllare.

### sudo -l

Elenca i comandi eseguibili con privilegi elevati. A seconda della configurazione può richiedere la password dell'utente corrente.

### /etc/passwd

```bash
cat /etc/passwd
```

Per ricavare solo i nomi utente (utile per liste da usare in attacchi di brute force):

```bash
cat /etc/passwd | cut -d ":" -f 1
```

Questo comando restituisce anche utenti di sistema e di servizio, poco utili. Gli utenti reali hanno di solito la home sotto `/home`:

```bash
cat /etc/passwd | grep /home
```

```text
matt:x:1000:1000:matt,,,:/home/matt:/bin/bash
karen:x:1001:1001::/home/karen:
```

## 3. Enumerazione della rete

### Interfacce di rete

```bash
ifconfig
ip addr
```

`ip addr` è l'equivalente moderno di `ifconfig` (che esiste ancora nel pacchetto `net-tools`). Serve a capire se l'host può essere un punto di **pivoting** verso un'altra rete. Nell'esempio l'interfaccia `docker0` (172.17.0.1) suggerisce che Docker sia in esecuzione sull'host, mentre `ens5` (10.80.96.65) è l'interfaccia di rete principale.

### netstat

`netstat` mostra le connessioni esistenti. Su sistemi moderni è sostituito da `ss` (es. `ss -tpl` equivale a `netstat -tpl`); `netstat` resta disponibile nel pacchetto `net-tools`.

| Comando | Cosa mostra |
|---|---|
| `netstat -a` | Tutte le porte in ascolto e le connessioni stabilite |
| `netstat -at` / `netstat -au` | Solo TCP / solo UDP |
| `netstat -l` | Solo le porte in ascolto (pronte ad accettare connessioni) |
| `netstat -lt` | Porte in ascolto solo TCP |
| `netstat -s` | Statistiche di utilizzo della rete per protocollo (limitabile con `-t` o `-u`) |
| `netstat -tp` | Connessioni con nome del servizio e PID |
| `netstat -tpln` | Porte TCP in ascolto con PID/programma, in formato numerico |
| `netstat -i` | Statistiche delle interfacce |
| `netstat -ano` | Tutti i socket, senza risoluzione dei nomi, con i timer |

Significato dei flag più usati:

| Flag | Significato |
|---|---|
| `-a` | Mostra tutti i socket |
| `-t` / `-u` | Solo TCP / solo UDP |
| `-l` | Solo socket in ascolto |
| `-p` | Mostra PID e nome del programma |
| `-n` | Formato numerico per IP e porte (non risolve i nomi) |
| `-o` | Mostra i timer |
| `-s` | Statistiche per protocollo |
| `-i` | Statistiche delle interfacce |

{: .prompt-info }
> Se la colonna `PID/Program name` è vuota, il processo appartiene a un altro utente. Lo stesso comando eseguito come root la popola (es. `1144/slapd`).

Esempio di `netstat -ano`:

```text
Proto Recv-Q Send-Q Local Address           Foreign Address         State       Timer
tcp        0      0 0.0.0.0:389             0.0.0.0:*               LISTEN      off (0.00/0/0)
tcp        0      0 127.0.0.1:5432          0.0.0.0:*               LISTEN      off (0.00/0/0)
tcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN      off (0.00/0/0)
tcp        0      0 0.0.0.0:80              0.0.0.0:*               LISTEN      off (0.00/0/0)
```

{: .prompt-tip }
> I servizi in ascolto solo su `127.0.0.1` (come PostgreSQL sopra) non sono raggiungibili dall'esterno ma possono esserlo da dentro l'host: sono da annotare.

## 4. Enumerazione dei file

### ls

Usare sempre `ls -la`: senza `-a` i file nascosti (che iniziano con `.`) non compaiono.

```bash
ls
ls -l
ls -la
```

```text
total 24
drwxrwxrwt  4 root  root  4096 Feb 16 04:36 .
drwxr-xr-x 23 root  root  4096 Jun 18  2021 ..
-rw-rw-r--  1 karen karen   23 Feb 16 04:36 .secret.txt
```

Nell'esempio `.secret.txt` sfugge sia a `ls` sia a `ls -l`.

### find

Il comando `find` è il più importante di questa sezione. Ha la sintassi `find <dove> <criteri>`.

{: .prompt-tip }
> `find` produce molti errori (permesso negato). Aggiungere `2>/dev/null` in fondo per scartarli e leggere solo i risultati utili.

#### Per nome e tipo

| Comando | Cosa trova |
|---|---|
| `find . -name flag1.txt` | Il file `flag1.txt` nella directory corrente e sottodirectory |
| `find /home -name flag1.txt` | Il file `flag1.txt` sotto `/home` |
| `find / -type d -name config` | La directory `config` sotto `/` |
| `find /home -user frank` | Tutti i file dell'utente `frank` sotto `/home` |

#### Per permessi

| Comando | Cosa trova |
|---|---|
| `find / -type f -perm 0777` | File con permessi 777 (leggibili, scrivibili ed eseguibili da tutti) |
| `find / -perm -a=x` | File eseguibili |
| `find / -perm -o=x -type d 2>/dev/null` | Cartelle eseguibili da tutti gli utenti |
| `find / -writable -type d 2>/dev/null` | Cartelle scrivibili da tutti (world-writable) |
| `find / -perm -222 -type d 2>/dev/null` | Cartelle world-writable (forma alternativa) |
| `find / -perm -o=w -type d 2>/dev/null` | Cartelle world-writable (forma alternativa) |
| `find / -perm -u=s -type f 2>/dev/null` | File con bit **SUID** |

Il bit SUID permette di eseguire il file con il livello di privilegio del proprietario e non di chi lo lancia: un binario SUID di root gira come root.

Le tre forme di `-perm` si comportano diversamente:

| Forma | Significato |
|---|---|
| `-perm mode` | I permessi sono **esattamente** `mode` |
| `-perm -mode` | **Tutti** i bit di `mode` sono impostati (la forma più usata) |
| `-perm /mode` | **Almeno uno** dei bit di `mode` è impostato |

#### Per tempo

| Comando | Cosa trova |
|---|---|
| `find / -mtime -10` | File modificati negli ultimi 10 giorni |
| `find / -atime -10` | File a cui si è avuto accesso negli ultimi 10 giorni |
| `find / -cmin -60` | File modificati nell'ultima ora (60 minuti) |
| `find / -amin -60` | File a cui si è avuto accesso nell'ultima ora |

#### Per dimensione

| Comando | Cosa trova |
|---|---|
| `find / -size +50M` | File di almeno 50 MB |
| `find / -size +100M` | File di almeno 100 MB |

I segni `+` e `-` indicano rispettivamente "più grande di" e "più piccolo di" la dimensione data.

#### Strumenti di sviluppo e linguaggi

```bash
find / -name perl*
find / -name python*
find / -name gcc*
```

Servono a capire cosa si può usare sul target per compilare o eseguire codice.

#### Ricerca con wildcard

```bash
find / -name pass*.txt
```

Trova nomi come `pass.txt`, `password.txt`, `passwords.txt`.

### locate

`locate <nome>` cerca un file interrogando un database di indici, quindi è molto più veloce di `find`, ma può non essere aggiornato e non trova file creati dopo l'ultimo aggiornamento del database (`updatedb`).

## Cheat sheet

| Obiettivo | Comando |
|---|---|
| Nome dell'host | `hostname` |
| Kernel e OS | `uname -a`, `cat /proc/version`, `cat /etc/issue` |
| Processi | `ps aux`, `ps axjf` |
| Cron | `cat /etc/crontab`, `ls -la /var/spool/cron/ /etc/cron.d/` |
| Pacchetti installati | `dpkg -l` |
| Chi sono e in quali gruppi | `id` |
| Gruppi di un altro utente | `id <utente>` |
| Variabili d'ambiente | `env` |
| Comandi passati | `history` |
| Comandi sudo consentiti | `sudo -l` |
| Utenti reali | `cat /etc/passwd \| grep /home` |
| Interfacce di rete | `ip addr` (o `ifconfig`) |
| Porte in ascolto con PID | `netstat -tpln` (o `ss -tpl`) |
| File nascosti | `ls -la` |
| File world-writable | `find / -writable -type d 2>/dev/null` |
| Binari SUID | `find / -perm -u=s -type f 2>/dev/null` |
| Strumenti disponibili | `find / -name gcc*`, `find / -name python*` |
| Password in chiaro | `find / -name pass*.txt 2>/dev/null` |

{: .prompt-info }
> L'enumerazione da sola raramente indica un percorso di escalation, ma costruisce il quadro che permette di trovarlo. Conviene familiarizzare anche con `grep`, `cut`, `sort` e `locate`, che aiutano a filtrare l'output.
