---
title: "SQL Fundamentals"
date: 2026-08-17 12:00:00 +0200
categories: [Cyber Security 101, web-hacking]
tags: [sql-fundamentals, sql, database]
description: "Database relazionali e non relazionali, primary/foreign key, DBMS, e i comandi SQL di base: DDL, CRUD, clausole, operatori e funzioni."
toc: true
---

## Introduzione

I database sono l'infrastruttura su cui si appoggia praticamente ogni applicazione moderna — dai siti web ai sistemi di autenticazione, fino agli strumenti di threat intelligence. Capire come funzionano è fondamentale sia per capire come proteggerli, sia per capire come vengono attaccati (es. tramite SQL injection).

### Tipologie di database

Esistono due grandi famiglie di database:

**Database relazionali (relational)**
Organizzano i dati in **tabelle** con righe e colonne fisse, con uno schema rigido e predefinito. Ogni tabella può essere collegata alle altre tramite chiavi. Sono la scelta ideale quando i dati sono strutturati in modo coerente e serve integrità referenziale (es. transazioni e-commerce). Esempi: MySQL, PostgreSQL, Oracle, SQL Server.

**Database non relazionali (non-relational / NoSQL)**
Gestiscono dati flessibili, non strutturati o semi-strutturati, che possono arrivare in formati diversi (documenti, coppie chiave-valore, grafi). Non richiedono uno schema rigido, quindi si adattano meglio a dati con struttura molto variabile. Esempi: MongoDB, Redis, Cassandra.

![Relational vs non-relational database](/assets/img/posts/relational-vs-nonrelational.svg)

### Foreign key e primary key

**Primary key (chiave primaria)**
È l'identificatore univoco di ogni riga in una tabella — non può ripetersi e non può essere nullo. Esempio: un ID studente univoco per ogni studente in una tabella `studenti`.

**Foreign key (chiave esterna)**
È una colonna che collega una tabella a un'altra, facendo riferimento alla primary key di quest'ultima. Esempio: una colonna `autore_id` nella tabella `libri` che punta all'`id` nella tabella `autori` — questo è ciò che permette di collegare dati correlati tra tabelle diverse.

![Primary key e foreign key](/assets/img/posts/primary-foreign-key.svg)

### DBMS

Un **DBMS** (Database Management System) è il software che gestisce concretamente il database: crea, legge, aggiorna ed elimina dati, gestisce permessi e utenti, garantisce l'integrità e le prestazioni. SQL è il linguaggio con cui si comunica con un DBMS relazionale — esempi di DBMS: MySQL, MariaDB, PostgreSQL, Microsoft SQL Server, Oracle Database.

### SQL

**SQL** (Structured Query Language) è un linguaggio dichiarativo per interagire con database relazionali tramite un DBMS. È dichiarativo perché descrivi *cosa* vuoi ottenere, non *come* ottenerlo — è il DBMS a occuparsi dell'esecuzione. La sua sintassi vicina al linguaggio naturale lo rende accessibile, e la sua rigidità nel tipo di dati (rifiuta inserimenti incompatibili) lo rende affidabile.

---

## Comandi SQL

### Comandi per il database

**CREATE DATABASE** — crea un nuovo database

```sql
CREATE DATABASE tools_db;
```

**SHOW DATABASES** — elenca tutti i database disponibili sul DBMS

```sql
SHOW DATABASES;
```

**USE** — seleziona il database su cui lavorare per i comandi successivi

```sql
USE tools_db;
```

**DROP DATABASE** — elimina definitivamente un database e tutto il suo contenuto

```sql
DROP DATABASE tools_db;
```

### Comandi per le tabelle

**CREATE TABLE** — crea una nuova tabella, definendo colonne e tipi di dato

```sql
CREATE TABLE hacking_tools (
    id INT PRIMARY KEY,
    name VARCHAR(50),
    category VARCHAR(50),
    price DECIMAL(6,2)
);
```

**SHOW TABLES** — elenca tutte le tabelle nel database selezionato

```sql
SHOW TABLES;
```

**DESCRIBE** — mostra la struttura di una tabella (colonne, tipi, chiavi)

```sql
DESCRIBE hacking_tools;
```

**DROP TABLE** — elimina definitivamente una tabella

```sql
DROP TABLE hacking_tools;
```

### Operazioni CRUD

CRUD sta per Create, Read, Update, Delete — le quattro operazioni base su qualsiasi dato in una tabella.

**INSERT (Create)** — aggiunge una nuova riga

```sql
INSERT INTO hacking_tools (id, name, category, price)
VALUES (1, 'Nmap', 'Reconnaissance', 0.00);
```

**SELECT (Read)** — legge dati da una tabella

```sql
SELECT * FROM hacking_tools;
```

**UPDATE (Update)** — modifica righe esistenti

```sql
UPDATE hacking_tools
SET price = 15.00
WHERE name = 'Nmap';
```

**DELETE (Delete)** — elimina righe esistenti

```sql
DELETE FROM hacking_tools
WHERE name = 'Nmap';
```

### Clauses

**DISTINCT** — rimuove i duplicati dal risultato

```sql
SELECT DISTINCT category FROM hacking_tools;
```

**GROUP BY** — raggruppa righe che condividono lo stesso valore in una colonna, tipicamente usata con funzioni di aggregazione

```sql
SELECT category, COUNT(*) FROM hacking_tools GROUP BY category;
```

**ORDER BY** — ordina il risultato in base a una o più colonne

```sql
SELECT * FROM hacking_tools ORDER BY name ASC;
```

**HAVING** — filtra i gruppi creati da GROUP BY (a differenza di WHERE, che filtra le righe prima del raggruppamento)

```sql
SELECT category, COUNT(*) FROM hacking_tools
GROUP BY category
HAVING COUNT(*) > 2;
```

### Operators

**LIKE** — confronto per pattern, spesso con wildcard `%` (qualsiasi sequenza) e `_` (un singolo carattere)

```sql
SELECT * FROM hacking_tools WHERE name LIKE 'N%';
```

**AND / OR / NOT** — combinano più condizioni

```sql
SELECT * FROM hacking_tools WHERE category = 'Reconnaissance' AND price = 0.00;
SELECT * FROM hacking_tools WHERE category = 'Reconnaissance' OR category = 'Exploitation';
SELECT * FROM hacking_tools WHERE NOT category = 'Reconnaissance';
```

**BETWEEN** — verifica se un valore rientra in un intervallo

```sql
SELECT * FROM hacking_tools WHERE price BETWEEN 10 AND 50;
```

**Operatori di confronto (`>`, `<`, `=`, `>=`, `<=`, `!=`)**

```sql
SELECT * FROM hacking_tools WHERE price > 20;
```

### Functions

**CONCAT()** — unisce più stringhe/valori in una sola

```sql
SELECT CONCAT(name, ' - ', category) AS descrizione FROM hacking_tools;
```

**GROUP_CONCAT()** — unisce i valori di più righe di un gruppo in un'unica stringa

```sql
SELECT category, GROUP_CONCAT(name SEPARATOR ', ') FROM hacking_tools GROUP BY category;
```

**SUBSTRING()** — estrae una porzione di una stringa

```sql
SELECT SUBSTRING(name, 1, 3) FROM hacking_tools;
```

**LENGTH()** — restituisce la lunghezza (in caratteri) di una stringa

```sql
SELECT name, LENGTH(name) FROM hacking_tools;
```

**COUNT()** — conta il numero di righe

```sql
SELECT COUNT(*) FROM hacking_tools;
```

**SUM()** — somma i valori numerici di una colonna

```sql
SELECT SUM(price) FROM hacking_tools;
```

**MAX() / MIN()** — restituiscono rispettivamente il valore massimo e minimo di una colonna

```sql
SELECT MAX(price), MIN(price) FROM hacking_tools;
```
