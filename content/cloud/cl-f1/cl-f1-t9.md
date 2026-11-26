---
id: cl-f1-t9
track: cloud
phase: cl-f1
title: DNS
minutes: 35
updated: 2026-11-26
---

## Objetivo

Entender cómo un nombre como `www.learnai.co` se convierte en una IP, qué tipos de registros existen y cómo diagnosticar problemas de DNS.

## Lo esencial

- **DNS** es la "guía telefónica" de internet: traduce nombres de dominio a direcciones IP.
- La resolución pasa por un **resolvedor** y una cadena de servidores: raíz → dominio de nivel superior (`.co`) → servidor **autoritativo** del dominio.
- Registros clave: **A** (nombre → IPv4), **AAAA** (→ IPv6), **CNAME** (alias a otro nombre), **MX** (correo), **TXT** (verificaciones y seguridad del correo), **NS** (quién administra la zona).
- Las respuestas se guardan en caché durante el **TTL**; por eso un cambio de DNS puede tardar en verse.
- En AWS, el servicio de DNS es **Route 53**.

## Explicación

### Cómo se resuelve un nombre

![El navegador pregunta al resolvedor por www.learnai.co; el resolvedor pregunta a un servidor raíz, que lo remite al servidor de .co, que lo remite al servidor autoritativo de learnai.co, que responde con la IP; el resolvedor la guarda en caché y se la entrega al navegador](img/cl-f1-t9-dns.svg)

*La primera consulta recorre toda la cadena; las siguientes salen de la caché hasta que vence el TTL.*

### Tipos de registro

| Tipo | Para qué | Ejemplo |
| --- | --- | --- |
| A | Nombre → IPv4 | `api.learnai.co → 203.0.113.10` |
| AAAA | Nombre → IPv6 | `api.learnai.co → 2001:db8::10` |
| CNAME | Alias de otro nombre | `www.learnai.co → learnai.vercel.app` |
| MX | Servidor de correo del dominio | `learnai.co → 10 mail.proveedor.com` |
| TXT | Texto: verificación, SPF, DKIM, DMARC | `"v=spf1 include:_spf.google.com ~all"` |
| NS | Servidores autoritativos de la zona | `learnai.co → ns-123.awsdns-15.com` |

Regla: un **CNAME no puede ir en el dominio raíz** (`learnai.co`, sin `www`). Route 53 resuelve esto con registros **Alias**, que apuntan el dominio raíz a un balanceador o a CloudFront.

### TTL: el tiempo en caché

Cada registro tiene un TTL en segundos. Con TTL de 3600, los resolvedores guardan la respuesta una hora.

- Antes de una migración, baja el TTL (por ejemplo, a 60) un día antes.
- Haz el cambio.
- Cuando todo esté estable, súbelo de nuevo.

### Dominio, registrador y zona

1. **Registrador:** donde compras el dominio (para `.co`, cualquier registrador acreditado; también Route 53).
2. **Zona hospedada:** donde defines los registros. Puede estar en el mismo registrador o en Route 53.
3. Para usar Route 53 con un dominio comprado en otro lado, cambias los registros **NS** en el registrador por los que te da Route 53.

### DNS privado

Dentro de una VPC, AWS ofrece un resolvedor en la segunda IP de la red (la `.2`) y permite **zonas privadas** de Route 53, por ejemplo `db.interno`, que solo se resuelven dentro de la VPC.

## Ejemplo práctico

Consultar el registro A de un dominio:

```bash
dig +short aws.amazon.com
```

Salida ilustrativa (los nombres y las IPs reales serán otros; lo importante es el formato: primero los CNAME, que terminan en punto, y al final las IPs):

```text
tp.8e49140c2-frontier.amazon.com.
dr49lng3n1n2s.cloudfront.net.
18.164.96.31
18.164.96.96
```

Ver la respuesta completa con TTL (en esta lección `learnai.co` es un dominio de ejemplo):

```bash
dig learnai.co A
```

Fragmento de salida de ejemplo:

```text
;; ANSWER SECTION:
learnai.co.        300     IN      A       203.0.113.10
```

El `300` es el TTL: esa respuesta se reutilizará durante 5 minutos.

Ver los servidores de correo de un dominio:

```bash
dig +short MX gmail.com
```

```text
5 gmail-smtp-in.l.google.com.
10 alt1.gmail-smtp-in.l.google.com.
```

(La lista real puede tener más líneas.)

## Errores comunes

1. **"Cambié el DNS y no funciona."** Probablemente es caché. Espera el TTL o consulta otro resolvedor: `dig @1.1.1.1 dominio`.
2. **CNAME en el dominio raíz.** No está permitido; usa un registro Alias en Route 53 o el tipo equivalente de tu proveedor.
3. **Olvidar cambiar los NS en el registrador** al pasar la zona a Route 53.
4. **Borrar registros TXT de verificación.** Rompen el correo (SPF, DKIM) o la verificación de servicios.

## Práctica (20 minutos)

1. Con `dig`, consulta los registros A, MX, NS y TXT de un dominio conocido y explica cada uno.
2. Compara la respuesta de `dig @8.8.8.8` y `dig @1.1.1.1` para el mismo dominio.
3. Usa `dig +trace www.google.com` y relaciona la salida con los pasos de la imagen.
4. Diseña los registros que necesitaría LearnAI: dominio raíz y `www` apuntando a Vercel, `api` a un balanceador de AWS y el correo en Google Workspace.

## Repaso

1. ¿Qué hace un registro CNAME?
2. ¿Qué es el TTL y por qué se baja antes de una migración?
3. ¿Qué registro indica el servidor de correo de un dominio?
4. ¿Qué servicio de AWS administra DNS?

## Respuestas

1. Hace que un nombre sea alias de otro nombre.
2. El tiempo que la respuesta queda en caché; se baja para que el cambio se propague rápido.
3. El registro MX.
4. Amazon Route 53.

## Para profundizar

- [Cloudflare: ¿qué es DNS?](https://www.cloudflare.com/es-es/learning/dns/what-is-dns/)
- [AWS: tipos de registro en Route 53](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/ResourceRecordTypes.html)
- [AWS: elegir entre Alias y CNAME](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resource-record-sets-choosing-alias-non-alias.html)
