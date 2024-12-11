import winkTokenizer from 'wink-tokenizer';

const tokenizer = new winkTokenizer();

/**
 * Encuentra la raíz más relevante en el vocabulario.
 * @param {string} token - La palabra a buscar.
 * @param {Set<string>} vocabulario - Un conjunto de palabras conocidas (para eficiencia).
 * @returns {string} - La raíz más cercana encontrada en el vocabulario o el token original.
 */
const encontrarRaizDinamica = (token, vocabulario) => {
    // Primero busca coincidencia exacta
    if (vocabulario.has(token)) {
        return token;
    }

    // Si no hay coincidencia exacta, busca el prefijo más largo
    for (let i = token.length; i > 0; i--) {
        const prefijo = token.slice(0, i);
        if (vocabulario.has(prefijo)) {
            return prefijo;
        }
    }

    return token; // Si no encuentra nada, regresa el token original
};

/**
 * Divide una oración en palabras y aplica un mapeo dinámico de raíces.
 * @param {string} oracion - La entrada del usuario.
 * @param {string[]} palabrasConocidas - Lista de palabras en el vocabulario.
 * @returns {string[]} - Lista de raíces de las palabras (tokens procesados).
 */
export const dividirEnPalabras = (oracion, palabrasConocidas) => {
    const vocabulario = new Set(palabrasConocidas); // Convertir a conjunto para búsqueda rápida
    // Tokenizar la oración
    const tokens = tokenizer.tokenize(oracion.toLowerCase())
        .filter(token => token.tag === 'word' || token.tag === 'number')
        .map(token => token.value);

    // Encontrar raíces dinámicamente
    const tokensConRaices = tokens.map(token => encontrarRaizDinamica(token, vocabulario));

    console.log(`[DEBUG] Tokens originales: ${tokens}`);
    console.log(`[DEBUG] Tokens con raíces: ${tokensConRaices}`);
    return tokensConRaices;
};

/**
 * Convierte una lista de raíces en un vector de bolsa de palabras.
 * @param {string[]} tokens - Raíces de las palabras procesadas.
 * @param {string[]} palabrasConocidas - Palabras del vocabulario.
 * @returns {number[]} - Vector de bolsa de palabras.
 */
export const vectorBolsaDePalabras = (tokens, palabrasConocidas) => {
    const vector = Array(palabrasConocidas.length).fill(0);

    tokens.forEach(token => {
        const indice = palabrasConocidas.indexOf(token);
        if (indice !== -1) {
            vector[indice] = 1;
        } else {
            console.warn(`[DEBUG] Token no encontrado en el vocabulario: ${token}`);
        }
    });

    console.log(`[DEBUG] Vector de bolsa de palabras generado: ${vector}`);
    return vector;
};