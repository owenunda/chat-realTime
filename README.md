# OuChat 💬

Una aplicación de chat en tiempo real construida con Node.js, Socket.io y Turso (LibSQL). Los usuarios pueden enviar mensajes instantáneamente y ver mensajes de otros usuarios conectados en tiempo real.

## ✨ Características

- **Chat en tiempo real**: Mensajes instantáneos usando WebSockets
- **Persistencia de datos**: Los mensajes se almacenan en una base de datos Turso
- **Recuperación de conexión**: Los mensajes perdidos durante desconexiones se recuperan automáticamente
- **Nombres de usuario automáticos**: Generación automática de nombres usando la API de API-Ninjas
- **Interfaz moderna**: Diseño limpio y responsive
- **Historial completo**: Acceso a todos los mensajes anteriores al conectarse

## 🛠️ Tecnologías

- **Backend**: Node.js, Express.js
- **WebSockets**: Socket.io
- **Base de datos**: Turso (LibSQL)
- **Frontend**: HTML5, CSS3, JavaScript vanilla
- **API externa**: API-Ninjas para generación de nombres de usuario

## 📋 Requisitos previos

- Node.js (versión 18 o superior)
- Una cuenta en [Turso](https://turso.tech/)
- Clave de API de [API-Ninjas](https://api.api-ninjas.com/) (opcional, para nombres automáticos)

## 🚀 Instalación y configuración

1. **Clona el repositorio:**
   ```bash
   git clone https://github.com/owenunda/chat-realTime.git
   cd chat-realTime
   ```

2. **Instala las dependencias:**
   ```bash
   npm install
   ```

3. **Configura las variables de entorno:**
   
   Crea un archivo `.env` en la raíz del proyecto:
   ```env
   PORT=3000
   DB_TOKEN=tu_token_de_turso_aqui
   ```

4. **Configura la base de datos Turso:**
   - Crea una cuenta en [Turso](https://turso.tech/)
   - Crea una nueva base de datos
   - Obtén tu token de autenticación
   - Actualiza la URL de la base de datos en `server/index.js` si es necesario

## 🎯 Uso

1. **Inicia el servidor en modo desarrollo:**
   ```bash
   npm run dev
   ```

2. **Abre tu navegador y visita:**
   ```
   http://localhost:3000
   ```

3. **¡Comienza a chatear!**
   - Tu nombre de usuario se generará automáticamente
   - Escribe mensajes en el campo de texto
   - Presiona Enter o haz clic en "Enviar"
   - Ve mensajes de otros usuarios en tiempo real

## 📁 Estructura del proyecto

```
chat-realTime/
├── cliente/
│   └── index.html          # Frontend del chat
├── server/
│   └── index.js           # Servidor principal
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

## 🔧 Scripts disponibles

- `npm run dev`: Inicia el servidor en modo desarrollo con auto-reload
- `npm start`: Inicia el servidor en modo producción (requiere definir el script)

## 🌐 Características técnicas

### Backend
- **Express.js**: Servidor web y API REST
- **Socket.io**: Comunicación en tiempo real bidireccional
- **Morgan**: Logging de peticiones HTTP
- **Turso/LibSQL**: Base de datos serverless

### Frontend
- **WebSockets**: Conexión en tiempo real con el servidor
- **LocalStorage**: Almacenamiento local del nombre de usuario
- **API-Ninjas**: Generación automática de nombres de usuario
- **Diseño responsive**: Compatible con dispositivos móviles

### Base de datos
```sql
CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content TEXT,
  user TEXT
);
```

## 🔒 Seguridad y mejores prácticas

- Variables de entorno para datos sensibles
- Validación de entrada en el servidor
- Manejo de errores robusto
- Recuperación automática de conexión

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Para contribuir:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia ISC. Ve el archivo `LICENSE` para más detalles.

## 🚀 Próximas características

- [ ] Salas de chat privadas
- [ ] Envío de imágenes y archivos
- [ ] Notificaciones push
- [ ] Temas personalizables
- [ ] Moderación de mensajes
- [ ] Estados de usuario (en línea/ausente)
- [ ] Mensajes privados entre usuarios

## 📞 Soporte

Si tienes alguna pregunta o necesitas ayuda, puedes:

- Abrir un issue en GitHub
- Contactar al desarrollador

---

**Desarrollado con ❤️ por [owenunda](https://github.com/owenunda)**