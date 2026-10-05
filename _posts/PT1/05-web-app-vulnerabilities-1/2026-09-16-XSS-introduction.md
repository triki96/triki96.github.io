---
title: "XSS"
date: 2026-09-16 00:00:00 +0200
categories: [PT1, 5-Web-App-Vulnerabilities-1]
tags: [xss]
# description:
---


FARE UN ESEMPIO DI ATTACCO XSS PER CAPIRE COS'È


OGGETTI PRESENTI IN UNA PAGINA WEB

In questo compito tratteremo i termini di base che devi comprendere per padroneggiareXSS.

Document Object Model (DOM) : Il Document Object Model (DOM) è la rappresentazione strutturata e dinamica di una pagina web nel browser, essenzialmente un albero di elementi (tag, testo, attributi) che il tuo codice JavaScript può leggere e modificare. Pensalo come il progetto in memoria della pagina; quando JavaScript aggiorna il DOM, la pagina visibile si aggiorna immediatamente.
Trasformazione del codice in Cookie nel DOM.

Parametri URL : i parametri URL (stringhe di query) sono le parti che seguono ?l'URL e che passano dati al sito, ad esempio, https://site.com/search?q=helloha un qparametro con il valore  hello. Sono controllabili dall'utente (digitati nella barra degli indirizzi o inviati tramite link/moduli), quindi tratta i loro valori come input non attendibili.
JavaScript : il linguaggio di scripting che viene eseguito all'interno del browser. I payload XSS sono in genere piccoli frammenti di codice JavaScript che vengono eseguiti nel contesto della pagina della vittima e possono leggere o modificare il DOM, effettuare richieste di rete o accedere ai cookie (a meno che non siano protetti).
Cookie : I cookie memorizzano piccole quantità di dati nel browser (ID di sessione, preferenze). Se un cookie è leggibile da JavaScript e un utente malintenzionato può eseguire codice JS tramite XSS, può rubare quel cookie e dirottare una sessione. HttpOnlyè un flag che impedisce a JavaScript di leggere il cookie (bene).
Escape : L'escape (codifica di output) consiste nel trasformare i dati dell'utente in modo che il browser li tratti come testo semplice, non come codice, ad esempio, trasformandoli <in &lt; quindi <script>diventa testo innocuo. Un filtro (validazione dell'input) controlla che l'input sia consentito (lettere, numeri, lunghezza), ma non impedisce che i dati vengano trasformati in codice quando vengono successivamente inseriti in una pagina. Ad esempio, l'input grezzo dell'utente  <script>alert(1)</script> verrà sottoposto a escape per HTML, diventando &lt;script&gt;alert(1)&lt;/script&gt.


Test per XSS
Quando si effettuano test per la rilevazione di XSS, i penetration tester di solito iniziano con un payload semplice per verificare se è possibile eseguire codice JavaScript.

Un payload di test comune è:


<script>alert('XSS')</script>
Se l'applicazione è vulnerabile, il browser eseguirà lo script iniettato e visualizzerà un messaggio pop-up. Ciò conferma che JavaScript può essere eseguito nel browser della vittima.

Dove vengono iniettati i carichi utili
I payload XSS vengono in genere iniettati nelle aree di un sito web che accettano e visualizzano l'input dell'utente.

Campi di ricerca
sezioni commenti
Nomi dei profili
Moduli di feedback
parametri URL



REFLECTED XSS

STORED XSS

accade quando un'applicazione salva sul server (di solito in un database) input controllati da un utente malintenzionato e successivamente fornisce tale contenuto ad altri utenti senza un'adeguata procedura di escape, causando l'esecuzione dello script iniettato nel browser di ogni visitatore.

La vulnerabilità XSS persistente è più dannosa della vulnerabilità XSS riflessa perché il payload persiste e può colpire molti utenti (amministratori, visitatori del sito) nel tempo. Un utente malintenzionato può inserire uno script in un commento, nella biografia del profilo, in un messaggio o in un pannello riservato agli amministratori; ogni volta che qualcuno (inclusi gli amministratori) visualizza quella pagina, il browser esegue il codice JavaScript iniettato nel contesto dell'origine vulnerabile. Questo script può rubare i token di sessione ed eseguire azioni per conto dell'utente

DOM BASED XSS

BLIND XSS
