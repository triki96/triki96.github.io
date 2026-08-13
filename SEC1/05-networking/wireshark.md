---
title: "Wireshark"
date: 2026-08-11 14:00:00 +0200
categories: [Cyber Security 101]
tags: [networking, wireshark]
description: ""
toc: true
---
## Capture Filters and Interfaces

È la schermata iniziale di Wireshark, prima ancora di iniziare qualsiasi cattura. Serve a rispondere a due domande preliminari: **da dove** catturare il traffico, e **cosa** catturare esattamente.

**Interfaces** — l'elenco di tutte le interfacce di rete disponibili sul computer, le stesse che si vedrebbero con `ifconfig`/`ip addr` (es. `eth0`, `wlo1`, `lo`). Bisogna scegliere su quale interfaccia ascoltare.

**Capture Filters** — un filtro impostato **prima** di iniziare la cattura, che dice a Wireshark di registrare solo un certo tipo di traffico, ignorando tutto il resto — utile perché su una rete anche moderatamente attiva si accumulano rapidamente migliaia di pacchetti irrilevanti.

### Capture filter vs Display filter

| | Capture filter | Display filter |
|---|---|---|
| Quando si applica | Prima/durante la cattura | Dopo, sui pacchetti già catturati |
| Effetto | I pacchetti esclusi non vengono mai salvati | I pacchetti esclusi restano salvati, solo nascosti dalla vista |
| Sintassi | BPF (es. `host 1.2.3.4`) | Sintassi Wireshark (es. `ip.addr == 1.2.3.4`) |
| Reversibilità | Non reversibile | Reversibile, si può cambiare in ogni momento |

Consiglio pratico: se non si è sicuri di cosa serve, è meglio non applicare un capture filter troppo restrittivo (si rischia di scartare per sempre traffico utile), e filtrare invece dopo con i display filter, una volta che i pacchetti sono già salvati.

## La struttura di un pacchetto

Aprendo un pacchetto, Wireshark mostra questi campi principali: **Frame**, **Source [MAC]**, **Source [IP]**, **Protocol**, **Protocol Errors**, **Application Protocol**, **Application Data**.

![Struttura annidata di un pacchetto in Wireshark](/assets/img/posts/wireshark-frame-structure-diagram.svg)
_Anche se mostrati come elenco piatto, questi campi sono annidati l'uno dentro l'altro_

### Cos'è davvero il Frame

Il **Frame** non è il livello fisico (livello 1 OSI) — quel livello si occupa di segnali elettrici/ottici/radio, non ha campi strutturati, e Wireshark non può catturarlo in senso stretto (la scheda di rete traduce già i segnali in dati digitali prima che qualsiasi software li veda). Il "Frame" di Wireshark è invece il **contenitore che rappresenta l'intera cattura di un singolo pacchetto**, dalla prima all'ultima byte, più i metadati che Wireshark stesso aggiunge:

```
Frame Number: 42
Arrival Time: Aug 8, 2026 23:45:12.384729000
Frame Length: 100 bytes
Capture Length: 100 bytes
```

**Questi metadati non viaggiano mai in rete** — il numero progressivo del frame, il timestamp di arrivo, non fanno parte del pacchetto originale in nessun modo. Sono generati localmente da `libpcap` (la libreria di cattura) nel momento in cui la scheda di rete consegna quei byte al sistema, esattamente come scrivere a penna sul retro di una foto "scattata alle 14:32, è la 42ª che vedo oggi" — un'annotazione dell'osservatore, non parte dell'oggetto fotografato.

### Perché sembrano un elenco piatto ma sono annidati

Wireshark mostra Frame, Ethernet, IP, TCP e Dati applicativi tutti alla stessa indentazione visiva, per comodità di lettura — ma concettualmente ogni voce successiva è contenuta **dentro** il payload di quella precedente:

```
Frame: [ Ethernet: [ IP: [ TCP: [ Dati applicativi ] ] ] ]
```

La prova diretta: sommando le lunghezze di ciascuna sezione (Ethernet header + IP header + TCP header + dati applicativi) si ottiene esattamente la Frame Length totale.

### Gli altri campi

- **Source [MAC]** — indirizzo MAC del mittente a livello 2; se il traffico arriva da fuori la propria subnet, è il MAC del gateway, non del vero mittente originale (il MAC cambia a ogni hop, l'IP resta lo stesso)
- **Source [IP]** — indirizzo IP del mittente a livello 3, resta invariato per tutto il percorso
- **Protocol** — il protocollo di trasporto/rete riconosciuto (TCP, UDP, ICMP)
- **Protocol Errors** — anomalie rilevate (checksum non validi, pacchetti malformati), utile sia per troubleshooting sia per individuare traffico manipolato
- **Application Protocol** — il protocollo di livello applicativo riconosciuto dentro il payload (HTTP, DNS, SMTP...)
- **Application Data** — il contenuto vero del messaggio applicativo; se il traffico è cifrato (HTTPS), qui si vedono solo byte illeggibili, a meno di fornire a Wireshark le chiavi di sessione (vedi sezione finale)

## Leggere contenuti troncati ([Truncated])

Se un campo testuale mostra `[Truncated]` e la riga non termina, ci sono due cause possibili, da distinguere:

**Causa 1 — cattura incompleta (snaplen).** Se `Capture Length` è minore di `Frame Length` nel Frame espanso, significa che Wireshark ha catturato solo i primi N byte del pacchetto (limite di "Snap Length" impostato in fase di cattura). In questo caso i byte mancanti sono persi per sempre, non recuperabili da un file già catturato — l'unica soluzione è rifare la cattura con uno snaplen alto o disattivato (`Capture > Options`).

**Causa 2 — limite di visualizzazione per riga.** Se il pacchetto è stato catturato per intero (`Capture Length` = `Frame Length`), ma una singola riga di testo molto lunga (es. un'ASCII art con righe ripetute di caratteri) viene comunque troncata nel pannello ad albero, è solo un limite di visualizzazione di quella riga specifica, non una perdita di dati.

**Soluzioni per la causa 2:**
- **Export Objects** (`File > Export Objects > HTTP`) — estrae il file reale trasferito e lo salva su disco, apribile con un editor di testo qualsiasi, senza alcun troncamento
- **Follow > HTTP Stream** (tasto destro sul pacchetto) — ricompone l'intero scambio richiesta/risposta in una finestra dedicata e scorrevole
- **Packet Bytes pane** — il pannello esadecimale in basso mostra comunque tutti i byte reali, anche se la rappresentazione testuale a sinistra li interpreta a capo per leggibilità

## Filtri: normale, Apply as a Filter, e Conversation Filter

### La differenza generale

- **Filtro scritto a mano** (es. `ip.addr == 10.10.57.178`) — richiede di conoscere la sintassi, ma è il più flessibile
- **Apply as a Filter** (tasto destro su un campo nel pannello dettagli) — filtra su un **singolo valore** del pacchetto selezionato; se quel valore è ad esempio l'IP sorgente, il filtro generato mostra solo i pacchetti dove quell'IP è **mittente**, escludendo le risposte dove lo stesso IP compare come destinatario
- **Conversation Filter** (tasto destro su un pacchetto → Conversation Filter, o `Analyze > Conversation Filter`) — isola l'**intera relazione bidirezionale** tra due endpoint, combinando automaticamente IP e porte in entrambe le direzioni

### Conversation Filter per livello

Scegliendo il livello nel menu Conversation Filter, cambia cosa viene isolato:

| Livello scelto | Cosa isola |
|---|---|
| Ethernet | Traffico tra due MAC address |
| IP | Tutto il traffico tra due host, qualsiasi porta/protocollo |
| TCP | Una singola connessione TCP specifica (stesso IP+porta in entrambe le direzioni) |
| UDP | Come TCP, ma per scambi UDP |

Scegliendo **TCP**, Wireshark genera un filtro basato sul numero di stream progressivo che assegna a ogni connessione:
```
tcp.stream eq 7
```
(il numero parte da 0: se si ottiene `tcp.stream eq 0`, è semplicemente la prima connessione TCP registrata in quella cattura — normale se si è selezionato un pacchetto diverso da quello precedente)

Questo è più preciso di un filtro IP puro: se lo stesso host avesse altre connessioni TCP parallele (porte diverse) verso lo stesso server, quelle non comparirebbero, perché avrebbero un `tcp.stream` diverso.

### Perché non si può fare "Apply as a Filter" sulla colonna Protocol nella lista

La colonna **Protocol** nella lista pacchetti (in alto) è un valore riassuntivo calcolato dall'interfaccia — mostra "il protocollo più alto riconosciuto" per comodità di lettura, ma non è un vero campo dissezionato collegabile direttamente a un filtro. I veri campi filtrabili stanno nel pannello **Packet Details** (quello ad albero, sotto): lì si può cliccare col tasto destro su una riga specifica (es. `Transmission Control Protocol`) e usare Apply as Filter in modo affidabile.

In alternativa, per filtrare per protocollo basta scrivere direttamente il suo nome nella barra filtri:
```
tcp
http
dns
```

## Perché a volte Wireshark mostra HTTP, a volte solo TCP

![Riassemblaggio dei segmenti TCP in un messaggio HTTP](/assets/img/posts/wireshark-reassembly-diagram.svg)
_Solo l'ultimo frammento, quando il messaggio è completo, viene mostrato come HTTP_

Wireshark mostra il livello applicativo nella colonna Protocol solo se quel pacchetto contiene effettivamente dati riconoscibili come tali:

- **Pacchetti di puro controllo TCP** (SYN, SYN-ACK, ACK senza dati) → restano `TCP`, perché non c'è alcun payload applicativo da interpretare
- **Risposte HTTP grandi, spezzate su più pacchetti TCP** → i pacchetti intermedi restano `TCP` (spesso con la nota `[TCP segment of a reassembled PDU]`), perché un frammento isolato non è un messaggio HTTP valido di per sé. Solo l'**ultimo** pacchetto, quello che completa il messaggio secondo `Content-Length`, viene mostrato come `HTTP` — a quel punto Wireshark ha **riassemblato** tutti i pezzi e può interpretare il messaggio nella sua interezza

TCP garantisce solo che i byte arrivino nell'ordine giusto — non ha alcun concetto di "dove finisce un messaggio applicativo". È il livello applicativo a doverlo capire, e Wireshark replica lo stesso comportamento: accumula i segmenti finché non rileva di avere un messaggio completo.

## Contare i pacchetti visualizzati dopo un filtro

Il numero si trova nella **barra di stato**, in basso:

```
Packets: 58620 · Displayed: 11 (0.0%) · Marked: 4 (0.0%) · Comments: 1
```

- **Packets** — totale nell'intera cattura, prima di qualsiasi filtro
- **Displayed** — quanti pacchetti soddisfano il filtro attivo, con relativa percentuale
- **Marked** — pacchetti marcati manualmente (tasto destro → Mark/Unmark Packet)
- **Comments** — pacchetti con un commento testuale aggiunto

Lo stesso dato è consultabile anche da `Statistics > Capture File Properties`, insieme ad altre statistiche sulla cattura.

## Decifrare HTTPS con Wireshark

![Decifrare HTTPS con SSLKEYLOGFILE](/assets/img/posts/wireshark-sslkeylog-diagram.svg)
_Wireshark combina il traffico cifrato catturato con le chiavi di sessione esportate dal browser_

Wireshark può decifrare traffico HTTPS **solo se si ha accesso alle chiavi di sessione** — non è possibile decifrare traffico HTTPS altrui semplicemente catturandolo, perché è cifrato proprio per impedirlo. Il metodo standard richiede di controllare il client che genera quelle chiavi.

### Il metodo standard: SSLKEYLOGFILE

Molti browser (Chrome, Firefox) possono essere configurati per esportare le chiavi di sessione TLS in un file di log, mano a mano che le generano.

```bash
# Linux/macOS
export SSLKEYLOGFILE=~/sslkeys.log
google-chrome   # lanciato dallo stesso terminale
```

In Wireshark: `Edit > Preferences > Protocols > TLS`, campo **"(Pre)-Master-Secret log filename"**, inserire il percorso dello stesso file. Da quel momento, catturando il traffico mentre si naviga, Wireshark decifra automaticamente in tempo reale i pacchetti TLS di quella sessione.

### Il metodo alternativo: chiave privata del server

Se si possiede la chiave privata del certificato del server (es. un server di laboratorio proprio), si può configurarla in `Edit > Preferences > Protocols > TLS > RSA keys list`. Questo metodo **non funziona** però con i cipher suite moderni che usano **forward secrecy** (Diffie-Hellman effimero, oggi lo standard) — ogni sessione usa una chiave derivata unica che non dipende in modo statico dalla chiave del certificato, per cui `SSLKEYLOGFILE` resta il metodo universalmente consigliato oggi.

## Utilizzo

Wireshark rende visibile concretamente tutta la teoria di rete studiata: il three-way handshake TCP con i numeri di sequenza, l'SNI in chiaro durante un TLS handshake, un pacchetto RST che interrompe una connessione, o il riassemblaggio di una risposta HTTP frammentata. È uno strumento centrale sia per il troubleshooting di rete sia per l'analisi di sicurezza — verificare traffico anomalo, estrarre file trasferiti in chiaro, o analizzare comunicazioni cifrate in un ambiente di laboratorio controllato.
