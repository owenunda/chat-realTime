import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import admin from 'firebase-admin'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import logger from 'morgan'
import dotenv from 'dotenv'

// Configuración
dotenv.config()
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const port = process.env.PORT || 3001

// Configurar Firebase Admin
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://ouchat-realtime-1d262-default-rtdb.firebaseio.com"
})

const db = admin.database()

// Configurar Express y Socket.io
const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
})

app.use(express.static(join(__dirname, '..', 'client')))
app.use(logger('dev'))

// Mapa de usuarios conectados
const connectedUsers = new Map()

// Función para limpiar mensajes antiguos (más de 24 horas)
async function cleanOldMessages() {
  try {
    const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000) // 24 horas en milisegundos
    
    console.log('🧹 Iniciando limpieza de mensajes antiguos...')
    
    // Limpiar mensajes públicos
    const publicMessagesRef = db.ref('messages/public')
    const publicSnapshot = await publicMessagesRef.orderByChild('timestamp').endAt(twentyFourHoursAgo).once('value')
    
    let publicDeleted = 0
    const publicPromises = []
    publicSnapshot.forEach(childSnapshot => {
      publicPromises.push(childSnapshot.ref.remove())
      publicDeleted++
    })
    await Promise.all(publicPromises)
    
    // Limpiar mensajes privados
    const privateMessagesRef = db.ref('messages/private')
    const privateRoomsSnapshot = await privateMessagesRef.once('value')
    
    let privateDeleted = 0
    const privatePromises = []
    
    privateRoomsSnapshot.forEach(roomSnapshot => {
      roomSnapshot.forEach(messageSnapshot => {
        const message = messageSnapshot.val()
        if (message.timestamp && message.timestamp <= twentyFourHoursAgo) {
          privatePromises.push(messageSnapshot.ref.remove())
          privateDeleted++
        }
      })
    })
    await Promise.all(privatePromises)
    
    if (publicDeleted > 0 || privateDeleted > 0) {
      console.log(` Limpieza completada: ${publicDeleted} mensajes públicos y ${privateDeleted} mensajes privados eliminados`)
    } else {
      console.log(' Limpieza completada: No hay mensajes antiguos para eliminar')
    }
    
  } catch (error) {
    console.error(' Error durante la limpieza de mensajes:', error)
  }
}

// Ejecutar limpieza cada hora
setInterval(cleanOldMessages, 60 * 60 * 1000) // Cada hora

// Ejecutar limpieza inicial al iniciar el servidor
setTimeout(cleanOldMessages, 5000) // Esperar 5 segundos después del inicio

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('🔌 Usuario conectado:', socket.id)

  // Autenticación del usuario
  socket.on('authenticate', async (token) => {
    try {
      const decodedToken = await admin.auth().verifyIdToken(token)
      const userId = decodedToken.uid
      const username = decodedToken.name || decodedToken.email
      
      socket.userId = userId
      socket.username = username
      
      // Registrar usuario en Realtime Database
      await db.ref(`users/${userId}`).set({
        id: userId,
        name: username,
        email: decodedToken.email,
        online: true,
        lastSeen: admin.database.ServerValue.TIMESTAMP,
        socketId: socket.id
      })
      
      connectedUsers.set(userId, {
        id: userId,
        name: username,
        email: decodedToken.email,
        socketId: socket.id
      })
      
      console.log(`🟢 Usuario autenticado: ${username} (${userId})`)
      
      // Emitir lista actualizada de usuarios
      const usersList = Array.from(connectedUsers.values())
      io.emit('users list', usersList)
      
      socket.emit('authenticated', { userId, username })
      
    } catch (error) {
      console.error(' Error de autenticación:', error)
      socket.emit('auth error', 'Token inválido')
    }
  })

  // Mensaje público
  socket.on('chat message', async (data) => {
    if (!socket.userId) return
    
    const messageData = {
      id: Date.now().toString(),
      content: data.message,
      userId: socket.userId,
      username: socket.username,
      timestamp: admin.database.ServerValue.TIMESTAMP,
      type: 'public'
    }
    
    // Guardar en Realtime Database
    await db.ref('messages/public').push(messageData)
    
    console.log(`💬 ${socket.username}: ${data.message}`)
  })

  // Mensaje privado
  socket.on('private message', async (data) => {
    if (!socket.userId) return
    
    const { recipientId, message } = data
    const roomId = [socket.userId, recipientId].sort().join('-')
    
    const messageData = {
      id: Date.now().toString(),
      content: message,
      senderId: socket.userId,
      senderName: socket.username,
      recipientId: recipientId,
      timestamp: admin.database.ServerValue.TIMESTAMP,
      read: false
    }
    
    // Guardar en Realtime Database
    await db.ref(`messages/private/${roomId}`).push(messageData)
    
    console.log(` ${socket.username} → ${recipientId}: ${message}`)
  })

  // Unirse a chat privado
  socket.on('join private chat', async (recipientId) => {
    if (!socket.userId) return
    
    const roomId = [socket.userId, recipientId].sort().join('-')
    socket.join(roomId)
    
    console.log(`👥 ${socket.username} se unió al chat privado: ${roomId}`)
    
    // Cargar historial de mensajes privados
    const messagesRef = db.ref(`messages/private/${roomId}`)
    const snapshot = await messagesRef.orderByChild('timestamp').limitToLast(50).once('value')
    
    const messages = []
    snapshot.forEach(childSnapshot => {
      messages.push(childSnapshot.val())
    })
    
    socket.emit('private chat history', { roomId, messages })
  })

  // Desconexión
  socket.on('disconnect', () => {
    if (socket.userId) {
      console.log(`🔴 Usuario desconectado: ${socket.username}`)
      
      // Marcar como offline en Realtime Database
      db.ref(`users/${socket.userId}`).update({
        online: false,
        lastSeen: admin.database.ServerValue.TIMESTAMP
      })
      
      connectedUsers.delete(socket.userId)
      
      // Emitir lista actualizada
      const usersList = Array.from(connectedUsers.values())
      io.emit('users list', usersList)
    }
  })
})

// Configurar listeners en tiempo real para mensajes públicos
db.ref('messages/public').on('child_added', (snapshot) => {
  const message = snapshot.val()
  io.emit('chat message', message)
})

// Configurar listeners para mensajes privados
db.ref('messages/private').on('child_added', (snapshot) => {
  const roomId = snapshot.key
  
  snapshot.ref.on('child_added', (messageSnapshot) => {
    const message = messageSnapshot.val()
    io.to(roomId).emit('private message received', message)
  })
})

// Rutas - Todas redirigen al archivo unificado
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, '..', 'client', 'index.html'))
})

app.get('/login', (req, res) => {
  res.sendFile(join(__dirname, '..', 'client', 'index.html'))
})

app.get('/chat', (req, res) => {
  res.sendFile(join(__dirname, '..', 'client', 'index.html'))
})

// Iniciar servidor
server.listen(port, () => {
  console.log(`🚀 Firebase Realtime Chat Server running on port ${port}`)
  console.log(`📱 Accede a: http://localhost:${port}/chat`)
  console.log(`🔥 Firebase Realtime Database URL: https://ouchat-realtime-1d262-default-rtdb.firebaseio.com`)
  console.log(`🧹 Limpieza automática: Los mensajes se eliminan después de 24 horas`)
  console.log(`⏰ Limpieza cada: 1 hora`)
})
