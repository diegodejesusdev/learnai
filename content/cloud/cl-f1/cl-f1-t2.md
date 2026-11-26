---
id: cl-f1-t2
track: cloud
phase: cl-f1
title: Procesos, servicios y logs
minutes: 30
updated: 2026-11-26
---

## Objetivo

Ver qué está corriendo en un servidor, controlar servicios con systemd y leer logs para entender por qué algo falla.

## Lo esencial

- Un **proceso** es un programa en ejecución, con un número único (PID).
- Un **servicio** es un proceso que corre en segundo plano y arranca solo con el sistema (Nginx, SSH, una API).
- **systemd** administra los servicios con `systemctl` (iniciar, detener, reiniciar, habilitar al arrancar).
- **journalctl** muestra los logs de los servicios de systemd; muchas apps también escriben en `/var/log`.
- Cuando algo falla en un servidor, el orden es: ¿el servicio está corriendo? → ¿qué dicen los logs?

## Explicación

### Procesos

| Comando | Qué hace |
| --- | --- |
| `ps aux` | Lista todos los procesos |
| `ps aux \| grep nginx` | Busca un proceso por nombre |
| `top` o `htop` | Procesos en vivo, ordenados por uso de CPU |
| `kill PID` | Pide a un proceso que termine |
| `kill -9 PID` | Lo termina a la fuerza (último recurso) |

### Servicios con systemd

| Comando | Qué hace |
| --- | --- |
| `systemctl status nginx` | Estado del servicio y últimas líneas de log |
| `sudo systemctl start nginx` | Lo inicia |
| `sudo systemctl stop nginx` | Lo detiene |
| `sudo systemctl restart nginx` | Lo reinicia (después de cambiar la configuración) |
| `sudo systemctl enable nginx` | Lo activa al arrancar el servidor |
| `systemctl list-units --type=service --state=failed` | Servicios que fallaron |

**start** y **enable** son distintos: `start` lo enciende ahora; `enable` hace que arranque solo después de un reinicio. En la nube los servidores se reinician, así que normalmente quieres los dos (`sudo systemctl enable --now nginx`).

### Crear tu propio servicio

Para que una API en Python arranque sola y se reinicie si se cae, se crea un archivo de unidad en `/etc/systemd/system/miapi.service`:

```ini
[Unit]
Description=Mi API de ejemplo
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/miapi
ExecStart=/home/ubuntu/miapi/.venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

Después: `sudo systemctl daemon-reload` y `sudo systemctl enable --now miapi`.

### Logs

| Comando | Qué muestra |
| --- | --- |
| `journalctl -u nginx` | Todos los logs de un servicio |
| `journalctl -u nginx -f` | Los sigue en vivo |
| `journalctl -u nginx --since "1 hour ago"` | Solo la última hora |
| `journalctl -p err -b` | Errores desde el último arranque |
| `tail -f /var/log/nginx/error.log` | Log de errores de Nginx en vivo |

En la fase 9 enviarás estos logs a CloudWatch para verlos sin entrar al servidor.

## Ejemplo práctico

Revisar el estado de SSH (siempre está instalado en un servidor de nube):

```bash
systemctl status ssh
```

Salida esperada (resumida):

```text
● ssh.service - OpenBSD Secure Shell server
     Loaded: loaded (/usr/lib/systemd/system/ssh.service; enabled; preset: enabled)
     Active: active (running) since Thu 2026-11-26 09:02:11 UTC; 1h 28min ago
   Main PID: 812 (sshd)
```

Las tres líneas clave: `enabled` (arranca solo), `active (running)` (está corriendo) y el PID.

Ver los últimos 3 intentos de conexión por SSH:

```bash
journalctl -u ssh -n 3 --no-pager
```

Salida de ejemplo:

```text
Nov 26 10:21:04 web-1 sshd[1290]: Accepted publickey for ubuntu from 181.53.10.24 port 52114 ssh2
Nov 26 10:24:47 web-1 sshd[1302]: Invalid user admin from 45.88.12.9 port 40122
Nov 26 10:24:48 web-1 sshd[1302]: Connection closed by invalid user admin 45.88.12.9 port 40122
```

La segunda y tercera línea son un bot probando usuarios: pasa en cualquier servidor con SSH abierto a internet. Lo resolverás en las fases 3 y 5 (Session Manager y Security Groups).

## Errores comunes

1. **Cambiar la configuración y no reiniciar el servicio.** El cambio no se aplica hasta `restart` o `reload`.
2. **Iniciar un servicio pero no habilitarlo.** Funciona hasta el próximo reinicio y luego desaparece.
3. **Usar `kill -9` primero.** No deja al proceso cerrar archivos ni conexiones. Úsalo solo si `kill` no funciona.
4. **No leer el log antes de buscar en internet.** El log casi siempre dice exactamente qué falló.

## Práctica (20 minutos)

1. Instala Nginx (`sudo apt install nginx`), revisa su estado y abre `http://localhost`.
2. Detén el servicio, comprueba que la página ya no carga, y vuelve a iniciarlo.
3. Rompe a propósito la configuración (agrega una línea inválida en `/etc/nginx/sites-enabled/default`), ejecuta `sudo nginx -t` y lee el error. Arréglalo.
4. Busca con `journalctl` los mensajes de Nginx de la última hora.

## Repaso

1. ¿Qué diferencia hay entre `systemctl start` y `systemctl enable`?
2. ¿Qué comando usarías para ver en vivo los logs de un servicio?
3. ¿Por qué no conviene usar `kill -9` de primeras?
4. ¿Qué tienes que hacer después de crear o editar un archivo `.service`?

## Respuestas

1. `start` lo inicia ahora; `enable` hace que arranque automáticamente al encender el servidor.
2. `journalctl -u nombre -f`.
3. Porque termina el proceso sin dejarlo cerrar archivos y conexiones de forma ordenada.
4. Ejecutar `sudo systemctl daemon-reload` y luego reiniciar o habilitar el servicio.

## Para profundizar

- [DigitalOcean: cómo usar systemctl](https://www.digitalocean.com/community/tutorials/how-to-use-systemctl-to-manage-systemd-services-and-units)
- [Manual de journalctl](https://www.freedesktop.org/software/systemd/man/latest/journalctl.html)
