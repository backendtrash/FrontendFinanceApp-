import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

// Aviso de Privacidad Integral (RF01). Public: it has to be readable before
// an account exists, and the registration form links here.
//
// Fields only the responsible party can supply are shown highlighted with
// <Pending>, and the banner stays up while any remain. The technical facts
// — hosting regions, this URL, the route to delete an account — are filled
// in from how the application is actually deployed.

const NOTICE_URL   = 'https://frontend-finance-app.vercel.app/privacidad'
const LAST_UPDATED = '19 de octubre de 2026'
const DRAFT        = true

const BRAND = '#702963'

function Pending({ children }: { children: ReactNode }) {
  return (
    <mark style={{ background: '#fdf0c8', color: '#7a5a00', padding: '0 3px', borderRadius: 3 }}>
      [{children}]
    </mark>
  )
}

function H2({ children }: { children: ReactNode }) {
  return <h2 style={{ fontSize: 18, fontWeight: 600, margin: '32px 0 10px', color: 'var(--text-primary)' }}>{children}</h2>
}

function P({ children }: { children: ReactNode }) {
  return <p style={{ fontSize: 14, lineHeight: 1.65, margin: '0 0 12px', color: 'var(--text-secondary)' }}>{children}</p>
}

function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  const cell = { border: '1px solid var(--border, #e2e8f0)', padding: '8px 10px', fontSize: 13, verticalAlign: 'top' as const, color: 'var(--text-secondary)' }
  return (
    <div style={{ overflowX: 'auto', margin: '0 0 12px' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 520 }}>
        <thead>
          <tr>{head.map(h => <th key={h} style={{ ...cell, textAlign: 'left', fontWeight: 600, color: 'var(--text-primary)' }}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} style={cell}>{c}</td>)}</tr>)}
        </tbody>
      </table>
    </div>
  )
}

function Ol({ items }: { items: ReactNode[] }) {
  return (
    <ol style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--text-secondary)', margin: '0 0 12px', paddingLeft: 22 }}>
      {items.map((it, i) => <li key={i}>{it}</li>)}
    </ol>
  )
}

function Ul({ items }: { items: ReactNode[] }) {
  return (
    <ul style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--text-secondary)', margin: '0 0 12px', paddingLeft: 22 }}>
      {items.map((it, i) => <li key={i}>{it}</li>)}
    </ul>
  )
}

export default function PrivacyPage() {
  const email = <Pending>CORREO DE PRIVACIDAD</Pending>

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg, #faf9f7)', padding: '40px 20px' }}>
      <article style={{ maxWidth: 780, margin: '0 auto' }}>
        <Link to="/register" style={{ fontSize: 13, color: BRAND, textDecoration: 'none' }}>← Volver al registro</Link>

        {DRAFT && (
          <div role="note" style={{ margin: '16px 0', padding: '10px 14px', borderRadius: 8, background: '#fdf6e3', border: '1px solid #ecd9a0', fontSize: 13, color: '#6b5200' }}>
            Faltan por completar los datos del responsable, marcados en amarillo.
          </div>
        )}

        <h1 style={{ fontSize: 26, fontWeight: 600, margin: '16px 0 6px', color: 'var(--text-primary)' }}>
          Aviso de Privacidad Integral — BackendFinance
        </h1>
        <P>
          <strong>BackendFinance trata tus datos personales y financieros solo para operar tu cuenta de
          finanzas personales, y nunca los vende ni los comparte con fines publicitarios.</strong>
        </P>
        <P>
          Este Aviso de Privacidad Integral se emite conforme a la Ley Federal de Protección de Datos
          Personales en Posesión de los Particulares, publicada en el Diario Oficial de la Federación el
          20 de marzo de 2025 y vigente desde el 21 de marzo de 2025 (la “Ley”), y, en lo que no la
          contradiga, su Reglamento. BackendFinance es una aplicación web para registrar, planear y
          analizar el dinero de una persona: gastos e ingresos, presupuestos, movimientos recurrentes,
          metas de ahorro, costos proyectados y reportes.
        </P>

        <H2>1. Identidad y domicilio del responsable</H2>
        <P>
          <Pending>NOMBRE COMPLETO O RAZÓN SOCIAL DEL RESPONSABLE</Pending> (“BackendFinance” o “el
          Responsable”), con domicilio en <Pending>CALLE, NÚMERO, COLONIA, CÓDIGO POSTAL, MUNICIPIO, ESTADO</Pending>,
          México, es responsable del tratamiento de tus datos personales.
        </P>
        <P>
          Para cualquier asunto de privacidad puedes escribir a {email}, que atiende{' '}
          <Pending>NOMBRE O ÁREA ENCARGADA DE DATOS PERSONALES</Pending>.
        </P>

        <H2>2. Datos personales que tratamos</H2>
        <P>
          Tratamos datos de identificación, datos patrimoniales y financieros, y datos técnicos de uso.
          Todos los obtenemos directamente de ti al usar la aplicación.
        </P>
        <Table
          head={['Categoría', 'Datos', 'Para qué se usan']}
          rows={[
            ['Identificación y contacto', 'Nombre, correo electrónico', 'Crear y administrar tu cuenta'],
            ['Autenticación', 'Contraseña (almacenada cifrada por Supabase Auth; no la conocemos), identificador de usuario, tokens de sesión', 'Iniciar sesión y proteger tu cuenta'],
            ['Patrimoniales y financieros', 'Gastos e ingresos (monto, moneda, fecha, descripción, categoría), monto convertido a MXN y tipo de cambio aplicado, categorías propias, presupuestos, movimientos recurrentes, metas de ahorro, costos proyectados, archivos de importación en lote, patrimonio acumulado', 'Prestar las funciones de registro, planeación y analítica'],
            ['Técnicos', 'Dirección IP, tipo de navegador y dispositivo, fecha y hora de acceso, registros de errores', 'Seguridad, diagnóstico y continuidad del servicio'],
          ]}
        />
        <P>
          <strong>Datos patrimoniales y financieros.</strong> La Ley exige tu consentimiento expreso para
          tratarlos. Lo otorgas al aceptar este aviso al crear tu cuenta, y puedes revocarlo en cualquier
          momento (sección 7).
        </P>
        <P>
          <strong>Datos sensibles.</strong> BackendFinance no solicita datos sensibles (salud, origen
          étnico, creencias, preferencia sexual, opiniones políticas, datos biométricos ni otros). Te
          recomendamos no escribirlos en descripciones o nombres de categorías; si lo haces, los
          trataremos solo como parte de tu registro y con las mismas medidas de seguridad.
        </P>
        <P>
          <strong>Menores de edad.</strong> El servicio está dirigido a personas mayores de 18 años. No
          recabamos a sabiendas datos de menores.
        </P>

        <H2>3. Finalidades del tratamiento</H2>
        <P><strong>Finalidades necesarias</strong> (sin ellas no podemos prestarte el servicio):</P>
        <Ol items={[
          'Crear, autenticar y administrar tu cuenta.',
          'Registrar tus gastos e ingresos y guardar cada movimiento también convertido a pesos mexicanos con el tipo de cambio del día.',
          'Organizar movimientos por categorías e importar movimientos en lote.',
          'Gestionar presupuestos semanales o mensuales y avisarte cuando te acerques al límite.',
          'Registrar automáticamente tus movimientos recurrentes en su fecha.',
          'Dar seguimiento a tus metas de ahorro y comparar costos proyectados con gastos reales.',
          'Generar tu analítica (resumen mensual, evolución mensual y semanal, gasto por categoría, patrimonio y tendencias) y tus reportes en PDF.',
          'Proteger la seguridad de la plataforma, prevenir accesos no autorizados y diagnosticar errores.',
          'Atender tus solicitudes, dudas y el ejercicio de tus derechos, y cumplir obligaciones legales.',
        ]} />
        <P><strong>Finalidades voluntarias</strong> (requieren tu consentimiento y puedes rechazarlas sin perder el servicio):</P>
        <Ol items={[
          'Enviarte avisos sobre nuevas funciones o mejoras de BackendFinance.',
          'Elaborar estadísticas de uso agregadas y anónimas para mejorar la aplicación.',
        ]} />
        <P>
          Si no quieres que tus datos se usen para estas finalidades voluntarias, deja sin marcar la
          casilla correspondiente al registrarte o escríbenos a {email} en cualquier momento. Negarte no
          afecta tu acceso al servicio.
        </P>
        <P>No usamos tus datos para publicidad de terceros, perfilamiento crediticio ni venta de información.</P>

        <H2>4. Encargados y transferencias</H2>
        <P>
          Tus datos se alojan con tres proveedores de infraestructura que los tratan únicamente por
          nuestra cuenta y bajo nuestras instrucciones; no los usan para fines propios.
        </P>
        <Table
          head={['Proveedor', 'Servicio que presta', 'Datos a los que accede', 'Ubicación de los servidores']}
          rows={[
            ['Supabase, Inc.', 'Base de datos PostgreSQL y autenticación', 'Todos los datos de tu cuenta y tus registros financieros', 'Estados Unidos — Este (Norte de Virginia, us-east-1)'],
            ['Railway Corp.', 'Servidor de la API (FastAPI)', 'Datos en tránsito al procesar tus peticiones; registros técnicos', 'Estados Unidos — Oeste (US West)'],
            ['Vercel Inc.', 'Alojamiento del sitio web (frontend)', 'Datos técnicos de acceso (IP, navegador)', 'Red global de servidores'],
          ]}
        />
        <P>
          Como estos servidores pueden ubicarse fuera de México, el envío a estos proveedores implica un
          tratamiento internacional de datos. Exigimos a cada proveedor confidencialidad y medidas de
          seguridad equivalentes a las de este aviso.
        </P>
        <P>Para obtener el tipo de cambio diario consultamos fuentes externas sin enviarles ningún dato personal.</P>
        <P>
          <strong>Transferencias.</strong> No transferimos tus datos personales a terceros. Solo los
          comunicaremos a autoridades competentes cuando una ley o un mandato judicial lo exija, supuesto
          que no requiere tu consentimiento. Si en el futuro necesitáramos hacer alguna transferencia que
          sí lo requiera, actualizaremos este aviso y te pediremos tu aceptación antes de realizarla.
        </P>

        <H2>5. Medidas de seguridad</H2>
        <P>
          <strong>Cada usuario solo puede ver y modificar sus propios datos, y eso se comprueba
          automáticamente antes de publicar cualquier cambio en la aplicación.</strong>
        </P>
        <Ul items={[
          <><strong>Autenticación.</strong> El inicio de sesión usa Supabase Auth, con tokens firmados con el algoritmo ES256. Tu contraseña se guarda cifrada y nadie en BackendFinance puede leerla.</>,
          <><strong>Aislamiento por usuario.</strong> Cada consulta a la base de datos se hace con tu propio token, y las políticas de seguridad por fila de PostgreSQL impiden que una cuenta lea o modifique datos de otra.</>,
          <><strong>Verificación continua.</strong> Una prueba automática con dos cuentas reales confirma ese aislamiento en cada cambio al código; si falla, el cambio no se integra.</>,
          <><strong>Cifrado en tránsito.</strong> Toda la comunicación entre tu navegador, la API y la base de datos viaja por HTTPS.</>,
          <><strong>Acceso interno restringido.</strong> Solo <Pending>PERSONAS O ROLES AUTORIZADOS</Pending> pueden acceder a la infraestructura, y solo para mantenimiento o soporte.</>,
        ]} />
        <P>
          Ninguna medida elimina todo riesgo. Si ocurre una vulneración que afecte de forma significativa
          tus derechos, te lo informaremos sin demora para que puedas tomar medidas.
        </P>

        <H2>6. Conservación de los datos</H2>
        <P>
          Conservamos tus datos mientras tu cuenta esté activa. Si eliminas tu cuenta o solicitas la
          cancelación, bloqueamos tus datos y los suprimimos de forma definitiva en un plazo máximo de{' '}
          <Pending>NÚMERO</Pending> días, salvo lo que debamos conservar por obligación legal. Las copias
          de respaldo de los proveedores se eliminan conforme a sus ciclos de rotación.
        </P>
        <P>Los reportes PDF y archivos que descargues quedan bajo tu control en tu dispositivo.</P>

        <H2>7. Derechos ARCO y revocación del consentimiento</H2>
        <P>
          Puedes acceder a tus datos, rectificarlos, cancelarlos u oponerte a su tratamiento (derechos
          ARCO), y revocar el consentimiento que nos diste, escribiendo a {email}.
        </P>
        <P>Tu solicitud debe incluir:</P>
        <Ol items={[
          'Tu nombre y el correo electrónico con el que te registraste.',
          'Una copia de tu identificación oficial o, si actúas por medio de un representante, el documento que acredite la representación.',
          'Una descripción clara del derecho que quieres ejercer y de los datos a los que se refiere.',
          'En caso de rectificación, el dato correcto y, si aplica, el documento que lo respalde.',
        ]} />
        <P>
          Te responderemos en un plazo máximo de 20 días hábiles desde que recibamos tu solicitud. Si
          procede, la haremos efectiva dentro de los 15 días hábiles siguientes a nuestra respuesta. El
          ejercicio de estos derechos es gratuito.
        </P>
        <P>
          También puedes corregir tus movimientos, categorías y metas directamente desde la aplicación,
          y eliminar tu cuenta desde Configuración (Settings) &gt; Delete account.
        </P>
        <P>
          Revocar el consentimiento para tratar tus datos financieros implica que ya no podremos
          prestarte el servicio, porque esos datos son su contenido esencial.
        </P>

        <H2>8. Opciones para limitar el uso o divulgación</H2>
        <P>
          Puedes dejar de recibir comunicaciones sobre novedades con el enlace de baja incluido en cada
          correo, o pidiéndolo a {email}. También puedes solicitar que tus datos no se incluyan en las
          estadísticas de uso. Registraremos tu decisión y la respetaremos en adelante.
        </P>

        <H2>9. Cookies y tecnologías similares</H2>
        <P>
          BackendFinance solo usa el almacenamiento de tu navegador (cookies o almacenamiento local) para
          mantener tu sesión iniciada y recordar tus preferencias. No usamos cookies de publicidad ni de
          rastreo de terceros.
        </P>
        <P>
          Puedes borrar o bloquear estos datos desde la configuración de tu navegador; si lo haces,
          tendrás que iniciar sesión de nuevo.
        </P>

        <H2>10. Cambios, autoridad y consentimiento</H2>
        <P>
          <strong>Cambios al aviso.</strong> Publicaremos cualquier cambio en{' '}
          <a href={NOTICE_URL} style={{ color: BRAND }}>{NOTICE_URL}</a> con su fecha de actualización y
          te avisaremos por correo o dentro de la aplicación. Si el cambio implica nuevas finalidades, te
          pediremos de nuevo tu consentimiento antes de aplicarlo.
        </P>
        <P>
          <strong>Autoridad.</strong> Si consideras que tu derecho a la protección de datos fue
          vulnerado, puedes acudir a la Secretaría Anticorrupción y Buen Gobierno, autoridad que asumió
          desde el 21 de marzo de 2025 las funciones del extinto INAI en esta materia.
        </P>
        <P>
          <strong>Consentimiento.</strong> Al crear tu cuenta y marcar la casilla “He leído y acepto el
          Aviso de Privacidad”, otorgas tu consentimiento expreso para el tratamiento de tus datos
          personales, patrimoniales y financieros conforme a este aviso.
        </P>
        <P><em>Última actualización: {LAST_UPDATED}.</em></P>
      </article>
    </div>
  )
}
