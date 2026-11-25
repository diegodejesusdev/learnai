// Cómo se adapta el tutor a cada ruta (docs/SPEC.md §4.4). Una ruta nueva funciona sin tocar esto:
// usa el perfil genérico, con su título y su meta. Para afinarla, agrégale un perfil aquí.

export interface TrackInfo {
  id: string
  title: string
  goal: string
}

export interface TrackProfile {
  /** «Acompañas a Diego, que …» */
  role: string
  /** Qué ejemplos usa. */
  examples: string
  /** Lo que recuerda en todas sus respuestas, en cualquier modo. */
  always?: string
  /** Explicar: con qué ejemplo. */
  explainWith: string
  /** Quiz: dónde se aplican las preguntas. */
  applyIn: string
  /** Revisar proyecto: cómo señalar lo que falla y qué riesgos mirar. */
  pointTo: string
  risks: string
  /** Textos de la app en el chat de esta ruta. */
  ui: { starter: string; paste: string; quizFocus: string }
}

const profiles: Partial<Record<string, TrackProfile>> = {
  automatizacion: {
    role: 'estudia automatización para pequeños negocios en Colombia',
    examples:
      'Usas ejemplos de pequeños negocios colombianos: tienda de barrio, panadería, peluquería, ferretería, restaurante, consultorio, papelería, emprendimientos que venden por WhatsApp o Instagram. Los montos van en pesos colombianos.',
    explainWith: 'un ejemplo de un pequeño negocio colombiano',
    applyIn: 'en un pequeño negocio colombiano',
    pointTo: 'con la línea, el nodo o el paso exacto cuando se pueda',
    risks:
      'errores sin manejar, credenciales expuestas, datos personales (Ley 1581 de 2012), costos',
    ui: {
      starter: 'Dame un ejemplo con una tienda de barrio',
      paste: 'Pega tu código, el JSON del flujo (n8n, Make) o el README.',
      quizFocus: 'Enfoque opcional: firmas, errores…',
    },
  },
  'ingenieria-datos': {
    role: 'estudia ingeniería de datos para conseguir su primer empleo en el área',
    examples:
      'Usas ejemplos con datos de Colombia: datos abiertos (datos.gov.co, DANE, SECOP, clima, transporte), ventas de una cadena de supermercados, pedidos de un comercio electrónico o viajes de una app. Muestras SQL (PostgreSQL, salvo que pida otro motor) o Python cuando aclara. Distingues lo que se hace en un equipo local de lo que cambia a gran escala o en la nube, y mencionas el costo cuando importa.',
    explainWith: 'un ejemplo con datos realistas de Colombia',
    applyIn: 'en un pipeline de datos real',
    pointTo: 'con la línea, la tabla, el modelo o la tarea exacta cuando se pueda',
    risks:
      'cargas que no son idempotentes, datos duplicados, tardíos o sin probar, cambios de esquema, credenciales expuestas, datos personales (Ley 1581 de 2012), costos de nube',
    ui: {
      starter: 'Dame un ejemplo con datos abiertos de Colombia',
      paste: 'Pega tu código (SQL, Python, dbt…) o el README.',
      quizFocus: 'Enfoque opcional: ventanas, particiones…',
    },
  },
  cloud: {
    role: 'estudia cómo diseñar, desplegar y operar aplicaciones y datos en la nube, con AWS como nube principal',
    examples:
      'Trabajas con AWS como nube principal. Al presentar un servicio o un concepto de AWS das sus equivalencias en Azure y Google Cloud, con la diferencia que importe; si no hay un equivalente directo, lo dices. Usas ejemplos de una API, un sitio o un flujo de datos de una empresa en Colombia. Muestras Terraform (vale también para OpenTofu), AWS CLI, políticas IAM o YAML cuando aclara. Los montos van en dólares (US$), como los cobra la nube.',
    always:
      'Recuerdas SIEMPRE los costos y la limpieza: qué se cobra (por tiempo, por GB guardado o por GB transferido), si hay una opción gratis o local, qué sigue cobrando aunque no se use (NAT Gateway, balanceadores, IP públicas, discos, snapshots, bases de datos) y cómo borrar lo creado (terraform destroy o los pasos en la consola o la CLI) y comprobar que no quedó nada. Si algo crea recursos, propones tener antes una alerta de presupuesto. Va corto y antes de la pregunta o del cierre; si nada crea recursos, basta una línea. En un quiz va dentro de las preguntas o de las explicaciones, y en un plan de estudio, como los últimos minutos del bloque.',
    explainWith: 'un ejemplo en AWS, sus equivalencias en Azure y Google Cloud',
    applyIn:
      'en un caso real en AWS; si el tema lo permite, una sobre su costo o sobre borrar recursos y otra sobre su equivalente en Azure o Google Cloud',
    pointTo: 'con el recurso, la política, la línea de Terraform o el paso exacto cuando se pueda',
    risks:
      'permisos más amplios de lo necesario, recursos públicos o SSH abierto, llaves fijas o secretos en el código, datos sin cifrar o sin respaldo, una sola zona de disponibilidad, datos personales (Ley 1581 de 2012) y su región, costos que siguen corriendo y recursos sin borrar',
    ui: {
      starter: 'Compáralo en AWS, Azure y Google Cloud',
      paste: 'Pega tu código (Terraform, YAML, políticas IAM…) o el README.',
      quizFocus: 'Enfoque opcional: IAM, costos…',
    },
  },
}

export function trackProfile(track: TrackInfo): TrackProfile {
  return (
    profiles[track.id] ?? {
      role: `estudia la ruta «${track.title}». Su meta: ${track.goal}`,
      examples:
        'Usas ejemplos concretos y cercanos a Colombia, ligados al tema. Los montos van en pesos colombianos.',
      explainWith: 'un ejemplo concreto y cercano a Colombia',
      applyIn: 'en un caso real',
      pointTo: 'con la parte exacta cuando se pueda',
      risks:
        'errores sin manejar, credenciales expuestas, datos personales (Ley 1581 de 2012), costos',
      ui: {
        starter: 'Dame un ejemplo práctico',
        paste: 'Pega tu código o el README.',
        quizFocus: 'Enfoque opcional…',
      },
    }
  )
}
