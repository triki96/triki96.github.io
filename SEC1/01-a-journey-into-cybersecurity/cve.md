---
title: "CVE"
date: 2026-08-07 19:00:00 +0200
categories: [Cyber Security 101]
tags: [a-journey-into-cybersecurity, vulnerability-management, cve]
description: "Cosa sono e come identificano le vulnerabilità."
toc: true
---

## Cos'è

Con il termine CVE (**Common Vulnerabilities and Exposures**) si intende un sistema standardizzato per identificare in modo univoco le vulnerabilità di sicurezza note in software e hardware. Ogni vulnerabilità confermata riceve un identificativo unico nel formato `CVE-ANNO-NUMERO`, ad esempio `CVE-2025-55182`.

## Come funziona

Il formato `CVE-ANNO-NUMERO` comunica già informazioni utili a colpo d'occhio:

- **ANNO**: l'anno in cui la vulnerabilità è stata assegnata/pubblicata (non necessariamente l'anno in cui è stata scoperta o corretta)
- **NUMERO**: un identificativo progressivo, senza un limite fisso di cifre — negli anni con più vulnerabilità pubblicate, i numeri arrivano a 5-6 cifre

Ogni CVE è mantenuta in un database centrale (il database CVE, coordinato da MITRE) e collegata a informazioni come: descrizione tecnica del problema, software/versioni affette, gravità (spesso espressa con un punteggio **CVSS**), e riferimenti a patch o exploit noti.

### Il moniker: quando una CVE ottiene anche un nome proprio

Se una vulnerabilità è particolarmente impattante, può ricevere anche un **moniker** — un nome informale e memorabile, coniato per renderla riconoscibile anche a chi non è tecnico, spesso accompagnato da un logo dedicato.

| CVE | Moniker |
|---|---|
| CVE-2014-0160 | Heartbleed |
| CVE-2017-5754 | Meltdown |
| CVE-2017-5753 / 5715 | Spectre |
| CVE-2021-44228 | Log4Shell |
| CVE-2014-6271 | Shellshock |

Non tutte le CVE ottengono un moniker — solo quelle particolarmente diffuse (colpiscono software usato ovunque), particolarmente gravi nell'impatto (RCE, furto massivo di dati), o con un potenziale mediatico interessante da comunicare al pubblico generale. La maggior parte delle decine di migliaia di CVE pubblicate ogni anno resta identificata solo dal proprio codice numerico.

## Utilizzo

Le CVE sono il riferimento standard usato in ogni fase in cui si valuta o si sfrutta una vulnerabilità nota: durante l'enumerazione (per collegare una versione software identificata a un problema documentato), durante il reporting di un assessment (per comunicare in modo univoco e verificabile cosa è stato trovato), e nella difesa (per dare priorità alle patch in base alla gravità).

---
**Modulo:** A Journey into Cybersecurity
**Room:** 
**Data:** 7 agosto 2026
