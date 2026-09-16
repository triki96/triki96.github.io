
---
title: "Burp Suite Intruder"
date: 2026-09-14 00:00:00 +0200
categories: [Cyber Security 101, Burp Suite]
tags: [burp-suite, intruder, fuzzing, brute-forcing, macros, csrf]
---

Il modulo Intruder di Burp Suite offre la manipolazione automatizzata delle richieste e consente attività come il fuzzing e il brute-forcing.

> Il fuzzing è una tecnica di test automatizzato che consiste nel mandare a un'applicazione un gran numero di input — spesso generati sistematicamente o presi da liste predefinite — per vedere come reagisce, con l'obiettivo di far emergere comportamenti anomali che rivelano vulnerabilità. Invece di testare manualmente un parametro con un valore alla volta (es. `/products/1000'`, poi `/products/-1`, poi `/products/abc`...), il fuzzing automatizza il processo: prendi una lista di centinaia o migliaia di payload, li inietti uno dopo l'altro nello stesso punto della richiesta, e osservi sistematicamente le risposte cercando differenze — errori 500, tempi di risposta anomali, contenuti diversi dal solito, codici di stato inattesi.

Normalmente Intruder segue il seguente flusso di lavoro:


1. Intercettiamo una richiesta http con Burp Proxy
2. La inoltriamo a Intruder e cerchiamo il punto di injection nella richiesta (es. il valore `1000` in `/products/1000`)
3. Forniamo una wordlist
4. Burp manda una richiesta per ogni voce della lista, sostituendo il placeholder con ciascun valore
5. Analizziamo i risultati

Intruder ha 4 tab di base: Positions, Payloads, Resource Pool e Settings

## Il tab Positions

Qui si specifica il tipo di attacco. Consideriamo come esempio una richiesta di login con due posizioni marcate, username e password:

```
POST /login
username=§user§&password=§pass§
```

### Sniper — una posizione alla volta, le altre restano al valore originale

Usa un solo payload set. Prende la prima posizione, ci prova tutti i payload della lista mentre l'altra posizione resta fissa al suo valore originale. Poi passa alla seconda posizione e fa lo stesso.

```
Round 1: username=admin,       password=<originale>
Round 1: username=root,        password=<originale>
Round 2: username=<originale>, password=admin
Round 2: username=<originale>, password=root
```

### Battering ram — lo stesso payload in tutte le posizioni contemporaneamente

Usa un solo payload set, ma inserisce lo stesso valore identico in tutte le posizioni marcate, per ogni payload della lista:

```
Round 1: username=admin, password=admin
Round 2: username=root,  password=root
```

Serve quando il medesimo valore deve comparire in più punti della stessa richiesta — es. un campo "nuova password" e "conferma password", o un token ripetuto sia nell'URL che in un header.

### Pitchfork — payload diversi, abbinati in parallelo per indice

Usa più payload set, uno per posizione, ma li scorre in sincronia, riga per riga:

```
set A (username): admin, root, test
set B (password): admin123, toor, test123

Round 1: username=admin, password=admin123
Round 2: username=root,  password=toor
Round 3: username=test,  password=test123
```

### Cluster bomb — ogni combinazione possibile tra i set

Usa più payload set, ma testa tutte le combinazioni incrociate:

```
set A (username): admin, root
set B (password): admin123, toor

Round 1: username=admin, password=admin123
Round 2: username=admin, password=toor
Round 3: username=root,  password=admin123
Round 4: username=root,  password=toor
```



## Il tab Payloads

La sezione Payloads di Intruder è dove si definisce cosa mandare al posto dei punti marcati nella richiesta (i simboli `§...§`). Si divide in quattro blocchi, in ordine logico di elaborazione.


## Le macro

### Perchè sono utili

Consideriamo un form di login che richiede sia il cookie di sessione che un `loginToken` hardcodato nel codice HTML (messo ad esempio per evitare attacchi CSRF). Intruder cattura una richiesta di login una sola volta, con un cookie di sessione e un `loginToken` fissati in quel preciso istante. Ma il server ne accetta solo la coppia più recente — quindi dal secondo tentativo in poi, ogni richiesta arriva con credenziali di autenticazione della richiesta (non del login) ormai scadute, e viene rifiutata prima ancora di controllare username e password.

Serve un modo per rigenerare quella coppia prima di ogni singolo tentativo — non una volta sola all'inizio.

### L'idea della macro

Una macro in Burp è, in parole semplici: "prima di mandare la richiesta che interessa, fanne prima un'altra al volo, guarda cosa risponde il server, e usa quei dati freschi nella richiesta vera".

Nel caso del login: prima di ogni tentativo (username X, password Y), Burp fa in automatico una `GET /admin/login/` — esattamente come quando si carica la pagina a mano — legge dalla risposta il nuovo cookie `session` e il nuovo `loginToken`, e li inserisce al posto di quelli vecchi nella richiesta POST che sta per partire. È letteralmente l'automazione di quello che un utente onesto farebbe: ricaricare la pagina di login prima di ogni tentativo.


### Il flusso completo, per ogni singolo tentativo

```
1. Intruder prende la prossima coppia username/password dalle wordlist
2. PRIMA di inviare, la Session Handling Rule scatta e lancia la macro
3. La macro manda GET /admin/login/
4. Il server risponde con un nuovo cookie session + un nuovo loginToken nell'HTML
5. Burp estrae questi due valori e li inietta nella richiesta POST in preparazione
6. La richiesta POST (username, password, loginToken fresco, session fresco) parte verso il server
7. Il server valida token/sessione → OK → procede a controllare le credenziali → risponde 302
```
