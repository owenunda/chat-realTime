# OuChat Realtime

OuChat Realtime es una aplicación de chat en tiempo real desarrollada con Node.js, Socket.io y Firebase. Permite a los usuarios comunicarse de forma instantánea a través de mensajes públicos y privados, con autenticación segura y persistencia de datos.

## Características principales

Esta aplicación ofrece un sistema de chat completo con las siguientes funcionalidades:

**Comunicación en tiempo real**: Los mensajes se transmiten instantáneamente entre todos los usuarios conectados utilizando WebSockets a través de Socket.io, garantizando una experiencia de chat fluida y sin demoras.

**Autenticación segura**: El sistema de autenticación utiliza Firebase Authentication, permitiendo a los usuarios registrarse e iniciar sesión tanto con email y contraseña como con su cuenta de Google. Todas las sesiones están protegidas con tokens JWT.

**Chat público y privado**: Los usuarios pueden participar en conversaciones públicas donde todos pueden ver los mensajes, o iniciar chats privados uno a uno con cualquier usuario conectado.

**Persistencia de mensajes**: Todos los mensajes se almacenan en Firebase Realtime Database, permitiendo que los usuarios vean el historial de conversaciones cuando se conectan.

**Lista de usuarios en tiempo real**: La aplicación muestra en tiempo real qué usuarios están conectados, su estado de conexión y permite iniciar conversaciones privadas con un solo clic.

**Interfaz unificada**: La aplicación cuenta con una interfaz moderna y responsive que combina el login y el chat en una sola página, detectando automáticamente el estado de autenticación del usuario.

**Mantenimiento automático**: El sistema incluye una función de auto-limpieza que elimina automáticamente los mensajes después de 24 horas, ejecutándose cada hora para mantener la base de datos optimizada.

## Tecnologías utilizadas

### Backend
- **Node.js con Express.js**: Servidor web que maneja las peticiones HTTP y sirve la aplicación cliente.
- **Socket.io**: Biblioteca que implementa WebSockets para comunicación bidireccional en tiempo real entre cliente y servidor.
- **Firebase Admin SDK**: Permite la integración con los servicios de Firebase desde el servidor, incluyendo autenticación y base de datos.
- **Morgan**: Middleware para logging de peticiones HTTP, útil para monitoreo y debugging.

### Frontend
- **HTML5, CSS3 y JavaScript ES6+**: Tecnologías web estándar para crear la interfaz de usuario interactiva y responsive.
- **Firebase Web SDK**: Cliente JavaScript para integración con Firebase Authentication y Realtime Database desde el navegador.
- **Socket.io Client**: Cliente WebSocket que se conecta con el servidor Socket.io para recibir mensajes en tiempo real.

### Servicios Firebase
- **Firebase Realtime Database**: Base de datos NoSQL en tiempo real que sincroniza automáticamente los datos entre todos los clientes conectados.
- **Firebase Authentication**: Servicio de autenticación que maneja el registro, login y gestión de sesiones de usuarios.

## Instalación y configuración

### Prerrequisitos
- Node.js versión 18 o superior instalado en el sistema
- Una cuenta de Firebase con un proyecto creado
- Git para clonar el repositorio

### Pasos de instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/owenunda/chat-realTime.git
   cd chat-realTime
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar Firebase**
   - Crear un proyecto en Firebase Console
   - Habilitar Authentication (Email/Password y Google)
   - Crear una Realtime Database
   - Generar una clave de cuenta de servicio desde Project Settings > Service Accounts
   - Descargar el archivo JSON de credenciales

4. **Configurar variables de entorno**
   Crear un archivo `.env` en la raíz del proyecto con el siguiente contenido:
   ```
   FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"tu-proyecto"...}
   PORT=3001
   ```

5. **Iniciar la aplicación**
   ```bash
   npm start
   ```

6. **Acceder a la aplicación**
   Abrir el navegador en `http://localhost:3001`

## Estructura del proyecto

```
chat-realTime/
├── client/
│   └── index.html          # Aplicación frontend completa (login + chat)
├── server/
│   └── realtime-server.js  # Servidor backend con Socket.io y Firebase
├── package.json            # Dependencias y scripts de npm
├── .env                    # Variables de entorno (no incluido en git)
├── .gitignore             # Archivos y carpetas ignoradas por git
└── README.md              # Este archivo de documentación
```

## Funcionamiento interno

### Arquitectura de la aplicación

La aplicación sigue una arquitectura cliente-servidor donde:

**Cliente (Frontend)**: Una aplicación web de página única (SPA) que maneja tanto el proceso de autenticación como la interfaz de chat. Utiliza Firebase Web SDK para autenticación y Socket.io client para comunicación en tiempo real.

**Servidor (Backend)**: Un servidor Express.js que integra Socket.io para WebSockets y Firebase Admin SDK para validación de tokens y acceso a la base de datos.

**Base de datos**: Firebase Realtime Database almacena usuarios, mensajes públicos y mensajes privados en una estructura JSON jerárquica que se sincroniza automáticamente.

### Flujo de autenticación

1. El usuario accede a la aplicación y ve la interfaz de login
2. Puede registrarse o iniciar sesión con email/contraseña o Google
3. Firebase Authentication genera un token JWT
4. El token se envía al servidor a través de Socket.io
5. El servidor valida el token con Firebase Admin SDK
6. Si es válido, el usuario se registra en la lista de conectados
7. La interfaz cambia automáticamente al modo chat

### Flujo de mensajería

**Mensajes públicos:**
1. Usuario escribe mensaje en la interfaz
2. Cliente envía mensaje al servidor vía Socket.io
3. Servidor guarda el mensaje en Firebase Realtime Database
4. Firebase dispara evento de nuevo mensaje
5. Servidor retransmite el mensaje a todos los clientes conectados

**Mensajes privados:**
1. Usuario selecciona otro usuario de la lista
2. Se crea una sala privada con ID único basado en los IDs de usuarios
3. Los mensajes se guardan en una sección separada de la base de datos
4. Solo los participantes de la conversación reciben los mensajes

### Sistema de auto-limpieza

La aplicación incluye un sistema automatizado de mantenimiento que:

- Se ejecuta cada hora para revisar mensajes antiguos
- Elimina automáticamente mensajes con más de 24 horas de antigüedad
- Aplica tanto a mensajes públicos como privados
- Registra estadísticas de limpieza en los logs del servidor
- Mantiene la base de datos optimizada sin intervención manual

## Uso de la aplicación

### Registro e inicio de sesión

Los usuarios pueden crear una cuenta nueva o iniciar sesión de dos formas:

**Email y contraseña**: Permite crear una cuenta personalizada ingresando un email válido y una contraseña segura.

**Cuenta de Google**: Utiliza OAuth2 para autenticación rápida con una cuenta de Google existente.

### Navegación del chat

Una vez autenticado, el usuario tiene acceso a:

**Chat público**: Área principal donde todos los mensajes son visibles para todos los usuarios conectados. Ideal para conversaciones grupales y anuncios generales.

**Chats privados**: Conversaciones uno a uno que se inician haciendo clic en cualquier usuario de la lista de conectados. Los mensajes son privados y solo los participantes pueden verlos.

**Lista de usuarios**: Panel lateral que muestra todos los usuarios conectados en tiempo real, con indicadores de estado de conexión.

### Persistencia y sincronización

Todos los mensajes se guardan automáticamente y están disponibles cuando el usuario se reconecta. La sincronización es instantánea gracias a Firebase Realtime Database, asegurando que todos los usuarios vean los mensajes al mismo tiempo.

## Consideraciones de despliegue

Para un despliegue en producción, considerar:

- Configurar reglas de seguridad en Firebase Realtime Database
- Implementar rate limiting para prevenir spam
- Configurar HTTPS para conexiones seguras
- Establecer variables de entorno en el servidor de producción
- Configurar CORS apropiadamente para el dominio de producción
- Implementar logging y monitoreo para el servidor

## Licencia

Este proyecto está bajo la licencia ISC, permitiendo uso comercial y modificación libre del código.