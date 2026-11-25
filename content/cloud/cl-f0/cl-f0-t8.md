---
id: cl-f0-t8
track: cloud
phase: cl-f0
title: Herramientas de costos
minutes: 30
updated: 2026-11-24
---

## Objetivo

Configurar alertas para enterarte antes de gastar de más, y saber dónde mirar en qué se fue el dinero.

## Lo esencial

- **AWS Budgets:** defines un presupuesto mensual y te avisa por correo al acercarte o pasarte, incluso con el gasto **pronosticado**.
- **Cost Explorer:** muestra en qué servicios, regiones y días gastaste.
- **Cost Anomaly Detection:** detecta gastos raros con aprendizaje automático y te avisa.
- **Etiquetas (tags):** te permiten saber qué proyecto generó cada costo.
- Una alerta no apaga nada por sí sola: te avisa para que actúes.

## Explicación

### AWS Budgets

Es lo primero que se configura en una cuenta nueva. Puedes crear un presupuesto de costo con alertas en varios umbrales:

| Umbral | Tipo | Para qué |
| --- | --- | --- |
| 50% del presupuesto | Real | Saber que vas a mitad de mes de gasto |
| 80% del presupuesto | Real | Revisar qué está encendido |
| 100% del presupuesto | Pronosticado | Aviso temprano si al ritmo actual te vas a pasar |

Las alertas llegan por correo o por un tema de SNS (que luego puede notificar a Slack, Telegram o activar una automatización). Budgets también permite **acciones**, como aplicar una política que impida crear más recursos al pasar un umbral.

### Cost Explorer

Gráficas de gasto filtradas por servicio, región, cuenta o etiqueta, con hasta varios meses hacia atrás y un pronóstico. Úsalo cada semana durante la ruta: te enseña qué cuesta cada cosa en la práctica.

### Cost Anomaly Detection

Aprende tu patrón de gasto y avisa cuando algo se sale de lo normal (por ejemplo, un servicio que pasó de US$0,10 a US$5 en un día). Útil para atrapar errores sin revisar a diario.

### Etiquetas

Agrega etiquetas como `proyecto=learnai` o `fase=cl-f3` a tus recursos. Después de activarlas como etiquetas de asignación de costos en la consola de facturación, puedes ver en Cost Explorer cuánto costó cada proyecto o fase.

### Rutina recomendada para esta ruta

1. Presupuesto mensual de US$5 a US$10 con alertas al 50%, 80% y 100% pronosticado.
2. Cost Anomaly Detection activo.
3. Revisar Cost Explorer una vez por semana.
4. Etiquetar todo con proyecto y fase.
5. Al terminar cada práctica, borrar lo creado y confirmar al día siguiente que el gasto no siguió subiendo.

## Ejemplo práctico

Crear un presupuesto de US$5 con la CLI. Primero, el archivo `budget.json`:

```json
{
  "BudgetName": "presupuesto-aprendizaje",
  "BudgetLimit": { "Amount": "5", "Unit": "USD" },
  "TimeUnit": "MONTHLY",
  "BudgetType": "COST"
}
```

Luego `notificaciones.json`, con alertas al 80% real y al 100% pronosticado:

```json
[
  {
    "Notification": { "NotificationType": "ACTUAL", "ComparisonOperator": "GREATER_THAN", "Threshold": 80, "ThresholdType": "PERCENTAGE" },
    "Subscribers": [{ "SubscriptionType": "EMAIL", "Address": "tu-correo@ejemplo.com" }]
  },
  {
    "Notification": { "NotificationType": "FORECASTED", "ComparisonOperator": "GREATER_THAN", "Threshold": 100, "ThresholdType": "PERCENTAGE" },
    "Subscribers": [{ "SubscriptionType": "EMAIL", "Address": "tu-correo@ejemplo.com" }]
  }
]
```

Y el comando (cambia el número de cuenta por el tuyo):

```bash
aws budgets create-budget --account-id 123456789012 \
  --budget file://budget.json \
  --notifications-with-subscribers file://notificaciones.json
```

Salida esperada: ninguna. Si no aparece un error, se creó. Para comprobarlo:

```bash
aws budgets describe-budgets --account-id 123456789012 \
  --query "Budgets[].[BudgetName,BudgetLimit.Amount]" --output text
```

Salida esperada:

```text
presupuesto-aprendizaje    5.0
```

## Errores comunes

1. **Crear la alerta con un correo que no revisas.** Usa el correo que miras todos los días.
2. **Poner solo la alerta al 100% real.** Cuando llega, ya te pasaste. La alerta pronosticada avisa antes.
3. **No etiquetar.** Sin etiquetas, a fin de mes no sabes qué práctica generó el costo.

## Práctica (15 minutos)

1. Crea en la consola un presupuesto mensual de US$5 con alertas al 50%, 80% y 100% pronosticado.
2. Activa Cost Anomaly Detection con una alerta por correo.
3. Abre Cost Explorer y familiarízate con los filtros por servicio y por región.

## Repaso

1. ¿Qué diferencia hay entre una alerta de gasto real y una de gasto pronosticado?
2. ¿Qué herramienta usarías para ver en qué servicio se fue el dinero?
3. ¿Para qué sirven las etiquetas en los costos?
4. ¿Una alerta de presupuesto apaga los recursos?

## Respuestas

1. La real avisa cuando ya gastaste el porcentaje; la pronosticada avisa si al ritmo actual vas a llegar a él.
2. Cost Explorer.
3. Para saber qué proyecto, fase o equipo generó cada costo.
4. No por sí sola; avisa. Para actuar automáticamente se configuran acciones de presupuesto.

## Para profundizar

- [AWS Budgets](https://aws.amazon.com/aws-cost-management/aws-budgets/)
- [AWS Cost Explorer](https://aws.amazon.com/aws-cost-management/aws-cost-explorer/)
- [AWS Cost Anomaly Detection](https://aws.amazon.com/aws-cost-management/aws-cost-anomaly-detection/)
