
---
title: "CSRF - Cross-Site Request Forgery"
date: 2026-09-16 00:00:00 +0200
categories: [PT1, 5-Web-App-Vulnerabilities-1]
tags: [csrf, owasp, web-security, session, cookie]
---

Le moderne applicazioni web si basano fortemente su *sessioni autenticate* per eseguire azioni per conto degli utenti. Quando accediamo a un sito, il nostro browser memorizza un *cookie di sessione* che permette all'applicazione di riconoscerci nelle richieste successive. Questa comodità però crea anche un'opportunità di abuso. La **Cross-Site Request Forgery (CSRF)** è un attacco che sfrutta proprio questo meccanismo di fiducia.

Il punto chiave che distingue la CSRF da altri attacchi è che *non ruba le credenziali*, ma **sfrutta il rapporto di fiducia tra il browser e l'applicazione web**. In particolare, inganna il *browser della vittima* inducendolo a compiere un'azione su un sito in cui la vittima è *già autenticata*. Poiché il browser allega automaticamente i cookie a ogni richiesta verso quel sito, l'applicazione tratta la richiesta malevola come se fosse legittima.


## Come funziona un attacco CSRF

L'attacco si svolge in quattro passaggi:

1. **La vittima si autentica** su un'applicazione web legittima. Il suo browser memorizza un cookie di sessione valido.
2. **L'aggressore inganna la vittima** inducendola a visitare una pagina web dannosa, che contiene una richiesta appositamente costruita verso l'applicazione bersaglio (ad esempio nascosta in un'immagine, un form auto-inviante o un link).
3. **Il browser della vittima invia automaticamente** quella richiesta all'applicazione di destinazione, allegando — come fa sempre — il cookie di sessione memorizzato. Qua giace il cuore del problema: *il browser include i cookie automaticamente*, senza chiedersi da *dove* parta la richiesta. Se il server non verifica l'origine della richiesta, non ha modo di distinguere un'azione voluta dall'utente da una innescata di nascosto da un sito malevolo.
4. **Il server considera la richiesta legittima**, perché contiene un cookie di sessione valido, ed esegue l'azione.



## Cosa può ottenere un attaccante

Le azioni sfruttabili dipendono dalle funzionalità dell'applicazione bersaglio. Esempi tipici:

- Modifica dell'indirizzo email di un utente
- Aggiornamento delle impostazioni dell'account
- Esecuzione di transazioni finanziarie
- Modifica delle preferenze di sicurezza (es. disattivazione di una protezione)

Il filo comune: sono tutte **azioni che modificano lo stato** dell'account o dell'applicazione.

## Individuazione delle vulnerabilità

Ogni volta che un utente compie un'azione su un sito, il browser invia una o più **richieste HTTP** al server. Possiamo dividere queste richieste in due categorie:

- **Richieste che recuperano informazioni** (leggono dati, non modificano nulla)
- **Richieste che modificano lo stato** dell'applicazione (creano, aggiornano, cancellano dati). Sono queste gli obiettivi principali degli attacchi CSRF.

Come penetration tester, davanti a ogni azione sensibile la domanda che dobbiamo porci è semplice: "*È possibile attivare questa azione senza verificare che la richiesta provenga effettivamente dall'utente?*"

Se la risposta è **sì**, la funzionalità è potenzialmente vulnerabile a CSRF.

## Best practice per testare la CSRF

Un approccio sistematico all'analisi di un'applicazione:

- **Concentriamoci sulle richieste che modificano lo stato.** Diamo priorità alle azioni che cambiano dati — cambio password, aggiornamento email, impostazioni account, transazioni finanziarie. Sono i bersagli CSRF più comuni.

- **Ispezioniamo le richieste alla ricerca di token CSRF.** Verifichiamo se le azioni sensibili includono un *token anti-CSRF*. Se il token non esiste, oppure appare **statico o prevedibile**, la richiesta potrebbe essere vulnerabile (un token valido deve essere univoco e imprevedibile per ogni sessione/richiesta).

- **Analizziamo i metodi HTTP.** Le azioni sensibili dovrebbero usare richieste **POST**. Se operazioni importanti vengono eseguite tramite **GET**, sono più facili da sfruttare: ci basta incapsularle in un'immagine (`<img src=...>`) o in un semplice link.

- **Testiamo le richieste al di fuori dell'applicazione.** Copiamo la richiesta e proviamo a riprodurla da una **pagina HTML esterna**. Se l'azione va a buon fine senza ulteriori verifiche, l'endpoint è con ogni probabilità vulnerabile a CSRF.

- **Osserviamo il comportamento dei cookie.** Controlliamo se l'autenticazione si basa **solo** sul cookie di sessione. Se l'applicazione accetta automaticamente qualsiasi richiesta che contenga il cookie di sessione, senza validare l'origine della richiesta, l'attacco CSRF diventa possibile.
