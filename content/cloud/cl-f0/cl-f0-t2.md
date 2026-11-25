---
id: cl-f0-t2
track: cloud
phase: cl-f0
title: Modelos de servicio
minutes: 25
updated: 2026-11-24
---

## Objetivo

Distinguir IaaS, PaaS, SaaS y serverless, y saber qué administras tú y qué el proveedor en cada uno.

## Lo esencial

- **IaaS:** te dan la infraestructura (máquinas, discos, redes). Tú instalas y mantienes todo lo demás.
- **PaaS:** te dan una plataforma lista para subir tu código. Tú te ocupas de la app y los datos.
- **SaaS:** te dan el software terminado. Tú solo lo usas y configuras.
- **Serverless:** subes funciones o contenedores y pagas por ejecución; no ves servidores.
- Entre más arriba subes, menos controlas y menos mantienes.

## Explicación

### La analogía de la pizza

| Modelo | Analogía | Qué haces tú |
| --- | --- | --- |
| Servidores propios | Haces la pizza en tu casa | Todo: ingredientes, horno, mesa |
| IaaS | Alquilas una cocina equipada | Cocinas y sirves |
| PaaS | Pides a domicilio | Pones la mesa |
| SaaS | Vas al restaurante | Solo comes |

### Qué administras en cada modelo

| Capa | Servidor propio | IaaS | PaaS | SaaS |
| --- | --- | --- | --- | --- |
| Datos y accesos | Tú | Tú | Tú | Tú (configuración) |
| Aplicación | Tú | Tú | Tú | Proveedor |
| Runtime (Python, Java) | Tú | Tú | Proveedor | Proveedor |
| Sistema operativo | Tú | Tú | Proveedor | Proveedor |
| Virtualización | Tú | Proveedor | Proveedor | Proveedor |
| Servidores, red, edificio | Tú | Proveedor | Proveedor | Proveedor |

Fíjate en la primera fila: **tus datos y quién puede verlos siempre son tu responsabilidad**, incluso en SaaS.

### Ejemplos en AWS y fuera de AWS

| Modelo | AWS | Otros ejemplos |
| --- | --- | --- |
| IaaS | EC2 (máquinas virtuales), EBS (discos), VPC (redes) | Azure Virtual Machines, Google Compute Engine |
| PaaS | Elastic Beanstalk, App Runner, RDS (base de datos administrada) | Azure App Service, Heroku |
| SaaS | Amazon WorkMail, Amazon QuickSight | Gmail, Microsoft 365, Siigo, HubSpot |
| Serverless | Lambda, DynamoDB, S3, API Gateway | Azure Functions, Google Cloud Run |

### Serverless no significa "sin servidores"

Los servidores existen, pero no los ves ni los administras. Lo que cambia:

1. No eliges tamaño de máquina ni sistema operativo.
2. Escala solo, desde cero hasta miles de ejecuciones.
3. Pagas por solicitud y tiempo de ejecución, no por hora encendida.
4. Tiene límites: por ejemplo, una función de Lambda puede correr como máximo 15 minutos.

### Cómo elegir

- **IaaS** cuando necesitas control total (software especial, configuración del sistema operativo).
- **PaaS** cuando quieres desplegar rápido una app web o una base de datos sin administrarla.
- **SaaS** cuando el problema ya está resuelto por un producto (correo, CRM, contabilidad).
- **Serverless** para tráfico irregular, tareas cortas o automatizaciones que se disparan por eventos.

## Ejemplo práctico

Mismo objetivo, tres modelos: tener una base de datos PostgreSQL.

1. **IaaS:** creas una máquina EC2, instalas PostgreSQL, configuras respaldos, aplicas parches de seguridad cada mes y vigilas el disco.
2. **PaaS:** creas una base en RDS. AWS instala, parchea y respalda; tú defines tablas, usuarios y quién se conecta.
3. **Serverless:** usas Aurora Serverless, que además ajusta su capacidad sola según la carga.

Con la CLI (fase 2 en adelante) puedes ver las versiones de PostgreSQL que ofrece RDS:

```bash
aws rds describe-db-engine-versions --engine postgres \
  --query "DBEngineVersions[-3:].EngineVersion" --output text
```

Salida de ejemplo (al ejecutarlo verás las tres versiones más recientes vigentes ese día):

```text
17.4    17.5    17.6
```

## Errores comunes

1. **Creer que en SaaS la seguridad es 100% del proveedor.** Si das acceso de administrador a todo el mundo en tu CRM, el problema es tuyo.
2. **Elegir IaaS por costumbre.** Muchas veces un servicio administrado ahorra horas de mantenimiento que valen más que la diferencia de precio.
3. **Usar serverless para todo.** Procesos largos o con tráfico alto y constante pueden salir más caros que un servidor.

## Práctica (15 minutos)

1. Clasifica estas herramientas en IaaS, PaaS, SaaS o serverless: Google Drive, EC2, Lambda, WhatsApp Business, RDS, Supabase, Vercel, n8n Cloud.
2. Para tu app LearnAI, escribe qué partes son SaaS, PaaS o serverless (pista: Supabase, Vercel, la función del tutor).
3. Describe una tarea de tu trabajo que podría resolverse con una función serverless.

## Repaso

1. ¿Qué administra el cliente en IaaS que no administra en PaaS?
2. ¿Qué responsabilidad mantiene siempre el cliente, sin importar el modelo?
3. ¿Qué significa realmente "serverless"?
4. ¿Cuándo elegirías IaaS sobre PaaS?

## Respuestas

1. El sistema operativo y el runtime (instalar, actualizar y parchear).
2. Sus datos y la configuración de accesos (quién puede ver y hacer qué).
3. Que no administras servidores: el proveedor los maneja, escala solo y pagas por ejecución.
4. Cuando necesitas control total del sistema operativo o software que la plataforma no soporta.

## Para profundizar

- [AWS: tipos de computación en la nube](https://aws.amazon.com/types-of-cloud-computing/)
- [AWS: ¿Qué es serverless?](https://aws.amazon.com/serverless/)
