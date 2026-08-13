---
title: "John the Ripper"
date: 2026-08-13 11:00:00 +0200
categories: [Cyber Security 101]
tags: [cryptography, john-the-ripper, password-cracking]
description: "Cracking automatico, identificazione hash, modalità simple, regole custom, e l'uso di John su Windows, Linux, zip, rar e chiavi SSH."
toc: true
---

## Intro

**John the Ripper** (spesso abbreviato "John") è uno degli strumenti di **password cracking** più diffusi e versatili — open source, supporta centinaia di formati di hash diversi (già visti in dettaglio parlando di `/etc/shadow` e NTLM), e offre più modalità di attacco: automatica, a dizionario, con regole di trasformazione, e a forza bruta.

```bash
john --help
```

## Automatic cracking

Il modo più semplice per iniziare: passare a John un file di hash e lasciare che scelga da solo la strategia.

```bash
john hash.txt
```

Senza altre opzioni, John prova automaticamente prima la **single crack mode** (basata su informazioni contestuali come username), poi passa alla propria wordlist integrata con regole di mangling di default. Per usare una wordlist specifica:

```bash
john --wordlist=/usr/share/wordlists/rockyou.txt hash.txt
```

Per vedere i risultati già trovati in una sessione precedente (John salva lo stato e non sempre ristampa tutto a schermo):
```bash
john hash.txt --show
```

## Identifying hashes

Prima di lanciare un attacco, serve sapere **che tipo di hash** si sta affrontando — esattamente il problema già visto con i prefissi `$prefix$` di `/etc/shadow` o la somiglianza visiva tra NTLM e MD4/MD5.

```bash
john --list=formats
```

Elenca tutti i formati che John sa riconoscere e craccare. Per cercarne uno specifico:

```bash
john --list=formats | grep -i "md5"
```
```
dynamic_6: md5(md5($p).$s)
Raw-MD5: Raw MD5
Raw-MD5u: Raw MD5 (Unicode)
```

Strumenti dedicati come `hashid` o `hash-identifier` possono aiutare a riconoscere un hash sconosciuto guardandone solo la struttura (lunghezza, caratteri usati), ma il contesto (da dove proviene l'hash — Linux, Windows, un'applicazione specifica) resta spesso l'indizio più affidabile.

## Format specific cracking

Una volta identificato il formato, si può forzare esplicitamente John a usarlo con `--format`, invece di lasciargli indovinare:

```bash
john --format=Raw-MD5 hash.txt --wordlist=/usr/share/wordlists/rockyou.txt
```

Questo è importante quando un hash potrebbe essere ambiguo (es. potrebbe sembrare sia MD5 sia NTLM per lunghezza) — specificare il formato elimina ogni ambiguità e garantisce che John applichi l'algoritmo corretto.

## Simple mode

La **single crack mode** (`--single`) genera i candidati di password a partire da informazioni **contestuali** disponibili nel file di hash stesso — tipicamente lo username, ma anche altri campi come il nome completo (GECOS), se presenti — invece di usare una wordlist esterna.

```bash
john --single --format=Raw-MD5 hash.txt
```

È efficace perché molte persone scelgono password derivate dal proprio username o nome (es. utente `mario` con password `mario123`).
Nel caso volessimo fare uso di questa modalità, dobbiamo modificare il file (hash.txt) premettendo il nome utente (mario) e un separatore (:).

<!-- ### Modificare il file di configurazione

Il comportamento della single mode (e delle regole di trasformazione applicate ai candidati) è definito nel file `john.conf` (spesso in `/etc/john/john.conf` o `~/.john/john.conf`). Modificando le sezioni `[List.Rules:Single]`, si può personalizzare **come** John trasforma username/informazioni contestuali in tentativi di password — ad esempio aggiungendo suffissi numerici comuni o sostituzioni di caratteri (leetspeak) non già presenti di default. -->

## Custom rules

Le **regole** dicono a John come **modificare** ogni parola di una wordlist prima di provarla come password — es. aggiungere un numero alla fine, mettere la prima lettera maiuscola, sostituire lettere con simboli simili (`a` → `@`, `s` → `$`).

Si definiscono in `john.conf`, in una sezione personalizzata:

```
[List.Rules:Custom]
Az"[0-9]"
c
$1 $2 $3
```

Questa regola aggiunge un numero da 0 a 9 in fondo a ogni parola, la capitalizza, e aggiunge "123" alla fine — un esempio semplificato di come si combinano trasformazioni multiple.

```bash
john --wordlist=/usr/share/wordlists/rockyou.txt --rules=Custom hash.txt
```

Le regole aumentano enormemente la copertura di un attacco a dizionario: invece di provare solo le parole esatte della wordlist, si provano anche tutte le loro varianti più comuni che le persone usano davvero (es. `password` → `Password1!`).

## John & Windows

Gli hash delle password Windows (**NTLM**, di cui abbiamo già parlato) si trovano nel **SAM**, tipicamente estratti con strumenti come `mimikatz` o tecniche di dumping della memoria durante un assessment.

```bash
john --format=NT hash.txt --wordlist=/usr/share/wordlists/rockyou.txt
```

`--format=NT` specifica esplicitamente l'algoritmo NTLM, evitando che John lo confonda con un hash MD4/MD5 puro, viste le somiglianze già discusse.

## John & Linux (unshadow)

Su Linux, come già visto, gli hash vivono in `/etc/shadow` (accessibile solo da root), mentre le informazioni sugli utenti (username, UID, home directory) sono in `/etc/passwd` (leggibile da chiunque). John lavora meglio con un file che **combina entrambi**, e per questo esiste `unshadow`:

```bash
unshadow /etc/passwd /etc/shadow > combined.txt
john combined.txt --wordlist=/usr/share/wordlists/rockyou.txt
```

`unshadow` unisce le due fonti in un unico file nel formato che John si aspetta, ricostruendo l'associazione tra username e hash corrispondente, dato che nel solo `/etc/shadow` gli hash sono presenti senza il contesto completo dell'utente.

## John & zip files (zip2john)

![Il pattern comune degli strumenti *2john](/assets/img/posts/john-2john-diagram.svg)
_John non attacca mai il file originale direttamente: serve sempre estrarre prima l'hash_

John non può lavorare direttamente su un file `.zip` protetto da password — serve prima **estrarne l'hash** in un formato che John sappia interpretare.

```bash
zip2john secret.zip > zip_hash.txt
john zip_hash.txt --wordlist=/usr/share/wordlists/rockyou.txt
john zip_hash.txt --show
```

`zip2john` legge la struttura interna del file ZIP e ne estrae i dati necessari (basati sull'algoritmo di cifratura usato dal ZIP) in un formato compatibile con John.

## John & Rar files (rar2john)

Stesso principio identico, applicato agli archivi RAR:

```bash
rar2john secret.rar > rar_hash.txt
john rar_hash.txt --wordlist=/usr/share/wordlists/rockyou.txt
john rar_hash.txt --show
```

## John & SSH keys (ssh2john)

Come già visto parlando di autenticazione SSH, una chiave privata protetta da **passphrase** può essere attaccata offline: `ssh2john` converte la chiave in un formato che John può craccare, esattamente come `gpg2john` fa per le chiavi GPG protette.

```bash
ssh2john id_rsa > ssh_hash.txt
john ssh_hash.txt --wordlist=/usr/share/wordlists/rockyou.txt
john ssh_hash.txt --show
```

Se la passphrase viene trovata, quella stessa chiave privata diventa immediatamente utilizzabile per autenticarsi via SSH, ricollegandosi direttamente a `ssh -i chiave_privata utente@host` già visto negli appunti su SSH.
