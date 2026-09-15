---
title: Nmap Post Port Scans
date: 2026-09-11 00:00:00 +0200
categories: [PT1, 2-nmap]
tags: [nmap, port-scanning, tcp, evasion]
---


# Nmap — Post Port Scan

Dopo il port scanning, l'enumerazione con Nmap può proseguire con attività più mirate per capire *quali servizi sono in ascolto*, *quali versioni utilizzano*, *quale sistema operativo è presente*, *quali informazioni possono essere raccolte tramite gli script NSE*, e *come salvare i risultati delle scansioni*. Questo approccio consente di passare dalla semplice informazione "porta aperta" a un quadro molto più ricco del target.

## 1. Service Detection (-sV)

L'opzione `-sV` permette a Nmap di raccogliere e determinare le informazioni relative a *servizio e versione* delle porte aperte.

```bash
nmap -sV target
```

Con questo comando Nmap non si limita a indicare che la porta è `open`: prova a capire *quale servizio* è in esecuzione e, quando possibile, *quale versione*. Per farlo, Nmap invia una serie di **probe** (sonde) specifiche e confronta le risposte ricevute con un ampio database di firme note, contenuto nel file/database `nmap-service-probes`.

> La service detection richiede normalmente di interagire direttamente con il servizio. Per le porte TCP, questo comporta l'instaurazione della connessione TCP necessaria per comunicare con il servizio in ascolto.

### Version intensity

Ogni probe presente in `nmap-service-probes` ha un valore di **rarity** compreso tra `0` e `9`. In generale, il valore indica quanto una determinata probe sia considerata comune/probabile e quindi quanto sia ragionevole provarla durante l'identificazione del servizio.

- **Rarità bassa (`0–2`)** → probe utili per servizi molto comuni, come HTTP, SSH o FTP.
- **Rarità alta (`8–9`)** → probe più rare o specialistiche, utili soprattutto per servizi insoliti; possono aumentare sensibilmente il tempo della scansione.

L'opzione `--version-intensity LEVEL` determina quali probe vengono utilizzate.

```bash
nmap -sV --version-intensity 0 target
```

```bash
nmap -sV --version-intensity 9 target
```

In generale:

- un'intensità più bassa tende a privilegiare una scansione più rapida;
- un'intensità più alta utilizza un insieme più ampio di probe e può aumentare la probabilità di identificare servizi non standard, al costo di una scansione più lenta. Di seguito due varianti:


```bash
nmap -sV --version-light target
```
Usa una selezione ridotta di probe, equivalente alla versione leggera dell'enumerazione del servizio.


```bash
nmap -sV --version-all target
```

Tenta tutte le probe disponibili, massimizzando la copertura a discapito della velocità.


## 2. OS Detection (`-O`)

L'opzione `-O` abilita il rilevamento del *sistema operativo* del target.


```bash
sudo nmap -sS -O <TARGET_IP>
```

Nmap analizza caratteristiche e risposte della rete per cercare di identificare il sistema operativo e, in alcuni casi, una versione o una famiglia di sistemi compatibile.

> L'OS detection può richiedere privilegi elevati e può essere influenzata da firewall, filtraggio, dispositivi intermedi e configurazioni di rete particolari.


## 3. Traceroute (`--traceroute`)

L'opzione `--traceroute` permette di ricostruire il **percorso di rete** seguito dai pacchetti verso il target, mostrando i vari **hop** (router o altri dispositivi intermedi).

```bash
nmap --traceroute <TARGET_IP>
```

Spesso viene combinata con altre tecniche di enumerazione:

```bash
nmap -sV --traceroute <TARGET_IP>
```

Il meccanismo si basa sul **TTL** (Time To Live) dei pacchetti, aumentando progressivamente il valore del TTL:

1. *TTL = 1* → il primo router decrementa il TTL a `0`, scarta il pacchetto e può rispondere con un messaggio *ICMP Time Exceeded*; questo permette di identificare il primo hop.
2. *TTL = 2* → il pacchetto supera il primo router e viene fermato dal secondo, permettendo di identificare il secondo hop.
3. Il TTL viene incrementato progressivamente fino a raggiungere il target.

Nmap raccoglie gli indirizzi rilevati e li presenta in sequenza, ricostruendo il percorso osservabile verso il bersaglio.

> Non tutti i dispositivi rispondono allo stesso modo: molti router sono configurati per non inviare messaggi ICMP *Time-to-Live exceeded*, quindi alcuni hop possono risultare non identificabili.

### Esempio di output

```text
TRACEROUTE (using port 443/tcp)
HOP  RTT       ADDRESS
1    2.14 ms   192.168.1.1
2    8.67 ms   10.20.0.1
3    15.32 ms  203.0.113.5
4    22.90 ms  target.example.com (203.0.113.10)
```

### Perché è utile durante un pentest

Il traceroute può aiutare a:

- *mappare la topologia della rete*, stimando quanti hop separano l'attaccante dal target;
- *individuare dispositivi intermedi*, come router, gateway o altri apparati di rete;
- *rilevare possibili firewall o proxy*, soprattutto quando il percorso si interrompe o alcuni hop risultano filtrati;
- ottenere indizi sulla presenza di *VPN, NAT o infrastrutture cloud*.



## 4. Nmap Scripting Engine (NSE)

*Nmap Scripting Engine (NSE)* permette di estendere le funzionalità di Nmap tramite script dedicati all'enumerazione, al rilevamento e, in alcuni casi, alla verifica di vulnerabilità.

### Principali categorie di script NSE

| Categoria | Descrizione |
|---|---|
| `auth` | Esegue script relativi all'autenticazione. |
| `broadcast` | Cerca host inviando messaggi broadcast. |
| `brute` | Esegue auditing di password tramite tentativi di autenticazione. |
| `default` | Esegue gli script NSE predefiniti (equivalente a `-sC`). |
| `discovery` | Recupera informazioni accessibili, come nomi DNS o dati di database. |
| `dos` | Individua servizi potenzialmente vulnerabili a Denial of Service. |
| `exploit` | Tenta di sfruttare vulnerabilità di servizi specifici. |
| `external` | Utilizza servizi di terze parti, quando previsti dallo script. |
| `fuzzer` | Esegue attività di fuzzing. |
| `intrusive` | Include script invasivi, come brute force o exploitation. |
| `malware` | Cerca indicatori di backdoor o malware. |
| `safe` | Include script considerati sicuri e progettati per ridurre il rischio di impatto sul target. |
| `version` | Recupera informazioni sulle versioni dei servizi. |
| `vuln` | Controlla la presenza di vulnerabilità note o condizioni di sfruttabilità. |

> Le categorie non sono tutte mutuamente esclusive: un singolo script può appartenere a più categorie.

### Script di default con `-sC`

L'opzione *-sC*  è una scorciatoia per *--script=default*. Questo ordina a Nmap di eseguire gli script NSE classificati come **default**. Si concentra principalmente sull'individuazione dello stato delle porte, con l'obiettivo di ottenere automaticamente informazioni aggiuntive sui servizi rilevati.
A seconda del servizio trovato, gli script possono raccogliere informazioni come:

- banner e dettagli del servizio;
- certificati SSL/TLS;
- informazioni SMB;
- informazioni HTTP e contenuti di base;
- altri dati utili all'enumerazione.

### La combinazione `-sS -sV -sC`

Nella pratica, `-sC` viene spesso utilizzato insieme a `-sV` e `-sS`, perché molti script NSE possono beneficiare delle informazioni già raccolte durante la service detection.


### Esecuzione di script specifici

È possibile selezionare direttamente script o categorie tramite `--script`:

```bash
nmap --script=default <TARGET_IP>
```

```bash
nmap --script=vuln <TARGET_IP>
```


### Combinazione completa: `-A`

L'opzione `-A` abilita un insieme esteso di tecniche di detection.

In termini pratici, è associata a:

```text
-sV -O -sC --traceroute
```

Esempio:

```bash
sudo nmap -A target
```

È una modalità comoda per ottenere molte informazioni con un singolo comando, ma può risultare più rumorosa, più lenta e più invasiva rispetto a una scansione costruita con opzioni selezionate manualmente.



## 6. Saving the Output

Durante le attività di enumerazione il numero di file prodotti può crescere rapidamente. Salvare i risultati in formati standardizzati aiuta a conservarli e a consultarli successivamente. Il comando

```bash
nmap -oN scan.nmap 10.113.178.167
```

salva l'output in **formato normale**, leggibile direttamente da una persona. ll comando


```bash
nmap -oG scan.gnmap 10.113.178.167
```

è pensato per facilitare l'estrazione automatica di informazioni tramite strumenti come `grep`, `awk` e script di shell, mentre il comando

```bash
nmap -oX scan.xml 10.113.178.167
```
salva i dati in formato formato XML ed è utile quando i risultati devono essere elaborati automaticamente da altri strumenti.

>`-oA` salva contemporaneamente i risultati nei principali formati di output.
>```bash
>nmap -oA scan 10.113.178.167
>```
>Questo produce i file relativi ai formati **normal**, **XML** e **grepable**.



## 7. Sum Up

**Significato delle flag:**

| Opzione | Significato |
|---|---|
| `-sV` | Determina le informazioni di servizio/versione sulle porte aperte. |
| `--version-light` | Usa una selezione più limitata di probe per una service detection più rapida. |
| `--version-all` | Prova tutte le probe disponibili. |
| `--version-intensity LEVEL` | Controlla l'intensità della service detection in base alla rarity delle probe. |
| `-O` | Tenta di identificare il sistema operativo. |
| `--traceroute` | Ricostruisce il percorso di rete verso il target. |
| `--script=SCRIPTS` | Specifica gli script NSE da eseguire. |
| `-sC` / `--script=default` | Esegue gli script NSE della categoria `default`. |
| `-A` | Abilita un insieme esteso di detection: `-sV`, `-O`, `-sC` e traceroute. |
| `-oN` | Salva l'output in formato normale. |
| `-oG` | Salva l'output in formato grepable. |
| `-oX` | Salva l'output in formato XML. |
| `-oA` | Salva l'output nei formati normal, XML e grepable. |

**Comandi:**

```bash
# Service/version detection
nmap -sV target

# Version intensity
nmap -sV --version-intensity 0 target
nmap -sV --version-intensity 9 target
nmap -sV --version-light target
nmap -sV --version-all target

# OS detection
sudo nmap -sS -O target

# Traceroute
nmap --traceroute target
nmap -sV --traceroute target

# Default NSE scripts
nmap -sC target
sudo nmap -sS -sV -sC target

# Specific NSE scripts/categories
nmap --script=SCRIPTS target

# Aggressive scan
sudo nmap -A target

# Save output
nmap -oN scan.nmap target
nmap -oG scan.gnmap target
nmap -oX scan.xml target
nmap -oA scan target
```


## 9. Quick workflow

Una sequenza tipica di enumerazione post-port-scan può essere:

```bash
# 1. Identificare servizi e versioni
nmap -sV target

# 2. Aggiungere gli script NSE di default
nmap -sV -sC target

# 3. Provare l'OS detection
sudo nmap -sV -sC -O target

# 4. Aggiungere il traceroute
sudo nmap -sV -sC -O --traceroute target

# 5. Salvare i risultati
sudo nmap -sV -sC -O --traceroute -oA scan target
```
