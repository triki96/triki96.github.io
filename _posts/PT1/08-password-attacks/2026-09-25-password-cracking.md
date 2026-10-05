
---
title: "Password Cracking"
# description: 
date: 2026-09-25
categories: [PT1. password-cracking]
tags: [password-cracking, hashcat, john-the-ripper, hashid]
---

## Algoritmi per l'hash

MD5, SHA-1 e SHA-256 sono stati progettati per la verifica dell'integrità dei file e le firme digitali, non per la memorizzazione delle password: una GPU moderna può calcolare miliardi di hash MD5 al secondo. bcrypt e Argon2 sono diversi, perché sono stati creati specificamente per le password, con un fattore di costo che li rende volutamente onerosi da calcolare. L'attaccante che analizza una wordlist viene rallentato tanto quanto il server che verifica un login, che è proprio l'obiettivo.

| Algoritmo | Lunghezza di uscita | Ancora usato per le password? | Note |
|---|---|---|---|
| MD5 | 128 bit (32 caratteri esadecimali) | No | Veloce, soggetto a collisioni, ampiamente craccato |
| SHA-1 | 160 bit (40 caratteri esadecimali) | No | Più veloce di SHA-256, obsoleto |
| SHA-256 | 256 bit (64 caratteri esadecimali) | A volte | Meglio di MD5/SHA-1, ma comunque veloce |
| NTLM | 128 bit (32 caratteri esadecimali) | Sì (autenticazione Windows legacy) | Basato su MD4, usato per gli hash degli account Windows |
| bcrypt | ~60 caratteri, prefisso `$2*$` | Sì, consigliato | Deliberatamente lento, fattore di costo configurabile |
| Argon2 | Variabile | Sì, consigliato | Standard moderno, "memory hard" |

## Identificazione dei tipi di hash

Con `hashid`:

```bash
root@tryhackme:~# hashid '$2y$10$wJ/mZDURD4jQ0lrCEMheE.8FzMXNEBNjIkuZgEFm9VMn1m4ZP4eDG'
Analyzing '$2y$10$wJ/mZDURD4jQ0lrCEMheE.8FzMXNEBNjIkuZgEFm9VMn1m4ZP4eDG'
[+] Blowfish(OpenBSD)
[+] Woltlab Burning Board 4.x
[+] bcrypt
```

Con `hashcat --identify`:

```bash
root@tryhackme:~# hashcat --identify '5f4dcc3b5aa765d61d8327deb882cf99'
The following 11 hash-modes match the structure of your input hash:

      # | Name                                                       | Category
  ======+============================================================+======================================
    900 | MD4                                                        | Raw Hash
      0 | MD5                                                        | Raw Hash
     70 | md5(utf16le($pass))                                        | Raw Hash
   2600 | md5(md5($pass))                                            | Raw Hash salted and/or iterated
   3500 | md5(md5(md5($pass)))                                       | Raw Hash salted and/or iterated
   4400 | md5(sha1($pass))                                           | Raw Hash salted and/or iterated
  20900 | md5(sha1($pass).md5($pass).sha1($pass))                    | Raw Hash salted and/or iterated
   4300 | md5(strtoupper(md5($pass)))                                | Raw Hash salted and/or iterated
   1000 | NTLM                                                       | Operating System
   9900 | Radmin2                                                    | Operating System
   8600 | Lotus Notes/Domino 5                                       | Enterprise Application Software (EAS)
```

Risorse online utili per ricerche rapide:
- [crackstation.net](https://crackstation.net/) — confronta l'hash con una tabella di ricerca precalcolata di miliardi di voci; se il testo in chiaro è già noto, viene restituito subito.
- [hashes.com](https://hashes.com/) — identifica il tipo di hash e tenta una ricerca in un ampio database; accetta anche invii in blocco.

### Hashcat modes e John formats

Una volta identificato l'algoritmo, va tradotto nel formato/numero di modalità specifico dello strumento. Questi valori sono fissi: `hashcat -m 1000` significa sempre NTLM, a prescindere dal formato dell'hash. Sbagliare la modalità è una delle cause più comuni per cui un attacco non produce risultati.

| Algoritmo | Hashcat Mode (`-m`) | John Format (`--format=`) |
|---|---|---|
| MD5 | 0 | raw-md5 |
| SHA-1 | 100 | raw-sha1 |
| SHA-256 | 1400 | raw-sha256 |
| SHA-512 | 1700 | raw-sha512 |
| NTLM | 1000 | nt |
| bcrypt | 3200 | bcrypt |

## Wordlist e strategie di attacco

**Attacchi a dizionario** — la wordlist più usata è `rockyou.txt` (`/usr/share/wordlists/rockyou.txt`). Per una copertura più ampia c'è la raccolta SecLists (`/usr/share/wordlists/SecLists/`), con wordlist mirate per contesti specifici.

```bash
root@tryhackme:~# john --format=raw-md5 --wordlist=/usr/share/wordlists/rockyou.txt demo.txt
```

John memorizza i risultati nel suo potfile (`/usr/local/john/run/john.pot`). Per rivedere gli hash già decifrati:

```bash
root@tryhackme:~# john --show --format=raw-md5 demo.txt
?:password
```

Attacco base a dizionario con hashcat (`-m 0` = MD5, `-a 0` = modalità dizionario):

```bash
root@tryhackme:~# hashcat -m 0 -a 0 demo.txt /usr/share/wordlists/rockyou.txt
```

**Attacchi di forza bruta** — provano tutte le combinazioni possibili di caratteri.

**Attacchi basati su regole** — prendono una wordlist esistente e applicano trasformazioni a ogni parola, generando le mutazioni che le persone usano comunemente quando creano password:

- Iniziale maiuscola: `password` → `Password`
- Aggiunta di un numero: `password` → `password1`
- Aggiunta di un carattere speciale: `password` → `password!`
- Sostituzione di caratteri: `password` → `p@ssw0rd`

I file delle regole di Hashcat si trovano in `/opt/hashcat/rules/`:

| File | Descrizione |
|---|---|
| `best64.rule` | 64 mutazioni molto efficaci, buona prima scelta |
| `rockyou-30000.rule` | 30.000 regole derivate dall'analisi di RockYou |
| `d3ad0ne.rule` | Ampio set di regole costruito dalla community |
| `dive.rule` | Set di regole estensivo, copre una vasta gamma di mutazioni |
| `OneRuleToRuleThemAll.rule` | Set di regole molto popolare compilato dalla community; non incluso di default, verificare che esista sul sistema prima dell'uso |

John the Ripper ha i propri set di regole in `/usr/local/john/run/rules/`, attivabili con `--rules=wordlist` (mutazioni predefinite) o `--rules=single` (set Single, genera mutazioni basate su nome e username).


```bash
root@tryhackme:~# john --format=raw-md5 --wordlist=/usr/share/wordlists/rockyou.txt --rules=wordlist demo2.txt
```
```bash
root@tryhackme:~# hashcat -m 0 -a 0 demo2.txt /usr/share/wordlists/rockyou.txt -r /usr/local/hashcat/rules/best64.rule
```


**Attacchi con maschera** — attacco di forza bruta strutturato in cui si definisce lo schema della password (es. parola + anno di 4 cifre) invece della sola sequenza di caratteri, generando solo i candidati che corrispondono a quello schema.

| Placeholder | Set di caratteri |
|---|---|
| `?l` | Minuscole (a-z) |
| `?u` | Maiuscole (A-Z) |
| `?d` | Cifre (0-9) |
| `?s` | Caratteri speciali |
| `?a` | Tutto l'ASCII stampabile |

Una maschera per una password come `Summer2026!` sarebbe: `?u?l?l?l?l?l?d?d?d?d?s`

Attacco con maschera (`-a 3` = modalità maschera):

```bash
root@tryhackme:~# hashcat -m 0 -a 3 demo3.txt '?l?l?l?l?l?l?l?l'
```


### Scegliere l'approccio giusto

| Scenario | Approccio migliore |
|---|---|
| Nessuna informazione sulla password | Attacco a dizionario con `rockyou.txt` |
| Il dizionario non funziona, la password è probabilmente cambiata | Dizionario + regole (es. `best64.rule`) |
| Schema di password noto o imposto da policy | Attacco con maschera |
| Password breve, set di caratteri ridotto | Forza bruta (solo lunghezza vincolata) |
| È probabile che il target abbia usato termini specifici dell'azienda | Wordlist personalizzata + regole |


### Confronto

| | John the Ripper | Hashcat |
|---|---|---|
| Accelerazione | CPU (principalmente) | GPU (principalmente, CPU come riserva) |
| Velocità (MD5/SHA) | Veloce | Molto veloce |
| Rilevamento del formato | Buono, automatico | Richiede modalità esplicita |
| Formati non standard | Eccellente | Buono |
| Set di regole | Integrati + estensibili | Ampia libreria di file |
| Ideale per | Tentativi rapidi, formati vari, file shadow | Attacchi prolungati, cracking accelerato via GPU |
