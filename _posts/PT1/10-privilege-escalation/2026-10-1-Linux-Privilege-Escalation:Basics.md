---
title: "Linux Privilege Escalation: Basics"
date: 2026-10-01 16:44:00 +0200
categories: [PT1, 10-privilege-escalation]
tags: [linux-privilege-escalation-basics, privilege-escalation]
# description:
---

Vediamo le tecniche di base per fare privilege escalation su sistemi Linux.

## PRIVILEGE ESCALATION: SUDO

Con `sudo -l` abbiamo verificato quali comandi possiamo eseguire come root senza inserire la password. Se tra questi compare un binario che permette di leggere o scrivere file arbitrari, possiamo sfruttarlo direttamente.

### Escalation diretta

`sudo -l` mi dice che posso eseguire `/bin/cat` come root, ed eseguo subito `cat /etc/shadow`

```bash
sudo cat /etc/shadow
```

### Escalation tramite applicazioni


sudo -l mi dice che posso eseguire una app (ex. apache 2) come root, e la eseguo in modo furbo. Ad esempio, per apache 2 posso fargli leggere /etc/shadow come file di configurazione. Mi darà un errore e mi mostrerà la prima riga del file. Da qui proverò a craccare la password offline.

```bash
sudo apache2 -C "LoadModule mpm_event_module /usr/lib/apache2/modules/mod_mpm_event.so" -f /etc/shadow
```


## PRIVILEGE ESCALATION: SUID

Un binario con bit SUID attivo viene eseguito con i privilegi del proprietario del file, indipendentemente da chi lo lancia. Cerchiamo questi binari sul filesystem con:

```bash
find / -type f -perm -04000 -ls 2>/dev/null
```
Se un binario SUID di proprietà di root ci permette di leggere o scrivere file, possiamo usarlo per leggere `/etc/shadow` oppure per aggiungere un nuovo utente con privilegi massimi in `/etc/passwd`.

## PRIVILEGE ESCALATION: PATH

Questa tecnica sfrutta programmi SUID che invocano altri comandi senza specificarne il percorso assoluto, affidandosi alla variabile `$PATH` per trovarli.

### Condizioni necessarie

Prima di procedere verifichiamo:
- quali directory compongono `$PATH` (`echo $PATH`);
- se abbiamo permessi di scrittura in una di esse (o se possiamo aggiungerne una nostra, ad esempio `/tmp`);
- se esiste un binario SUID di root che chiama un comando senza percorso assoluto.

### Svolgimento dell'attacco

Supponiamo di aver individuato un programma SUID che invoca internamente il comando `thm` senza percorso assoluto.

Cerchiamo prima le directory scrivibili:
```bash
find / -type d -writable 2>/dev/null | sort -u
```
Normalmente troviamo /tmp. Anteponiamo quindi la directory al `$PATH`:
```bash
export PATH=/tmp:$PATH
```
Creiamo in quella directory un eseguibile con lo stesso nome del comando atteso, contenente una shell:
```bash
cd /tmp
echo "/bin/bash" > thm
chmod 777 thm
```
A questo punto eseguiamo il programma vulnerabile:
```bash
./program
```
Il programma parte con i privilegi di root grazie al SUID, cerca `thm` nel `$PATH`, trova prima il nostro file in `/tmp` e lo esegue ereditando i privilegi di root.

## PRIVILEGE ESCALATION: CAPABILITIES

Le capabilities introducono una gestione granulare dei privilegi di root: invece di assegnare a un programma tutti i poteri di root, l'amministratore può concedergli solo la capacità specifica di cui ha bisogno (ad esempio `cap_net_bind_service` per aprire porte sotto la 1024).

### Individuare le capabilities

Poiché non si basano sul bit SUID tradizionale, i binari con capabilities non vengono intercettati da una ricerca SUID e vanno cercati con:
```bash
getcap -r / 2>/dev/null
```
Un output come il seguente indica un'anomalia sfruttabile:
```
/home/john/vim = cap_setuid+ep
```
> Da notare che un `ls -l` su questo stesso file non mostrerebbe alcun bit SUID, rendendo questo vettore invisibile alle scansioni tradizionali.

### Sfruttamento

La capability `cap_setuid+ep` permette a un eseguibile di cambiare il proprio UID a piacimento, root incluso. Nel caso di Vim, possiamo sfruttarla tramite il suo supporto a Python integrato:
```bash
./vim -c ':py3 import os; os.setuid(0); os.execl("/bin/sh", "sh", "-c", "reset; exec sh")'
```
Il comando imposta l'UID del processo a 0 e poi sostituisce il processo corrente con una shell, che eredita i privilegi di root.

## PRIVILEGE ESCALATION: CRON

Se un'attività pianificata viene eseguita come root e possiamo modificare lo script che lancia, quello script verrà eseguito con privilegi di root. Possiamo quindi inserire una reverse shell oppure cambiare direttamente la password di root con `echo "root:newpass" | chpasswd`.

Le posizioni da controllare sempre sono:
- `/etc/crontab`
- `/etc/cron.d/` (frammenti crontab inseriti tipicamente dai pacchetti, stesso formato di `/etc/crontab`, incluso il campo utente)
- `/etc/cron.hourly/`, `/etc/cron.daily/`, `/etc/cron.weekly/`, `/etc/cron.monthly/`
- `/var/spool/cron/crontabs/` (su Debian/Ubuntu, i crontab personali di ciascun utente)

## PRIVILEGE ESCALATION: NFS

NFS (Network File Sharing) permette a un sistema Linux di condividere cartelle e file con altri computer sulla rete. La configurazione di queste condivisioni si trova nel file /etc/exports, che solitamente può essere letto dagli utenti per capire quali directory sono accessibili.

Le condivisioni NFS sono definite in `/etc/exports`, generalmente leggibile da chiunque:
```
/backups *(rw,sync,insecure,no_root_squash,no_subtree_check)
```
Per impostazione predefinita NFS applica il *root squashing*: se un utente root sulla macchina client crea un file sulla condivisione, il server lo declassa a un utente non privilegiato. L'opzione `no_root_squash` disattiva questa protezione: se siamo root sulla nostra macchina d'attacco, qualsiasi file che creiamo, incluso un binario con bit SUID, mantiene i privilegi di root anche sul server.

### Svolgimento dell'attacco

Enumeriamo le condivisioni esposte dal target:
```bash
showmount -e <IP_TARGET>
```
Se troviamo una cartella condivisa con `*` (accessibile a tutti), ad esempio `/backups`, la montiamo sulla nostra macchina:
```bash
mkdir /tmp/backupsonattackermachine
mount -o rw <IP_TARGET>:/backups /tmp/backupsonattackermachine
```
Nella cartella montata scriviamo un piccolo programma in C che apre una shell con UID/GID 0:
```c
int main() {
    setgid(0);
    setuid(0);
    system("/bin/bash");
    return 0;
}
```
Essendo root sulla nostra macchina, possiamo compilarlo e attivare il bit SUID senza restrizioni:
```bash
gcc nfs.c -o nfs -w -static
chmod +s nfs
```
Grazie a `no_root_squash`, il binario viene salvato sul server con proprietà `root:root` e bit SUID attivo. Spostandoci sulla macchina vittima ed eseguendo il binario dalla cartella condivisa otteniamo una shell come root:
```bash
./nfs
```

title: “Linux Privilege Escalation: Basics”
date: 2026-10-01 16:44:00 +0200
categories: [Cyber Security 101, Linux]
tags: [linux-privilege-escalation-basics, privilege-escalation]

description:
Vediamo le tecniche di base per fare privilege escalation su sistemi Linux.

PRIVILEGE ESCALATION: SUDO
Con sudo -l abbiamo verificato quali comandi possiamo eseguire come root senza inserire la password. Se tra questi compare un binario che permette di leggere o scrivere file arbitrari, possiamo sfruttarlo direttamente.

Escalation diretta
sudo -l mi dice che posso eseguire /bin/cat come root, ed eseguo subito cat /etc/shadow

sudo cat /etc/shadow
Escalation tramite applicazioni
sudo -l mi dice che posso eseguire una app (ex. apache 2) come root, e la eseguo in modo furbo. Ad esempio, per apache 2 posso fargli leggere /etc/shadow come file di configurazione. Mi darà un errore e mi mostrerà la prima riga del file. Da qui proverò a craccare la password offline.

sudo apache2 -C "LoadModule mpm_event_module /usr/lib/apache2/modules/mod_mpm_event.so" -f /etc/shadow
PRIVILEGE ESCALATION: SUID
Un binario con bit SUID attivo viene eseguito con i privilegi del proprietario del file, indipendentemente da chi lo lancia. Cerchiamo questi binari sul filesystem con:

find / -type f -perm -04000 -ls 2>/dev/null
Se un binario SUID di proprietà di root ci permette di leggere o scrivere file, possiamo usarlo per leggere /etc/shadow oppure per aggiungere un nuovo utente con privilegi massimi in /etc/passwd.

PRIVILEGE ESCALATION: PATH
Questa tecnica sfrutta programmi SUID che invocano altri comandi senza specificarne il percorso assoluto, affidandosi alla variabile $PATH per trovarli.

Condizioni necessarie
Prima di procedere verifichiamo:

quali directory compongono $PATH (echo $PATH);
se abbiamo permessi di scrittura in una di esse (o se possiamo aggiungerne una nostra, ad esempio /tmp);
se esiste un binario SUID di root che chiama un comando senza percorso assoluto.
Svolgimento dell’attacco
Supponiamo di aver individuato un programma SUID che invoca internamente il comando thm senza percorso assoluto.

Cerchiamo prima le directory scrivibili:

find / -type d -writable 2>/dev/null | sort -u
Normalmente troviamo /tmp. Anteponiamo quindi la directory al $PATH:

export PATH=/tmp:$PATH
Creiamo in quella directory un eseguibile con lo stesso nome del comando atteso, contenente una shell:

cd /tmp
echo "/bin/bash" > thm
chmod 777 thm
A questo punto eseguiamo il programma vulnerabile:

./program
Il programma parte con i privilegi di root grazie al SUID, cerca thm nel $PATH, trova prima il nostro file in /tmp e lo esegue ereditando i privilegi di root.

PRIVILEGE ESCALATION: CAPABILITIES
Le capabilities introducono una gestione granulare dei privilegi di root: invece di assegnare a un programma tutti i poteri di root, l’amministratore può concedergli solo la capacità specifica di cui ha bisogno (ad esempio cap_net_bind_service per aprire porte sotto la 1024).

Individuare le capabilities
Poiché non si basano sul bit SUID tradizionale, i binari con capabilities non vengono intercettati da una ricerca SUID e vanno cercati con:

getcap -r / 2>/dev/null
Un output come il seguente indica un’anomalia sfruttabile:

/home/john/vim = cap_setuid+ep
Da notare che un ls -l su questo stesso file non mostrerebbe alcun bit SUID, rendendo questo vettore invisibile alle scansioni tradizionali.

Sfruttamento
La capability cap_setuid+ep permette a un eseguibile di cambiare il proprio UID a piacimento, root incluso. Nel caso di Vim, possiamo sfruttarla tramite il suo supporto a Python integrato:

./vim -c ':py3 import os; os.setuid(0); os.execl("/bin/sh", "sh", "-c", "reset; exec sh")'
Il comando imposta l’UID del processo a 0 e poi sostituisce il processo corrente con una shell, che eredita i privilegi di root.

PRIVILEGE ESCALATION: CRON
Se un’attività pianificata viene eseguita come root e possiamo modificare lo script che lancia, quello script verrà eseguito con privilegi di root. Possiamo quindi inserire una reverse shell oppure cambiare direttamente la password di root con echo "root:newpass" | chpasswd.

Le posizioni da controllare sempre sono:

/etc/crontab
/etc/cron.d/ (frammenti crontab inseriti tipicamente dai pacchetti, stesso formato di /etc/crontab, incluso il campo utente)
/etc/cron.hourly/, /etc/cron.daily/, /etc/cron.weekly/, /etc/cron.monthly/
/var/spool/cron/crontabs/ (su Debian/Ubuntu, i crontab personali di ciascun utente)
PRIVILEGE ESCALATION: NFS
NFS (Network File Sharing) permette a un sistema Linux di condividere cartelle e file con altri computer sulla rete. La configurazione di queste condivisioni si trova nel file /etc/exports, che solitamente può essere letto dagli utenti per capire quali directory sono accessibili.

Le condivisioni NFS sono definite in /etc/exports, generalmente leggibile da chiunque:

/backups *(rw,sync,insecure,no_root_squash,no_subtree_check)
Per impostazione predefinita NFS applica il root squashing: se un utente root sulla macchina client crea un file sulla condivisione, il server lo declassa a un utente non privilegiato. L’opzione no_root_squash disattiva questa protezione: se siamo root sulla nostra macchina d’attacco, qualsiasi file che creiamo, incluso un binario con bit SUID, mantiene i privilegi di root anche sul server.

Svolgimento dell’attacco
Enumeriamo le condivisioni esposte dal target:

showmount -e <IP_TARGET>
Se troviamo una cartella condivisa con * (accessibile a tutti), ad esempio /backups, la montiamo sulla nostra macchina:

mkdir /tmp/backupsonattackermachine
mount -o rw <IP_TARGET>:/backups /tmp/backupsonattackermachine
Nella cartella montata scriviamo un piccolo programma in C che apre una shell con UID/GID 0:

int main() {
    setgid(0);
    setuid(0);
    system("/bin/bash");
    return 0;
}
Essendo root sulla nostra macchina, possiamo compilarlo e attivare il bit SUID senza restrizioni:

gcc nfs.c -o nfs -w -static
chmod +s nfs
Grazie a no_root_squash, il binario viene salvato sul server con proprietà root:root e bit SUID attivo. Spostandoci sulla macchina vittima ed eseguendo il binario dalla cartella condivisa otteniamo una shell come root:

./nfs
Markdown 6516 bytes 930 words 151 lines Ln 130, Col 18HTML 5268 characters 874 words 80 paragraphs