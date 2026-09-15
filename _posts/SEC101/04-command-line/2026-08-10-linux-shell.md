---
title: "Linux Shell"
date: 2026-08-10 13:10:00 +0200
categories: [Cyber Security 101, command-line]
tags: [linux-shell]
description: ""
toc: true
---

## Lo shebang: #!/bin/bash

La prima riga di uno script bash inizia tipicamente con:

```bash
#!/bin/bash
```

Questa riga speciale è chiamata **shebang** (o hashbang). Non è un commento nel senso classico: dice al sistema operativo **quale interprete** usare per eseguire il resto del file. Quando lanci lo script (`./script.sh`), il sistema legge questa prima riga e sa di dover passare tutto il contenuto del file a `/bin/bash` per l'esecuzione.

### Shell alternative

`/bin/bash` non è l'unica opzione — esistono altre shell, ciascuna con piccole differenze di sintassi e funzionalità:

| Shebang | Shell | Note |
|---|---|---|
| `#!/bin/bash` | Bash | La più diffusa, quella usata in questi appunti |
| `#!/bin/sh` | Shell POSIX generica | Più minimale, spesso un link a `dash` su sistemi Debian/Ubuntu |
| `#!/bin/zsh` | Zsh | Shell più moderna, di default su macOS |
| `#!/usr/bin/env python3` | Python | Lo shebang non è limitato a shell: può puntare a qualsiasi interprete |

> Uno script scritto per bash non è garantito che funzioni identico se eseguito con `sh`, anche se la sintassi sembra simile — alcune funzionalità (come `{1..10}` che vedremo nei loop) sono estensioni specifiche di bash, non parte dello standard POSIX.

## Comandi base

**`pwd`** (print working directory) — mostra il percorso della directory in cui ci si trova attualmente.
```bash
$ pwd
/home/triki96/Documenti/sitoCarmen
```

**`ls`** — elenca il contenuto di una directory.
```bash
$ ls -la
drwxr-xr-x  4 triki96 triki96 4096 Aug  8 20:15 .
drwxr-xr-x 12 triki96 triki96 4096 Aug  7 09:30 ..
-rw-r--r--  1 triki96 triki96  512 Aug  8 20:10 script.sh
```

**`grep`** — cerca un pattern di testo dentro uno o più file.
```bash
$ grep "root" /etc/passwd
root:x:0:0:root:/root:/bin/bash
```

Il flag **`-q`** (quiet) sopprime completamente l'output testuale e restituisce solo un **exit code**: `0` se il pattern è stato trovato, `1` se non lo è. È il modo idiomatico per usare `grep` dentro una condizione, invece di dover analizzare manualmente l'output:
```bash
if grep -q "root" /etc/passwd; then
    echo "L'utente root è presente nel file"
fi
```

**`chmod`** — modifica i permessi di un file. Il flag **`+x`** aggiunge il permesso di esecuzione, indispensabile per poter lanciare uno script con `./nomescript.sh` invece di doverlo passare esplicitamente all'interprete (`bash nomescript.sh`).
```bash
$ chmod +x script.sh
$ ./script.sh
```

## Loop

Un ciclo `for` in bash permette di ripetere un blocco di comandi per ogni elemento di una sequenza.

```bash
for i in {1..10}; do
    echo $i
done
```
```
1
2
3
4
5
6
7
8
9
10
```

`{1..10}` è un'espansione di intervallo di bash: genera la sequenza `1 2 3 ... 10`. Il ciclo `for` assegna, a ogni iterazione, il valore corrente alla variabile `i`, ed esegue il blocco tra `do` e `done`.

### A cosa servono i punti e virgola

In bash, `;` e "andare a capo" sono **intercambiabili** come modo di terminare un'istruzione. Quando scrivi il ciclo tutto su una riga sola (comune per i comandi al volo da terminale), servono per separare le singole parti:

```bash
for i in {1..10}; do echo $i; done
```

Qui il primo `;` separa `for i in {1..10}` da `do`, il secondo separa `echo $i` da `done`. Senza, bash darebbe un errore di sintassi perché non saprebbe dove finisce una parte e inizia l'altra. Se invece scrivi il ciclo su più righe (come nel primo esempio), l'a capo stesso fa già da separatore, e i `;` diventano superflui.

## Conditional Statements (if)

Le strutture condizionali permettono di eseguire comandi diversi in base al risultato di un test.

```bash
#!/bin/bash

directory="$HOME/Documenti/sitoCarmen"
flag="thm-flag01-script"

for file in $directory/*.txt; do
    if grep -q "$flag" "$file"; then
        echo "Flag found in: $(basename "$file")"
    fi
done
```
```
Flag found in: notes3.txt
```

**Appendice — perché `$(basename "$file")` e non semplicemente `$file`**

Non sono equivalenti: `$file`, dentro il ciclo, contiene il **percorso completo**, perché il glob è stato costruito come `$directory/*.txt` (es. `/home/triki96/Documenti/sitoCarmen/notes3.txt`). `basename` invece **estrae solo il nome del file**, scartando tutto il percorso davanti (`notes3.txt`).

Se lo script usasse `$file` al posto di `$(basename "$file")`, l'output diventerebbe `Flag found in: /home/triki96/Documenti/sitoCarmen/notes3.txt` invece di `Flag found in: notes3.txt` — `basename` c'è apposta per rendere l'output più leggibile, mostrando solo il nome del file invece del percorso completo, spesso lungo e ripetitivo se si stanno scandendo molti file nella stessa cartella.

Il caso in cui converrebbe davvero usare `$file` al posto di `basename` è quando si cercano file sparsi in **sottocartelle diverse**: in quel caso il percorso completo è un'informazione utile per sapere esattamente dove si trova ciascun file, non un dettaglio ridondante da nascondere.

Lo scheletro di un `if` in bash è:
```bash
if <condizione>; then
    <comandi da eseguire se la condizione è vera>
elif <altra condizione>; then
    <comandi alternativi>
else
    <comandi se nessuna condizione è vera>
fi
```

Nell'esempio, `grep -q "$flag" "$file"` funge direttamente da condizione: bash controlla l'exit code del comando (`0` = vero, qualsiasi altro valore = falso), senza bisogno di un confronto esplicito con `[ ]`. Il blocco `if`/`then`/`fi` chiude sempre con `fi` ("if" al contrario), esattamente come `for`/`do`/`done` chiude con `done`.

> Un errore comune da evitare in questo tipo di script: assegnare un percorso con la tilde (`~`) dentro le virgolette, es. `directory="~/Documenti/sitoCarmen"`. La tilde si espande nel percorso home solo se **non è tra virgolette** — dentro `"..."` resta un carattere letterale, e il ciclo non troverà mai i file. Meglio usare `directory="$HOME/Documenti/sitoCarmen"`, che funziona correttamente anche tra virgolette.

## Utilizzo

Shebang, comandi base, loop e condizioni sono i mattoni fondamentali di qualsiasi script bash — la stessa combinazione che serve per scrivere piccoli strumenti di enumerazione automatica durante un assessment (es. cercare una stringa specifica in centinaia di file, come nell'esempio con `grep -q` e il ciclo `for`), o per automatizzare compiti ripetitivi di amministrazione di sistema.
