---
id: cl-f1-t11
track: cloud
phase: cl-f1
title: Herramientas de red
minutes: 30
updated: 2026-11-26
---

## Objetivo

Diagnosticar problemas de conexión con ping, traceroute, dig, nslookup, curl y nc, siguiendo un orden de capa en capa.

## Lo esencial

- Diagnostica **de abajo hacia arriba**: ¿resuelve el nombre? → ¿llego a la IP? → ¿el puerto está abierto? → ¿la app responde bien?
- `dig` o `nslookup` para DNS, `ping` y `traceroute` para alcance, `nc` para puertos, `curl` para HTTP.
- Que `ping` no responda **no** significa que el servidor esté caído: muchos firewalls bloquean ICMP (y en AWS está bloqueado por defecto).
- Un **timeout** suele ser un firewall que descarta el tráfico; un **connection refused** significa que llegaste pero nada escucha en ese puerto.

## Explicación

### El método de las cuatro preguntas

| Pregunta | Herramienta | Si falla, sospecha de |
| --- | --- | --- |
| 1. ¿El nombre resuelve a la IP correcta? | `dig +short dominio` | DNS: registro mal puesto o caché |
| 2. ¿Llego a esa IP? | `ping`, `traceroute` | Rutas, IP equivocada, ICMP bloqueado |
| 3. ¿El puerto está abierto? | `nc -zv ip puerto` | Firewall, Security Group, app sin escuchar |
| 4. ¿La app responde bien? | `curl -v https://dominio/ruta` | La app: errores, certificados, rutas |

### Timeout frente a connection refused

| Mensaje | Qué pasó | Causa típica en AWS |
| --- | --- | --- |
| `Connection timed out` | Los paquetes se perdieron sin respuesta | El Security Group o la NACL no permite el puerto |
| `Connection refused` | El servidor respondió "aquí no hay nadie" | La app está caída o escucha en otro puerto o en 127.0.0.1 |
| `Could not resolve host` | No se encontró el nombre | DNS mal configurado o nombre mal escrito |
| `SSL certificate problem` | Certificado inválido o vencido | Certificado de otro dominio, vencido o autofirmado |

### Herramientas

| Herramienta | Ejemplo | Para qué |
| --- | --- | --- |
| `ping` | `ping -c 4 8.8.8.8` | ¿Hay conectividad y cuánta latencia? |
| `traceroute` / `tracepath` | `traceroute aws.amazon.com` | Por dónde pasa el tráfico y dónde se corta |
| `mtr` | `mtr -rwc 20 dominio` | ping y traceroute combinados, con pérdida por salto |
| `dig` / `nslookup` | `nslookup learnai.co` | Resolver nombres |
| `nc` | `nc -zv 10.0.1.25 5432` | Probar si un puerto TCP está abierto |
| `curl` | `curl -sv https://dominio` | Probar HTTP/HTTPS con todo el detalle |
| `ss` | `sudo ss -tlnp` | Qué escucha en la máquina local |
| `ip` | `ip addr`, `ip route` | IPs de la máquina y su ruta por defecto |

## Ejemplo práctico

Una API en `api.learnai.co` (dominio de ejemplo) no responde. Recorremos las cuatro preguntas:

```bash
dig +short api.learnai.co
```

```text
203.0.113.10
```

El nombre resuelve. Paso 2, ping:

```bash
ping -c 2 203.0.113.10
```

```text
PING 203.0.113.10 (203.0.113.10) 56(84) bytes of data.

--- 203.0.113.10 ping statistics ---
2 packets transmitted, 0 received, 100% packet loss, time 1012ms
```

No responde, pero puede ser ICMP bloqueado. Pasamos al puerto:

```bash
nc -zv -w 5 203.0.113.10 443
```

```text
nc: connect to 203.0.113.10 port 443 (tcp) timed out: Operation now in progress
```

**Timeout** en el 443: lo más probable es que el Security Group no permita HTTPS. Después de agregar la regla de entrada para el puerto 443:

```bash
nc -zv -w 5 203.0.113.10 443
curl -s -o /dev/null -w "%{http_code}\n" https://api.learnai.co/salud
```

```text
Connection to 203.0.113.10 443 port [tcp/https] succeeded!
200
```

Problema resuelto en el paso 3: era el firewall, no la app.

## Errores comunes

1. **Concluir "está caído" porque no responde ping.** Prueba el puerto real con `nc` o `curl`.
2. **Saltar directo a la app.** Si el DNS apunta a la IP vieja, todo lo demás da igual.
3. **Ignorar la diferencia entre timeout y refused.** Cada uno apunta a un culpable distinto.
4. **Probar desde el mismo servidor.** `curl localhost` puede funcionar aunque desde fuera esté bloqueado; prueba desde fuera también.

## Práctica (20 minutos)

1. Ejecuta las cuatro preguntas contra un sitio conocido y anota cada resultado.
2. Levanta `python3 -m http.server 8000` y prueba `nc -zv 127.0.0.1 8000`; detén el servidor y prueba de nuevo: observa el `refused`.
3. Usa `traceroute` (o `tracert` en Windows) hacia `aws.amazon.com` y cuenta los saltos.
4. Escribe en una tabla qué harías si recibes cada uno de los cuatro mensajes de error.

## Repaso

1. ¿En qué orden diagnosticarías un servicio que no responde?
2. ¿Qué diferencia hay entre timeout y connection refused?
3. ¿Por qué ping no es suficiente para saber si un servidor está caído?
4. ¿Qué herramienta usas para probar si un puerto TCP está abierto?

## Respuestas

1. DNS, alcance a la IP, puerto abierto y respuesta de la app.
2. Timeout: el tráfico se pierde (normalmente un firewall). Refused: llegaste, pero nada escucha en ese puerto.
3. Porque muchos firewalls, incluidos los Security Groups por defecto, bloquean ICMP.
4. `nc -zv` (o `curl` si es HTTP).

## Para profundizar

- [AWS: solucionar problemas de conexión a una instancia](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/TroubleshootingInstancesConnecting.html)
- [Julia Evans: zines de redes](https://wizardzines.com/zines/networking/)
