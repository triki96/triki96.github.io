---
title: "Firewall Fundamentals"
date: 2026-08-20 09:15:00 +0200
categories: [Cyber Security 101, security-solutions]
tags: [firewall]
description: "..."
toc: true
---

## Cos'è un firewall

Un firewall è un software progettato per ispezionare il traffico in entrata e in uscita di una rete o di un dispositivo digitale.
In generale, i firewall si differenziano per quanti dati considerano, a che livello OSI ispezionano il traffico, e per quanto è comoda la loro configurazione: su Windows c'è un'unica interfaccia integrata, mentre su Linux esiste un intero ecosistema di strumenti — dalla sintassi più "grezza" e potente di iptables/nftables fino alla semplicità di ufw.

## Tipi di firewall

Esistono diversi tipi di firewall, e operano a livelli diversi del modello OSI:

- **Stateless Firewall** — valutano ogni pacchetto in isolamento, senza memoria dei pacchetti precedenti. Opera ai **livelli 3 (Network) e 4 (Transport)**, basando le proprie decisioni su indirizzo IP, porta e protocollo.
- **Stateful Firewall** — mantiene lo stato delle connessioni, cioè tiene traccia delle connessioni già autorizzate e valuta i pacchetti successivi in base a quel contesto, non isolatamente — colma proprio il limite dello stateless. Opera anch'esso ai **livelli 3 e 4**, con in più la capacità di tracciare lo stato della sessione (es. lo stato di una connessione TCP).
- **Proxy Firewall** — ispeziona il traffico diretto a un'applicazione, agendo da intermediario. Opera al **livello 7 (Application)**, potendo quindi leggere e filtrare il contenuto reale della comunicazione, non solo gli header.
- **Next-Generation Firewall (NGFW)** — offre analisi euristica del traffico, andando oltre le semplici regole statiche per includere capacità più avanzate come ispezione approfondita dei pacchetti, prevenzione delle intrusioni, e talvolta integrazione con feed di threat intelligence. Opera principalmente al **livello 7**, pur mantenendo visibilità e controllo anche sui livelli inferiori (3 e 4) — combina quindi più livelli di ispezione in un unico strumento.

In sintesi sui livelli: si passa da un controllo "grezzo" basato solo su indirizzi/porte (livelli 3-4, stateless/stateful) a un controllo capace di leggere il contenuto reale del traffico (livello 7, proxy/NGFW) — più si sale di livello, più il firewall può essere preciso nelle decisioni, ma anche più costoso in termini di risorse computazionali richieste.

## Firewall rules

I componenti base di ogni regola di un firewall sono:

- **Source address** — indirizzo di origine
- **Destination address** — indirizzo di destinazione
- **Port** — porta
- **Protocol** — protocollo
- **Action** — azione
- **Direction** — direzione

**Le tre azioni principali** applicabili a una regola:

- **Allow** — permetti
- **Deny** — nega
- **Forward** — inoltra

**Le categorie di regole in base alla direzione del traffico:**

- **Inbound Rules** — regole per il traffico in entrata
- **Outbound Rules** — regole per il traffico in uscita (es. la regola creata per il traffico che lascia la nostra rete ha direzione outbound)

## Windows Defender Firewall

Windows include un firewall nativo, **Windows Defender Firewall**, introdotto da Microsoft nel sistema operativo Windows.

**Come accedervi:**

```cmd
wf.msc
```

Questo apre la console "Windows Defender Firewall with Advanced Security", da cui si possono creare regole in entrata/uscita specificando gli stessi componenti visti sopra: indirizzo sorgente/destinazione, porta, protocollo, azione.

## Linux Firewalls

Linux offre diverse opzioni di firewall, tutte basate sullo stesso framework del kernel, **Netfilter**, che fornisce le funzionalità firewall di base (packet filtering, NAT, connection tracking) su cui si appoggiano tutte le utility elencate di seguito.

- **iptables** — l'utility più usata storicamente, organizza le informazioni in **tabelle, chain e regole**: le tabelle contengono chain di regole, e ogni chain ha un insieme di regole che definiscono come i pacchetti vengono filtrati. È il successore di un firewall ancora più vecchio chiamato **ipchains**.
- **nftables** — il successore di iptables, con capacità di packet filtering e NAT migliorate, anch'esso basato su Netfilter.
- **firewalld** — anche questo basato su Netfilter, ma con un approccio diverso: usa configurazioni di **zone di rete predefinite** invece della sintassi diretta di iptables/nftables.
- **ufw (Uncomplicated Firewall)** — elimina le complicazioni della sintassi di iptables (o del suo successore) offrendo un'interfaccia più semplice — qualsiasi regola serva in iptables può essere definita con comandi più intuitivi via ufw, che poi configura iptables sotto il cofano.

### ufw focus

Vediamo come ufw permetta di scrivere comandi brevi e leggibili, invece della sintassi molto più verbosa di iptables puro. Di seguito i comandi di base.

```bash
sudo ufw enable                       # 1. accendi il firewall
sudo ufw default allow outgoing       # 2. imposta la regola di fondo per l'uscita
sudo ufw deny 22/tcp                  # 3. aggiungi una regola specifica (blocca SSH)
sudo ufw status numbered              # 4. controlla cosa è configurato, con i numeri
sudo ufw delete 2                     # 5. se serve, rimuovi una regola specifica
```
