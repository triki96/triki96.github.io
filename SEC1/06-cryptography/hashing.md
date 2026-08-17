---
title: "Hashing"
date: 2026-08-13 10:00:00 +0200
categories: [Cyber Security 101]
tags: [cryptography, hashing]
description: "Come si salvano le password, cosa sono le rainbow table e come difendersi con il salting, e come funziona HMAC."
toc: true
---

## Intro

Considerando il problema di salvare una password, viene naturale chiedersi: perché non cifrarla? Il motivo è che, anche scegliendo un algoritmo di cifratura sicuro, servirebbe comunque **conservare la chiave** usata per cifrarle. Da qui la necessità delle funzioni di Hash.

### Linux: /etc/shadow e il formato dell'hash

Su Linux, gli hash delle password sono salvati in `/etc/shadow`, normalmente leggibile solo da root. In passato venivano salvati in `/etc/passwd`, leggibile da chiunque — un rischio di sicurezza significativo che ha portato alla separazione attuale.

Il campo della password cifrata contiene l'hash con quattro componenti: prefisso (ID dell'algoritmo), opzioni (parametri), salt, e hash — nel formato:
```
$prefix$options$salt$hash
```

Il prefisso rende facilmente riconoscibile quale algoritmo di hashing è stato usato:

| Prefisso | Algoritmo |
|---|---|
| `$y$` | **yescrypt** — schema scalabile, default e raccomandato sui sistemi nuovi |
| `$gy$` | **gost-yescrypt** — usa la funzione hash GOST R 34.11-2012 con il metodo yescrypt |
| `$7$` | **scrypt** — funzione di derivazione di chiave basata su password |
| `$2b$`, `$2y$`, `$2a$`, `$2x$` | **bcrypt** — basato sul cifrario a blocchi Blowfish, originariamente per OpenBSD |
| `$6$` | **sha512crypt** — basato su SHA-2 a 512 bit, comune sui sistemi Linux (più datati) |
| `$md5` | **SunMD5** — basato su MD5, originariamente per Solaris |
| `$1$` | **md5crypt** — basato su MD5, originariamente per FreeBSD |

### Windows: NTLM e il SAM

Le password di Windows sono hashate con **NTLM**, una variante di MD4 — visivamente identico agli hash MD4/MD5, quindi è fondamentale usare il **contesto** per determinare correttamente il tipo di hash che si sta esaminando.

Su Windows, gli hash sono salvati nel **SAM (Security Accounts Manager)**. Windows cerca di impedire agli utenti normali di estrarli, ma strumenti come **mimikatz** esistono proprio per aggirare questa protezione. Gli hash trovati lì sono divisi in **NT hash** e **LM hash**.

## Attacchi

### Craccare hash offline con Hashcat

La sintassi base:
```bash
hashcat -m <hash_type> -a <attack_mode> hashfile wordlist
```

- **`-m <hash_type>`** — specifica il tipo di hash in formato numerico (es. `-m 1000` per NTLM). Il codice corretto si trova nella documentazione ufficiale (`man hashcat`) o nella pagina degli hash di esempio
- **`-a <attack_mode>`** — specifica la modalità d'attacco (es. `-a 0` per straight, cioè provare una password dopo l'altra dalla wordlist)
- **`hashfile`** — il file contenente l'hash da craccare
- **`wordlist`** — la wordlist da usare nell'attacco

```bash
hashcat -m 3200 -a 0 hash.txt /usr/share/wordlists/rockyou.txt
```
Questo tratta l'hash come Bcrypt (`3200`) e prova le password contenute in `rockyou.txt`.

Per vedere il risultato in seguito (Hashcat salva la sessione e non sempre stampa subito la password in chiaro a schermo se interrotto):
```bash
hashcat -m 3200 hash.txt --show
```

### Rainbow Tables

Una **rainbow table** è una struttura dati precalcolata che contiene un enorme numero di coppie **password → hash corrispondente**, generata in anticipo, una volta sola. Invece di calcolare l'hash di ogni tentativo di password durante l'attacco (come fa un attacco a dizionario classico), un attaccante consulta semplicemente la tabella già pronta, cercando l'hash rubato tra quelli presenti — un'operazione molto più veloce di ricalcolare milioni di hash al volo.

Il vantaggio per l'attaccante è la **velocità**: generare una rainbow table richiede tempo e risorse significative una tantum, ma una volta creata può essere riutilizzata per craccare **qualsiasi** hash che rientri nel suo dominio di copertura, in una frazione del tempo che servirebbe per un attacco a forza bruta o a dizionario tradizionale ripetuto ogni volta. Esistono rainbow table pubbliche già pronte per gli algoritmi di hashing più comuni e non protetti (es. MD5, SHA-1 senza salt), scaricabili e utilizzabili direttamente.

## Il salting

Il **salt** è un valore casuale, unico per ogni password, aggiunto alla password stessa **prima** di calcolarne l'hash. È esattamente il componente che si vede nel formato `$prefix$options$salt$hash` di `/etc/shadow` visto sopra: ogni utente ha un salt diverso, anche se avesse scelto la stessa identica password di un altro utente.

```
Senza salt:  hash("password123") → sempre lo stesso hash, per chiunque usi quella password
Con salt:    hash("password123" + salt_unico) → hash diverso per ogni utente
```

Questo rende le rainbow table **inefficaci**: una tabella precalcolata è costruita per un dominio di hash "puri" (senza salt) — se ogni password nel sistema è combinata con un salt diverso e casuale, l'attaccante dovrebbe generare una rainbow table **separata per ogni singolo salt**, il che vanifica completamente il vantaggio di precalcolo che rende la tecnica efficace in primo luogo. È il motivo per cui tutti gli algoritmi moderni della tabella vista sopra (yescrypt, bcrypt, scrypt, sha512crypt) includono il salting come parte integrante del proprio design, non come opzione facoltativa.

## HMAC

**HMAC** (Keyed-Hash Message Authentication Code) è un tipo di codice di autenticazione del messaggio (MAC) che combina una funzione di hash crittografica con una **chiave segreta**, per verificare sia l'**autenticità** sia l'**integrità** dei dati.

Un HMAC permette di confermare che chi ha creato quel codice sia davvero chi dice di essere (autenticità), e prova che il messaggio non è stato modificato o corrotto (integrità) — ottenuto combinando una chiave segreta (per l'autenticità) con un algoritmo di hashing (per generare l'hash che garantisce l'integrità).

![Come funziona HMAC](/assets/img/posts/hmac-diagram.svg)
_Due passate di hashing, con la chiave combinata a due costanti diverse (ipad e opad)_

I passaggi, in sintesi:
1. La chiave segreta viene **paddata** (riempita) fino alla dimensione del blocco della funzione di hash
2. La chiave paddata viene messa in **XOR** con una costante (tipicamente un blocco di zeri o di uno) — questa è la fase preparatoria per la prima passata
3. Il messaggio viene hashato usando la funzione di hash insieme alla chiave XORata risultante dal passo 2
4. Il risultato del passo 3 viene hashato **di nuovo**, con la stessa funzione di hash, ma usando la chiave paddata XORata con una **seconda** costante diversa
5. L'output finale è il valore **HMAC**, tipicamente una stringa di dimensione fissa

Il fatto che servano **due passate di hashing**, ciascuna con la chiave combinata a una costante diversa, è una scelta di design che protegge da specifiche debolezze strutturali delle funzioni di hash sottostanti — solo chi conosce la chiave segreta può generare (o verificare) l'HMAC corretto per un dato messaggio.
