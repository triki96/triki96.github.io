---
title: "Digital Forensics Fundamentals"
date: 2026-08-18 11:00:00 +0200
categories: [Cyber Security 101, defensive-security]
tags: [forensics, metadata]
description: "Il processo forense in 4 fasi del NIST e l'analisi dei metadati con pdfinfo ed exiftool."
toc: true
---

Il **NIST** definisce un processo generale in quattro fasi per quanto riguarda l'analisi forense, applicabile a qualsiasi caso indipendentemente da strumenti/tecniche specifiche: **Collection** (identificare e raccogliere i dispositivi/dati, senza alterare gli originali), **Examination** (filtrare i dati raccolti ed estrarre quelli di interesse), **Analysis** (correlare i dati per trarne conclusioni), **Reporting** (documentare i risultati).

Prima di raccogliere qualsiasi prova servono un'**autorizzazione appropriata**, una **chain of custody** (il documento che traccia ogni passaggio di mano delle prove digitali raccolte) e l'uso di un **write blocker**, uno strumento hardware/software che garantisce l'integrità dei dati impedendo qualsiasi scrittura accidentale sul dispositivo originale durante la raccolta.

Vediamo due strumenti utili per l'analisi, `pdfinfo` ed `exiftool`. Sono strumenti minimi ma spesso decisivi in una prima fase di **Examination**: prima ancora di analizzare il contenuto vero e proprio di un documento o di un'immagine, i metadati possono già rivelare autore, software usato, data di creazione o posizione geografica — informazioni che in un'indagine reale permettono di correlare rapidamente una prova digitale a una persona o un luogo, senza bisogno di strumenti forensi più complessi.

## pdfinfo

`pdfinfo` legge e mostra i metadati di un file PDF: titolo, soggetto, autore, software creatore, data di creazione, e altri campi incorporati nel documento.


**Uso di base**

```bash
root@tryhackme:~# pdfinfo ransom-letter.pdf
Creator:        Microsoft® Word for Office 365
Producer:       Microsoft® Word for Office 365
Author:         J. Doe
CreationDate:   Thu Sep 12 10:14:22 2024
ModDate:        Thu Sep 12 10:15:03 2024
Pages:          1
```

Anche se il file finale è un PDF, il campo `Creator`/`Producer` spesso rivela il programma originale con cui è stato scritto (qui Word) — segno che il documento è stato prima creato in un altro formato e poi esportato in PDF, esportazione che tipicamente **mantiene gran parte dei metadati originali**, incluso il campo `Author`, molto utile in un'indagine per collegare un documento anonimo a un nome.

## exiftool

`exiftool` legge i metadati **EXIF** (Exchangeable Image File Format) delle immagini — informazioni incorporate automaticamente dalla fotocamera/smartphone al momento dello scatto, che spesso includono anche le **coordinate GPS** di dove la foto è stata scattata.


**Uso di base**

```bash
root@tryhackme:~# exiftool ransom-photo.jpg
Make                            : Apple
Camera Model Name               : iPhone 13
Create Date                     : 2024:09:12 09:47:31
GPS Latitude                    : 41 deg 53' 24.36" N
GPS Longitude                   : 12 deg 29' 32.16" E
GPS Position                    : 41 deg 53' 24.36" N, 12 deg 29' 32.16" E
```

Le coordinate GPS (`GPS Latitude`/`GPS Longitude`) possono essere inserite direttamente in un servizio di mappe (es. Google Maps) per risalire al luogo esatto in cui la foto è stata scattata — nel caso pratico della room, questo è il passaggio che permette di identificare la via da cui è stata inviata l'immagine di un documento di riscatto.



## Osservazione

I metadati sono affidabili solo finché non vengono deliberatamente ripuliti o alterati: molte piattaforme (social network, app di messaggistica) rimuovono automaticamente i dati EXIF, incluse le coordinate GPS, durante l'upload o l'invio — quindi l'assenza di metadati non significa che l'informazione non esistesse in origine, solo che è stata rimossa lungo il percorso. Va sempre verificato da quale fonte/canale il file è stato effettivamente ottenuto.
