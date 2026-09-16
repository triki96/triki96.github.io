
# Burp Suite Modules

## DECODER

Il **Decoder** di Burp Suite è uno strumento per *codificare, decodificare e fare hashing di dati* in diversi formati, direttamente all'interno di Burp. È particolarmente utile durante i test web quando ci si trova davanti a dati trasformati, come parametri *Base64*, valori *URL-encoded* o token apparentemente illeggibili. Permette di *riportare i dati in chiaro* per analizzarli oppure di *codificare un payload* nel formato richiesto prima di inviarlo.

| Operazione | Formati |
|---|---|
| **Encode / Decode** | URL, HTML, Base64, ASCII hex, octal, binary, gzip |
| **Hash** | MD5, SHA-1, SHA-256, ecc. |

### Esempio

Un cookie potrebbe contenere `eyJ1c2VyIjoiZ3Vlc3QifQ==`. Le `==` finali sono un indizio tipico di *Base64*. Inserendo il valore nel Decoder e scegliendo *Decode as → Base64* si ottiene: `{"user":"guest"}`. Il contenuto è ora leggibile e può essere analizzato o, nel contesto di un test autorizzato, modificato e successivamente ricodificato con *Encode as → Base64*.

> I dati possono essere codificati più volte, ad esempio Base64 all'interno di URL-encoding. Il Decoder consente di applicare più trasformazioni in sequenza nella stessa finestra, evitando continui copia/incolla tra strumenti diversi.

> **Smart decode**: Il pulsante *Smart decode* tenta di *riconoscere automaticamente il tipo di codifica* e di applicare la decodifica appropriata. Non è infallibile, ma è utile quando non si conosce il formato del dato.




## COMPARER

Il **Comparer** permette di *confrontare due insiemi di dati*, sia a livello di *testo ASCII* sia a livello di *byte*. È utile quando bisogna individuare rapidamente differenze tra dati anche potenzialmente molto grandi.

### Esempio

Durante un attacco di *brute force* o *credential stuffing* eseguito con Intruder, è possibile ottenere risposte HTTP leggermente diverse. Confrontando due risposte, per esempio una di lunghezza diversa dall'altra, si possono individuare variazioni che potrebbero indicare un comportamento differente dell'applicazione, come un accesso riuscito. Il confronto può quindi essere utile per:

- individuare differenze tra risposte;
- confrontare dati ASCII;
- confrontare dati binari a livello di byte;
- analizzare rapidamente grandi quantità di dati.


## SEQUENCER

Il **Sequencer** serve a verificare la *qualità e la prevedibilità dei token casuali* generati da un'applicazione web. Può essere utilizzato, per esempio, per analizzare:

- cookie di sessione;
- token CSRF;
- ID di sessione;
- codici o identificatori temporanei.

### Esempio

Un'applicazione potrebbe generare dei token quando visitiamo una pagina di login. Individuiamo quindi la richiesta che genera il token. Per esempio, la risposta contiene:

```http
Set-Cookie: session=Ab7xK29Lm...
```

Inviamo la richiesta a Sequencer (da Burp si invia la richiesta al Sequencer e si indica quale parte della risposta contiene il token da analizzare). Avviamo quindi la cattura (Sequencer ripete la richiesta e raccoglie un campione significativo di token)

```
session=8f31a92c17...
session=8f31b15d42...
session=8f31c04a91...
...
```

Burp analizza i dati raccolti e cerca segnali che indichino che il token potrebbe non essere sufficientemente casuale.


## ORGANIZER

*Organizer* è il modulo utilizzato per *organizzare e gestire le richieste HTTP che si vogliono conservare durante un test*. È particolarmente utile quando il numero di richieste cresce rapidamente e la HTTP history diventa difficile da gestire.

Il concetto centrale di Organizer è la **collection**, cioè una raccolta di richieste. Una richiesta interessante può essere inserita in una collection insieme alle altre relative allo stesso test.

Per esempio:

```text
Collection: IDOR

Request 1 → /api/account/100
Request 2 → /api/account/101
Request 3 → /api/account/102
```

Questo permette di mantenere facilmente sotto controllo tutte le richieste utilizzate nello stesso esperimento, senza doverle cercare continuamente nella HTTP history.



## SUM UP

| Modulo | Scopo principale |
|---|---|
| **Proxy** | Intercettare il traffico |
| **HTTP history** | Visualizzare il traffico passato |
| **Repeater** | Modificare e reinviare richieste |
| **Intruder** | Automatizzare variazioni e payload |
| **Decoder** | Codificare, decodificare e fare hashing |
| **Comparer** | Confrontare dati ASCII o byte |
| **Sequencer** | Analizzare la casualità dei token |
| **Organizer** | Organizzare e gestire le richieste importanti |