---
title: "Linux Fundamentals"
date: 2026-08-08 10:00:00 +0200
categories: [Cyber Security 101]
tags: [a-journey-into-cybersecurity, linux, linux-fundamentals, shell, directories, passwd]
description: "Comandi essenziali, operatori shell, permessi e directory principali di un sistema Linux."
toc: true
---


In questa sezione parleremo unicamente di Linux.

## Comandi essenziali

| Comando | Cosa fa |
|---|---|
| `echo` | Stampa testo a schermo |
| `whoami` | Mostra l'utente con cui si è collegati |
| `ls` | Elenca il contenuto di una directory |
| `cd` | Cambia directory corrente |
| `cat` | Mostra il contenuto di un file |
| `pwd` | Mostra il percorso della directory corrente (print working directory) |

## Cercare file e testo

```bash
find -name passwords.txt
find -name *.txt
```
`find` cerca file nel filesystem in base a criteri come il nome.

```bash
grep "81.143.211.90" access.log
grep -R "PRETTY_NAME" /etc/
```
`grep` cerca una stringa dentro uno o più file. Il flag `-R` rende la ricerca ricorsiva su tutte le sottodirectory.

## Operatori della shell

| Operatore | Descrizione |
|---|---|
| `&` | Esegue il comando in background nel terminale |
| `&&` | Combina più comandi in una sola riga, eseguendo il secondo solo se il primo va a buon fine |
| `>` | Redireziona l'output di un comando su un file, **sovrascrivendo** il contenuto esistente |
| `>>` | Come `>`, ma **accoda** l'output al file invece di sovrascriverlo |

## Flag e switch

Sono i parametri passati a un comando per modificarne il comportamento (es. `-v`, `--verbose`). Nella pratica "flag" e "switch" sono spesso usati come sinonimi; quando si fa una distinzione, "flag" indica tipicamente un'opzione booleana (senza valore aggiuntivo, es. `-l` in `ls -l`), mentre "switch"/"opzione" può richiedere anche un valore (es. `-p 80,443` in `nmap`).

## Il manuale (man)

```bash
man ls
```
Mostra la documentazione ufficiale di un comando: sintassi, tutte le opzioni disponibili, esempi d'uso — il primo posto dove cercare quando non si ricorda un flag specifico.

## Come funziona SSH

SSH (Secure Shell) permette di aprire una sessione di terminale remota su un'altra macchina, con il traffico cifrato end-to-end. Il client apre una connessione TCP (tipicamente sulla porta 22) verso il server, avviene uno scambio di chiavi per stabilire un canale cifrato, poi si autentica (con password o chiave crittografica) e infine ottiene una shell interattiva sulla macchina remota — lo stesso meccanismo usato per accedere alle macchine CTF una volta ottenute le credenziali.

## Comandi di gestione file

| Comando | Significato | Cosa fa |
|---|---|---|
| `touch` | touch | Crea un file vuoto |
| `mkdir` | make directory | Crea una cartella |
| `cp` | copy | Copia un file o una cartella |
| `mv` | move | Sposta (o rinomina) un file o una cartella |
| `rm` | remove | Elimina un file o una cartella |
| `file` | file | Determina il tipo di un file |

## Permessi: formato simbolico

```bash
ls -lh
-rw-r--r-- 1 cmnatic cmnatic 0 Feb 19 10:37 file1
-rw-r--r-- 8 cmnatic cmnatic 0 Feb 19 10:37 file2
```

I nove caratteri dopo il tipo di file (`-` per file normale, `d` per directory) si leggono in tre gruppi da tre: permessi del **proprietario**, del **gruppo**, e di **altri** — in quest'ordine. Ogni gruppo di tre indica rispettivamente lettura (`r`), scrittura (`w`) ed esecuzione (`x`), con `-` al posto della lettera quando il permesso manca.

## Differenza tra utente e gruppo

Ogni file ha tre livelli distinti di permessi: proprietario, gruppo e altri, completamente indipendenti tra loro. Questo permette, ad esempio, che il server web (utente `www-data`) resti proprietario di un file ma un gruppo di utenti condiviso (es. `webhosting-clienti`) abbia comunque permessi di lettura/scrittura sullo stesso file, senza che i clienti diventino mai `www-data` e senza che ottengano accesso ai file di altri clienti in gruppi diversi:

```bash
chown www-data:webhosting-clienti index.html
chmod 664 index.html
```

Se un cliente viene compromesso, l'attaccante ottiene solo i permessi del gruppo condiviso sui file a cui quel gruppo ha accesso — non l'intero server. È un esempio concreto del principio di minimo privilegio.

## Permessi in formato numerico

Ogni permesso ha un valore numerico:

| Permesso | Valore |
|---|---|
| Lettura (r) | 4 |
| Scrittura (w) | 2 |
| Esecuzione (x) | 1 |

Il valore numerico di ciascun gruppo (proprietario/gruppo/altri) è la somma dei permessi attivi:

| Simbolico | Numerico | Significato |
|---|---|---|
| `rwxr-xr-x` | 755 | Il proprietario può fare tutto, gli altri possono leggere ed eseguire |
| `rw-r--r--` | 644 | Il proprietario può leggere/scrivere, gli altri solo leggere |
| `rwx------` | 700 | Solo il proprietario ha accesso |

Il calcolo è diretto: per ottenere `7` si sommano tutti e tre i permessi (4+2+1), per `5` lettura ed esecuzione senza scrittura (4+1), per `4` solo lettura.

## Directory comuni

**`/etc`** — configurazione di sistema. Contiene i file di configurazione del sistema operativo e dei servizi, non programmi né dati utente.
```bash
ls /etc
shadow passwd sudoers sudoers.d
```
- `/etc/sudoers`: chi può usare `sudo` e con quali privilegi — uno dei primi file controllati in fase di enumerazione, perché una configurazione permissiva qui è spesso la via più diretta alla privilege escalation
- `/etc/passwd`: elenco degli utenti del sistema (nome, UID, home, shell) — leggibile da chiunque, non contiene più le password vere
- `/etc/shadow`: gli hash delle password (formato SHA-512) — leggibile solo da root

**`/var`** — dati che cambiano nel tempo (variable data): log, cache, database, tutto ciò che cresce durante il funzionamento normale del sistema.
```bash
ls /var
backups log opt tmp
```
`/var/log` in particolare è fondamentale sia lato blue team (investigare un incidente) sia lato red team (capire se le proprie azioni vengono registrate).

**`/root`** — la home directory dell'utente root, concettualmente identica a `/home/nomeutente` ma dedicata all'amministratore di sistema.
```bash
ls /root
myfile myfolder passwords.xlsx
```
Riuscire a leggere il contenuto di `/root` significa già avere ottenuto privilegi di root — spesso l'obiettivo finale di una CTF, con la flag "root.txt".

**`/tmp`** — spazio temporaneo, **scrivibile da qualsiasi utente per default**, indipendentemente dai privilegi.
```bash
ls /tmp
todelete trash.txt rubbish.bin
```
Essendo volatile (si svuota al riavvio) e scrivibile da chiunque, è il posto naturale dove caricare i propri strumenti (script di enumerazione, exploit) una volta ottenuto un accesso iniziale a bassi privilegi.

## Editor di testo da terminale

- **nano**: editor semplice, pensato per essere immediato — i comandi disponibili sono mostrati direttamente in fondo allo schermo
- **vim**: editor modale (modalità normale/inserimento/comando), più ostico all'inizio ma molto più potente per editing avanzato — praticamente onnipresente su qualunque sistema Linux

## Altri comandi utili da shell

**Servire un file via HTTP con Python**, senza installare nulla:
```bash
python -m http.server
```
Avvia un web server minimale nella directory corrente (di default sulla porta 8000).

**Scaricarlo da un altro host con `wget`:**
```bash
wget http://<machine_ip>:8000/file.txt
```

**`scp` (secure copy)** — copia file su un canale cifrato SSH, in entrambe le direzioni:
```bash
# Dal locale al remoto
scp file.txt utente@<machine_ip>:/percorso/destinazione/

# Dal remoto al locale
scp utente@<machine_ip>:/percorso/file.txt ./
```

## Processi

| Comando | Cosa fa |
|---|---|
| `ps` | Mostra i processi della sessione corrente |
| `ps aux` | Mostra tutti i processi di sistema, di tutti gli utenti, con dettagli (CPU, memoria) |
| `top` | Mostra i processi in tempo reale, aggiornati dinamicamente |

**Background e foreground:**
```bash
comando &          # avvia il comando direttamente in background
```
Oppure, con un comando già in esecuzione in foreground: `Ctrl+Z` lo sospende, poi `fg` lo riporta in primo piano.

### systemd e systemctl

Sono due cose diverse per natura, non alternative tra loro — uno è il sistema, l'altro è lo strumento per controllarlo.

**systemd** è il sistema di init stesso — il processo con PID 1, il primo che il kernel Linux avvia quando la macchina si accende, da cui derivano direttamente o indirettamente tutti gli altri processi del sistema. È un insieme di componenti che lavorano insieme: `systemd` (il processo PID 1, gestisce avvio e supervisione dei servizi), `systemd-journald` (gestisce i log), `systemd-logind` (gestisce le sessioni utente), `systemd-networkd`, `systemd-resolved`, e altri componenti specializzati. In pratica, è "il motore" che gira sempre in background, gestendo attivamente il ciclo di vita dei servizi.

**systemctl** è lo strumento a riga di comando con cui si parla con systemd, gli si danno istruzioni e si chiedono informazioni. Non fa nulla da solo: comunica con il processo systemd (tramite D-Bus) e traduce i comandi in richieste che systemd esegue effettivamente.

> Un'analogia utile: systemd è il motore di un'auto — è quello che fa effettivamente funzionare tutto, sempre acceso. systemctl è il cruscotto/i comandi con cui si interagisce con quel motore — accenderlo, spegnerlo, controllarne lo stato — ma il cruscotto da solo non fa muovere l'auto, è solo l'interfaccia.
{: .prompt-tip }

## Automatizzare processi con Crontab

**cron** è il demone che esegue comandi/script a orari programmati. La programmazione va scritta nel file **crontab**, modificabile con:
```bash
crontab -e
```

Sintassi di una riga crontab:
```
0 5 * * 1 tar -czf backup.tar.gz /home/utente
```
I primi cinque campi indicano rispettivamente minuto, ora, giorno del mese, mese, giorno della settimana — in questo esempio: ogni lunedì (`1`) alle 5:00 (`0 5`), ogni mese (`*`) e ogni giorno del mese (`*`).

## Gestione pacchetti

Un **repository** (deposito/archivio) è un server remoto che contiene pacchetti software pronti da scaricare e installare. Quando gli sviluppatori vogliono distribuire software su sistemi Debian/Ubuntu, lo sottomettono a un repository — se approvato, chiunque può installarlo tramite `apt`.

Perché è considerato un punto di forza di Linux:
- **Accessibilità**: non serve cercare il sito di ogni programma e scaricare installer manualmente — tutto passa da un sistema centralizzato
- **Merito dell'open source**: chiunque può contribuire software alla comunità, non solo il vendor ufficiale

**Dove vivono i repository configurati** (su Ubuntu):
```bash
cat /etc/apt/sources.list          # repository principali di default
ls /etc/apt/sources.list.d/        # repository aggiuntivi, uno per file
```
Ogni riga ha un formato tipo:
```
deb https://download.sublimetext.com/ apt/stable/
```

**Repository ufficiali vs community**: quelli ufficiali sono mantenuti direttamente da Canonical (software testato e affidabile per quella versione specifica); quelli community/terze parti sono aggiunti manualmente, spesso per software che non è (o non può essere, per licenza) incluso nei repository ufficiali — es. Sublime Text, Google Chrome, driver proprietari. Esistono anche repository geografici ("mirror") più vicini geograficamente, per velocizzare i download.

### Il ruolo delle chiavi GPG

Quando si scarica un pacchetto da un repository di terze parti, la firma crittografica GPG garantisce che non sia stato manomesso (attacco man-in-the-middle, o server compromesso):

1. Lo sviluppatore firma i propri pacchetti con la propria chiave privata GPG
2. Prima di fidarsi del repository, si importa la loro chiave pubblica nel sistema
3. Ogni volta che si scarica un pacchetto, `apt` verifica che la firma corrisponda alla chiave pubblica dichiarata fidata
4. Se non corrisponde, `apt` rifiuta l'installazione

> Concettualmente identico al discorso sui certificati SSL/TLS — stessa logica di catena di fiducia, applicata qui ai pacchetti software invece che alle connessioni di rete.
{: .prompt-tip }

**Esempio pratico completo (Sublime Text):**

```bash
# 1. Scarica e fidati della chiave GPG (metodo moderno, non deprecato)
wget -qO- https://download.sublimetext.com/sublimehq-pub.gpg | gpg --dearmor | sudo tee /etc/apt/trusted.gpg.d/sublimehq-archive.gpg > /dev/null

# 2. Aggiungi il repository come file separato
sudo nano /etc/apt/sources.list.d/sublime-text.list

# 3. Aggiorna la cache di apt
sudo apt update

# 4. Installa il software
sudo apt install sublime-text
```

`wget -qO -` scarica il file e lo stampa sullo standard output invece di salvarlo su disco; il risultato viene passato con una pipe direttamente al comando successivo.

**Rimuovere un repository**, in due casi diversi:
```bash
# Se aggiunto con add-apt-repository
sudo add-apt-repository --remove ppa:nome_ppa/ppa

# Se aggiunto manualmente
sudo rm /etc/apt/sources.list.d/sublime-text.list
sudo apt remove sublime-text
```

## Log

I log sono salvati in `/var/log`, divisi per processo/servizio (es. `apache2`, `syslog`):
```bash
cat /var/log/syslog
```
