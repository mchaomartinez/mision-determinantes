import { DeterminerExample } from '../types';

export const DETERMINER_EXAMPLES: DeterminerExample[] = [
  // Artículos
  { word: 'el', type: 'artículo', sentence: 'El perro corre por el parque.', explanation: 'Es un artículo determinado masculino singular.' },
  { word: 'la', type: 'artículo', sentence: 'La casa es muy grande.', explanation: 'Es un artículo determinado femenino singular.' },
  { word: 'unas', type: 'artículo', sentence: 'He visto unas flores preciosas.', explanation: 'Es un artículo indeterminado femenino plural.' },
  
  // Demostrativos
  { word: 'este', type: 'demostrativo', sentence: 'Este libro es mi favorito.', explanation: 'Indica cercanía.' },
  { word: 'aquella', type: 'demostrativo', sentence: 'Aquella montaña está muy lejos.', explanation: 'Indica lejanía.' },
  { word: 'esos', type: 'demostrativo', sentence: 'Esos zapatos te quedan bien.', explanation: 'Indica distancia media.' },

  // Posesivos
  { word: 'mi', type: 'posesivo', sentence: 'Mi mochila es azul.', explanation: 'Indica que me pertenece a mí.' },
  { word: 'vuestro', type: 'posesivo', sentence: 'Vuestro jardín es enorme.', explanation: 'Indica que os pertenece a vosotros.' },
  { word: 'sus', type: 'posesivo', sentence: 'Sus padres son simpáticos.', explanation: 'Indica que les pertenece a ellos.' },

  // Numerales
  { word: 'tres', type: 'numeral', sentence: 'Tengo tres lápices nuevos.', explanation: 'Es un numeral cardinal (indica cantidad).' },
  { word: 'segundo', type: 'numeral', sentence: 'Vivo en el segundo piso.', explanation: 'Es un numeral ordinal (indica orden).' },
  { word: 'diez', type: 'numeral', sentence: 'Hay diez niños en clase.', explanation: 'Es un numeral cardinal.' },

  // Indefinidos
  { word: 'algunos', type: 'indefinido', sentence: 'Algunos días llueve mucho.', explanation: 'Indica una cantidad imprecisa.' },
  { word: 'muchas', type: 'indefinido', sentence: 'Tengo muchas ganas de verte.', explanation: 'Indica una cantidad grande pero no exacta.' },
  { word: 'ningún', type: 'indefinido', sentence: 'No hay ningún juguete aquí.', explanation: 'Indica ausencia total.' },
];

export const DETERMINER_TYPES_INFO = {
  artículo: {
    color: 'bg-blue-400',
    description: 'Acompañan al sustantivo para concretarlo (el, la, los, las, un, una...).',
    icon: '🔍'
  },
  demostrativo: {
    color: 'bg-orange-400',
    description: 'Indican la distancia a la que está el sustantivo (este, ese, aquel...).',
    icon: '📍'
  },
  posesivo: {
    color: 'bg-purple-400',
    description: 'Indican a quién pertenece el sustantivo (mi, tu, su, nuestro...).',
    icon: '🏠'
  },
  numeral: {
    color: 'bg-green-400',
    description: 'Indican cantidad u orden (uno, dos, primero, segundo...).',
    icon: '🔢'
  },
  indefinido: {
    color: 'bg-pink-400',
    description: 'Indican una cantidad de forma imprecisa (algún, mucho, poco, varios...).',
    icon: '☁️'
  }
};
