import React, { useState, useEffect, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';
import { dividirEnPalabras, vectorBolsaDePalabras } from './utils/textProcessing.js';
import './App.css';

const App = () => {
    const [modelo, setModelo] = useState(null);
    const [intents, setIntents] = useState(null);
    const [palabras, setPalabras] = useState([]);
    const [input, setInput] = useState('');
    const [chat, setChat] = useState([]);
    const [etiquetas, setEtiquetas] = useState([]);
    const [escribiendo, setEscribiendo] = useState(false);
    const [mostrarBoton, setMostrarBoton] = useState(false);
    const chatContainerRef = useRef(null);

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                const modeloCargado = await tf.loadGraphModel('./model.json');
                const intentsRes = await fetch('./intents.json').then(res => res.json());
                const vocabularioRes = await fetch('./vocabulario.json').then(res => res.json());

                setModelo(modeloCargado);
                setIntents(intentsRes);
                setPalabras(vocabularioRes.palabras || []);
                setEtiquetas(vocabularioRes.etiquetas || []);

                console.log('[DEBUG] Vocabulario cargado:', vocabularioRes.palabras);
            } catch (error) {
                console.error('Error al cargar los datos:', error);
            }
        };
        cargarDatos();
    }, []);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chat]);

    useEffect(() => {
        const handleScroll = () => {
            if (!chatContainerRef.current) return;

            const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
            setMostrarBoton(scrollTop + clientHeight < scrollHeight - 50);
        };

        const chatBox = chatContainerRef.current;
        if (chatBox) {
            chatBox.addEventListener('scroll', handleScroll);
        }

        return () => {
            if (chatBox) {
                chatBox.removeEventListener('scroll', handleScroll);
            }
        };
    }, []);

    const manejarEntrada = async (texto) => {
        if (!modelo || !intents || palabras.length === 0) return;

        const tokens = dividirEnPalabras(texto, palabras);
        console.log('[DEBUG] Tokens procesados:', tokens);

        const vector = vectorBolsaDePalabras(tokens, palabras);
        console.log('[DEBUG] Vector de bolsa de palabras:', vector);

        const tensor = tf.tensor([vector]);
        setEscribiendo(true);

        try {
            await new Promise(resolve => setTimeout(resolve, 1500));

            const salida = modelo.predict(tensor);
            const prediccion = salida.argMax(-1).dataSync()[0];
            const confianza = salida.dataSync()[prediccion];

            if (confianza > 0.75) {
                const etiqueta = etiquetas[prediccion];
                console.log(`[DEBUG] Etiqueta detectada: ${etiqueta}`);

                if (["suma", "resta", "multiplicacion", "division"].includes(etiqueta)) {
                    const numeros = texto.match(/\d+/g)?.map(Number) || [];
                    console.log(`[DEBUG] Números extraídos: ${numeros}`);

                    if (numeros.length >= 2) {
                        const [num1, num2] = numeros;
                        let resultado;
                        if (etiqueta === "suma") {
                            resultado = num1 + num2;
                        } else if (etiqueta === "resta") {
                            resultado = num1 - num2;
                        } else if (etiqueta === "multiplicacion") {
                            resultado = num1 * num2;
                        } else if (etiqueta === "division") {
                            resultado = num2 !== 0 ? num1 / num2 : "No puedo dividir entre cero. 😅";
                        }
                        setChat(prevChat => [...prevChat, { tipo: 'bot', mensaje: `El resultado es ${resultado}` }]);
                    } else {
                        setChat(prevChat => [...prevChat, { tipo: 'bot', mensaje: 'Parece que faltan números para calcular. Intenta de nuevo.' }]);
                    }
                } else {
                    const respuestas = intents.intents.find(intent => intent.tag === etiqueta).responses;
                    const respuestaAleatoria = respuestas[Math.floor(Math.random() * respuestas.length)];
                    setChat(prevChat => [...prevChat, { tipo: 'bot', mensaje: respuestaAleatoria }]);
                }
            } else {
                setChat(prevChat => [...prevChat, { tipo: 'bot', mensaje: 'Lo siento, no entiendo eso.' }]);
            }
        } catch (error) {
            console.error('Error durante la predicción:', error);
        } finally {
            setEscribiendo(false);
        }
    };

    const manejarSubmit = (e) => {
        e.preventDefault();
        if (input.trim()) {
            setChat(prevChat => [...prevChat, { tipo: 'usuario', mensaje: input }]);
            manejarEntrada(input);
            setInput('');
        }
    };

    const bajarAlFinal = () => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior: 'smooth',
            });
        }
    };

    return (
        <div 
            className="chat-container" 
            style={{
                backgroundImage: "url('./background.jpg')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                height: "100vh",
                width: "100vw",
            }}
        >
            <h1 className="chat-title">ChatXD</h1>
            <div ref={chatContainerRef} className="chat-box">
                {chat.map((linea, index) => (
                    <div
                        key={index}
                        className={`chat-message-container ${linea.tipo}`}
                    >
                        <img
                            src={linea.tipo === 'usuario' ? './user-icon.png' : './bot-icon.png'}
                            alt={linea.tipo === 'usuario' ? 'Usuario' : 'Bot'}
                            className="chat-avatar"
                        />
                        <div className={`chat-message ${linea.tipo}`}>
                            {linea.mensaje}
                        </div>
                    </div>
                ))}
                {escribiendo && (
                    <div className="chat-message-container bot">
                        <img
                            src="/bot-icon.png"
                            alt="Bot"
                            className="chat-avatar"
                        />
                        <div className="chat-message bot typing-indicator">
                            <span>.</span><span>.</span><span>.</span>
                        </div>
                    </div>
                )}
            </div>
    
            {mostrarBoton && (
                <button onClick={bajarAlFinal} className="scroll-button">
                    ↓
                </button>
            )}
    
            <form onSubmit={manejarSubmit} className="chat-form">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Escribe tu mensaje..."
                    className="chat-input"
                />
                <button type="submit" className="chat-submit">Enviar</button>
            </form>
        </div>
    );
    
};

export default App;
