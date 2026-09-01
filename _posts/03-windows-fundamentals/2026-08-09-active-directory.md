---
title: "Active Directory: le basi"
date: 2026-08-09 18:00:00 +0200
categories: [Cyber Security 101, windows-fundamentals]
tags: [windows, active-directory]
description: "Cos'è Active Directory, domini, foreste e trust, gli oggetti gestiti da AD DS, le Organizational Units e la differenza con i Security Group."
toc: true
---

## Cos'è Active Directory (AD)

Active Directory è il sistema con cui Microsoft gestisce utenti, computer e risorse in una rete aziendale, tutti da un unico punto centrale. Invece di dover configurare manualmente ogni singolo computer con i propri utenti e permessi (come si farebbe con `lusrmgr.msc` su una macchina singola), AD permette a un amministratore di gestire centinaia o migliaia di dispositivi e persone con regole uniformi e coerenti.

L'idea principale alla base di un dominio è centralizzare l'amministrazione dei componenti comuni di una rete di computer Windows in un unico repository chiamato Active Directory.

I principali vantaggi di avere un dominio Windows configurato sono:
- **Gestione centralizzata delle identità**: tutti gli utenti della rete possono essere configurati da Active Directory con il minimo sforzo
- **Gestione dei criteri di sicurezza**: è possibile configurare i criteri di sicurezza direttamente da Active Directory e applicarli a utenti e computer in tutta la rete, a seconda delle necessità

## Cos'è un Active Directory Domain

Un Active Directory Domain è un raggruppamento logico di utenti, computer e altre risorse che condividono lo stesso database centrale di gestione e le stesse politiche di sicurezza. Quando un computer "si unisce a un dominio" (la stessa scheda **Computer Name** di System Properties già vista), smette di essere gestito solo localmente e inizia a rispondere alle regole decise centralmente dal dominio.

Il server che ospita questo database centrale e gestisce login, autenticazioni e regole è noto come **Domain Controller (DC)**, ed esegue un ruolo/servizio chiamato **AD DS (Active Directory Domain Services)**. AD DS gira **solo sui Domain Controller** — mai sulle workstation client né sui server "normali" del dominio: installare questo ruolo su un server Windows è proprio l'azione che lo trasforma in un Domain Controller. Le altre macchine del dominio non hanno AD DS installato, ma dei componenti che permettono loro di comunicare con il DC — quando un utente fa login, la macchina client contatta il DC per verificare le credenziali, invece di controllarle localmente.

### Un esempio concreto: la rete di un'università

Pensa alla rete informatica di un'università: migliaia di computer nei laboratori, negli uffici amministrativi, nelle biblioteche, più i portatili del personale docente. Senza un dominio, il reparto IT dovrebbe configurare manualmente ogni singolo PC con gli account degli studenti e del personale che potrebbero usarlo.

Con Active Directory, invece, esiste un dominio unico (es. `universita.edu`): uno studente che si iscrive riceve un account creato una sola volta, e può fare login su **qualsiasi computer del dominio** — un PC del laboratorio di informatica, uno della biblioteca, un altro dell'aula studio — ritrovando sempre lo stesso profilo e gli stessi permessi. Il personale IT applica regole una volta sola a livello centrale (es. "gli account studenti non possono installare software"), invece di configurarle su ogni macchina singolarmente.

## Gli oggetti che compongono un dominio

![Gli oggetti di un dominio Active Directory](/assets/img/posts/ad-objects-diagram.svg)
_Utenti, gruppi, computer e stampanti vivono tutti nello stesso database centrale ospitato dal Domain Controller_

Un dominio è composto da diversi elementi che lavorano insieme, ognuno trattato come un **oggetto** dentro lo stesso database centrale:

**Domain Controller (DC)**
Il server che custodisce il database centrale e gestisce login, autenticazioni e regole, già descritto sopra.

**Utenti**
Ogni persona ha un account utente in AD — es. `mario.rossi`, con la sua password, il suo indirizzo email, il suo reparto. Quando Mario si siede a qualunque computer del dominio e fa login, è AD che verifica le sue credenziali, non il singolo PC.

**Gruppi**
Invece di dare permessi a ogni singolo utente uno per uno, si creano gruppi come `Reparto-Contabilità` o `Amministratori-IT`, e si assegnano i permessi al gruppo — proprio come già visto con i permessi Linux/NTFS, solo applicato a scala aziendale. Aggiungere Mario al gruppo giusto gli dà automaticamente tutti i permessi associati a quel gruppo.

**Computer**
Ogni PC o server "unito al dominio" diventa un oggetto in AD — es. `PC-CONTABILITA-01`. Questo permette all'amministratore di applicare regole specifiche a quella macchina, indipendentemente da chi ci si logga sopra.

**Stampanti**
Una stampante di rete condivisa può essere registrata come oggetto in AD, così tutti gli utenti autorizzati la trovano e la usano facilmente cercandola per nome, senza doverla configurare manualmente su ogni singolo computer.

**Group Policy (GPO)**
Regole automatiche applicate a utenti/computer, ad esempio "tutti i PC del reparto marketing devono avere lo screensaver dopo 5 minuti".

Ogni oggetto vive nello stesso database centrale, e questo permette all'amministratore di gestire tutto da un unico posto — invece di configurare separatamente ogni computer, ogni account, ogni stampante uno per uno, come si dovrebbe fare in una rete senza Active Directory.

## Organizational Units (OU)

Le OU non sono un tipo di oggetto come utenti/gruppi/computer — sono i **contenitori** che li organizzano, come delle cartelle in un filesystem:

```
Dominio: azienda.local
│
├── OU: Contabilità
│   ├── Utente: mario.rossi
│   ├── Gruppo: Reparto-Contabilità
│   └── Computer: PC-CONTAB-01
│
├── OU: IT
│   ├── Utente: luca.bianchi
│   └── Gruppo: Amministratori-IT
│
└── OU: Stampanti
    └── Stampante: HP-Piano2
```

Le OU servono a due scopi pratici: organizzazione logica (invece di avere tutto mescolato in un'unica lista, si raggruppa per reparto, sede, funzione) e, soprattutto, ad **applicare Group Policy in modo mirato** — una policy collegata a una OU si applica automaticamente a tutto ciò che sta al suo interno.

## Security Groups vs OU

Viene naturale chiedersi perché esistano sia gruppi sia OU, dato che entrambi servono a classificare utenti e computer — ma i loro scopi sono completamente diversi.

![Confronto tra Organizational Unit e Security Group](/assets/img/posts/ou-vs-groups-diagram.svg)
_Stesso oggetto (l'utente), due scopi complementari: policy da un lato, permessi dall'altro_

- **Le OU** sono utili per applicare **policy** a utenti e computer — configurazioni specifiche legate al ruolo particolare di un insieme di utenti nell'azienda. Un utente può appartenere a **una sola OU** alla volta, perché non avrebbe senso provare ad applicare due insiemi di policy diversi a un singolo utente contemporaneamente.
- **I Security Group**, invece, servono a **concedere permessi** su risorse — ad esempio per permettere a certi utenti di accedere a una cartella condivisa o a una stampante di rete. Un utente può far parte di **molti gruppi** contemporaneamente, cosa necessaria per concedere accesso a più risorse diverse.

### I container di default

![Container di default in Active Directory Users and Computers](/assets/img/posts/aduc-containers-diagram.svg)
_Oltre alle OU create manualmente (come THM), Windows genera automaticamente questi container_

Oltre alle OU create manualmente da un amministratore, Windows genera automaticamente alcuni **container di default** quando il dominio viene creato:

- **Builtin** — contiene i gruppi predefiniti disponibili su qualsiasi host Windows
- **Computers** — qualsiasi macchina che si unisce alla rete finisce qui per default; è possibile spostarla altrove se necessario
- **Domain Controllers** — la OU di default che contiene i Domain Controller della rete
- **Users** — utenti e gruppi di default che si applicano a livello dell'intero dominio
- **Managed Service Accounts** — contiene gli account usati dai servizi nel dominio Windows

## Gestione degli utenti

### Eliminare utenti e OU

Un utente o una OU non più necessari possono essere rimossi direttamente da Active Directory Users and Computers (tasto destro → **Delete**), oppure da PowerShell:

```powershell
Remove-ADUser -Identity mario.rossi
Remove-ADOrganizationalUnit -Identity "OU=Contabilità,DC=azienda,DC=local"
```

Un dettaglio da tenere presente: le OU sono protette da eliminazione accidentale per default (una casella nelle proprietà dell'OU), proprio perché eliminarne una porta con sé, a cascata, tutti gli oggetti che contiene — utenti, gruppi, computer inclusi.

### Delegare il controllo

La **delega** permette di assegnare a un utente o un gruppo specifico il permesso di svolgere un compito amministrativo limitato, senza dovergli dare privilegi da amministratore di dominio completi — un'applicazione diretta del principio di minimo privilegio già visto più volte in questo percorso.

**Esempio pratico**: si vuole che Mike, un utente senza privilegi amministrativi generali, possa gestire il reset delle password per gli utenti di un solo gruppo (es. `Reparto-Contabilità`), senza avere accesso a nient'altro nel dominio.

Da Active Directory Users and Computers, tasto destro sulla OU o sul gruppo interessato → **Delegate Control**, si avvia una procedura guidata che permette di scegliere:
- **A chi** delegare il controllo (es. l'utente Mike)
- **Quale compito specifico** delegare (es. "Reset user passwords and force password change at next logon")

Una volta completata la delega, Mike — pur restando un utente normale sotto ogni altro aspetto — può eseguire azioni che normalmente richiederebbero privilegi amministrativi, ma **solo** su quel gruppo specifico di utenti.

**Cosa può fare Mike concretamente**, ad esempio da PowerShell:

```powershell
Set-ADAccountPassword sophie -Reset -NewPassword (Read-Host -AsSecureString -Prompt 'New Password') -Verbose
```
Resetta la password dell'utente `sophie` con una nuova password fornita in modo sicuro (`-AsSecureString` evita che venga mostrata in chiaro a schermo).

```powershell
Set-ADUser -ChangePasswordAtLogon $true -Identity sophie -Verbose
```
Obbliga `sophie` a cambiare la password al prossimo accesso — pratica comune dopo un reset, per assicurarsi che l'utente scelga una nuova password conosciuta solo a lei.

> Mike può eseguire questi comandi solo su utenti che rientrano nell'ambito della delega ricevuta (es. il gruppo Reparto-Contabilità) — un tentativo di resettare la password di un utente al di fuori di quell'ambito verrebbe rifiutato per mancanza di permessi.
{: .prompt-tip }

### Perché la delega è rilevante per la sicurezza

Le deleghe sono un'arma a doppio taglio ben nota in ambito Active Directory: se configurate correttamente riducono la superficie di rischio (non serve dare privilegi da amministratore di dominio solo per resettare qualche password), ma se configurate in modo troppo permissivo o dimenticate nel tempo, possono diventare un percorso di **privilege escalation** poco visibile — un utente con una delega innocua all'apparenza può, in certi scenari, sfruttarla come trampolino verso privilegi ben più ampi. Per questo l'enumerazione delle deleghe esistenti è un passo comune durante un assessment su un ambiente Active Directory.

### Come il Domain Controller verifica i permessi

Il meccanismo con cui il sistema decide se un comando come `Remove-ADUser` o `Set-ADAccountPassword` può andare a buon fine è concettualmente lo stesso già visto per i permessi NTFS, applicato però a oggetti di Active Directory invece che a file: **ogni oggetto AD** (un utente, una OU, un gruppo) ha un proprio Security Descriptor con una **DACL** che specifica chi può fare cosa su quello specifico oggetto — creare, eliminare, modificare attributi, resettare password, e così via.

Quando si lancia un comando come:
```powershell
Remove-ADUser -Identity mario.rossi
```
succede questo:
1. Il client PowerShell invia una richiesta al **Domain Controller**, chiedendo di eliminare l'oggetto utente `mario.rossi`
2. Il Domain Controller verifica due cose: chi sta facendo la richiesta (l'identità della sessione autenticata) e cosa dice la **DACL dell'oggetto `mario.rossi`** riguardo a quell'identità
3. Se la DACL contiene una regola che permette a quell'identità l'operazione richiesta, il DC la esegue e restituisce successo
4. Se non trova alcun permesso corrispondente, il DC **rifiuta** l'operazione — il controllo avviene sempre lato server (sul DC), il computer locale non decide nulla, si limita a inviare la richiesta

Questo spiega anche cosa succede concretamente "dietro le quinte" quando si esegue **Delegate Control** nell'esempio di Mike: viene aggiunta una nuova voce (**ACE — Access Control Entry**) nella DACL della OU o del gruppo target, del tipo:
```
Consenti a: Mike
Sull'oggetto: OU=Contabilità (e tutti gli oggetti al suo interno)
Permesso: Reset Password
```
Da quel momento, quando Mike lancia `Set-ADAccountPassword` su `sophie` (che si trova dentro quella OU), il Domain Controller trova questa ACE e concede l'operazione. Se Mike provasse lo stesso comando su un utente fuori da quella OU, non ci sarebbe nessuna ACE corrispondente, e il DC rifiuterebbe.

**Vedere le ACL effettive di un oggetto:**
```powershell
Get-Acl "AD:\OU=Contabilità,DC=azienda,DC=local" | Format-List
```
Lo stesso tipo di comando che un pentester userebbe durante l'enumerazione di un ambiente Active Directory per scoprire deleghe eccessivamente permissive o dimenticate.

## Trees, Forest e Trust Relationships

Man mano che un'organizzazione cresce, un singolo dominio può non bastare più.

![Tree, Forest e Trust Relationship](/assets/img/posts/tree-forest-trust-diagram.svg)
_Un tree condivide lo stesso namespace, una forest unisce tree con namespace diversi, il trust li collega_

### Trees: quando serve dividere ma restare collegati

**Esempio pratico**: immagina che l'azienda si espanda improvvisamente in un nuovo paese. Il nuovo paese ha leggi e regolamenti diversi, che richiedono di aggiornare le GPO per essere conformi. In più, ora c'è personale IT in entrambi i paesi, e ciascun team deve gestire le risorse del proprio paese senza interferire con l'altro team.

Si potrebbe provare a risolvere questo con una struttura complessa di OU e deleghe, ma una struttura AD enorme diventa difficile da gestire e più soggetta a errori umani. Active Directory supporta invece l'integrazione di **più domini**, così da partizionare la rete in unità gestibili in modo indipendente. Se due domini condividono lo stesso **namespace** (es. `thm.local`), possono essere uniti in un **Tree**.

**Esempio concreto**: se il dominio `thm.local` si espandesse in due filiali, UK e US, si potrebbe costruire un tree con dominio radice `thm.local` e due sottodomini, `uk.thm.local` e `us.thm.local`, ciascuno con il proprio Active Directory, i propri computer e utenti.

Questa struttura partizionata offre un controllo migliore su chi può accedere a cosa nel dominio: il personale IT del Regno Unito avrà il proprio DC che gestisce solo le risorse UK. Un utente del Regno Unito, ad esempio, non potrebbe gestire gli utenti US. Gli amministratori di dominio di ciascuna filiale hanno controllo completo sul proprio DC, ma non su quelli delle altre filiali. Anche le policy possono essere configurate in modo indipendente per ciascun dominio del tree.

### Il gruppo Enterprise Admins

Parlando di tree e forest bisogna introdurre un nuovo gruppo di sicurezza: **Enterprise Admins**, che garantisce privilegi amministrativi su **tutti** i domini dell'azienda. Ogni dominio mantiene comunque il proprio gruppo **Domain Admins**, con privilegi amministrativi solo sul proprio singolo dominio, mentre gli Enterprise Admins possono controllare tutto nell'intera azienda.

**Esempio pratico**: un admin del dominio `uk.thm.local` è un Domain Admin — può gestire tutto ciò che riguarda UK, ma non può toccare nulla su `us.thm.local`. Se venisse invece aggiunto al gruppo Enterprise Admins, otterrebbe controllo completo su entrambi i sottodomini.

### Forest: quando i namespace sono diversi

I domini gestiti possono anche appartenere a **namespace diversi**. Supponiamo che l'azienda continui a crescere ed eventualmente acquisisca un'altra azienda, `MHT Inc.`. Quando le due aziende si fondono, probabilmente ci saranno tree di domini diversi per ciascuna azienda, ognuno gestito dal proprio reparto IT. L'unione di più tree con namespace diversi nella stessa rete è nota come **Forest**.

**Esempio concreto**: il tree `thm.local` (con i suoi sottodomini `uk.thm.local` e `us.thm.local`) e il tree `mht.local` (dell'azienda appena acquisita) possono essere uniti nella stessa foresta, pur avendo namespace completamente diversi tra loro.

### Trust Relationships: collegare domini diversi

Avere più domini organizzati in tree e forest permette una rete ben compartimentata in termini di gestione e risorse. Ma a un certo punto, un utente di `THM UK` potrebbe aver bisogno di accedere a un file condiviso su uno dei server di `MHT EU` (un'altra azienda della stessa foresta, o addirittura di una foresta diversa). Perché questo sia possibile, i domini organizzati in tree e forest vengono collegati tramite **relazioni di trust**.

In parole semplici, avere una relazione di trust tra domini permette di autorizzare un utente del dominio `THM UK` ad accedere a risorse del dominio `MHT EU`.

**Trust unidirezionale: attenzione alla direzione.** La relazione di trust più semplice è un **trust unidirezionale (one-way)**. In un trust unidirezionale, se il `Dominio AAA` si fida del `Dominio BBB`, significa che un utente su BBB può essere autorizzato ad accedere a risorse su AAA.

> Il punto che genera più confusione: la direzione della freccia del trust è **opposta** alla direzione dell'accesso. Se `MHT EU` si fida di `THM UK` (freccia del trust: MHT EU → THM UK), un utente di THM UK può accedere a risorse di MHT EU (accesso: THM UK → MHT EU, direzione opposta). Pensalo così: se "mi fido di te", sto dando a te il permesso di entrare in casa mia — non il contrario.
{: .prompt-tip }

**Trust bidirezionale.** Si possono anche creare **trust bidirezionali (two-way)**, che permettono a entrambi i domini di autorizzare reciprocamente utenti dell'altro dominio. Per default, unire più domini sotto un tree o una forest crea automaticamente un trust bidirezionale tra loro — è il motivo per cui `uk.thm.local` e `us.thm.local` possono normalmente fidarsi a vicenda senza configurazione aggiuntiva.

**Un punto fondamentale da ricordare.** Avere una relazione di trust tra domini **non concede automaticamente accesso a tutte le risorse** dell'altro dominio. Una volta stabilito il trust, si ha la possibilità di autorizzare utenti tra domini diversi, ma resta a discrezione dell'amministratore decidere cosa viene effettivamente autorizzato e cosa no — anche con un trust bidirezionale completo tra `thm.local` e `mht.local`, un utente di `mht.local` non potrà automaticamente leggere ogni cartella condivisa del dominio `thm.local`: l'amministratore dovrà comunque concedere esplicitamente i permessi specifici su quella risorsa, con lo stesso meccanismo di ACL/DACL già visto parlando di delega e di SYSVOL.

### Collegamento al pentesting

I trust tra domini/foreste sono un vettore di attacco molto studiato: se un attaccante compromette un dominio con un trust verso un altro dominio più privilegiato, può potenzialmente sfruttare quel trust per muoversi lateralmente e ottenere accesso a risorse dell'altro dominio — è uno dei motivi per cui, durante un assessment su un ambiente enterprise con più domini, mappare le relazioni di trust esistenti è un passo di enumerazione importante quanto mappare gli utenti o i permessi.

## Group Policies

Finora gli utenti e i computer sono stati organizzati in OU non solo per tenere ordine, ma soprattutto per un motivo pratico: poter applicare **politiche diverse a ciascuna OU individualmente**. In questo modo è possibile distribuire configurazioni e livelli di sicurezza differenti agli utenti a seconda del reparto a cui appartengono.

Windows gestisce queste politiche tramite gli oggetti **Criteri di gruppo (GPO — Group Policy Object)**. Una GPO è semplicemente una raccolta di impostazioni che può essere applicata alle Organizational Unit. Le GPO possono contenere criteri destinati a utenti o a computer, permettendo di definire una configurazione di base uniforme su macchine e identità specifiche.

![Group Policy Management](/assets/img/posts/gpo-diagram.svg)
_Le GPO si creano nel contenitore Group Policy Objects e poi si collegano alle OU dove devono applicarsi_

### Lo strumento: Group Policy Management

Per configurare i Criteri di gruppo si usa lo strumento **Group Policy Management**, disponibile dal menu Start. All'apertura mostra l'intera gerarchia di OU già definita nel dominio.

Per configurare una nuova policy occorrono due passaggi distinti:
1. **Creare** la GPO nel contenitore **Group Policy Objects**
2. **Collegarla** alla OU specifica a cui si vuole che i criteri vengano applicati

Su un dominio già configurato è comune trovare alcune GPO già presenti di default, come la **Default Domain Policy**, applicata automaticamente all'intero dominio fin dalla sua creazione.

### SYSVOL: dove vivono davvero le policy

Una Group Policy è fatta di due pezzi separati che devono lavorare insieme: **un'etichetta** (chi/dove si applica) e **un contenuto** (cosa fa davvero) — e questi due pezzi vivono in due posti diversi.

È come spedire un pacco: l'etichetta attaccata sopra dice destinatario e indirizzo — informazioni brevi, che servono a sapere dove deve andare il pacco. Il contenuto del pacco è invece la merce vera, che può essere piccola o grande, semplice o complessa. Nessuno scriverebbe il contenuto del pacco direttamente sull'etichetta: sono due cose diverse, con scopi diversi.

Applicato a una GPO:
- **L'etichetta** = i metadati nel database di Active Directory (sul Domain Controller): nome della policy, ID univoco (GUID), a quale OU è collegata, versione. Serve a rispondere velocemente alla domanda "quali regole si applicano a questo utente?"
- **Il contenuto del pacco** = i file dentro **SYSVOL**, una cartella condivisa presente su ogni Domain Controller e automaticamente replicata tra tutti: script di avvio/spegnimento, template amministrativi, file di configurazione — quello che effettivamente fa qualcosa sul computer dell'utente.

**Il flusso, passo per passo:**
1. Un computer del dominio si accende, o un utente fa login
2. Il computer chiede al Domain Controller: "guardando il database, quali policy si applicano a me?"
3. Il Domain Controller risponde con l'elenco delle policy pertinenti
4. Il computer va a prendere il contenuto vero di quelle policy da SYSVOL
5. Applica quelle impostazioni

**Perché non mettere tutto in un unico posto**: il database è pensato per essere veloce da consultare (come un indice), non per contenere file grandi o complessi — proprio come non si scriverebbe il contenuto di un intero libro dentro il catalogo di una biblioteca, ma solo dove trovarlo sullo scaffale.

> Questa separazione tra "dove sta il riferimento" e "dove sta il contenuto vero" è lo stesso principio già visto con NTFS: il filesystem tiene un indice di metadati separato dal contenuto effettivo del file, invece di fondere tutto insieme.
{: .prompt-tip }

**Percorsi per accedere a SYSVOL:**
```batch
:: Percorso locale su un Domain Controller
C:\Windows\SYSVOL\sysvol\

:: Percorso condiviso in rete, raggiungibile da qualsiasi macchina del dominio
\\nome-dominio\SYSVOL\
```

**Rilevanza per la sicurezza**: per anni, una configurazione comune (Group Policy Preferences) permetteva di impostare password per account locali o servizi direttamente tramite GPO — quelle password venivano salvate in un file XML dentro SYSVOL, cifrate con una chiave resa pubblica per errore di design. Chiunque avesse accesso in lettura a SYSVOL (qualsiasi utente autenticato del dominio, per default) poteva trovarle e decifrarle istantaneamente. Microsoft ha patchato la creazione di nuove password in questo modo (MS14-025), ma i file vecchi lasciati da configurazioni precedenti restano spesso presenti — uno dei primi controlli che un pentester fa durante l'enumerazione di un ambiente Active Directory.

## Active Directory e Offensive Security

Con Active Directory la domanda "chi può fare cosa" non riguarda più un solo computer, ma un'intera infrastruttura di rete. Compromettere un Domain Controller significa spesso compromettere l'intera rete aziendale, non solo un singolo computer — per questo Active Directory è un'area centrale nella sicurezza offensiva enterprise, con tecniche di attacco dedicate (Kerberoasting, Pass-the-Hash, attacchi ai trust tra domini).

## Autenticazione: Kerberos e NetNTLM

### Il contesto: perché serve un protocollo di autenticazione di rete

In un dominio Windows, tutte le credenziali sono custodite sul Domain Controller. Ogni volta che un utente prova ad autenticarsi verso un servizio usando le credenziali di dominio, quel servizio deve chiedere al Domain Controller di verificare che siano corrette — il servizio stesso non conosce le password, deve fidarsi della verifica centrale.

Esistono due protocolli per l'autenticazione di rete nei domini Windows:
- **Kerberos** — usato da ogni versione recente di Windows, è il protocollo di default
- **NetNTLM** — protocollo legacy mantenuto solo per compatibilità con sistemi più vecchi

Anche se NetNTLM andrebbe considerato obsoleto, la maggior parte delle reti aziendali ha **entrambi** i protocolli abilitati contemporaneamente.

### L'idea centrale di Kerberos: i "ticket"

Chi effettua il login tramite Kerberos riceve dei **ticket** — pensali come una prova di autenticazione già avvenuta, un po' come il biglietto di un evento che viene dato dopo aver mostrato un documento d'identità alla cassa. Chi possiede il ticket può presentarlo a un servizio per dimostrare "mi sono già autenticato in questa rete, sono legittimato a usarla" — senza dover ripresentare username e password ogni volta.

![Il flusso di autenticazione Kerberos](/assets/img/posts/kerberos-diagram.svg)
_Tre fasi: ottenere il TGT al login, ottenere un TGS per il servizio specifico, presentare il TGS al servizio_

### Fase 1: ottenere il TGT (il login iniziale)

Quando l'utente fa login per la prima volta, invia al **KDC** (Key Distribution Center — un servizio installato tipicamente sul Domain Controller, incaricato di creare i ticket Kerberos) il proprio username e un timestamp, cifrato usando una chiave derivata dalla propria password.

**Esempio pratico**: un utente si siede a un PC del dominio e digita le sue credenziali. Il suo computer non manda la password in chiaro — usa la password per cifrare un semplice orario ("sono le 9:03:12") e manda quello al KDC. Solo chi conosce la password corretta può aver prodotto quella cifratura in quel modo specifico — è così che il KDC verifica l'identità senza che la password viaggi mai sulla rete.

Se tutto corrisponde, il KDC crea e restituisce un **TGT (Ticket Granting Ticket)** — un ticket che permetterà di richiedere ulteriori ticket per accedere a servizi specifici, insieme a una **Session Key** che servirà per le richieste successive.

Il TGT è cifrato usando l'hash della password dell'account `krbtgt` — un account speciale di sistema il cui hash l'utente non conosce, quindi non può leggere il contenuto del proprio TGT, può solo custodirlo e ripresentarlo. Dentro il TGT cifrato è contenuta anche una copia della Session Key — questo evita al KDC di doverla memorizzare da qualche parte: gli basta decifrare il TGT quando serve per recuperarla.

Perché serve "un ticket per ottenere altri ticket"? Senza il TGT, l'utente dovrebbe reinserire la propria password ogni singola volta che vuole accedere a un servizio diverso. Con il TGT, la password viene usata una sola volta al login, e da lì in poi tutto passa attraverso ticket.

### Fase 2: ottenere il TGS (il ticket per un servizio specifico)

Quando l'utente vuole connettersi a un servizio in rete — una cartella condivisa, un sito web interno, un database — usa il proprio TGT per chiedere al KDC un **TGS (Ticket Granting Service)**. A differenza del TGT, il TGS permette la connessione solo allo specifico servizio per cui è stato creato.

Per richiedere un TGS, l'utente invia: username e timestamp cifrati con la Session Key (non più con la password), il TGT ricevuto prima, e un **SPN (Service Principal Name)** — un identificativo che indica esattamente quale servizio e quale server si vuole raggiungere.

**Esempio pratico**: un utente vuole aprire la cartella condivisa `\\fileserver01\contabilità`. L'SPN che invia identifica esattamente quel servizio su quel server specifico — come specificare non solo "voglio entrare in un edificio" ma "voglio entrare nell'ufficio 304 al terzo piano di questo edificio specifico".

Il KDC risponde con un TGS e una **Service Session Key**. Il TGS è cifrato usando una chiave derivata dall'**hash dell'account proprietario del servizio** (il Service Owner — l'account utente o macchina sotto cui gira quel servizio, non l'account dell'utente). Il TGS contiene al suo interno una copia della Service Session Key, cifrata in modo che solo il Service Owner possa leggerla decifrando il TGS.

### Fase 3: accedere davvero al servizio

L'utente presenta il TGS al servizio desiderato per autenticarsi e stabilire la connessione. Il servizio usa l'hash della password del proprio account configurato per decifrare il TGS e validare la Service Session Key contenuta al suo interno — se la decifratura ha successo e i dati tornano coerenti, il servizio concede l'accesso.

### Perché questo design è così elaborato

Ogni passaggio usa una chiave di cifratura diversa: la password dell'utente serve solo una volta, al login, per ottenere il TGT; la Session Key serve per parlare col KDC senza riesporre la password; l'hash di `krbtgt` protegge il TGT, leggibile solo dal KDC; l'hash del Service Owner protegge il TGS, leggibile solo dal servizio specifico a cui è destinato. La password dell'utente non viaggia mai più di una volta, e ogni ticket successivo è protetto da una chiave diversa, pensata specificamente per chi deve poterla leggere — un principio di minimo privilegio applicato alla crittografia.

### Collegamento al pentesting

Questo meccanismo è anche la base di alcune tecniche di attacco note contro Active Directory:
- **Kerberoasting** — richiedere TGS per servizi con SPN registrati, poi provare a craccare offline l'hash con cui sono cifrati (l'hash del Service Owner), spesso più debole della password di un account utente normale
- **Golden Ticket** — se un attaccante riesce a rubare l'hash dell'account `krbtgt`, può forgiare TGT falsi per qualsiasi utente del dominio, bypassando completamente il KDC

---
**Modulo:** A Journey into Cybersecurity
**Room:**
**Data:** 8 agosto 2026
