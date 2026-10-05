FILE INCLUSION

indurre un'applicazione web a esporre, o addirittura eseguire, file che non avrebbero mai dovuto essere accessibili.

Obiettivi di apprendimento
Al termine di questa stanza, sarai in grado di:

Spiega la differenza tra attraversamento del percorso, LFI e RFI.
Identificare i punti di ingresso per l'inclusione dei file in un'applicazione web
Sfrutta le vulnerabilità LFI e RFI per leggere file sensibili e ottenere l'esecuzione di codice in remoto.
Applicare tecniche di correzione per prevenire le vulnerabilità di inclusione dei file


PATH TRASVERSAL

Molte applicazioni web necessitano di caricare contenuti in modo dinamico. L'immagine del profilo di un utente, un file di lingua, un report in PDF: questi sono tutti esempi di contenuti che possono essere recuperati in base all'input dell'utente. Le applicazioni spesso lo fanno accettando un parametro nell'URL che indica al server quale file restituire.


LFI

caso base 1
baso base 2

. In pratica, non sempre si ha questa possibilità. In questo compito, esploreremo come identificare le vulnerabilità LFI attraverso test black-box e come aggirare diversi filtri comuni che gli sviluppatori implementano per cercare di prevenire lo sfruttamento.
