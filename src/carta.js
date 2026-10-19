/**
 * carta.js — Configuración central de la carta para Yohandry
 * 
 * Enfoque: Reconocimiento de lo maravillosa y valiosa que es, amor incondicional,
 * apoyo eterno ("nunca estarás sola"), deseo de consentirla ("mi bebé consentida")
 * y la nostalgia de su calidez, sus abrazos y sus besos.
 */

export const NOMBRE_REMITENTE = 'David';
export const NOMBRE_DESTINATARIA = 'Yohandry';

// 12 fotos reales en public/fotos/ (1.jpg a 12.jpg)
export const FOTOS = [
  '/fotos/1.jpg',
  '/fotos/2.jpg',
  '/fotos/3.jpg',
  '/fotos/4.jpg',
  '/fotos/5.jpg',
  '/fotos/6.jpg',
  '/fotos/7.jpg',
  '/fotos/8.jpg',
  '/fotos/9.jpg',
  '/fotos/10.jpg',
  '/fotos/11.jpg',
  '/fotos/12.jpg',
];

// 12 recuerdos vinculados a las 12 rosas por los 12 meses compartidos
export const RECUERDOS = [
  {
    id: 1,
    rosaIndex: 0,
    foto: '/fotos/1.jpg',
    titulo: 'Entrenando juntos',
    anecdota: 'Cuando íbamos al gimnasio juntos a entrenar, cosa que me encantaba compartir esos lindos momentos a tu lado.'
  },
  {
    id: 2,
    rosaIndex: 1,
    foto: '/fotos/2.jpg',
    titulo: 'Aventura en el río',
    anecdota: 'Cuando fui para el río contigo y tu familia: fue un día maravilloso al poder compartir esa experiencia, viajar contigo en el motor y tumbar mangos... jajaja, fue hermoso.'
  },
  {
    id: 3,
    rosaIndex: 2,
    foto: '/fotos/3.jpg',
    titulo: 'Mañanas en el colegio',
    anecdota: 'Cuando estábamos en el colegio, todas las mañanas sin falta nos las pasábamos juntos disfrutando nuestra compañía mutua, momentos bellos de la vida.'
  },
  {
    id: 4,
    rosaIndex: 3,
    foto: '/fotos/4.jpg',
    titulo: 'Fotos antes de salir',
    anecdota: 'Cuando nos tomábamos fotos antes de salir. A pesar de todo siempre había una foto nuestra y yo las guardaba con mucho cariño.'
  },
  {
    id: 5,
    rosaIndex: 4,
    foto: '/fotos/5.jpg',
    titulo: 'Nuestras selfies',
    anecdota: 'Recuerdos de una selfie que nos tomamos. Uno de los momentos que más me encantaba era guardar recuerdos a tu lado.'
  },
  {
    id: 6,
    rosaIndex: 5,
    foto: '/fotos/6.jpg',
    titulo: 'El día de tu cumpleaños',
    anecdota: 'Inolvidable, el día de tu cumpleaños: fue maravilloso, incluso nos quedamos dormidos hasta tarde ese día en el mueble. Fue hermoso compartir con mi niña.'
  },
  {
    id: 7,
    rosaIndex: 6,
    foto: '/fotos/7.jpg',
    titulo: 'Vísperas de Año Nuevo',
    anecdota: 'Una foto en vísperas de año nuevo, cuando salíamos a pasear juntos iniciando un nuevo año.'
  },
  {
    id: 8,
    rosaIndex: 7,
    foto: '/fotos/8.jpg',
    titulo: 'Diciembre a tu lado',
    anecdota: 'Recuerdos de diciembre. Mi primer diciembre fuera de casa lo pasé a tu lado y fue de los mejores.'
  },
  {
    id: 9,
    rosaIndex: 8,
    foto: '/fotos/9.jpg',
    titulo: 'Juntos en el parque',
    anecdota: 'Un recuerdo en el parque luego de las festividades navideñas.'
  },
  {
    id: 10,
    rosaIndex: 9,
    foto: '/fotos/10.jpg',
    titulo: 'Las patronales',
    anecdota: 'Una foto de las patronales, luego de un año conociéndonos nos tomamos esa foto. Aún recuerdo la primera foto que nos tomamos en ese mismo lugar el año anterior.'
  },
  {
    id: 11,
    rosaIndex: 10,
    foto: '/fotos/11.jpg',
    titulo: 'Nuestros resultados',
    anecdota: 'Una fotito juntos en el gym, presumiendo los resultados que habíamos conseguido juntos jajajaja.'
  },
  {
    id: 12,
    rosaIndex: 11,
    foto: '/fotos/12.jpg',
    titulo: 'Nuestra última salida en la villa',
    anecdota: 'La última foto juntos que tenemos, y es algo muy especial ya que a esa villa fue que me invitaste cuando nos estábamos conociendo y ahí nos juntamos por primera vez en persona, pero lastimosamente un año después fue la última salida que tuvimos como pareja.'
  }
];

// Música de fondo: Playlist de dos temas (Alex425 - Dame Amor + Emmanuel Cortés - Amor)
export const PLAYLIST_AUDIO = [
  {
    titulo: 'Dame Amor',
    artista: 'OfficialAlex425',
    src: '/audio/OfficialAlex425 - Dame Amor (Visualizer).mp3'
  },
  {
    titulo: 'Amor',
    artista: 'Emmanuel Cortés',
    src: '/audio/Emmanuel Cortes- Amor (Official Video).mp3'
  }
];

export const RUTA_AUDIO = PLAYLIST_AUDIO[0].src;

// Texto completo, puro y emotivo de la carta
export const CARTA_COMPLETA = `Yohandry,

Te escribo esto desde el lugar más sincero de mi pecho. No es una despedida ni un hasta nunca; jamás podría cerrar una puerta contigo de esa manera. Solo necesito que leas esto con calma, porque nace de un amor real, tan limpio y tan hondo que a veces, te lo confieso con el alma abierta, duele.

Sé muy bien cuál es tu realidad hoy. Sé que estás con alguien, aunque me parta por dentro ver que no te da el lugar que te corresponde, que no te cuida ni te trata como a la mujer increíble que eres. Y aunque me muero por tenerte aquí conmigo y desvivirme por hacerte feliz, he tenido que aprender a guardar un poco de distancia. No porque te quiera menos —jamás pienses eso—, sino porque duele demasiado y necesito cuidar este corazón que ya ha salido bastante lastimado.

Pero guardar distancia no significa irme. Quiero que te quede grabado esto para siempre: vales demasiado, Yohandry. Vales más de lo que cualquiera pueda hacerte creer y no mereces amores a medias ni tratos fríos. Si algún día sientes que el mundo se te cae encima, si los días se ponen oscuros o llegas a sentirte sola o abandonada, por favor piensa en mí. Recuerda que aquí hay un hombre que siempre estará para ti, sin juzgarte, sin pedirte nada a cambio, listo para escucharte y ser tu refugio.

Te amo de verdad. Si de mí dependiera, serías mi bebé consentida todos los días de la vida. Me muero por poder darte todo lo que en su momento, cuando fuimos novios, no supe o no pude darte: llenarte de atenciones, consentirte en cada detalle, cuidarte y darte todo el cariño que siempre te has merecido.

No sabes cuánta falta me hace tu calor. Extraño la paz de tus abrazos, la ternura de tus besos y el simple hecho de tenerte cerca. Me haces una falta inmensa en cada instante.

Aquí sigo, con el corazón en la mano y la verdad por delante. No te estoy diciendo adiós; solo te estoy recordando quién eres, lo mucho que vales y que aquí siempre habrá un hombre que muere por ti.

Con todo mi amor,
David`;

// Capítulos interactivos y dinámicos para la presentación motion-graphics
export const CAPITULOS_CARTA = [
  {
    id: 'valor',
    numero: 'I',
    etiqueta: 'Lo Que Vales',
    icono: '✨',
    titulo: 'Lo Mucho Que Vales',
    cita: '«Vales demasiado para conformarte con amores a medias o que te traten con frialdad.»',
    texto: 'Necesito que recuerdes la mujer tan increíble y valiosa que eres. No dejes que nadie, absolutamente nadie, te haga dudar de tu valor ni te haga sentir menos. Me duele en el alma verte con alguien que no te sabe querer ni te da el lugar que mereces, porque ante mis ojos mereces el mundo entero.',
    faseRosa: 'apertura'
  },
  {
    id: 'amor-real',
    numero: 'II',
    etiqueta: 'Amor Real',
    icono: '💖',
    titulo: 'Un Amor Que Hasta Duele',
    cita: '«Lo que siento por ti es tan real y tan hondo que a veces duele en el pecho.»',
    texto: 'Lo mío por ti no es un capricho ni algo pasajero. Es un amor limpio, sincero y genuino, de esos que calan hasta el fondo. No te imaginas cuánto daría por tenerte aquí a mi lado y hacerte feliz; pero es un amor tan grande que, al ver las cosas como están hoy, hasta me duele el alma.',
    faseRosa: 'cambio'
  },
  {
    id: 'distancia',
    numero: 'III',
    etiqueta: 'Mi Distancia y Mi Apoyo',
    icono: '🛡️',
    titulo: 'Nunca Estarás Sola',
    cita: '«Guardo un poco de distancia para no romperme más, pero jamás te dejaré sola.»',
    texto: 'Si hoy doy unos pasos atrás no es porque me haya ido, sino para protegerme de no salir más lastimado de lo que ya estoy. Pero escúchame bien: cuando sientas que el mundo te pesa, cuando creas que estás sola o te sientas abandonada, piensa en mí. Yo siempre he estado, estoy y estaré para ti, incondicionalmente.',
    faseRosa: 'perdon'
  },
  {
    id: 'consentida',
    numero: 'IV',
    etiqueta: 'Mi Mayor Deseo',
    icono: '🧸',
    titulo: 'Mi Bebé Consentida',
    cita: '«Muero por hacerte feliz y darte todo lo que nunca pude darte cuando fuimos novios.»',
    texto: 'Te amo con toda mi alma. Si pudiera tenerte aquí conmigo, serías mi bebé consentida en cada momento: llenarte de mimos, de atenciones sinceras, cuidarte y darte todo ese cariño y devoción que en el pasado no supe o no pude darte. Aquí hay un hombre que se desvive por verte sonreír.',
    faseRosa: 'apertura'
  },
  {
    id: 'nostalgia',
    numero: 'V',
    etiqueta: 'Lo Que Extraño',
    icono: '🌸',
    titulo: 'Tu Calor y Tus Abrazos',
    cita: '«Extraño tu calor, la paz de tus abrazos y la magia de tus besos.»',
    texto: 'No te imaginas la falta que me haces todos los días. Extraño la calidez de tu cuerpo junto al mío, la tranquilidad infinita que sentía cada vez que te abrazaba y la dulzura de tus besos. Extraño a mi persona favorita en el mundo: a ti, tal como eres.',
    faseRosa: 'cambio'
  },
  {
    id: 'promesa',
    numero: 'VI',
    etiqueta: 'No Es Un Adiós',
    icono: '🌹',
    titulo: 'Esto No Es Una Despedida',
    cita: '«No es un hasta nunca; es solo recordarte que aquí hay alguien que muere por ti.»',
    texto: 'Esto no es un adiós ni una despedida. Es una carta para que nunca olvides quién eres y lo que vales. Pase lo que pase con tu vida, aquí siempre tendrás a alguien que te quiere de verdad, que te respeta y que te espera con el corazón abierto. Te amo, Yohandry.',
    faseRosa: 'cambio'
  }
];

export const CONFIG = {
  nombreDestinataria: NOMBRE_DESTINATARIA,
  nombreRemitente: NOMBRE_REMITENTE,
  totalRosas: 12,
  calidad: {
    pixelRatioMax: 1.75,
    petalosMaximos: 120,
    corazonesCanvas: 28,
    sombras: false
  },
  rendimiento: {
    fpsMin: 36,
    fpsObjetivo: 55,
    intervaloMs: 1500
  }
};
