# Appunti Cyber Security 101 (TryHackMe) — metodo di studio

Questo è il mio archivio di appunti per il percorso "Cyber Security 101" su TryHackMe (14 moduli, 56 room), in preparazione anche alla certificazione finale SEC1. Segui queste regole ogni volta che ti chiedo di creare o modificare appunti.

## Struttura delle cartelle

- Una cartella per **modulo del corso**, numerata nell'ordine ufficiale del path, es:
  ```
  01-networking/
  02-linux/
  03-web-security/
  ...
  ```
- Dentro ogni cartella modulo, un file markdown per **room completata**, es. `01-networking/dns-in-depth.md`.
- Alla fine di ogni modulo, un file `_riepilogo.md` dentro la cartella del modulo, con solo i concetti chiave e link alle room dettagliate — è quello che rileggo prima dell'esame SEC1, non deve contenere spiegazioni lunghe.

## Template per ogni file di room (post Chirpy)

```markdown
---
title: "Titolo"
date: AAAA-MM-GG 12:00:00 +0200
categories: [Cyber Security 101]
tags: [nome-modulo-thm, argomento-specifico]
description: "..."
toc: true
---

## Cos'è
(2-3 righe, con parole semplici)

## Come funziona
(passo per passo, elenchi puntati)

### Esempio pratico
(comando + perché quel flag/parametro)

## Un limite importante da conoscere
(non "errori che ho fatto" — limiti oggettivi dello strumento/tecnica, alternative migliori)

## Utilizzo
(prosa, non elenco: offensiva/difensiva se rilevante + perché conta in un assessment reale)

---
**Modulo:** (nome modulo THM per esteso, es. "A Journey into Cybersecurity")
**Room:** 
**Data:**
```

Note sul formato:
- `description` nel front matter va sempre compilata (1 riga, riassume il contenuto del post)
- `tags` in inglese minuscolo: nome esatto del modulo THM (slug) + argomento specifico
- tabella dei codici HTTP (quando presente): ordine 200, 301/302, 403, 404
- niente sezione "Collegamenti" se non ci sono link reali ad altri post già esistenti

## Template per il riepilogo di modulo (`_riepilogo.md`)

```markdown
# Riepilogo modulo: [nome modulo]

## Concetti chiave
- punto 1
- punto 2

## Room completate in questo modulo
- [Nome room 1](nome-file-1.md) — una riga su cosa copre
- [Nome room 2](nome-file-2.md) — una riga su cosa copre

## Cosa rivedere prima dell'esame SEC1
- ...
```

## Come comportarti quando ti chiedo di annotare qualcosa

- Non limitarti a scrivere ciò che ti dico: chiedimi *perché* penso che una cosa funzioni così, prima di darmi la spiegazione corretta.
- Segnala sempre se l'argomento è trattato da prospettiva offensiva o difensiva — il corso alterna le due, e voglio tenerne traccia per orientarmi poi tra SOC Level 1 (blu) e PT1 (rosso).
- Quando completo una room, chiedimi se il modulo è finito: se sì, proponimi di aggiornare/creare il file `_riepilogo.md` di quel modulo.
- Se un concetto tocca un modulo diverso da quello che sto trattando (es. parlo di DNS mentre sono nel modulo Web Security), aggiungi un link nella sezione "Collegamenti" verso il file del modulo pertinente, invece di duplicare la spiegazione.

## Su Chirpy (quando pubblico gli appunti come post)

- `categories: [Cyber Security 101]` fisso per tutte le room del corso, per tenerle distinte da eventuali CTF libere future.
- `tags:` con il nome del modulo e l'argomento specifico (es. `tags: [networking, dns]`).

## Interrogazioni

Quando ti chiedo di "interrogarmi" su un modulo o un gruppo di room, fammi 3-5 domande sul *perché* le cose funzionano, non sulla sintassi esatta dei comandi. Non darmi subito la risposta: aspetta il mio tentativo, poi correggimi.
