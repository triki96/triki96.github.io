# React and Next.js

Next.js è costruito sopra React e Node.js, ma introduce astrazioni proprie (App Router, RSC, middleware su Edge Runtime) che creano una superficie di attacco diversa e meno esplorata rispetto a un backend Express tradizionale."

## fingerprinting
root@tryhackme:~# curl -I http://10.113.162.136:3001/
HTTP/1.1 200 OK
Vary: RSC, Next-Router-State-Tree, Next-Router-Prefetch, Next-Router-Segment-Prefetch, Accept-Encoding
x-nextjs-cache: HIT
x-nextjs-prerender: 1
x-nextjs-stale-time: 4294967294
X-Powered-By: Next.js
Cache-Control: s-maxage=31536000,
ETag: "1pqu4ojvif3at"
Content-Type: text/html; charset=utf-8
Content-Length: 4277
Connection: keep-alive
Keep-Alive: timeout=5 


Segnale	Valore	Fiducia
X-Powered-Byintestazione	Next.js	Alto
Codice sorgente HTML	window.__next_f  in scripttag	Alto (conferma App Router)
Percorsi di risorse statiche	/_next/static/chunks/	Alto
Intestazioni middleware	x-middleware-nextOx-middleware-rewrite	Mezzo
Reindirizzamento al percorso protetto	HTTP 307 a/login	Mezzo


# Django

## fingerprinting
Signal	Value	Confidence
Server header	WSGIServer/0.2 CPython/X.X.X	High
Cookie name	csrftoken	High
X-Frame-Options header	DENY	High
X-Content-Type-Options header	nosniff	High
Referrer-Policy header	same-origin	Medium
HTML source (any POST form)	csrfmiddlewaretoken hidden field	High

Esempio:

root@tryhackme:~# curl -I "http://10.82.95.115:8000/products/"
HTTP/1.1 200 OK
Date: Sun, 03 May 2026 14:33:20 GMT
Server: WSGIServer/0.2 CPython/3.10.12
Content-Type: text/html; charset=utf-8
X-Frame-Options: DENY
Vary: Cookie
Content-Length: 407
X-Content-Type-Options: nosniff
Referrer-Policy: same-origin
Set-Cookie:  csrftoken=9vMaeHlURA0uOYnP9qB2BrDNTvNPoD0JPyecxWNxV7aohswgtAtBvwbLWaOTYIF7; expires=Sun, 02 May 2027 14:33:20 GMT; Max-Age=31449600; Path=/; SameSite=Lax


