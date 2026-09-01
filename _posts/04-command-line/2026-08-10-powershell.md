---
title: "PowerShell"
date: 2026-08-10 13:00:00 +0200
categories: [Cyber Security 101, command-line]
tags: [powershell]
description: ""
toc: true
---

## Introduzione

PowerShell è uno strumento potente di Microsoft pensato per l'automazione di task e la gestione della configurazione. Combina un'interfaccia a riga di comando e un linguaggio di scripting costruito sul framework .NET. A differenza dei vecchi strumenti a riga di comando basati solo su testo, PowerShell è **orientato agli oggetti**: questo significa che può gestire tipi di dati complessi e interagire con i componenti del sistema in modo molto più efficace rispetto a `cmd.exe`, dove ogni comando restituisce semplicemente testo grezzo.

Inizialmente esclusivo di Windows, PowerShell si è recentemente esteso per supportare anche macOS e Linux, diventando un'opzione versatile per i professionisti IT su sistemi operativi diversi.

**Un esempio concreto della differenza "orientato agli oggetti"**: in `cmd.exe`, `dir` restituisce testo che va analizzato manualmente riga per riga per estrarne informazioni. In PowerShell, `Get-ChildItem` restituisce **oggetti** con proprietà vere e proprie (`Name`, `Length`, `LastWriteTime`, ecc.), che possono essere filtrati, ordinati e trasformati direttamente.

## La sintassi: il verbo-nome

I cmdlet di PowerShell (i suoi comandi) seguono quasi tutti la convenzione **Verbo-Nome**: un verbo che descrive l'azione, seguito da un nome che descrive su cosa agisce. Questo rende i comandi prevedibili e facili da intuire anche senza averli mai usati prima.

```powershell
Get-Process      # "ottieni" i "processi"
New-Item         # "crea" un "elemento"
Remove-Item      # "rimuovi" un "elemento"
Set-Location     # "imposta" la "posizione" (cambia directory)
```

Verbi comuni: `Get` (ottieni), `Set` (imposta), `New` (crea), `Remove` (rimuovi), `Copy` (copia), `Start`/`Stop` (avvia/ferma), `Invoke` (esegui). Conoscere questa convenzione permette spesso di indovinare il nome di un cmdlet anche senza averlo mai visto.

## Gli alias

Per facilitare la transizione ai professionisti IT già abituati ad altri strumenti a riga di comando, PowerShell include gli **alias** — scorciatoie o nomi alternativi per i cmdlet, per molti dei comandi tradizionali di Windows (e di Unix). Indispensabili per chi già conosce altri strumenti a riga di comando, `Get-Alias` elenca tutti gli alias disponibili.

```powershell
PS C:\> Get-Alias

CommandType     Name                                               Version    Source
-----------     ----                                               -------    ------
Alias           cat -> Get-Content
Alias           cd -> Set-Location
Alias           cp -> Copy-Item
Alias           dir -> Get-ChildItem
Alias           ls -> Get-ChildItem
Alias           ps -> Get-Process
Alias           rm -> Remove-Item
```

**Esempi di alias comuni:**

| Alias | Cmdlet reale |
|---|---|
| `dir` | `Get-ChildItem` |
| `cd` | `Set-Location` |
| `ls` | `Get-ChildItem` |
| `cat` | `Get-Content` |
| `rm` | `Remove-Item` |
| `cp` | `Copy-Item` |
| `ps` | `Get-Process` |

Grazie agli alias, chi arriva da `cmd.exe` o da una shell Linux può continuare a digitare comandi familiari come `dir` o `cd`, che PowerShell traduce automaticamente nei cmdlet reali corrispondenti.

## I comandi

### Gestire il filesystem

**`Get-ChildItem`** — elenca il contenuto di una directory (equivalente object-oriented di `dir`/`ls`).
```powershell
PS C:\> Get-ChildItem C:\Users\triki96\Documenti

    Directory: C:\Users\triki96\Documenti

Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
d-----         08/08/2026     10:12                progetto
-a----         07/08/2026     18:44           2048 note.txt
-a----         06/08/2026     09:15          15360 report.docx
```

**`Set-Location`** — cambia la directory corrente (equivalente di `cd`).
```powershell
PS C:\> Set-Location C:\Windows\System32
PS C:\Windows\System32>
```

**`New-Item`** — crea un nuovo file o directory.
```powershell
PS C:\> New-Item -Path C:\progetto -ItemType Directory

    Directory: C:\

Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
d-----         08/08/2026     20:03                progetto
```
```powershell
PS C:\> New-Item -Path C:\progetto\note.txt -ItemType File

    Directory: C:\progetto

Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
-a----         08/08/2026     20:05              0 note.txt
```

**`Remove-Item`** — elimina un file o una directory.
```powershell
PS C:\> Remove-Item C:\progetto\note.txt
PS C:\>
```

**`Copy-Item`** — copia un file o una directory.
```powershell
PS C:\> Copy-Item C:\progetto\note.txt -Destination C:\backup\
PS C:\>
```

**`Get-Content`** — mostra il contenuto di un file (equivalente di `cat`/`type`).
```powershell
PS C:\> Get-Content C:\progetto\note.txt
Promemoria: aggiornare gli appunti THM entro venerdì.
Controllare i permessi sulla cartella condivisa.
```

**`Select-String`** — cerca un pattern di testo dentro uno o più file (equivalente di `grep`).
```powershell
PS C:\> Select-String -Path C:\logs\*.log -Pattern "ERROR"

C:\logs\app.log:142:2026-08-08 09:14:02 ERROR Connessione al database fallita
C:\logs\app.log:301:2026-08-08 11:02:37 ERROR Timeout richiesta API
```

### Piping

Il **piping** (`|`) collega l'output di un cmdlet come input del successivo — ed è qui che l'approccio "orientato agli oggetti" di PowerShell mostra davvero il suo valore, perché ogni cmdlet nella catena riceve oggetti veri, non solo testo da riparsare.

**Ordinare i file per dimensione:**
```powershell
PS C:\> Get-ChildItem | Sort-Object Length

    Directory: C:\Users\triki96\Documenti

Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
d-----         08/08/2026     10:12                progetto
-a----         07/08/2026     18:44           2048 note.txt
-a----         06/08/2026     09:15          15360 report.docx
```

**Filtrare per estensione:**
```powershell
PS C:\> Get-ChildItem | Where-Object -Property "Extension" -eq ".txt"

    Directory: C:\Users\triki96\Documenti

Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
-a----         07/08/2026     18:44           2048 note.txt
```

**Filtrare per un pattern nel nome:**
```powershell
PS C:\> Get-ChildItem | Where-Object -Property "Name" -like "report*"

    Directory: C:\Users\triki96\Documenti

Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
-a----         06/08/2026     09:15          15360 report.docx
```

**Selezionare solo alcune proprietà da mostrare:**
```powershell
PS C:\> Get-ChildItem | Select-Object Name, Length

Name              Length
----              ------
progetto
note.txt            2048
report.docx         15360
```

> Queste quattro righe si possono anche combinare tra loro in un'unica pipeline (es. filtrare per estensione, poi ordinare per dimensione, poi mostrare solo nome e dimensione) — è la composizione di più cmdlet semplici che rende PowerShell così potente per l'automazione.
{: .prompt-tip }

### Sistema e rete

**`Get-ComputerInfo`** — restituisce informazioni dettagliate sul sistema (equivalente PowerShell di `systeminfo`, ma come oggetto interrogabile).
```powershell
PS C:\> Get-ComputerInfo | Select-Object WindowsProductName, OsArchitecture, CsProcessors

WindowsProductName  OsArchitecture  CsProcessors
------------------  --------------  ------------
Windows 11 Pro      64-bit          {Intel(R) Core(TM) i7-1165G7}
```

**`Get-LocalUser`** — elenca gli utenti locali del sistema (equivalente PowerShell di `lusrmgr.msc`).
```powershell
PS C:\> Get-LocalUser

Name          Enabled  Description
----          -------  -----------
Administrator False    Account amministratore integrato
triki96       True
Guest         False    Account ospite integrato
```

**`Get-NetIPConfiguration`** — mostra la configurazione IP delle interfacce di rete attive (equivalente più sintetico di `Get-NetIPAddress`).
```powershell
PS C:\> Get-NetIPConfiguration

InterfaceAlias       : Ethernet
InterfaceIndex       : 12
IPv4Address          : 192.168.1.24
IPv4DefaultGateway   : 192.168.1.1
DNSServer            : 192.168.1.1, 8.8.8.8
```

**`Get-NetIPAddress`** — mostra i dettagli di tutti gli indirizzi IP configurati sul sistema, incluse le interfacce non attualmente attive.
```powershell
PS C:\> Get-NetIPAddress | Select-Object InterfaceAlias, IPAddress, AddressState

InterfaceAlias    IPAddress                 AddressState
--------------    ---------                 ------------
Ethernet          192.168.1.24              Preferred
Wi-Fi             169.254.83.12             Invalid (non attiva)
Loopback          127.0.0.1                 Preferred
```

**`Get-Process`** — elenca i processi in esecuzione (equivalente object-oriented di `tasklist`).
```powershell
PS C:\> Get-Process | Where-Object -Property "CPU" -gt 100

Handles  NPM(K)    PM(K)      WS(K)     CPU(s)     Id  ProcessName
-------  ------    -----      -----     ------     --  -----------
    842      42   215032     198340     312.45   4532  chrome
    391      28    98120      87200     145.10   6120  Teams
```

**`Get-Service`** — elenca i servizi Windows e il loro stato.
```powershell
PS C:\> Get-Service | Where-Object -Property "Status" -eq "Running" | Select-Object -First 3

Status   Name               DisplayName
------   ----               -----------
Running  Dhcp               DHCP Client
Running  Dnscache           DNS Client
Running  wuauserv           Windows Update
```

**`Get-NetTCPConnection`** — mostra le connessioni TCP attive (equivalente object-oriented di `netstat`).
```powershell
PS C:\> Get-NetTCPConnection | Where-Object -Property "State" -eq "Established"

LocalAddress   LocalPort  RemoteAddress    RemotePort  State
------------   ---------  -------------    ----------  -----
192.168.1.24   51422      142.250.180.14   443         Established
192.168.1.24   51430      20.190.159.4     443         Established
```

**`Get-FileHash`** — calcola l'hash crittografico di un file, utile per verificarne l'integrità o confrontarlo con hash noti (es. su VirusTotal).
```powershell
PS C:\> Get-FileHash -Path C:\downloads\file.exe -Algorithm SHA256

Algorithm  Hash                                                             Path
---------  ----                                                             ----
SHA256     A1B2C3D4E5F6...9F0A1B2C3D4E5F6A7B8C9D0E1F2A3B4C  C:\downloads\file.exe
```

**`Get-Item` con gli Alternate Data Stream** — permette di elencare gli stream nascosti di un file su NTFS, lo stesso meccanismo ADS già visto in dettaglio parlando di NTFS.
```powershell
PS C:\> Get-Item -Path C:\documento.txt -Stream *

PSPath        : Microsoft.PowerShell.Core\FileSystem::C:\documento.txt
Stream        : :$DATA
Length        : 21

PSPath        : Microsoft.PowerShell.Core\FileSystem::C:\documento.txt
Stream        : Zone.Identifier
Length        : 26
```

### Extra ma utili

**`Invoke-Command`** — esegue uno script o un blocco di comandi, anche su una macchina remota (già visto in dettaglio con `-ComputerName`).
```powershell
PS C:\> Invoke-Command -FilePath C:\scripts\test.ps1 -ComputerName Server01

Verifica completata su Server01
PSComputerName : Server01
RunspaceId     : 3fa1c2e0-...
```

**`Get-Command`** — elenca i cmdlet disponibili, filtrabili per tipo.
```powershell
PS C:\> Get-Command -CommandType "Function" | Select-Object -First 3

CommandType     Name
-----------     ----
Function        Clear-Host
Function        Get-TimeZone
Function        Update-Help
```

**`Get-Help`** — mostra la documentazione di un cmdlet, coi suoi parametri ed esempi d'uso (l'equivalente PowerShell di `man` su Linux).
```powershell
PS C:\> Get-Help Get-Process -Examples

NOME
    Get-Process

--------  ESEMPIO 1  --------
PS C:\> Get-Process

Ottiene tutti i processi in esecuzione sul computer locale.
```

**`Find-Module`** — cerca moduli PowerShell disponibili online, per estendere le funzionalità di base con cmdlet aggiuntivi.
```powershell
PS C:\> Find-Module -Name "*ActiveDirectory*"

Version    Name                          Repository
-------    ----                          ----------
1.0.1.0    ActiveDirectoryTools          PSGallery
```

**`Install-Module`** — installa un modulo trovato con `Find-Module`, rendendo disponibili i suoi cmdlet nella sessione.
```powershell
PS C:\> Install-Module -Name PSWindowsUpdate

NuGet provider è richiesto per continuare...
Il modulo 'PSWindowsUpdate' è stato installato correttamente.
```

## Utilizzo

PowerShell è ormai lo strumento principale con cui amministratori (e attaccanti) interagiscono con ambienti Windows moderni, inclusi quelli basati su Active Directory: molti dei cmdlet visti in questo file hanno un ruolo diretto nell'enumerazione di un sistema durante un assessment — `Get-LocalUser`, `Get-Process`, `Get-NetTCPConnection` per capire chi/cosa gira sulla macchina, `Get-FileHash` per verificare campioni sospetti, `Invoke-Command` per il movimento laterale in un dominio. La sua natura object-oriented e la possibilità di scaricare moduli aggiuntivi (`Find-Module`/`Install-Module`) lo rendono anche la base di numerosi strumenti offensivi e difensivi scritti interamente in PowerShell.
