---
title: "Incident Response Fundamentals"
date: 2026-08-18 10:00:00 +0200
categories: [Cyber Security 101]
tags: [defensive-security, incident-response, sans, nist]
description: "Da alert a incidente, tipi di attacchi, framework SANS e NIST, playbook/runbook."
toc: true
---

## Gli incidenti

Quando una soluzione di sicurezza rileva un evento o un gruppo di eventi associati a una possibile attività dannosa, genera un **avviso** (alert). Il team di sicurezza analizza quindi questi avvisi:

- **Falso positivo** — un avviso che segnala qualcosa di pericoloso ma che non è in realtà dannoso. Esempio: una soluzione di sicurezza genera un allarme per un elevato trasferimento di dati verso un IP esterno; analizzandolo, il team scopre che si trattava solo di un backup su un servizio di storage cloud.
- **Vero positivo** — un avviso che segnala qualcosa di dannoso e che è effettivamente pericoloso. Esempio: un avviso di tentativo di accesso non autorizzato tramite phishing ai danni di un utente, confermato come una vera email di phishing dopo l'analisi.

I veri positivi vengono talvolta chiamati **Incidenti**. Una volta che un avviso è classificato come incidente, il passo successivo è assegnargli un **livello di gravità**: se il team riceve più incidenti contemporaneamente, serve un criterio per decidere quale gestire per primo. Gli incidenti si classificano come **bassi, medi, alti o critici** in base all'impatto che possono generare — quelli critici hanno sempre la priorità più alta, seguiti da quelli alti, e così via.

![Dall'alert all'incidente](/assets/img/posts/alert-to-incident.svg)

## Tipi di attacchi

Diversi tipi di incidenti di sicurezza possono verificarsi in modo indipendente o combinato all'interno della stessa vittima:

- **Malware Infections** — infezioni da software dannoso (virus, trojan, ransomware) che compromettono uno o più sistemi
- **Security Breaches** — violazioni in cui un attaccante ottiene accesso non autorizzato a sistemi o dati
- **Data Leaks** — fuoriuscita di dati sensibili, intenzionale o accidentale
- **Insider Attacks** — attacchi condotti da persone interne all'organizzazione (dipendenti, collaboratori) che abusano del proprio accesso legittimo
- **Denial of Service (DoS)** — attacchi che mirano a rendere un sistema o un servizio non disponibile, sovraccaricandolo di richieste

Ogni tipo di incidente richiede un approccio di indagine e risposta specifico, anche se tutti seguono lo stesso iter generale di risposta descritto di seguito.

## Iter della risposta (SANS e NIST)

Data la varietà di incidenti che un'organizzazione può affrontare, servono **framework strutturati** per garantire una risposta efficace e ripetibile. I due framework più diffusi sono quelli sviluppati da **SANS** (che offre corsi e certificazioni in cybersecurity) e **NIST** (che sviluppa standard e linee guida).

### SANS — 6 fasi

1. **Preparation** — preparare strumenti, processi e persone prima che un incidente avvenga
2. **Identification** — identificare che un evento è effettivamente un incidente
3. **Containment** — isolare il problema per limitarne la diffusione (es. disconnettere una macchina infetta da Internet)
4. **Eradication** — rimuovere la causa/minaccia dal sistema
5. **Recovery** — riportare i sistemi colpiti alla normale operatività
6. **Lessons Learned** — analizzare l'incidente a posteriori per migliorare i processi futuri

### NIST — 4 fasi

1. **Preparation**
2. **Detection and Analysis**
3. **Containment, Eradication and Recovery**
4. **Post-Incident Activity**

Il framework NIST è concettualmente simile a quello SANS, ma con un numero di fasi ridotto — le fasi di Containment, Eradication e Recovery di SANS vengono accorpate in un'unica fase NIST, e la fase "Lessons Learned" di SANS corrisponde alla fase "Post-Incident Activity" di NIST.

![Confronto SANS vs NIST](/assets/img/posts/sans-vs-nist.svg)

### Playbook e Runbook

Gestire tipi di incidenti molto diversi tra loro in uno stesso ambiente può essere complesso — per questo, oltre al framework generale (SANS/NIST), le organizzazioni si dotano di guide più operative:

- **Playbook** — linee guida complete e strutturate, passo per passo, su come rispondere a un tipo specifico di incidente (es. phishing, malware, compromissione di un account, violazione di policy, ransomware). Un playbook segue tipicamente le fasi del framework scelto (preparazione, rilevamento, contenimento, eradicazione, recupero, lezioni apprese), ma le declina nel dettaglio per quel tipo di incidente specifico.
- **Runbook** — l'esecuzione dettagliata e tecnica di passaggi specifici durante un incidente, spesso a un livello ancora più granulare del playbook. Questi passaggi possono variare in base alle risorse/strumenti effettivamente disponibili per l'indagine in quel momento.

In sintesi, il playbook definisce **cosa fare** per un dato tipo di incidente, mentre il runbook scende nel dettaglio di **come farlo tecnicamente**, passo dopo passo, con gli strumenti a disposizione.

## Tecniche di risposta (SIEM, Antivirus, EDR)

Individuare comportamenti anomali e identificare incidenti manualmente è estremamente difficile su larga scala — per questo le organizzazioni si affidano a soluzioni di sicurezza che centralizzano informazioni e automatizzano le capacità di detection e response:

- **SIEM (Security Information and Event Management)** — centralizza i log e gli eventi provenienti da tutta la rete, correlandoli per generare alert sugli incidenti di sicurezza
- **Antivirus** — rileva e blocca malware noto sui singoli host, basandosi tipicamente su firme e pattern conosciuti
- **EDR (Endpoint Detection and Response)** — offre visibilità più approfondita rispetto a un antivirus tradizionale sul comportamento dei singoli endpoint, permettendo di rilevare e rispondere ad attività sospette anche quando non corrispondono a una firma di malware nota

Queste tecnologie sono gli strumenti con cui i team di sicurezza mettono in pratica, concretamente, le fasi di detection e response previste dai framework SANS e NIST.

## Utilizzo

L'incident response mette insieme tutto ciò che abbiamo visto finora: un alert deve prima essere confermato come vero positivo per diventare un incidente, l'incidente va classificato per gravità e tipologia (malware, breach, data leak, insider, DoS), e da lì la risposta segue un framework strutturato (SANS o NIST) reso operativo tramite playbook specifici per tipo di incidente e runbook per l'esecuzione tecnica dei singoli passaggi. SIEM, antivirus ed EDR sono gli strumenti che rendono questo processo scalabile.
