---
id: cl-f0-t6
track: cloud
phase: cl-f0
title: Cómo cobra la nube
minutes: 30
updated: 2026-11-24
---

## Objetivo

Entender las formas en que AWS cobra y estimar el costo mensual de un proyecto pequeño antes de crearlo.

## Lo esencial

- Se paga por **tres cosas principales**: cómputo (tiempo encendido), almacenamiento (GB guardados por mes) y transferencia de datos (GB que salen hacia internet).
- Muchos servicios también cobran por **solicitudes** (por ejemplo, por cada millón de llamadas).
- Los datos que **entran** a AWS no se cobran; los que **salen** hacia internet sí (los primeros 100 GB al mes son gratis).
- Los costos que más sorprenden: NAT Gateway, IPs públicas, discos y snapshots olvidados, y logs que nunca se borran.
- Siempre estima antes con la **AWS Pricing Calculator**.

## Explicación

### Las unidades de cobro

| Qué | Cómo se cobra | Ejemplo |
| --- | --- | --- |
| Cómputo | Por segundo u hora encendido | Una máquina EC2 |
| Almacenamiento | Por GB al mes | Archivos en S3, discos EBS |
| Solicitudes | Por cada millón o por cada mil | Llamadas a Lambda, lecturas en S3 |
| Transferencia | Por GB que sale | Usuarios descargando archivos |
| Servicios administrados | Por hora más almacenamiento | Una base en RDS |

### Ejemplo de estimación

Precios **aproximados** en us-east-1 a la fecha de esta lección. Cambian por región y con el tiempo, así que confírmalos en la calculadora.

| Recurso | Precio aprox. | Uso | Costo mensual aprox. |
| --- | --- | --- | --- |
| EC2 t3.micro | US$0,0104 por hora | 730 horas (todo el mes) | US$7,60 |
| Disco EBS gp3 | US$0,08 por GB-mes | 20 GB | US$1,60 |
| S3 Standard | US$0,023 por GB-mes | 50 GB | US$1,15 |
| IPv4 pública | US$0,005 por hora | 1 IP todo el mes | US$3,65 |
| Transferencia a internet | Primeros 100 GB gratis | 30 GB | US$0 |
| **Total** | | | **≈ US$14** |

Fíjate en la IP pública: AWS cobra cada dirección IPv4 pública, así que una app pequeña puede pagar casi la mitad de lo que cuesta el servidor solo por la IP.

### Los costos sorpresa más comunes

1. **NAT Gateway:** cobra por hora (cerca de US$0,045) más por cada GB procesado. Encendido todo el mes son unos US$33 aunque no lo uses.
2. **Recursos olvidados:** una máquina de prueba, un disco que quedó después de borrar la máquina, snapshots antiguos.
3. **Logs sin expiración:** CloudWatch guarda los logs para siempre si no configuras retención.
4. **Transferencia entre zonas y regiones:** mover datos entre AZ o regiones también se cobra.
5. **Servicios grandes por error:** elegir una instancia de base de datos grande "por defecto".

### Formas de pagar menos

1. **Apagar** lo que no usas (los entornos de prueba de noche y fin de semana).
2. **Elegir el tamaño correcto** (rightsizing).
3. **Savings Plans** o instancias reservadas: descuento por comprometerte uno o tres años.
4. **Spot:** capacidad sobrante con gran descuento, que AWS puede recuperar con poco aviso.
5. **Serverless** para tráfico irregular: pagas solo cuando se usa.

## Ejemplo práctico

Calcular en la terminal el costo de un mes de una máquina:

```bash
python3 -c "precio=0.0104; horas=730; print(f'US$ {precio*horas:.2f} al mes')"
```

Salida esperada:

```text
US$ 7.59 al mes
```

Y ver cuánto llevas gastado este mes con la CLI (requiere permisos de facturación):

```bash
aws ce get-cost-and-usage \
  --time-period Start=2026-11-01,End=2026-11-24 \
  --granularity MONTHLY --metrics UnblendedCost \
  --query "ResultsByTime[0].Total.UnblendedCost"
```

Salida de ejemplo:

```json
{
    "Amount": "0.4213",
    "Unit": "USD"
}
```

## Errores comunes

1. **Creer que "apagado" significa "gratis".** Una EC2 detenida no cobra cómputo, pero su disco EBS y su IP elástica sí.
2. **No mirar la transferencia de datos.** En apps con muchos archivos o videos puede ser el costo más alto.
3. **Estimar solo el servidor.** Suma discos, IPs, respaldos, logs y balanceadores.

## Práctica (20 minutos)

1. Abre la [AWS Pricing Calculator](https://calculator.aws/) y estima una app con: 1 EC2 t3.small todo el mes, 30 GB de EBS, 1 base RDS db.t4g.micro con 20 GB y 20 GB en S3, en us-east-1.
2. Repite la estimación en sa-east-1 y compara el total.
3. Agrega un NAT Gateway y anota cuánto sube el costo.

## Repaso

1. ¿Cuáles son las tres cosas principales por las que se paga en la nube?
2. ¿Se cobra la transferencia de datos que entra a AWS?
3. Menciona tres costos que suelen sorprender.
4. ¿Qué sigue cobrando una EC2 detenida?

## Respuestas

1. Cómputo, almacenamiento y transferencia de datos de salida.
2. No; se cobra la que sale hacia internet (después de los primeros 100 GB al mes).
3. NAT Gateway, IPs públicas, recursos olvidados (discos, snapshots) o logs sin expiración.
4. El disco EBS y, si tiene, la IP elástica.

## Para profundizar

- [AWS Pricing Calculator](https://calculator.aws/)
- [AWS: precios de EC2 bajo demanda](https://aws.amazon.com/ec2/pricing/on-demand/)
- [AWS: precios de VPC (NAT Gateway e IPv4 públicas)](https://aws.amazon.com/vpc/pricing/)
