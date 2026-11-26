---
id: cl-f1-t6
track: cloud
phase: cl-f1
title: Diagnóstico de servidor
minutes: 30
updated: 2026-11-26
---

## Objetivo

Revisar en pocos minutos si un servidor tiene problemas de CPU, memoria, disco o red, siguiendo un orden fijo.

## Lo esencial

- Ante "el servidor está lento" o "la app no responde", revisa en este orden: **CPU → memoria → disco → red → logs**.
- `uptime` y `top` para CPU, `free -h` para memoria, `df -h` y `du` para disco, `ss` y `curl` para red.
- Un **disco lleno** es una de las causas más comunes de caídas, y casi siempre son logs.
- La **carga promedio** (load average) se compara con el número de CPUs.
- En la nube, estos mismos datos los verás después como métricas en CloudWatch.

## Explicación

### La lista de chequeo

| Paso | Comando | Qué buscas |
| --- | --- | --- |
| 1. Carga general | `uptime` | Load average mayor que el número de CPUs (`nproc`) |
| 2. CPU y procesos | `top` (tecla `P` ordena por CPU, `M` por memoria) | Un proceso consumiendo 100% |
| 3. Memoria | `free -h` | Poca memoria `available` y swap en uso |
| 4. Disco | `df -h` | Particiones al 90% o más |
| 5. Qué llena el disco | `sudo du -sh /var/log/* \| sort -h \| tail` | Carpetas o logs gigantes |
| 6. Puertos | `sudo ss -tlnp` | ¿Tu app está escuchando en el puerto esperado? |
| 7. Respuesta de la app | `curl -I http://localhost:8000` | ¿Responde? ¿Con qué código? |
| 8. Logs | `journalctl -u miapi -n 50` | El error exacto |

### Cómo leer la carga promedio

`uptime` muestra tres números: el promedio de procesos esperando CPU en el último minuto, 5 y 15 minutos. En un servidor de 2 CPUs:

- Carga 0,5: tranquilo.
- Carga 2: usando el 100%.
- Carga 6: hay procesos haciendo fila; el servidor se siente lento.

### Memoria: "free" no es lo que parece

Linux usa la memoria libre como caché de disco, así que `free` casi siempre se ve baja. La columna que importa es **available**: lo que realmente pueden usar los programas. Si `available` es muy baja y el **swap** está en uso, el servidor se pone lento; si se agota, el sistema mata procesos (OOM killer) y lo verás en `journalctl -k`.

### Disco

`df -h` dice cuánto espacio hay por partición; `du` dice qué ocupa el espacio. Lo típico: logs que nunca se rotan, respaldos viejos, imágenes de Docker sin usar (`docker system df`).

## Ejemplo práctico

```bash
uptime
nproc
free -h
df -h /
```

Salida de ejemplo en una máquina con 2 CPUs y 1 GB de memoria:

```text
 10:42:07 up 3 days,  2:11,  1 user,  load average: 3.84, 3.20, 1.10
2
               total        used        free      shared  buff/cache   available
Mem:           957Mi       812Mi        48Mi       2.0Mi       245Mi        92Mi
Swap:             0B          0B          0B
Filesystem      Size  Used Avail Use% Mounted on
/dev/root       7.6G  7.5G   92M  99% /
```

Diagnóstico:

1. **Carga 3,84 con 2 CPUs:** hay más trabajo del que el servidor puede hacer, y empezó hace poco (la de 15 minutos es 1,10).
2. **Solo 92 MB disponibles de memoria** y sin swap: riesgo de que el sistema mate procesos.
3. **Disco al 99%:** urgente. Las apps fallan al no poder escribir.

Siguiente paso: buscar qué llena el disco.

```bash
sudo du -sh /var/log/* | sort -h | tail -3
```

```text
48M     /var/log/journal
1.2G    /var/log/nginx
5.1G    /var/log/miapi
```

La app escribe logs sin rotarlos. Solución inmediata: comprimir o borrar logs viejos; solución de fondo: configurar `logrotate` o enviar logs a CloudWatch con retención.

## Errores comunes

1. **Reiniciar sin mirar.** Se arregla un rato y pierdes la pista de la causa.
2. **Leer la columna `free` en vez de `available`.** Te alarmas sin razón.
3. **Ignorar el disco.** "La app no responde" muchas veces es "el disco está lleno".
4. **Elegir una instancia muy pequeña para ahorrar.** Si la carga siempre está alta, el tamaño no alcanza (rightsizing, fase 11).

## Práctica (20 minutos)

1. Ejecuta los comandos de la lista de chequeo en tu máquina o VM y anota los valores.
2. Genera carga con `yes > /dev/null &` (dos veces), observa `uptime` y `top`, y luego detén los procesos con `kill`.
3. Busca las tres carpetas más grandes dentro de `/var`.
4. Escribe un script `chequeo.sh` que imprima carga, memoria disponible y uso de disco de `/` en tres líneas.

## Repaso

1. ¿En qué orden revisarías un servidor lento?
2. Un servidor de 4 CPUs tiene carga 8. ¿Qué significa?
3. ¿Qué columna de `free -h` indica la memoria realmente utilizable?
4. ¿Cuál es una causa frecuente de disco lleno?

## Respuestas

1. CPU, memoria, disco, red y luego logs.
2. Que tiene el doble del trabajo que puede procesar: hay procesos esperando.
3. `available`.
4. Logs que nunca se rotan ni se borran.

## Para profundizar

- [Brendan Gregg: análisis de rendimiento de Linux en 60 segundos](https://www.brendangregg.com/Articles/Netflix_Linux_Perf_Analysis_60s.pdf)
- [Ubuntu: configurar logrotate](https://manpages.ubuntu.com/manpages/noble/man8/logrotate.8.html)
