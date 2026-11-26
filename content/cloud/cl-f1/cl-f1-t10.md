---
id: cl-f1-t10
track: cloud
phase: cl-f1
title: HTTP, TLS y balanceo
minutes: 40
updated: 2026-11-26
---

## Objetivo

Entender cómo funcionan HTTP y HTTPS, qué hace un certificado TLS y qué papel cumplen NAT, firewalls, proxies y balanceadores de carga en una arquitectura en la nube.

## Lo esencial

- **HTTP** es el protocolo de la web: el cliente envía una **petición** (método, ruta, cabeceras, cuerpo) y el servidor devuelve una **respuesta** con un **código de estado**.
- **HTTPS** es HTTP cifrado con **TLS**; el certificado demuestra que el servidor es quien dice ser.
- Un **firewall** decide qué tráfico entra o sale; **NAT** permite que máquinas privadas salgan a internet sin ser alcanzables desde fuera.
- Un **proxy inverso** recibe el tráfico y lo reenvía a tu app (Nginx); un **balanceador de carga** lo reparte entre varios servidores.
- En AWS: Security Groups (firewall), NAT Gateway (NAT), Application Load Balancer (balanceo HTTP) y Certificate Manager (certificados gratis).

## Explicación

### Una petición y una respuesta HTTP

```text
GET /api/temas?fase=cl-f1 HTTP/1.1
Host: api.learnai.co
Authorization: Bearer eyJhbGciOi...
Accept: application/json
```

```text
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: max-age=60

[{"id":"cl-f1-t1","titulo":"Archivos, permisos y usuarios"}]
```

| Familia de códigos | Significado | Ejemplos |
| --- | --- | --- |
| 2xx | Éxito | 200 OK, 201 Created, 204 No Content |
| 3xx | Redirección | 301 Moved Permanently, 302 Found |
| 4xx | Error del cliente | 400 Bad Request, 401 sin autenticar, 403 prohibido, 404 no existe, 429 demasiadas peticiones |
| 5xx | Error del servidor | 500 error interno, 502 Bad Gateway, 503 no disponible, 504 Gateway Timeout |

Los **502 y 504** aparecen mucho en la nube: el balanceador o el proxy no pudo hablar con tu app (caída, puerto equivocado o respuesta demasiado lenta).

### TLS y certificados

1. El navegador se conecta y el servidor presenta su **certificado**, firmado por una autoridad confiable.
2. El navegador verifica que el certificado es válido, no ha vencido y corresponde al dominio.
3. Acuerdan llaves de cifrado y desde ahí todo viaja cifrado.

Certificados gratis: **Let's Encrypt** (para tu servidor, con renovación automática con Certbot) y **AWS Certificate Manager** (para balanceadores y CloudFront, renovación automática).

### La arquitectura típica

![El usuario llega por internet a un balanceador de carga con el certificado TLS; un firewall solo deja pasar los puertos 80 y 443; el balanceador reparte el tráfico entre dos servidores de aplicación en una red privada; estos salen a internet para actualizaciones a través de un NAT, pero nadie puede entrar a ellos directamente](img/cl-f1-t10-arquitectura.svg)

*El usuario solo ve el balanceador. Los servidores quedan en la red privada.*

| Pieza | Qué hace | En AWS |
| --- | --- | --- |
| Firewall | Permite o bloquea tráfico por IP, puerto y protocolo | Security Groups, Network ACLs |
| Balanceador de carga | Reparte peticiones y revisa la salud de cada servidor | Application Load Balancer (capa 7), Network Load Balancer (capa 4) |
| Terminación TLS | Descifra HTTPS en el balanceador | Certificado de ACM en el ALB |
| Proxy inverso | Recibe y reenvía a la app, sirve archivos estáticos | Nginx en la instancia |
| NAT | Salida a internet para máquinas privadas | NAT Gateway |

## Ejemplo práctico

Ver solo las cabeceras de respuesta de un sitio:

```bash
curl -I https://aws.amazon.com
```

Fragmento de salida de ejemplo:

```text
HTTP/2 200
content-type: text/html;charset=UTF-8
server: Server
x-cache: Hit from cloudfront
```

`x-cache: Hit from cloudfront` indica que la respuesta salió de la caché de una ubicación de borde (fase 0).

Revisar el certificado y su vencimiento:

```bash
echo | openssl s_client -connect aws.amazon.com:443 -servername aws.amazon.com 2>/dev/null \
  | openssl x509 -noout -subject -enddate
```

Salida de ejemplo (las fechas serán otras):

```text
subject=CN=aws.amazon.com
notAfter=Jun 14 23:59:59 2027 GMT
```

## Errores comunes

1. **Certificados vencidos.** Usa certificados con renovación automática (ACM o Certbot) y alertas.
2. **Servidores de aplicación con IP pública** cuando todo el tráfico debería pasar por el balanceador.
3. **Health check apuntando a una ruta que no existe.** El balanceador marca todos los servidores como caídos y responde 503.
4. **Confundir 401 y 403.** 401: no te identificaste; 403: te identificaste pero no tienes permiso.

## Práctica (20 minutos)

1. Con `curl -I`, revisa tres sitios y anota código de estado y servidor.
2. Usa `curl -v https://example.com` y encuentra en la salida la negociación TLS y la petición HTTP.
3. Configura Nginx como proxy inverso hacia `python3 -m http.server 8000` (directiva `proxy_pass http://127.0.0.1:8000;`).
4. Explica con tus palabras por qué los servidores de la imagen están en una red privada.

## Repaso

1. ¿Qué significan los códigos 401, 403 y 502?
2. ¿Qué demuestra un certificado TLS?
3. ¿Para qué sirve un NAT en una red privada?
4. ¿Qué diferencia hay entre un proxy inverso y un balanceador de carga?

## Respuestas

1. 401: falta autenticación; 403: sin permiso; 502: el proxy o balanceador recibió una respuesta inválida o no pudo conectar con la app.
2. Que el servidor es dueño del dominio al que te conectas, verificado por una autoridad confiable.
3. Para que los servidores privados salgan a internet sin que nadie pueda iniciar conexiones hacia ellos.
4. El proxy reenvía tráfico a una app (y puede hacer más cosas, como servir estáticos); el balanceador reparte el tráfico entre varios servidores y revisa su salud.

## Para profundizar

- [MDN: resumen de HTTP](https://developer.mozilla.org/es/docs/Web/HTTP/Overview)
- [MDN: códigos de estado HTTP](https://developer.mozilla.org/es/docs/Web/HTTP/Status)
- [AWS: ¿qué es un Application Load Balancer?](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/introduction.html)
