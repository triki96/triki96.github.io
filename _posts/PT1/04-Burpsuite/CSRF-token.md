CSRF TOKEN 

Lo scenario

Immagina un sito bancario, mibanca.com, con questa funzione di trasferimento denaro:

GET https://mibanca.com/trasferisci?destinatario=amico&importo=100

Un design ingenuo: basta una richiesta GET con due parametri, e il server esegue il bonifico usando il cookie di sessione per sapere da quale conto prelevare i soldi (il tuo, quello associato alla sessione attiva).

Tu sei normalmente loggato su mibanca.com — hai il cookie di sessione valido in memoria nel browser.

L'attacco

Ricevi una mail con un link, oppure visiti un sito qualsiasi che contiene questo HTML nascosto:

html
<img src="https://mibanca.com/trasferisci?destinatario=attaccante&importo=5000" width="0" height="0">

Non devi cliccare nulla. Il browser, nel caricare quella pagina, prova a caricare l'immagine — e per farlo manda una richiesta GET a quell'URL, allegando automaticamente il cookie di sessione di mibanca.com, perché è quello che i browser fanno sempre: ogni richiesta verso un dominio include i cookie salvati per quel dominio, indipendentemente da quale pagina ha originato la richiesta.

Il server di mibanca.com riceve una richiesta con:

un cookie di sessione valido → "ok, questo è davvero un utente loggato"
parametri che dicono di trasferire 5000 euro all'attaccante

Non ha modo di sapere che la richiesta è partita da un sito esterno malevolo invece che da un click volontario tuo sulla pagina di mibanca.com. La esegue. Hai appena trasferito soldi all'attaccante senza aver fatto nulla di consapevole — hai solo aperto una pagina.

Perché funziona: il cookie non dice "chi ha voluto la richiesta"

Il punto chiave, collegandoci a prima: il cookie dimostra solo "questo browser ha una sessione valida con mibanca.com". Non dimostra che la richiesta sia partita da un'azione tua sul sito legittimo. Il browser è "ingenuo" in questo senso — allega il cookie a prescindere dall'origine della richiesta.

Come il token CSRF blocca questo attacco

Ora immagina che il form di trasferimento richieda anche un token:

html
<form method="POST" action="/trasferisci">
  <input type="hidden" name="csrf_token" value="a3f9c81b...">
  <input name="destinatario">
  <input name="importo">
</form>

Il server genera quel token solo quando tu carichi la pagina del form legittima, e lo lega alla tua sessione. Per completare il trasferimento, ora serve anche quel valore nel POST.

L'attaccante, nella sua pagina malevola, non ha modo di conoscere quel token: per leggerlo dovrebbe poter caricare la pagina mibanca.com/trasferisci e leggerne l'HTML — ma il browser, per via della same-origin policy, non permette a JavaScript eseguito su un dominio esterno di leggere il contenuto di pagine caricate da un altro dominio. Il cookie viene mandato automaticamente (è comportamento passivo del browser), ma il token va letto attivamente dall'HTML — e questo l'attaccante non può farlo.

Quindi l'attaccante può al massimo costruire una richiesta con destinatario e importo, ma non con un csrf_token valido. Il server riceve la richiesta, verifica che il token non corrisponde (o è assente) rispetto a quello associato alla sessione, e la rifiuta — anche se il cookie di sessione era perfettamente valido.