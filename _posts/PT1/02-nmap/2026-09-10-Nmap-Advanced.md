---
title: Nmap Advanced Port Scans
date: 2026-09-10 00:00:00 +0200
categories: [PT1, 2-nmap]
tags: [nmap, port-scanning, tcp, evasion]
---

Questo documento raccoglie le scan flag-based (NULL, FIN, Xmas, Maimon, ACK, Window, Custom) e le tecniche di evasione/offuscamento (Spoofing, Decoy, Frammentazione, Idle/Zombie scan).

## Introduzione

Oltre alla classica SYN scan (`-sS`), Nmap offre una famiglia di tecniche "avanzate" costruite manipolando i flag TCP e la struttura dei pacchetti IP. Queste tecniche nascono da un'unica esigenza di fondo: la SYN scan lascia un pattern di traffico molto riconoscibile.
Un pacchetto SYN mandato verso decine di porte, senza mai completare l'handshake, è la firma classica di un port scan — qualsiasi IDS/IPS (già a partire da Snort, 1998) la intercetta facilmente. Da qui nasce la domanda che guida tutte le tecniche seguenti: *come possiamo capire se una porta è aperta senza farci scoprire?*

Per rispondere a questa domanda vediamo come un server dovrebbe rispondere a una richiesta, secondo lo standard TCP originale:

- se un host riceve una richiesta su una **porta chiusa**, deve rispondere con **RST**, indipendentemente dai flag del pacchetto in arrivo
- se la porta è **aperta** e il pacchetto non ha né SYN né ACK né RST (cioè non appartiene a nessuna connessione riconosciuta), lo stack deve **ignorarlo silenziosamente**

Questo comportamento, pensato per la robustezza del protocollo, è diventato un modo per dedurre open/closed senza mai comparire come un vero tentativo di connessione.


## Parte 1 — Scan basate sui flag TCP

### Panoramica: le due famiglie di comportamento

| Scan | Flag inviati | Porta aperta (teoria RFC) | Porta chiusa (teoria RFC) |
|---|---|---|---|
| NULL | nessuno | Silenzio | RST |
| FIN | `FIN` | Silenzio | RST |
| Xmas | `FIN, PSH, URG` | Silenzio | RST |
| Maimon | `FIN, ACK` | Silenzio | RST |
| **ACK** | `ACK` | **RST** | **RST** |

> Null, FIN e Xmas provocano una risposta solo dalle porte **chiuse** (silenzio se aperte). Maimon, ACK e Window invece provocano sempre una risposta, sia da porte aperte che chiuse — cambia solo *cosa* osservare in quella risposta per dedurre lo stato.
{: .prompt-tip }

### NULL Scan (`nmap -sN <target>`)

Non imposta nessun flag: tutti e sei i bit sono a zero. È la variante più "pulita" e minimale delle tre basate sull'assenza di flag da connessione.

**Comportamento:** RST su porta chiusa, nessuna risposta su porta aperta.

*Esempio pratico:* un'organizzazione di fine anni '90 mette un firewall stateless davanti a un server interno, con la regola "blocca SYN in ingresso sulla porta 23 (telnet)". Una NULL scan non ha SYN, quindi il firewall la lascia passare senza riconoscerla come minaccia. Il pacchetto arriva al server: se la porta è chiusa risponde RST, se aperta lo ignora silenziosamente — in entrambi i casi l'attaccante ha "visto oltre" il firewall.

### FIN Scan (`nmap -sF <target>`)

Imposta solo il flag `FIN`, pensato per sembrare la coda di una connessione già esistente (magari chiusa in precedenza, o mai vista dal firewall).

**Comportamento:** identico a NULL — RST su porta chiusa, silenzio su porta aperta.

> Alcuni firewall droppano il traffico "silenziosamente" senza mandare RST — in quel caso porta chiusa e porta filtrata diventano indistinguibili dall'esterno.
{: .prompt-warning }

### Xmas Scan (`nmap -sX <target>`)

Imposta contemporaneamente `FIN`, `PSH` e `URG` — una combinazione priva di senso in una connessione reale (da qui il nome: il pacchetto è "acceso come un albero di Natale"), ma comunque valida per testare la stessa proprietà RFC.

**Comportamento:** RST → closed; nessuna risposta → riportato come `open|filtered`.


> **Perché tre varianti (NULL/FIN/Xmas) invece di una sola?**: Per **ridondanza contro implementazioni non standard**: se uno stack TCP gestisce male il caso NULL ma correttamente FIN (o viceversa), avere alternative aumenta le probabilità di un risultato affidabile. Ogni sistema operativo ha piccole discrepanze rispetto alla RFC — è anche per questo che Nmap usa questi stessi pattern per l'OS fingerprinting (`-O`): stack diversi rispondono in modo leggermente diverso, e quella differenza è una firma.

> Il caso d'uso pratico: firewall stateless
> Un **firewall stateless** rileva un tentativo di connessione controllando solo se il pacchetto ha `SYN=1`. Una combinazione di flag che non corrisponde a un SYN inganna quindi il firewall, permettendo di raggiungere il sistema dietro di esso.
> Un **firewall stateful** (lo standard oggi), invece, blocca praticamente tutti questi pacchetti "creativi", perché ragiona in termini di sessioni tracciate e non di singoli flag — rendendo queste tecniche in gran parte inefficaci contro l'infrastruttura moderna.



### TCP Maimon Scan (`nmap -sM <target>`)

La tecnica meno conosciuta tra le scan flag-based. Nasce dall'osservazione di Uriel Maimon a metà anni '90 su un comportamento specifico di alcuni stack BSD-derivati.
Quando le tecniche NULL/FIN/Xmas iniziarono a essere riconosciute e filtrate, serviva un pattern ancora meno ovvio, capace di sfruttare un comportamento peculiare di un sottoinsieme specifico di sistemi operativi.

Lo scan di Maimon manda un pacchetto con **FIN e ACK entrambi accesi**, senza connessione reale in corso. La RFC prevede che un pacchetto FIN/ACK ricevuto fuori da una connessione esistente produca un RST **indipendentemente dallo stato della porta**.

>La differenza rispetto a NULL/FIN/Xmas è proprio il flag ACK. In quelle scan non c'è ACK, quindi su porta aperta lo stack non ha nulla da contestare e ignora il pacchetto — da cui il silenzio che significa "aperta". Con FIN+ACK invece l'ACK stesso è l'anomalia, e la RFC dice di rispondere.

La conseguenza è che su uno stack perfettamente conforme alla RFC, il Maimon scan è _inutile_. Tutte le porte rispondono RST, tutte vengono marcate `closed`, comprese quelle aperte.
Uriel Maimon notò però che molti sistemi BSD-derivati non seguivano la RFC su questo punto specifico: quando la porta era aperta, invece di mandare l'RST prescritto, scartavano il pacchetto in silenzio. Ed è esattamente quella deviazione a rendere la scan utile: reintroduce l'asimmetria che serve.

Stack	|Porta chiusa	|Porta aperta|	Risultato|
---|---|---|---|
Conforme RFC	|RST|	RST	|scan inutile, tutto closed
BSD dell'epoca	|RST	|silenzio|	funziona: silenzio = open or filtered

**Esempio:** `nmap -sM 10.10.10.5 -p 1-100` contro un vecchio FreeBSD.
- Porta 22 (chiusa) → RST → Nmap marca `closed`
- Porta 80 (aperta) → nessuna risposta → Nmap marca `open|filtered`

**Limiti:**
1. Efficacia legata a implementazioni ormai obsolete: gli stack moderni si sono allineati alla RFC 793, quindi oggi si comportano come una normale FIN scan.
2. Stessa ambiguità strutturale delle altre scan "silenziose" (`open|filtered`): non distingue "porta open ignorata" da "firewall che droppa in silenzio".
3. Inefficace contro firewall stateful, che scarta pacchetti fuori sessione a prescindere dalla combinazione di flag.
4. Superata dai sistemi di detection moderni, che analizzano il comportamento a livello di sessione e non il singolo pattern di flag.



### TCP ACK Scan (`nmap -sA <target>`)

Questo scan manda un pacchetto con solo `ACK=1`, senza connessione precedente — un "ACK a freddo". L'idea di base è la seguente: a differenza di NULL/FIN/Xmas/Maimon, la ACK scan non serve a scoprire se una porta è open o closed. Serve a rispondere a una domanda diversa: **"questo firewall sta effettivamente filtrando questa porta, o la lascia passare?"** — utile perché una SYN scan da sola non isola il comportamento specifico del firewall.

**Il comportamento standard è sempre RST:** il flag ACK non è neutro come gli altri — dichiara esplicitamente "sto confermando la ricezione di dati fino a questo sequence number". Lo stack deve verificare questa affermazione contro la propria connection table (la struttura che traccia tutte le connessioni note). Non trovando alcuna connessione corrispondente, non può ignorare l'ACK (sarebbe come lasciare un'affermazione falsa senza contraddittorio): deve rispondere attivamente con **RST**, sia che la porta sia aperta sia che sia chiusa. La decisione avviene a un livello dello stack più basso di quello applicativo — il servizio (open/closed) non entra nemmeno in gioco.

> Con NULL/FIN/Xmas il comportamento standard prevede porta aperta = pacchetto ignorato, porta chiusa = RST. Con la ACK scan questo non vale: il comportamento standard, aperta o chiusa che sia la porta, è **sempre RST**. Ecco perché in una ACK scan non esistono gli stati `open`/`closed`, solo `unfiltered` (RST ricevuto) o `filtered` (nessuna risposta, o ICMP unreachable).
{: .prompt-tip }

**Esempio pratico:** `nmap -sA 10.10.10.5 -p 21,22,80,443`
- Porta 22 → arriva RST → `unfiltered` (il pacchetto è passato, ma non sappiamo se SSH è realmente in ascolto)
- Porta 21 → timeout, nessuna risposta → `filtered` (quasi certamente un firewall scarta il pacchetto)

A quel punto sappiamo che la 22 è raggiungibile attraverso il firewall (serve una SYN scan mirata per sapere se il servizio è davvero attivo), mentre la 21 è bloccata da un dispositivo di sicurezza lungo il percorso.

**Caso d'uso concreto — distinguere firewall stateless da stateful:**
- **Stateless**: filtra solo se vede `SYN=1`. Un ACK a freddo non matcha quella regola e passa → risultato `unfiltered` anche dove il firewall dovrebbe proteggere, rivelando un dispositivo aggirabile.
- **Stateful**: scarta qualsiasi pacchetto non appartenente a una sessione tracciata, a prescindere dal flag → risultato `filtered` quasi ovunque, rivelando (per esclusione) un firewall moderno.

Questo è probabilmente l'uso pratico più concreto della ACK scan oggi: *strumento diagnostico sul tipo di firewall*, più che sul servizio dietro di esso.

---

### Window Scan (`nmap -sW <target>`)

La ACK scan non dice mai open/closed. Si osservò che, su alcuni sistemi, il pacchetto RST di risposta a un ACK a freddo non è sempre identico in ogni campo — in particolare il **TCP Window Size** nell'header del RST può variare a seconda dello stato della porta.

Di conseguenza, il Window Scan è **identico bit per bit** a quello del' ACK scan (solo `ACK=1`), e cambia solo l'analisi della risposta:
- porta chiusa → Window = **0**
- porta aperta → Window **diverso da zero**

**Esempio:** `nmap -sW 10.10.10.5 -p 22,23`
- Porta 22 → RST con Window=512 → `open`
- Porta 23 → RST con Window=0 → `closed`

**Limiti:**
1. *Non è un comportamento da RFC* — è un artefatto implementativo di alcuni stack (storicamente BSD-derivati), non garantito su TCP in generale. Su molti sistemi moderni la Window scan degenera nella stessa ambiguità della ACK scan.
2. *Inaffidabile senza conoscere il target in anticipo*: se tutti i risultati sono identici (tutti zero o tutti diversi da zero), probabilmente lo stack non supporta questa tecnica.
3. *Eredita il problema del firewall stateful*: stesso pacchetto ACK, stesso destino contro un firewall moderno → `filtered` ovunque.

### Custom Scan (`nmap --scanflags <FLAGS> <target>`)

Permette di sperimentare liberamente combinazioni di flag TCP oltre a quelle predefinite.

**Esempio:** per impostare SYN, RST e FIN contemporaneamente:
```bash
nmap --scanflags RSTSYNFIN <target>
```


## Tecniche di evasione ed offuscamento

Mentre gli scan appena visti giocano sui *flag TCP* per ingannare la logica di risposta del target, le tecniche seguenti agiscono su un piano diverso: *l'identità del mittente* (spoofing, decoy, idle scan) o *la forma fisica del pacchetto* (frammentazione), per eludere l'ispezione di firewall/IDS o nascondere l'attribuzione dell'attacco.

### Spoofing dell'IP sorgente (`-S`)

Il meccanismo si articola in tre fasi:
1. L'attaccante invia un pacchetto con un IP sorgente falsificato al target
2. Il target risponde all'IP falsificato (non a quello reale dell'attaccante)
3. L'attaccante dovrebbe intercettare quelle risposte per identificare le porte aperte

Lo spoofing puro è *inutile ai fini pratici* se l'attaccante non può monitorare la rete su cui viaggiano le risposte dirette all'IP falsificato — è per questo che, da solo, serve raramente a qualcosa (si usa tipicamente in combinazione con l'idle scan, vedi sotto, oppure solo per generare rumore/confusione).
{: .prompt-warning }

**Comando completo tipico:**
```bash
nmap -e NET_INTERFACE -Pn -S SPOOFED_IP TARGET_IP
```

>Osserviamo che serve specificare `-e` (interfaccia di rete): normalmente Nmap deduce da solo da quale scheda di rete uscire, guardando le tabelle di routing associate all'IP sorgente. Ma un IP spoofato non corrisponde a nessuna interfaccia reale del tuo host, quindi Nmap non sa più dedurlo automaticamente. Ad esempio, supponiamo di avere`eth0` con IP reale 192.168.1.50. Lanciamo `nmap -S 10.10.10.99 10.10.10.5` — Nmap non sa se 10.10.10.99 debba uscire da `eth0`, `tun0` (se hai una VPN) o altro. Con `-e eth0` lo specifichiamo esplicitamente.

>Osserviamo che serve disabilitare il ping preliminare con `-Pn`:** le risposte, spoofing attivo, non torneranno mai al tuo vero IP — quindi anche il controllo ping preliminare di Nmap fallirebbe sempre, portando Nmap a concludere erroneamente "host down" e a saltare la scansione.
>Tecnicamente il ping resterebbe possibile — verrebbe fatto con il tuo vero IP (lo spoofing si applica solo ai pacchetti della scansione), quindi il risultato sarebbe "onesto" ma irrilevante ai fini di restare nascosti. Il vero rischio pratico è che il target abbia un firewall che blocca ICMP (scenario comune in questi contesti) e Nmap concluda erroneamente "host down". `-Pn` è quindi una precauzione standard contro questo falso negativo, non un obbligo tecnico dello spoofing in sé.
{: .prompt-info }




### Idle / Zombie Scan (`-sI`)

Risolve proprio il limite dello spoofing puro: dà un modo (indiretto) di **vedere i risultati** pur restando completamente nascosti, sfruttando un host terzo (**zombie**) e il suo campo IP ID.

**I tre passaggi del meccanismo:**
1. Interroga lo zombie per registrare il suo **IP ID** attuale
2. Manda un pacchetto SYN al target, spoofato per sembrare proveniente dallo zombie
3. Reinterroga lo zombie per confrontare il nuovo IP ID con quello precedente

**Interpretazione:**
- se la porta target è **aperta**, il target risponde SYN/ACK allo zombie (che non se lo aspettava) → lo zombie risponde RST → il suo IP ID aumenta di **2** (invece di 1)
- se la porta è **chiusa**, il target risponde RST allo zombie → lo zombie lo ignora → l'IP ID aumenta solo di **1** (il normale incremento dovuto al probe di controllo)

Tutto si basa su **osservazione passiva dall'esterno** — esattamente come una normale scansione: mandiamo pacchetti e osserviamo le risposte, senza mai autenticarci o eseguire codice sullo zombie.

**Comando base:**
```bash
nmap -sI ZOMBIE_IP -Pn TARGET_IP
```

>Osserviamo che serve comunque `-Pn` perchè il controllo host-alive preliminare non è compatibile con questa tecnica indiretta — si dà per scontato che l'host sia raggiungibile.

**Differenze fra `-sI` e `-S`:**

| | `-sI ZOMBIE_IP` | `-S SPOOFED_IP` (da solo) |
|---|---|---|
| Cos'è | Un tipo di scan completo | Un modificatore dell'IP sorgente |
| Zombie richiesto | Sì | No |
| Vedi i risultati? | Sì, indirettamente (via IP ID) | No — le risposte vanno all'IP spoofato |

`-sI` include quindi lo spoofing come parte intrinseca del meccanismo, ma risolve il problema di fondo dello spoofing puro dandoci comunque un canale (indiretto) per recuperare l'informazione.



### Decoy Scan (`-D`)

L'idle scan richiede uno zombie con IP ID incrementale prevedibile — sempre più raro sugli stack moderni (molti randomizzano l'IP ID proprio per contrastare questa tecnica). Serve un modo più semplice per ottenere un obiettivo simile: *confondere l'attribuzione* nei log del target, senza dipendere da uno zombie con proprietà così specifiche. L' *idea di fondo* è far sembrare che la scansione provenga da molti IP diversi, così che l'IP reale dell'attaccante si perda tra essi.

A differenza dello spoofing puro, il nostro vero IP *è presente* nel traffico, mescolato a IP fasulli (decoy). Per ogni porta, Nmap manda più pacchetti identici in parallelo: uno con il nostro IP reale, altri con IP falsificati. Le risposte di cui siamo formalmente i mittenti tornano regolarmente e Nmap le processa normalmente.

**Esempi:**
```bash
nmap -D 10.10.0.1,10.10.0.2,ME MACHINE_IP
nmap -D 10.10.0.1,10.10.0.2,RND,RND,ME MACHINE_IP
```
Nel secondo esempio, il terzo e quarto IP sorgente vengono assegnati casualmente da Nmap (`RND`). `ME` indica dove inserire il tuo vero IP nella sequenza; se omesso, Nmap lo inserisce comunque in posizione casuale.

>**Funziona come confusione, non occultamento totale:** un analista che vede nei log 5 IP diversi scansionare simultaneamente le stesse porte, con lo stesso pattern temporale, non può dire con certezza quale sia l'attaccante reale — a meno di indagini più approfondite (TTL, verifica se gli IP esistono e sono raggiungibili).

**Limiti:**
1. Non funziona con la connect scan (`-sT`), che richiede un handshake reale completato dal sistema operativo — un decoy con IP falso non può completarlo.
2. I decoy dovrebbero essere host realmente esistenti e vivi, altrimenti un'analisi attenta li distingue facilmente.
3. Genera molto più traffico (ogni porta viene sondata N volte).

### Frammentazione dei pacchetti (`-f`)

Le tecniche precedenti giocano sul contenuto dei pacchetti (flag, IP sorgente). La frammentazione nasce da un problema diverso: molti firewall/IDS, soprattutto datati o semplici, ispezionano il traffico cercando *pattern noti nell'header TCP completo* (es. la firma di uno scan Nmap). L'idea: se quella firma non viene mai data tutta insieme, ma spezzata in pezzi piccoli — ciascuno innocuo se preso da solo — il dispositivo di ispezione potrebbe non riconoscerla.

All'atto pratico, `-f` frammenta i dati IP in blocchi di **8 byte o meno**. Aggiungendo un secondo `-f` (cioè `-f -f`, equivalente a `-ff`) i frammenti diventano di **16 byte**.

Il target finale **riassembla** comunque i frammenti a livello IP prima di passarli allo stack TCP superiore, quindi il risultato della scansione non cambia — il vantaggio si gioca tutto nei dispositivi **intermedi** che ispezionano il traffico senza riassemblarlo.

**Perché funzionava (soprattutto in passato):** riassemblare frammenti per fare ispezione approfondita è costoso in termini di risorse per un dispositivo che deve farlo in tempo reale su grandi volumi di traffico — molti firewall/IDS datati non lo facevano affatto, o lo facevano solo parzialmente.

**Limiti:**
1. I dispositivi moderni riassemblano prima di ispezionare — l'efficacia oggi è molto ridotta.
2. Frammenti piccoli e anomali possono far scattare allarmi **più facilmente**, non meno — alcuni IDS li considerano di per sé un indicatore di evasione.
3. Aggiunge overhead e può causare scansioni meno affidabili (frammenti persi, fuori ordine, oltre i timeout di riassemblaggio).
4. Non supportata da tutte le tecniche di scan (es. connect scan `-sT`, dove è il kernel a costruire i pacchetti).
5. Alcuni dispositivi bloccano a priori tutto il traffico frammentato per policy, indipendentemente dal contenuto.

**Esempio:**
```bash
nmap -f 10.10.10.5          # frammenti da 8 byte
nmap -ff 10.10.10.5         # frammenti da 16 byte
nmap --mtu 24 10.10.10.5    # dimensione custom (multiplo di 8)
```


## Falsi risultati: quando uno scan mente

È possibile ottenere un risultato **definitivo ma sbagliato**, non solo ambiguo (`open|filtered`). Alcuni scenari documentati:

1. **Stack non conformi a RFC 793.** Alcuni sistemi (storicamente Windows, Cisco IOS, BSD/OS, IBM OS/400) rispondono sempre con RST a un FIN/NULL/Xmas, indipendentemente dallo stato reale della porta — una FIN scan contro Windows può segnalare `closed` una porta in realtà aperta. **Campanello d'allarme:** se una FIN/NULL/Xmas scan restituisce *tutte* le porte `closed`, sospetta prima un target non RFC-compliant che una rete realmente chiusa ovunque.
2. **Window scan su stack che non espone la particolarità.** Se il campo Window non varia mai (sempre zero o sempre diverso da zero), tutte le porte vengono marcate allo stesso modo, a prescindere dallo stato reale.
3. **RST injection difensiva.** Alcuni IDS/IPS iniettano attivamente RST falsi verso l'attaccante per far credere che porte realmente aperte siano chiuse.
4. **Dispositivi intermedi che rispondono al posto del target.** Load balancer, reverse proxy o NAT possono generare risposte che non riflettono lo stato reale del servizio dietro di essi.

> La SYN scan resta la tecnica più affidabile per open/closed, perché si basa sul comportamento TCP più fondamentale e universalmente implementato — ma anche lì, inganno attivo e dispositivi intermedi restano possibili. Buona pratica: non fidarsi mai di un singolo scan type, incrociare più tecniche sulla stessa porta.
{: .prompt-danger }

---

## Opzioni utili per l'analisi dei risultati

| Opzione | Scopo |
|---|---|
| `--reason` | Spiega esplicitamente il motivo per cui Nmap ha concluso che l'host è up o una porta è in un dato stato |
| `-v` | Verbose |
| `-vv` | Very verbose |
| `-d` | Debugging |
| `-dd` | Debugging più dettagliato |
| `--source-port PORT_NUM` | Specifica manualmente la porta sorgente |
| `--data-length NUM` | Aggiunge dati casuali fino alla lunghezza indicata |
| `--spoof-mac SPOOFED_MAC` | Falsifica l'indirizzo MAC |

---

## Riepilogo comandi

| Tecnica | Comando | Cosa fa |
|---|---|---|
| TCP Null Scan | `sudo nmap -sN <target>` | Invia un pacchetto TCP senza flag impostati per dedurre le porte aperte dalla mancanza di risposta.|
| TCP FIN Scan | `sudo nmap -sF <target>` | Invia un pacchetto TCP contenente solo il flag FIN per sondare le porte senza avviare una connessione.
| TCP Xmas Scan | `sudo nmap -sX <target>` | Imposta simultaneamente i flag FIN, PSH e URG per sondare le porte dietro firewall stateless.
| TCP Maimon Scan | `sudo nmap -sM <target>` | Imposta contemporaneamente i flag FIN e ACK per sfruttare un comportamento riscontrato in alcuni sistemi derivati ​​da BSD.
| TCP ACK Scan | `sudo nmap -sA <target>` | Invia un pacchetto contenente solo il flag ACK per mappare le regole del firewall anziché rilevare le porte aperte.
| TCP Window Scan | `sudo nmap -sW <target>` | Esaminare il campo Finestra TCP nelle risposte RST per distinguere le porte aperte da quelle chiuse.
| Custom TCP Scan | `sudo nmap --scanflags URG|ACK|PSH|RST|SYN|FIN <target>` | Utilizza --scanflags per creare combinazioni di flag TCP personalizzate per una scansione mirata.
| Spoofed Source IP | `sudo nmap -e <iface> -Pn -S <spoofed_ip> <target>` | Falsifica l'indirizzo IP di origine utilizzando -S in modo che il traffico di scansione sembri provenire da un host diverso.
| Spoofed MAC Address | `--spoof-mac <spoofed_mac>` | Falsifica l'indirizzo MAC di origine utilizzando --spoof-mac quando ti trovi sulla stessa rete locale del target.
| Decoy Scan | `nmap -D <decoy_ip>,ME <target>` | Mescola il tuo vero IP con più indirizzi esca utilizzando -D per nascondere la vera origine della scansione.
| Idle (Zombie) Scan | `sudo nmap -sI <zombie_ip> -Pn <target>` | Utilizza un host di terze parti inattivo con l'opzione -sI per scansionare un target senza rivelare il tuo indirizzo IP.
| Frammenta in blocchi da 8 byte | `-f` | Suddividi i pacchetti in frammenti IP più piccoli per eludere firewall e IDS.
| Frammenta in blocchi da 16 byte | `-ff` | Suddividi i pacchetti in frammenti IP più piccoli utilizzando per eludere firewall e IDS.
