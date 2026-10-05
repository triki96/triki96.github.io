---
title: Walking an Application
date: 2026-09-16 00:00:00 +0200
categories: [PT1, 3-Web-App-Fundamentals]
tags: [inspect, debugger, storage, source code]
description: Facciamo una prima valutazione manuale di una applicazione web
---

1. Visitiamo il sito a mano e facciamo una prima mappatura degli endpoint. Utile per:

		-   **Struttura dell'applicazione**: pagine pubbliche vs. autenticate, flussi logici (login, registrazione, reset password, checkout…)
		-   **Parametri nell'URL**: `?id=123`, `?page=admin`, `?redirect=https://...` → subito candidati per injection, IDOR, open redirect
		-   **Nomi di endpoint rivelatori**: `/admin`, `/api/v1/users`, `/debug`, `/backup.zip`, `/test`
		-   **Comportamento dell'app**: messaggi di errore diversi ("utente non trovato" vs. "password errata") → user enumeration
		-   **Tecnologie intuibili dall'URL**: `.php`, `.aspx`, `.jsp` ci dicono il backend
2. controlliamo il *codice sorgente* del sito. Utile per:
	 -   **Commenti degli sviluppatori**: credenziali hardcoded, TODO, URL di staging, note interne
	-   **Endpoint JS/API nascosti**: funzioni JS che chiamano `/api/internal/...` non linkate dall'UI
	-   **Token e chiavi nelle variabili JS**: API key, token JWT, client secret esposti in `window.__CONFIG__` o simili
	-   **Form nascosti** (`type="hidden"`): campi con valori come `role=user`, `isAdmin=false` → parameter tampering
	-   **Nomi di file e percorsi**: asset che rivelano struttura directory (`/assets/js/admin-panel.js`)
	-   **Framework e versioni**: meta tag, commenti, nomi di file versionati → CVE lookup
3. *inspect*. Differisce dal sorgente perché mostra il DOM **dopo** che JS lo ha manipolato.
4. *debugger*
5. *network*. Utile per:
	-   **Tutti gli endpoint reali chiamati**: anche quelli non visibili nell'UI, chiamate in background, polling
	-   **Header HTTP rivelatori**:
	    -   `Server: Apache/2.4.1` → versione vulnerabile?
	    -   `X-Powered-By: PHP/7.1` → CVE
	    -   `X-Debug-Token` → Symfony in debug mode
	    -   Assenza di `X-Frame-Options`, `CSP`, `HSTS` → vulnerabilità configurazione
	-   **Struttura delle richieste API**: metodi (GET/POST/PUT/DELETE), corpo JSON, parametri
	-   **Token di autenticazione**
	-   **Cookie e flag**: assenza di `HttpOnly`, `Secure`, `SameSite` → vulnerabilità XSS/CSRF
	-   **Richieste a domini terzi**: CDN, analytics, OAuth provider — superficie d'attacco allargata
	-   **Codici di risposta inattesi**: `403` su `/admin` ci dice che esiste; `500` ci dice che abbiamo rotto qualcosa di interessante
	-   **Tempo di risposta differenziale**: risposte più lente su certi input → blind injection
7. *storage*. Utile per i cookie e altro.
