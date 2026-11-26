---
id: cl-f0-t4
track: cloud
phase: cl-f0
title: Responsabilidad compartida
minutes: 25
updated: 2026-11-24
---

## Objetivo

Saber exactamente qué protege AWS y qué te toca proteger a ti, para no dejar huecos de seguridad.

## Lo esencial

- AWS es responsable de la **seguridad DE la nube**: edificios, hardware, red física y la capa de virtualización.
- Tú eres responsable de la **seguridad EN la nube**: tus datos, quién tiene acceso, la configuración de red, el cifrado y el sistema operativo si usas máquinas virtuales.
- Tu parte cambia según el servicio: más trabajo en IaaS (EC2), menos en servicios administrados (RDS, S3, Lambda).
- Casi todos los incidentes en la nube vienen de la parte del cliente: buckets públicos, contraseñas débiles, llaves filtradas.

## Explicación

![Dos bloques: arriba lo que proteges tú (datos, permisos, redes, sistema operativo y configuración); abajo lo que protege AWS (centros de datos, hardware, virtualización y software administrado); al pie, una flecha que muestra que tu trabajo disminuye de EC2 a RDS y a S3 o Lambda](img/cl-f0-t4-responsabilidad.svg)

*La línea entre los dos bloques se mueve según el servicio, pero tus datos y tus permisos siempre son tuyos.*

### Las dos mitades

| AWS protege (DE la nube) | Tú proteges (EN la nube) |
| --- | --- |
| Centros de datos, guardias y acceso físico | Tus datos y su clasificación |
| Servidores, discos y equipos de red | Usuarios, roles y permisos (IAM) |
| Red global y regiones | Configuración de redes y firewalls (Security Groups) |
| Virtualización que aísla a los clientes | Cifrado de datos y manejo de llaves |
| Software de los servicios administrados | Sistema operativo y parches en tus EC2 |
| | Configuración de cada servicio (por ejemplo, si un bucket es público) |

### Cómo cambia según el servicio

| Tarea | EC2 (IaaS) | RDS (administrado) | S3 / Lambda (serverless) |
| --- | --- | --- | --- |
| Parchear el sistema operativo | Tú | AWS | AWS |
| Actualizar el motor de base de datos | Tú | AWS (tú eliges cuándo) | No aplica |
| Respaldos | Tú | AWS los automatiza, tú configuras | Tú configuras versionado |
| Firewall de red | Tú | Tú | Tú (políticas de acceso) |
| Permisos de quién accede | Tú | Tú | Tú |
| Cifrado de datos | Tú lo activas | Tú lo activas | Tú lo eliges (S3 cifra por defecto) |

Regla práctica: **entre más administrado el servicio, menos tareas tienes, pero los permisos y los datos siempre son tuyos.**

### Los incidentes típicos son del lado del cliente

1. Un bucket de S3 con datos de clientes queda público.
2. Una llave de acceso de AWS se sube por error a GitHub y alguien la usa para crear servidores de minería.
3. Un servidor con el puerto de base de datos abierto a todo internet.
4. Un usuario administrador sin MFA al que le roban la contraseña.

Ninguno de estos es una falla de AWS. Todos se evitan con buenas prácticas que verás en las fases 2, 5 y 10.

## Ejemplo práctico

S3 tiene una protección a nivel de cuenta que bloquea el acceso público. Con la CLI puedes revisar si está activa (fase 2 en adelante):

```bash
aws s3control get-public-access-block --account-id 123456789012
```

Salida esperada si está bien configurada:

```json
{
    "PublicAccessBlockConfiguration": {
        "BlockPublicAcls": true,
        "IgnorePublicAcls": true,
        "BlockPublicPolicy": true,
        "RestrictPublicBuckets": true
    }
}
```

Si ves algún valor en `false`, o un error que dice que no existe la configuración, tu cuenta permite que alguien haga público un bucket.

## Errores comunes

1. **Pensar "está en AWS, entonces está seguro".** AWS asegura la infraestructura, no tus decisiones de configuración.
2. **Dejar puertos abiertos "para probar".** Lo que se abre para probar casi siempre se queda abierto.
3. **Usar el usuario raíz para todo.** Si se compromete, el atacante controla la cuenta entera.

## Práctica (15 minutos)

1. Para cada caso, di si es responsabilidad de AWS o tuya: (a) cambiar un disco dañado en un centro de datos; (b) parchear Ubuntu en una EC2; (c) decidir quién puede leer un bucket; (d) aplicar un parche al motor de PostgreSQL en RDS; (e) activar MFA.
2. Revisa la lista de incidentes típicos y escribe, para cada uno, qué práctica lo habría evitado.

## Repaso

1. ¿Qué significa "seguridad DE la nube" y "seguridad EN la nube"?
2. ¿Quién parchea el sistema operativo en EC2? ¿Y en RDS?
3. ¿Qué responsabilidad mantienes en todos los servicios?
4. ¿De qué lado vienen la mayoría de incidentes?

## Respuestas

1. DE la nube: lo que AWS protege (infraestructura física, red, virtualización). EN la nube: lo que proteges tú (datos, accesos, configuración).
2. En EC2 lo haces tú; en RDS lo hace AWS.
3. Los datos y los permisos de acceso.
4. Del lado del cliente, por configuraciones incorrectas.

## Para profundizar

- [AWS: modelo de responsabilidad compartida](https://aws.amazon.com/compliance/shared-responsibility-model/)
- [AWS: bloquear acceso público en S3](https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-control-block-public-access.html)
