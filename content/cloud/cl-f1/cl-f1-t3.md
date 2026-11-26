---
id: cl-f1-t3
track: cloud
phase: cl-f1
title: Paquetes y configuración
minutes: 25
updated: 2026-11-26
---

## Objetivo

Instalar y actualizar software en un servidor, manejar variables de entorno y saber dónde vive la configuración.

## Lo esencial

- Cada familia de Linux tiene su **gestor de paquetes**: `apt` en Ubuntu y Debian, `dnf` en Amazon Linux, Fedora y Red Hat.
- Primero se **actualiza la lista** de paquetes y luego se instala o actualiza.
- Las **variables de entorno** pasan configuración y secretos a los programas sin escribirlos en el código.
- La configuración de los servicios vive en `/etc`; la de tu usuario, en archivos ocultos de tu carpeta (`~/.bashrc`).
- En la nube, todo lo que instales a mano se pierde si reemplazas el servidor; por eso más adelante lo harás con scripts y código.

## Explicación

### apt y dnf

| Tarea | Ubuntu (apt) | Amazon Linux (dnf) |
| --- | --- | --- |
| Actualizar lista de paquetes | `sudo apt update` | (automático con dnf) |
| Actualizar todo | `sudo apt upgrade -y` | `sudo dnf upgrade -y` |
| Instalar | `sudo apt install -y nginx` | `sudo dnf install -y nginx` |
| Buscar | `apt search postgres` | `dnf search postgres` |
| Desinstalar | `sudo apt remove nginx` | `sudo dnf remove nginx` |
| Ver si está instalado | `apt list --installed \| grep nginx` | `dnf list installed nginx` |

En EC2 verás sobre todo **Amazon Linux 2023** (usa `dnf`) y **Ubuntu** (usa `apt`). El usuario por defecto es `ec2-user` en Amazon Linux y `ubuntu` en Ubuntu.

### Variables de entorno

Son pares nombre=valor que heredan los programas que ejecutas:

```bash
export DATABASE_URL="postgresql://app:clave@db.interna:5432/app"
echo $DATABASE_URL
```

- Solo duran en la sesión actual. Para que sean permanentes para tu usuario, agrégalas a `~/.bashrc`.
- Para un servicio de systemd, se ponen con `Environment=` o `EnvironmentFile=/etc/miapi.env` dentro del archivo `.service`.
- En la fase 10 aprenderás a guardar secretos en **AWS Secrets Manager** en vez de archivos.

Variables que verás seguido:

| Variable | Para qué |
| --- | --- |
| `PATH` | Carpetas donde se buscan los programas |
| `HOME` | Tu carpeta de usuario |
| `AWS_PROFILE` | Qué perfil de la AWS CLI usar |
| `AWS_REGION` | Región por defecto de la AWS CLI |

### Archivos de configuración

- `/etc/nginx/nginx.conf` y `/etc/nginx/sites-available/`: Nginx.
- `/etc/ssh/sshd_config`: servidor SSH.
- `/etc/hosts`: nombres locales que se resuelven antes que DNS.
- `~/.ssh/config`: atajos para tus conexiones SSH.
- `~/.aws/config` y `~/.aws/credentials`: perfiles de la AWS CLI.

Antes de editar un archivo de configuración importante, haz una copia: `sudo cp archivo archivo.bak`.

### User data: instalar al crear el servidor

En EC2 puedes pasar un script que se ejecuta la primera vez que arranca la máquina. Así el servidor nace configurado:

```bash
#!/bin/bash
dnf install -y nginx
systemctl enable --now nginx
echo "<h1>Servidor listo</h1>" > /usr/share/nginx/html/index.html
```

Lo usarás en la fase 3.

## Ejemplo práctico

Instalar `jq` (procesa JSON, útil con la AWS CLI) y probarlo:

```bash
sudo apt update && sudo apt install -y jq
echo '{"region":"sa-east-1","zonas":3}' | jq '.zonas'
```

Salida esperada (las líneas de apt se omiten):

```text
3
```

Comprobar una variable de entorno:

```bash
export AWS_REGION=sa-east-1
echo "Región por defecto: $AWS_REGION"
```

```text
Región por defecto: sa-east-1
```

## Errores comunes

1. **Instalar sin `apt update`.** Instalas versiones viejas o falla porque la lista está desactualizada.
2. **Guardar contraseñas en `~/.bashrc` o en el código y subirlo a Git.** Usa archivos fuera del repositorio o un gestor de secretos.
3. **Configurar a mano un servidor que vas a replicar.** Lo que no está en un script, se pierde. Usa user data o, más adelante, Terraform.
4. **Mezclar comandos de apt y dnf.** Revisa la distribución con `cat /etc/os-release`.

## Práctica (15 minutos)

1. Revisa qué distribución usas con `cat /etc/os-release`.
2. Instala `jq`, `curl` y `htop`.
3. Crea una variable `APP_ENV=desarrollo`, imprímela, y luego hazla permanente en `~/.bashrc`. Abre otra terminal y comprueba que existe.
4. Escribe un script de user data que instale Nginx y deje una página con tu nombre.

## Repaso

1. ¿Qué gestor de paquetes usa Amazon Linux 2023? ¿Y Ubuntu?
2. ¿Por qué se usan variables de entorno en vez de escribir valores en el código?
3. ¿Dónde vive la configuración de los servicios del sistema?
4. ¿Qué es el user data de EC2?

## Respuestas

1. `dnf` en Amazon Linux 2023 y `apt` en Ubuntu.
2. Para cambiar la configuración sin tocar el código y no exponer secretos en el repositorio.
3. En `/etc`.
4. Un script que se ejecuta la primera vez que arranca la instancia, para dejarla configurada automáticamente.

## Para profundizar

- [Amazon Linux 2023: gestión de paquetes](https://docs.aws.amazon.com/linux/al2023/ug/package-management.html)
- [AWS: ejecutar comandos al lanzar una instancia (user data)](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/user-data.html)
