---
title: "Passive Reconnaissance"
date: 2026-08-31 8:00:00 +0200
categories: [PT1, reconnaissance]
tags: [recon]
description: "Reconnaissance passiva senza contatto diretto col target: whois/RDAP, nslookup/dig per i record DNS, DNSDumpster e crt.sh per l'enumerazione di sottodomini, Shodan per i servizi già esposti."
toc: true
---

## Intro

Con il termine *reconnaissance* (ricognizione) indichiamo la prima fase di un pentest: raccogliere quante più informazioni possibili su un target prima di iniziare a testarlo attivamente. La dividiamo in due categorie:

- **Passiva**: raccogliamo informazioni solo da fonti pubbliche di terze parti. Non mandiamo nessun pacchetto verso il target, quindi non c'è nessun rischio di essere rilevati.
- **Attiva**: interagiamo direttamente con il target (scansioni, query dirette ai suoi server). Qui il target può accorgersi di noi.

In questo documento ci concentriamo solo sulla parte passiva.

Il vantaggio pratico è semplice: usando solo tecniche passive, non generiamo nessun allarme, corriamo un rischio legale minimo, e spesso riusciamo comunque a scoprire sottodomini dimenticati, servizi obsoleti o configurazioni sbagliate — tutto prima ancora di toccare l'infrastruttura del target.

Nella pratica, useremo questi strumenti in sequenza logica:

1. **whois/rdap** → scopriamo chi è il target, chi gestisce il dominio e il DNS
2. **nslookup/dig** → vediamo le informazioni legate al DNS (A, AAAA, MX, TXT, ...)
3. **DNSDumpster + crt.sh** → espandiamo la superficie, troviamo sottodomini dimenticati
4. **Shodan** → per ogni IP/sottodominio trovato, vediamo cosa è già esposto pubblicamente

Solo dopo aver esaurito questa fase passiva — a costo zero di rilevabilità — passeremo alla reconnaissance attiva (scan diretti, query dirette ai nameserver del target), per massimizzare le informazioni raccolte prima di "farci sentire".


## whois & RDAP

### whois

Interroghiamo per esempio *tryhackme.com*:

```bash
whois tryhackme.com
```

Cosa ci ricaviamo da questa query?

- **Registrar**: Il registrar è l'azienda accreditata attraverso cui si registra e si gestisce un nome a dominio (es. GoDaddy, Namecheap). È, in pratica, l'intermediario tra chi vuole possedere un dominio e i registri centrali che tengono traccia di tutti i domini esistenti al mondo. Sapere il registrar può essere utile in un pentest perché:
	-   Ci dice se l'azienda usa un servizio economico/consumer o uno enterprise (indicatore indiretto di quanto siano attenti alla sicurezza)
	   -   In scenari estremi, i registrar sono stati bersaglio di attacchi (es. domain hijacking, dove un attaccante convince o inganna un registrar a trasferire il controllo di un dominio a un account non autorizzato)
- **Date di registrazione/scadenza**: un dominio giovane può indicare un progetto nuovo, magari meno maturo in termini di sicurezza.
- **Nameserver**: ci dice se il DNS è gestito internamente dall'azienda oppure delegato a un provider esterno come Cloudflare o AWS.

Oggi la maggior parte dei dati personali (email, telefono del registrante) è oscurata per motivi di privacy (GDPR), quindi WHOIS resta molto utile per l'infrastruttura, ma poco per raccogliere contatti umani.

### RDAP

**RDAP** (Registration Data Access Protocol) è il protocollo che sta gradualmente sostituendo WHOIS. Risolve i limiti principali di WHOIS:

- Restituisce dati in **JSON strutturato** invece di testo libero non standardizzato, quindi è molto più facile da automatizzare.
- Gira su **HTTPS**, quindi è cifrato di default.
- Supporta un controllo degli accessi più granulare, compatibile con le normative privacy moderne.

```bash
curl https://rdap.org/domain/tryhackme.com
```

ICANN ha reso RDAP obbligatorio per i registrar accreditati, ma *whois* resta ancora ampiamente usato per compatibilità con strumenti e abitudini più vecchie.



## nslookup & dig

Questi due strumenti ci servono per interrogare i record DNS di un dominio: a quale IP punta, quali sono i suoi server di posta, e altre informazioni pubbliche.

`dig` è lo strumento più moderno e completo — output più chiaro, ed è più affidabile per query complesse o per script. `nslookup` lo troviamo ancora spesso in documentazioni datate e su sistemi Windows, ma preferiamo sempre `dig` quando possibile.

### Esempio con `nslookup`

```bash
nslookup -type=MX tryhackme.com 1.1.1.1
```

Qui chiediamo al resolver pubblico di Cloudflare (`1.1.1.1`) quali sono i record **MX** di `tryhackme.com`, cioè quali server gestiscono la posta elettronica del dominio.

*OSS*: quando facciamo queste query verso resolver pubblici (come `1.1.1.1` di Cloudflare o il nostro resolver di default), restiamo nel campo della reconnaissance passiva — non stiamo contattando direttamente l'infrastruttura del target, ma un intermediario neutro.


### Esempio con `dig`

```bash
dig tryhackme.com A
```

Con questo comando otteniamo il record **A**, cioè l'indirizzo IP associato al dominio. Se vogliamo interrogare uno specifico resolver invece di quello di default, usiamo `@`:

```bash
dig @1.1.1.1 tryhackme.com MX
```

### Cosa ci ricaviamo dai vari tipi di record

- **A / AAAA**: l'IP reale del dominio (se non c'è un proxy come Cloudflare davanti). È il punto di partenza per ogni test attivo successivo.
- **MX**: quale servizio di posta usa l'azienda (es. Google Workspace, Microsoft 365, o un server proprio). Se usano un server mail proprio, diventa un target aggiuntivo da testare.
- **TXT**: qui troviamo record come SPF e DMARC, che ci dicono quanto è protetta l'azienda contro lo spoofing delle email — informazione utile se dobbiamo pianificare un test di phishing autorizzato.




## DNSDumpster

Le query DNS standard (con `dig` o `nslookup`) risolvono solo i nomi che già conosciamo. Non ci rivelano sottodomini "nascosti" come `dev.tryhackme.com` o `staging.tryhackme.com` se non li interroghiamo esplicitamente. Per quello dobbiamo passare alla fase successiva: l'enumerazione dei sottodomini.


**DNSDumpster** è uno strumento che aggrega dati DNS già raccolti da altri senza che dobbiamo noi stessi interrogare l'infrastruttura del target. Lo usiamo soprattutto per l'**enumerazione dei sottodomini**, insieme a **crt.sh** (che cerca nei log di Certificate Transparency, cioè nell'elenco pubblico di tutti i certificati SSL/TLS emessi). Questo secondo metodo è considerato il più efficace in assoluto per trovare sottodomini in modo passivo: dato che ogni certificato HTTPS è pubblico per design, anche un sottodominio mai linkato da nessuna parte emerge lo stesso, se qualcuno ha mai richiesto un certificato per lui.

```
https://crt.sh/?q=%.tryhackme.com
```

### Cosa ci ricaviamo

- **Superficie d'attacco più ampia**: sottodomini come `dev.`, `staging.`, `test.`, `admin.` sono spesso dimenticati e molto meno protetti del sito principale. È qui che troviamo la maggior parte delle vulnerabilità reali in un assessment.
- **Mappa dell'infrastruttura**: guardando i pattern nei nomi (es. `api-eu.`, `db-staging.`) capiamo come è organizzata l'azienda internamente, quanti ambienti gestisce, se ha una separazione geografica.
- **Banner e servizi**: DNSDumpster ci mostra anche un riepilogo di tecnologie rilevate sugli host trovati, ad esempio:

```
cloudflare      36
nginx/1.29.1    27
CloudFront       2
```

Da un output così ricaviamo informazioni utili: se molti host risultano dietro Cloudflare, per la maggior parte del dominio non conosciamo l'IP reale (il proxy lo nasconde). Le versioni software diverse tra loro (es. due versioni di nginx) ci indicano che l'infrastruttura non è aggiornata in modo uniforme — magari gestita da team diversi o in momenti diversi.


## Shodan

**Shodan.io** è un motore di ricerca che scansiona costantemente internet e indicizza dispositivi, porte aperte, banner dei servizi e informazioni sull'hosting. La differenza fondamentale rispetto a un nostro scan diretto (es. con `nmap`) è che la scansione l'ha già fatta Shodan al posto nostro — quindi, quando lo consultiamo, restiamo completamente invisibili.

### Cosa ci ricaviamo

- **Porte e servizi esposti**, senza generare traffico verso il target.
- **Versioni software esposte**: se un servizio mostra la sua versione (es. `Apache 2.4.29`), possiamo già iniziare a cercare CVE note per quella versione specifica, prima ancora di toccare il target.
- **Dispositivi inaspettati**: Shodan indicizza anche webcam, router, sistemi industriali (SCADA), NAS — spesso con credenziali di default mai cambiate.
- **Storico**: possiamo vedere come è cambiata l'esposizione del target nel tempo, utile per capire modifiche recenti alla loro infrastruttura.

### Esempio

Se cerchiamo su Shodan un IP che abbiamo trovato con `dig`, otteniamo subito un riepilogo di tutte le porte aperte e dei servizi in ascolto — senza dover lanciare noi stessi nessuno scan.
