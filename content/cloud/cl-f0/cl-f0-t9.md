---
id: cl-f0-t9
track: cloud
phase: cl-f0
title: Comparar proveedores
minutes: 20
updated: 2026-11-24
---

## Objetivo

Conocer en qué se destaca cada proveedor grande y por qué esta ruta usa AWS como nube principal.

## Lo esencial

- **AWS** lidera el mercado (26% en el tercer trimestre de 2026, según Synergy Research), tiene el catálogo más amplio y la mayor cantidad de ofertas de trabajo.
- **Microsoft Azure** es fuerte en empresas que ya usan Microsoft (Windows, Office, Entra ID).
- **Google Cloud** destaca en datos, analítica, Kubernetes e IA, y es el que más rápido crece.
- **Oracle Cloud** es fuerte en bases de datos Oracle y viene creciendo.
- Los conceptos son los mismos en todas: lo que aprendas en AWS se traslada.

## Explicación

### En qué se destaca cada uno

| Proveedor | Fortalezas | Dónde lo verás |
| --- | --- | --- |
| AWS | Catálogo más grande, madurez, comunidad y documentación | Startups, empresas de tecnología, bancos, retail |
| Microsoft Azure | Integración con Microsoft 365, Windows Server, Entra ID y empresas grandes | Corporativos, gobierno, empresas con licencias Microsoft |
| Google Cloud | BigQuery, Kubernetes (GKE), IA con Gemini y red global | Empresas de datos, medios, startups de IA |
| Oracle Cloud | Bases de datos Oracle, precios de cómputo competitivos | Empresas con sistemas Oracle |

### Mismo servicio, distinto nombre

| Necesidad | AWS | Azure | Google Cloud |
| --- | --- | --- | --- |
| Máquina virtual | EC2 | Virtual Machines | Compute Engine |
| Almacenamiento de objetos | S3 | Blob Storage | Cloud Storage |
| Funciones serverless | Lambda | Functions | Cloud Run Functions |
| Base relacional administrada | RDS | Azure SQL / Database for PostgreSQL | Cloud SQL |
| Kubernetes | EKS | AKS | GKE |
| Identidad | IAM | Entra ID | Cloud IAM |

En la fase 12 verás la tabla completa de equivalencias.

### Por qué esta ruta usa AWS

1. **Mercado:** es el proveedor con mayor participación, así que hay más vacantes y más proyectos que lo usan.
2. **Material:** más cursos, documentación, foros y ejemplos que cualquier otro.
3. **Certificaciones reconocidas:** Solutions Architect Associate es de las más pedidas en ofertas de cloud.
4. **Transferible:** IAM, VPC, cómputo y almacenamiento existen en todas las nubes con otros nombres.

Esto no significa que AWS sea "la mejor" para todo. Si una empresa ya usa Microsoft 365 y Active Directory, Azure suele ser la elección natural; si su fuerte es analítica, Google Cloud es muy competitivo.

### Cómo decide una empresa

1. Qué usa ya (licencias, sistemas, conocimiento del equipo).
2. Servicios específicos que necesita (warehouse, IA, bases de datos).
3. Regiones disponibles cerca de sus clientes.
4. Precios y descuentos negociados.
5. Requisitos legales y de soporte.

## Ejemplo práctico

Las tres nubes tienen línea de comandos. El mismo objetivo, listar tus buckets o contenedores de almacenamiento:

```bash
# AWS
aws s3 ls

# Azure
az storage account list --query "[].name" -o tsv

# Google Cloud
gcloud storage buckets list --format="value(name)"
```

Salida de ejemplo en AWS (una línea por bucket con su fecha de creación):

```text
2026-11-20 09:15:02 learnai-practica-diego
2026-11-22 18:40:11 learnai-logs-diego
```

La sintaxis cambia, pero la idea es la misma: autenticarte, elegir región o proyecto y operar recursos.

## Errores comunes

1. **Aprender las tres nubes a la vez.** Domina una y luego aprende las equivalencias.
2. **Elegir proveedor por fanatismo.** En el trabajo, la nube la elige el contexto de la empresa.
3. **Memorizar nombres de servicios sin entender el concepto.** Los nombres cambian (Google renombró Vertex AI en 2026); los conceptos no.

## Práctica (10 minutos)

1. Busca 5 ofertas de trabajo de cloud o DevOps remotas para Latinoamérica y anota qué nube pide cada una.
2. Para tres de ellas, escribe qué temas de esta ruta te acercan a cumplir los requisitos.

## Repaso

1. ¿Qué proveedor lidera el mercado de nube?
2. ¿En qué tipo de empresas suele elegirse Azure?
3. ¿En qué se destaca Google Cloud?
4. ¿Cómo se llama el almacenamiento de objetos en cada una de las tres nubes grandes?

## Respuestas

1. AWS, con el 26% en el tercer trimestre de 2026 según Synergy Research.
2. En empresas que ya usan Microsoft 365, Windows Server o Entra ID.
3. En datos y analítica (BigQuery), Kubernetes (GKE) e IA.
4. S3 en AWS, Blob Storage en Azure y Cloud Storage en Google Cloud.

## Para profundizar

- [Synergy Research / TechInsights: mercado de nube, tercer trimestre de 2026](https://techinsights.com/ja/node/61958)
- [Azure para profesionales de AWS](https://learn.microsoft.com/azure/architecture/aws-professional/)
- [Google Cloud para profesionales de AWS](https://cloud.google.com/docs/get-started/aws-azure-gcp-service-comparison)
