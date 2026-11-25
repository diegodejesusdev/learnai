---
id: cl-f0-t7
track: cloud
phase: cl-f0
title: Plan gratis de AWS
minutes: 20
updated: 2026-11-24
---

## Objetivo

Entender cómo funciona hoy el plan gratis de AWS para practicar sin pagar y sin perder tu trabajo cuando termine.

## Lo esencial

- Desde el 15 de julio de 2025, el plan gratis funciona con **créditos**: US$100 al crear la cuenta y hasta US$100 más por completar actividades en la consola.
- Al registrarte eliges **plan gratis (Free plan)** o **plan de pago (Paid plan)**; los dos reciben los créditos.
- El plan gratis termina a los **6 meses** o cuando se acaban los créditos, lo que pase primero.
- Más de 30 servicios tienen **cuotas gratis permanentes** (always free) para todos los clientes.
- Necesitas un medio de pago para registrarte, aunque elijas el plan gratis.

## Explicación

### Plan gratis frente a plan de pago

| | Plan gratis | Plan de pago |
| --- | --- | --- |
| Créditos | Hasta US$200 | Hasta US$200 |
| Cobros a tu tarjeta | No, mientras estés en el plan | Sí, lo que pase de los créditos |
| Servicios | Algunos servicios costosos no están disponibles | Todos |
| Duración | Hasta 6 meses o hasta agotar créditos | Sin límite |
| Al terminar | La cuenta se cierra si no pasas a plan de pago | Sigue funcionando |

Al final del plan gratis, AWS cierra la cuenta y tienes **90 días** para pasarla a plan de pago y recuperar tus recursos; después se borra con su contenido.

### Cómo ganar los US$100 adicionales

La consola te propone actividades con servicios básicos (por ejemplo, lanzar una instancia de EC2, crear un presupuesto en AWS Budgets o crear una base de datos). Cada una suma créditos. Revisa la lista vigente en la página de créditos de la consola de facturación.

### Reglas que conviene saber

1. Solo aplica a clientes **nuevos**: si ya tuviste una cuenta de AWS, no recibes los créditos.
2. Si una cuenta del plan gratis se une a **AWS Organizations**, pasa a plan de pago y los créditos vencen de inmediato. Por eso, en esta ruta practicarás Organizations al final o con una cuenta de pago.
3. Los créditos no se pueden transferir a otra cuenta.
4. Los créditos se consumen con el uso: un recurso olvidado gasta tus créditos igual que gastaría dinero.

### Estrategia para esta ruta

1. Crea la cuenta cuando vayas a practicar, no antes, porque el reloj de 6 meses empieza al registrarte.
2. Activa alertas de presupuesto el primer día (tema siguiente).
3. Borra todo al terminar cada sesión de práctica. Más adelante lo harás con un solo comando de Terraform.
4. Prefiere servicios con cuota gratis permanente para practicar: Lambda, DynamoDB, S3 en volúmenes pequeños.
5. Antes de que termine el plan gratis, decide si pasas a plan de pago (con presupuesto controlado) para seguir con las fases avanzadas.

## Ejemplo práctico

Revisa tus créditos y tu plan en la consola: **Billing and Cost Management → Credits** (créditos restantes y fecha de vencimiento) y **Free Tier** (uso de las cuotas gratis).

Con la CLI puedes ver el uso de la capa gratis (requiere permisos de facturación):

```bash
aws freetier get-free-tier-usage \
  --query "freeTierUsages[0:2].[service,actualUsageAmount,limit]" --output table
```

Salida de ejemplo:

```text
----------------------------------------------
|              GetFreeTierUsage              |
+-------------------------+--------+---------+
|  AWS Lambda             |  1520  |  1000000|
|  Amazon DynamoDB        |  0.3   |  25     |
+-------------------------+--------+---------+
```

## Errores comunes

1. **Crear la cuenta meses antes de usarla.** Pierdes tiempo del plan gratis.
2. **Pensar que "plan gratis" protege de todo.** En el plan de pago, lo que pase de los créditos se cobra a tu tarjeta.
3. **Olvidar el cierre a los 6 meses.** Si tienes proyectos que quieres conservar, pasa a plan de pago antes o guarda todo como código.

## Práctica (10 minutos)

1. Lee la página de preguntas frecuentes del plan gratis y anota: duración, créditos y qué pasa al final.
2. Escribe tu plan: qué fecha vas a crear la cuenta, qué fases harás dentro de los 6 meses y cuál será tu presupuesto máximo mensual después.

## Repaso

1. ¿Cuántos créditos recibe una cuenta nueva y cómo se consiguen?
2. ¿Cuándo termina el plan gratis?
3. ¿Qué pasa si una cuenta del plan gratis se une a AWS Organizations?
4. ¿Qué pasa con la cuenta al final del plan gratis si no haces nada?

## Respuestas

1. US$100 al registrarse y hasta US$100 más por completar actividades en la consola.
2. A los 6 meses o cuando se agotan los créditos, lo que ocurra primero.
3. Pasa a plan de pago y los créditos vencen de inmediato.
4. Se cierra; tienes 90 días para pasarla a plan de pago antes de que se borre.

## Para profundizar

- [AWS: preguntas frecuentes del plan gratis](https://aws.amazon.com/free/faqs/)
- [AWS: términos del plan gratis](https://aws.amazon.com/free/terms)
- [AWS Builder Center: la cuenta de US$0 en 2026](https://builder.aws.com/content/3Kkt4kNiDSUnO3n6db2weSNubzE/the-dollar0-aws-account-in-2026-free-plan-credits-guardrails)
