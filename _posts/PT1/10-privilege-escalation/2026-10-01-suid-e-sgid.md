---
title: SUID e SGID
date: 2026-10-01 17:18:00 +0200
categories: [PT1, 10-privilege-escalation]
tags: [linux, privilege-escalation, file-permissions]
description: "Come funzionano i permessi speciali SUID e SGID in Linux e perché possono diventare un vettore di privilege escalation."
---

## 1. Il concetto di base: Come funzionano i permessi in Linux?

Di solito, quando esegui un programma o apri un file, il sistema operativo controlla chi sei tu (il tuo utente e il tuo gruppo) e decide se puoi farlo.
- Se sei un utente normale, non puoi toccare i file di sistema di `root`.
- Il problema: A volte un utente normale ha bisogno di compiere un'azione che richiederebbe i poteri di root (ad esempio, cambiare la propria password con il comando `passwd`, che deve modificare il file protetto `/etc/shadow`).

Come si risolve? Usando i permessi speciali SUID e SGID.

## 2. SUID (Set User ID)

Il SUID riguarda i file eseguibili (i programmi).
- Cosa fa: Se un programma ha il SUID attivo, chiunque lo avvii lo eseguirà temporaneamente con i privilegi del proprietario del file (che solitamente è `root`), e non con i propri.
- Metafora: Immagina di dare a chiunque la chiave per aprire la cassetta della posta del capo. Chiunque usi quella chiave, per quel singolo gesto, agisce con l'autorità del capo.
- Esempio tipico: Il comando `/usr/bin/passwd`. Tu sei un utente normale, ma quel comando ha il SUID di root. Quando lo lanci per cambiare la password, il programma gira come root, riesce a scrivere in `/etc/shadow` (dove gli utenti normali non possono entrare) e poi si chiude.

## 3. SGID (Set Group ID)

Il SGID (spesso confuso con GUID) funziona allo stesso identico modo del SUID, ma si applica al gruppo invece che al singolo utente. Ha due scopi principali:
1. **Sui file eseguibili**: Quando avvii il programma, questo viene eseguito con i permessi del gruppo proprietario del file, anziché del gruppo dell'utente che lo ha lanciato.
2. **Sulle directory** (il caso più comune e utile): Se metti il SGID su una cartella condivisa, tutti i file o le sottocartelle create all'interno di quella cartella erediteranno automaticamente lo stesso gruppo della cartella principale, invece del gruppo primario dell'utente che li ha creati. È utilissimo nei progetti di gruppo o nelle cartelle condivise aziendali per evitare che i file appartengano a singoli utenti isolati.

## 4. Come si vedono con `ls -l`?

I permessi normali si leggono in gruppi di tre (`rwx` per l'utente, `rwx` per il gruppo, `rwx` per gli altri). I bit speciali non creano spazi extra: vanno semplicemente a occupare il posto della lettera `x` (esecuzione).

Ecco dove li trovi:
- **Sulla posizione dell'utente** (la prima `x`): Se c'è una `s` (o `S`), indica il SUID.
  - Esempio: `-rwsr-xr-x`
- **Sulla posizione del gruppo** (la seconda `x`): Se c'è una `s` (o `S`), indica il SGID.
  - Esempio: `-rwxr-sr-x`
- **(Bonus) Sulla posizione degli altri** (la terza `x`): Se c'è una `t` (o `T`), indica lo Sticky Bit (spesso usato nelle cartelle pubbliche come `/tmp` per fare in modo che nessuno possa cancellare i file degli altri).

### Lettera minuscola vs maiuscola
- **Minuscola** (`s` o `t`): Il bit speciale è attivo E c'è anche il permesso di esecuzione (`x`).
- **Maiuscola** (`S` o `T`): Il bit speciale è attivo MA manca il permesso di esecuzione (`x`) (situazione anomala o inutile).

## 5. Perché interessano nella Privilege Escalation?

Se durante un'analisi di sicurezza trovi un programma personalizzato o uno script che ha il SUID attivo ed è di proprietà di root, potresti riuscire a sfruttarlo per forzare il sistema ed eseguire comandi con i privilegi massimi.
