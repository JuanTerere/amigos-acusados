export const catalog = {
    "no-responde": {
        label: "Nunca responde los mensajes.",
        evidences: [
            "Última respuesta registrada hace 11 días.",
            "Abrió el mensaje pero respondió mentalmente.",
            "Respondió con un 👍 después de dos semanas."
        ],
        sentences: [
            "Cebar el próximo tereré para todos sin quejarse.",
            "Llevar chipas calentitas para la próxima reunión.",
            "Invitar la próxima ronda completa de bebidas."
        ],
        defenses: [
            "No respondió porque estaba ignorando a todos por igual. Es justo.",
            "Su teléfono tiene un virus que solo bloquea tus mensajes.",
            "Estaba formulando una respuesta filosófica y se le pasó el tiempo."
        ]
    },
    "llega-tarde": {
        label: "Siempre llega tarde.",
        evidences: [
            "Dijo 'estoy llegando' cuando recién se metía a bañar.",
            "Su zona horaria personal tiene 45 minutos de retraso."
        ],
        sentences: [
            "Llegar 30 minutos antes la próxima vez para guardar lugar.",
            "Comprar el hielo para la próxima juntada por el resto del año."
        ],
        defenses: [
            "No llegó tarde. Los demás llegaron demasiado temprano.",
            "El tiempo es una construcción social, su alma llegó a tiempo."
        ]
    },
    "cancela-planes": {
        label: "Cancela los planes a último momento.",
        evidences: [
            "Le 'dolió la panza' justo cuando había que salir.",
            "Se quedó dormido 'sin querer' a las 8 PM."
        ],
        sentences: [
            "Organizar y pagar enteramente la próxima salida grupal.",
            "Dejar su teléfono como rehén la próxima vez que asista."
        ],
        defenses: [
            "Su cama lo secuestró y no tuvo opción.",
            "Tuvo una premonición de que la salida iba a ser aburrida."
        ]
    }
    // Puedes seguir agregando los demás cargos aquí fácilmente...
};

export const getRandomItem = (array) => array[Math.floor(Math.random() * array.length)];