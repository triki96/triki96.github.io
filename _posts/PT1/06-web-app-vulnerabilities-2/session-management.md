Pensando alle tue interazioni con le applicazioni web, dovresti renderti conto che non fornisci a un'applicazione web il tuo nome utente e la tua password a ogni richiesta. Invece, dopo l'autenticazione, ti viene assegnata una sessione. Questa sessione viene utilizzata dall'applicazione web per mantenere il tuo stato, tracciare le tue azioni e decidere se sei autorizzato o meno a fare ciò che stai tentando di fare. La gestione delle sessioni ha lo scopo di garantire che questi passaggi vengano eseguiti correttamente.


Obiettivi di apprendimento
Comprendere cos'è la gestione delle sessioni
Comprendere le differenze tra autenticazione e autorizzazione e il ruolo che ciascuna di esse svolge nella gestione delle sessioni.
Scopri i due principali metodi di gestione delle sessioni.
Scopri il ciclo di vita della gestione delle sessioni.
Scopri come sfruttare concretamente le implementazioni vulnerabili della gestione delle sessioni

GESTIONE DELLE SESSIONI
*creazione della sessione:* Una volta forniti nome utente e password, si riceve un valore di sessione che viene poi inviato con ogni nuova richiesta. Il modo in cui questi valori di sessione vengono generati, utilizzati e memorizzati è fondamentale per la sicurezza della creazione della sessione.

*Tracciamento della sessione*: Una volta ricevuto il valore di sessione, questo viene inviato con ogni nuova richiesta. Ciò consente all'applicazione web di tracciare le tue azioni, anche se il protocollo HTTP è di natura stateless. Ad ogni richiesta effettuata, l'applicazione web può recuperare il valore di sessione dalla richiesta stessa ed eseguire una ricerca lato server per capire a chi appartiene la sessione e quali autorizzazioni ha.

*Scadenza della sessione*: può capitare che un utente dell'applicazione web smetta improvvisamente di utilizzare la sessione. Se la durata scade e si invia un valore di sessione obsoleto all'applicazione web, la richiesta dovrebbe essere rifiutata poiché la sessione avrebbe dovuto essere scaduta. Invece, l'utente dovrebbe essere reindirizzato alla pagina di login per autenticarsi nuovamente e ricominciare il ciclo di gestione della sessione da capo!

*Terminazione della sessione*: l'utente potrebbe forzare la disconnessione. In tal caso, l'applicazione web dovrebbe terminare la sessione dell'utente. Sebbene questo sia simile alla scadenza della sessione, se ne distingue per il fatto che, anche se la durata della sessione è ancora valida, la sessione stessa dovrebbe essere terminata.


AUTENTICAZIONE VS AUTORIZZAZIONE

COOKIE VS TOKEN
La gestione delle sessioni basata sui cookie è spesso definita il metodo tradizionale. Quando un'applicazione web desidera iniziare il tracciamento, invia il valore dell'intestazione Set-Cookie in una risposta. Il browser interpreta questa intestazione per memorizzare un nuovo valore del cookie. Vediamo un esempio di intestazione Set-Cookie:

Set-Cookie: session=12345;

La gestione delle sessioni basata su token è un concetto relativamente nuovo. Invece di utilizzare le funzionalità automatiche di gestione dei cookie del browser, si affida a codice lato client per il processo. Dopo l'autenticazione, l'applicazione web fornisce un token all'interno del corpo della richiesta. Tramite codice JavaScript lato client, questo token viene quindi memorizzato nel LocalStorage del browser.

PROBLEMI COMUNI

CREAZIONE DELLA SESSIONE:
   - VALORI DI SESSIONE DEBOLI: Un buon esempio è un meccanismo che codifica semplicemente il nome utente in base64 come valore di sessione. Se un malintenzionato è in grado di decodificare il processo di creazione delle sessioni, può generare o indovinare i valori di sessione per impossessarsi degli account di utenti legittimi.
   - VALORI D ISESSIONE CONTROLLABILI: In alcuni token, come i JWT, sono fornite tutte le informazioni necessarie sia per la creazione che per la verifica della validità del token stesso.
   - FISSAZIONE DELLA SESSIONE: Ricordate l'applicazione web che vi assegnava una sessione prima dell'autenticazione? Queste applicazioni web possono essere vulnerabili a un problema chiamato "session fixation". Se il valore della sessione non viene ruotato correttamente dopo l'autenticazione, un malintenzionato ben posizionato potrebbe registrarlo quando non siete ancora autenticati e attendere che vi autentichiate per ottenere l'accesso alla vostra sessione.  

TRACCIAMENTO DELLA SESSIONE:
   - Bypass dell'autorizzazione
   - Registrazione insufficiente
   - Scadenza della sessione

Terminazione della sessione   
