---
id: cl-f0-t3
track: cloud
phase: cl-f0
title: Modelos de despliegue
minutes: 20
updated: 2026-11-24
---

## Objetivo

Diferenciar nube pública, privada, híbrida y multinube, y saber por qué una empresa elige cada una.

## Lo esencial

- **Pública:** infraestructura de un proveedor compartida entre muchos clientes (AWS, Azure, Google Cloud).
- **Privada:** infraestructura dedicada a una sola organización, en su centro de datos o alquilada.
- **Híbrida:** combina la nube privada o los servidores propios con la nube pública, conectados entre sí.
- **Multinube:** usa dos o más nubes públicas.
- La mayoría de empresas grandes terminan siendo híbridas o multinube, aunque no lo planeen.

## Explicación

### Nube pública

El modelo más común. Ventajas: no hay que comprar nada, escala casi sin límite y tiene cientos de servicios. Desventajas: dependes del proveedor y debes entender bien su modelo de costos.

### Nube privada

La organización tiene infraestructura propia pero la usa "como nube": autoservicio, virtualización y automatización (por ejemplo, con VMware u OpenStack). Se elige por regulación muy estricta, por cargas muy estables o por inversiones ya hechas en centros de datos. Es más cara de operar y escala más lento.

### Nube híbrida

Parte de los sistemas siguen en las oficinas o el centro de datos de la empresa y otra parte va a la nube pública, conectadas por VPN o enlace dedicado. Casos típicos:

1. Un banco mantiene el sistema central en su centro de datos y usa la nube para su app móvil y analítica.
2. Una empresa migra poco a poco: primero los sistemas nuevos, luego los antiguos.
3. Una fábrica procesa datos de sus máquinas en el sitio (baja latencia) y envía resúmenes a la nube.

AWS ofrece servicios para esto: Outposts (hardware de AWS en tu centro de datos), Direct Connect (enlace privado) y VPN de sitio a sitio.

### Multinube

Usar varias nubes públicas a la vez. Razones reales:

- Un servicio específico es mejor en otra nube (por ejemplo, un warehouse o un modelo de IA).
- Compraron otra empresa que usaba otro proveedor.
- Regulación o estrategia para no depender de uno solo.

El costo oculto: hay que dominar varias consolas, modelos de permisos y facturas. Por eso herramientas portables como Terraform y Kubernetes son tan valoradas.

### Comparación rápida

| Modelo | Control | Costo inicial | Escala | Caso típico |
| --- | --- | --- | --- | --- |
| Pública | Medio | Bajo | Muy alta | Startups, apps web, analítica |
| Privada | Alto | Alto | Limitada | Regulación estricta, cargas estables |
| Híbrida | Alto | Medio | Alta | Bancos, gobierno, migraciones graduales |
| Multinube | Medio | Medio | Muy alta | Empresas grandes, servicios especializados |

## Ejemplo práctico

Una empresa de telecomunicaciones en Colombia podría verse así:

1. **En su centro de datos:** sistemas de red y facturación que manejan datos de abonados (híbrido).
2. **En AWS:** el portal de clientes, la app móvil y los reportes de analítica (pública).
3. **En Google Cloud:** un warehouse en BigQuery que usa el equipo de datos (multinube).
4. **Conexión:** una VPN o enlace dedicado entre el centro de datos y AWS.

## Errores comunes

1. **Ir a multinube "por si acaso".** Duplica el trabajo sin un beneficio claro. Empieza con una nube y domínala.
2. **Confundir híbrida con multinube.** Híbrida mezcla infraestructura propia con nube pública; multinube son varias nubes públicas.
3. **Olvidar la conexión.** En un modelo híbrido, la red entre sitios (latencia, ancho de banda, costo) define si funciona o no.

## Práctica (10 minutos)

1. Clasifica estos casos: (a) una startup que solo usa AWS; (b) un hospital con historias clínicas en su servidor y un portal de citas en Azure; (c) una empresa con apps en AWS y analítica en Google Cloud.
2. Elige un caso y escribe una ventaja y un riesgo de su modelo.

## Repaso

1. ¿Qué diferencia hay entre nube híbrida y multinube?
2. Menciona dos razones por las que una empresa mantendría una nube privada.
3. ¿Qué servicio de AWS lleva su hardware al centro de datos del cliente?

## Respuestas

1. Híbrida combina infraestructura propia o privada con nube pública; multinube usa varias nubes públicas.
2. Regulación estricta y cargas muy estables o inversiones ya hechas en centros de datos.
3. AWS Outposts.

## Para profundizar

- [AWS: ¿Qué es la nube híbrida?](https://aws.amazon.com/what-is/hybrid-cloud/)
- [AWS Outposts](https://aws.amazon.com/outposts/)
