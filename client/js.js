        // Configuración de Firebase
        import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js'
        import { 
            getAuth, 
            onAuthStateChanged, 
            signInWithEmailAndPassword,
            createUserWithEmailAndPassword,
            signInWithPopup,
            GoogleAuthProvider,
            updateProfile,
            signOut 
        } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js'

        const firebaseConfig = {
            apiKey: "AIzaSyCuegcqofvudg5wqSo0PXZ9cVLrh4qBk14",
            authDomain: "ouchat-realtime-1d262.firebaseapp.com",
            databaseURL: "https://ouchat-realtime-1d262-default-rtdb.firebaseio.com",
            projectId: "ouchat-realtime-1d262",
            storageBucket: "ouchat-realtime-1d262.firebasestorage.app",
            messagingSenderId: "33533365543",
            appId: "1:33533365543:web:88f8523121e15ee654ad02"
        }

        const app = initializeApp(firebaseConfig)
        const auth = getAuth(app)
        const googleProvider = new GoogleAuthProvider()

        // Variables globales
        let currentUser = null
        let socket = null
        let currentTab = 'public'
        let selectedUser = null
        let currentAuthMode = 'login'

        // Elementos del DOM - Login
        const loginScreen = document.getElementById('loginScreen')
        const chatScreen = document.getElementById('chatScreen')
        const authForm = document.getElementById('authForm')
        const authTabs = document.querySelectorAll('.auth-tab')
        const authButton = document.getElementById('authButton')
        const googleAuthButton = document.getElementById('googleAuth')
        const errorMessage = document.getElementById('errorMessage')
        const loadingMessage = document.getElementById('loadingMessage')
        const nameGroup = document.getElementById('nameGroup')

        // Elementos del DOM - Chat
        const elements = {
            messages: document.getElementById('messages'),
            form: document.getElementById('form'),
            input: document.getElementById('input'),
            connectionStatus: document.getElementById('connectionStatus'),
            logoutBtn: document.getElementById('logoutBtn'),
            conversationsList: document.getElementById('conversationsList')
        }

        // Funciones de utilidad
        function showError(message) {
            errorMessage.textContent = message
            errorMessage.classList.remove('hidden')
            setTimeout(() => {
                errorMessage.classList.add('hidden')
            }, 5000)
        }

        function showLoading(show = true) {
            if (show) {
                loadingMessage.classList.remove('hidden')
            } else {
                loadingMessage.classList.add('hidden')
            }
        }

        function switchScreen(screen) {
            if (screen === 'login') {
                loginScreen.classList.remove('hidden')
                chatScreen.classList.add('hidden')
            } else {
                loginScreen.classList.add('hidden')
                chatScreen.classList.remove('hidden')
                chatScreen.classList.add('active')
                chatScreen.style.display = 'block'
            }
        }

        // Manejo de pestañas de autenticación
        authTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                authTabs.forEach(t => t.classList.remove('active'))
                tab.classList.add('active')
                
                currentAuthMode = tab.dataset.mode
                
                if (currentAuthMode === 'register') {
                    authButton.textContent = 'Crear Cuenta'
                    nameGroup.classList.remove('hidden')
                } else {
                    authButton.textContent = 'Iniciar Sesión'
                    nameGroup.classList.add('hidden')
                }
            })
        })

        // Manejo del formulario de autenticación
        authForm.addEventListener('submit', async (e) => {
            e.preventDefault()
            
            const email = document.getElementById('email').value
            const password = document.getElementById('password').value
            const displayName = document.getElementById('displayName').value

            showLoading(true)
            
            try {
                let userCredential
                
                if (currentAuthMode === 'register') {
                    userCredential = await createUserWithEmailAndPassword(auth, email, password)
                    
                    if (displayName) {
                        await updateProfile(userCredential.user, {
                            displayName: displayName
                        })
                    }
                } else {
                    userCredential = await signInWithEmailAndPassword(auth, email, password)
                }
                
                // El usuario será manejado por onAuthStateChanged
                
            } catch (error) {
                showLoading(false)
                showError(getErrorMessage(error.code))
            }
        })

        // Autenticación con Google
        googleAuthButton.addEventListener('click', async () => {
            showLoading(true)
            
            try {
                await signInWithPopup(auth, googleProvider)
                // El usuario será manejado por onAuthStateChanged
            } catch (error) {
                showLoading(false)
                showError(getErrorMessage(error.code))
            }
        })

        function getErrorMessage(errorCode) {
            const errorMessages = {
                'auth/user-not-found': 'Usuario no encontrado',
                'auth/wrong-password': 'Contraseña incorrecta',
                'auth/email-already-in-use': 'El correo ya está en uso',
                'auth/weak-password': 'La contraseña es muy débil',
                'auth/invalid-email': 'Correo electrónico inválido',
                'auth/popup-closed-by-user': 'Autenticación cancelada',
                'auth/network-request-failed': 'Error de conexión'
            }
            
            return errorMessages[errorCode] || 'Error de autenticación'
        }

        // Verificar estado de autenticación
        onAuthStateChanged(auth, async (user) => {
            showLoading(false)
            
            if (!user) {
                switchScreen('login')
                return
            }

            currentUser = user
            
            // Guardar en localStorage
            localStorage.setItem('user', JSON.stringify({
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL
            }))
            
            switchScreen('chat')
            
            setupPublicChat()
            
            initializeSocket()
        })

        // Inicializar Socket.io
        function initializeSocket() {
            socket = io()
            
            socket.on('connect', async () => {
                updateConnectionStatus(true)
                
                // Autenticar con el servidor
                const token = await currentUser.getIdToken()
                socket.emit('authenticate', token)
            })

            socket.on('disconnect', () => {
                updateConnectionStatus(false)
            })

            socket.on('authenticated', (data) => {
                elements.messages.innerHTML = ''
                
                if (currentTab === 'public') {
                    addSystemMessage('<i class="fas fa-wifi"></i> Conectado al chat público')
                }
            })

            socket.on('users list', (users) => {
                updateUsersList(users)
            })

            socket.on('chat message', (message) => {
                if (currentTab === 'public') {
                    addMessage(message, 'public')
                }
            })

            socket.on('private message received', (message) => {
                if (currentTab === 'private') {
                    addMessage(message, 'private')
                }
            })

            socket.on('private chat history', (data) => {
                if (currentTab === 'private') {
                    elements.messages.innerHTML = ''
                    if (data.messages.length === 0) {
                        addSystemMessage('<i class="fas fa-comment-dots"></i> No hay mensajes aún. ¡Envía el primero!')
                    } else {
                        data.messages.forEach(msg => addMessage(msg, 'private'))
                    }
                    scrollToBottom()
                }
            })
        }

        // Actualizar estado de conexión
        function updateConnectionStatus(connected) {
            elements.connectionStatus.className = connected ? 'connection-status' : 'connection-status disconnected'
        }

        // Actualizar lista de conversaciones (estilo WhatsApp)
        function updateUsersList(users) {
            const conversationsList = document.getElementById('conversationsList')
            
            // Mantener el chat público y limpiar el resto
            const publicChat = conversationsList.querySelector('[data-type="public"]')
            conversationsList.innerHTML = ''
            conversationsList.appendChild(publicChat)
            
            if (users.length === 0) {
                return
            }

            users.forEach(user => {
                if (user.id === currentUser.uid) return
                
                const li = document.createElement('li')
                li.className = 'conversation-item'
                li.setAttribute('data-type', 'private')
                li.setAttribute('data-id', user.id)
                
                const avatar = user.name.charAt(0).toUpperCase()
                
                li.innerHTML = `
                    <div class="conversation-avatar online">
                        ${avatar}
                    </div>
                    <div class="conversation-content">
                        <div class="conversation-header">
                            <div class="conversation-name">${user.name}</div>
                            <div class="conversation-time">en línea</div>
                        </div>
                        <div class="conversation-preview">
                            <div class="last-message">¡Inicia una conversación!</div>
                            <div class="unread-badge hidden">0</div>
                        </div>
                    </div>
                `
                
                li.onclick = () => selectConversation(li, user)
                conversationsList.appendChild(li)
            })
        }

        // Seleccionar conversación (estilo WhatsApp)
        function selectConversation(conversationElement, user = null) {
            // Remover clase active de todas las conversaciones
            document.querySelectorAll('.conversation-item').forEach(item => {
                item.classList.remove('active')
            })
            
            // Activar conversación seleccionada
            conversationElement.classList.add('active')
            
            // En móvil, mostrar el chat y ocultar la lista
            if (window.innerWidth <= 768) {
                document.querySelector('.main-container').classList.add('chat-active')
            }
            
            const conversationType = conversationElement.getAttribute('data-type')
            const conversationId = conversationElement.getAttribute('data-id')
            
            if (conversationType === 'public') {
                currentTab = 'public'
                selectedUser = null
                
                // Actualizar header del chat
                document.getElementById('currentChatAvatar').innerHTML = '<i class="fas fa-comments"></i>'
                document.getElementById('currentChatName').textContent = 'Chat Público'
                document.getElementById('currentChatStatus').innerHTML = '<i class="fas fa-circle" style="color: #00a884; font-size: 8px; margin-right: 6px;"></i>Activo ahora'
                
                // Limpiar mensajes y mostrar mensaje de bienvenida
                elements.messages.innerHTML = ''
                addSystemMessage('<i class="fas fa-globe"></i> Chat público - Visible para todos los usuarios')
                
            } else if (conversationType === 'private' && user) {
                currentTab = 'private'
                selectedUser = user
                
                // Actualizar header del chat
                const avatar = user.name.charAt(0).toUpperCase()
                document.getElementById('currentChatAvatar').innerHTML = `<span style="font-weight: 600;">${avatar}</span>`
                document.getElementById('currentChatName').textContent = user.name
                document.getElementById('currentChatStatus').innerHTML = '<i class="fas fa-circle" style="color: #00a884; font-size: 8px; margin-right: 6px;"></i>en línea'
                
                // Unirse al chat privado
                socket.emit('join private chat', user.id)
            }
        }
        
        // Configurar el chat público por defecto
        function setupPublicChat() {
            const publicChatItem = document.querySelector('[data-type="public"]')
            publicChatItem.onclick = () => selectConversation(publicChatItem)
        }



        // Agregar mensaje del sistema
        function addSystemMessage(text) {
            const div = document.createElement('div')
            div.style.cssText = `
                align-self: center;
                background: rgba(255, 255, 255, 0.05);
                color: #999;
                font-style: italic;
                text-align: center;
                max-width: 90%;
                border-radius: 25px;
                padding: 0.8rem 1rem;
                margin: 0.5rem 0;
                animation: messageSlide 0.3s ease;
            `
            div.innerHTML = text
            elements.messages.appendChild(div)
            scrollToBottom()
        }

        // Agregar mensaje a la UI (estilo WhatsApp)
        function addMessage(message, type) {
            const messageDiv = document.createElement('div')
            const isOwn = message.senderId === currentUser.uid || message.userId === currentUser.uid
            
            messageDiv.className = `message ${isOwn ? 'own' : 'other'}`
            
            const bubble = document.createElement('div')
            bubble.className = 'message-bubble'
            
            // Solo mostrar nombre del autor en mensajes públicos y si no es nuestro
            if (type === 'public' && !isOwn) {
                const header = document.createElement('div')
                header.className = 'message-header'
                
                const author = document.createElement('span')
                author.className = 'message-author'
                author.textContent = message.username
                
                header.appendChild(author)
                bubble.appendChild(header)
            }
            
            const content = document.createElement('div')
            content.className = 'message-content'
            content.textContent = message.content
            bubble.appendChild(content)
            
            const time = document.createElement('div')
            time.className = 'message-time'
            
            const timestamp = new Date(message.timestamp).toLocaleTimeString('es-ES', { 
                hour: '2-digit', 
                minute: '2-digit' 
            })
            
            // Agregar icono según el tipo de mensaje
            const messageIcon = type === 'public' ? 
                '<i class="fas fa-globe" style="font-size: 10px; margin-right: 4px; opacity: 0.6;"></i>' : 
                '<i class="fas fa-lock" style="font-size: 10px; margin-right: 4px; opacity: 0.6;"></i>'
            
            time.innerHTML = `
                ${messageIcon}${timestamp}
                ${isOwn ? '<span class="message-status"><i class="fas fa-check-double" style="color: #53bdeb; font-size: 12px;"></i></span>' : ''}
            `
            bubble.appendChild(time)
            
            messageDiv.appendChild(bubble)
            elements.messages.appendChild(messageDiv)
            scrollToBottom()
            
            // Actualizar último mensaje en la conversación
            updateLastMessage(type, message, isOwn)
        }
        
        // Actualizar último mensaje en la lista de conversaciones
        function updateLastMessage(type, message, isOwn) {
            let conversationItem
            
            if (type === 'public') {
                conversationItem = document.querySelector('[data-type="public"]')
                const lastMessageEl = conversationItem.querySelector('.last-message')
                const timeEl = conversationItem.querySelector('.conversation-time')
                
                if (lastMessageEl) {
                    const prefix = isOwn ? 'Tú: ' : `${message.username}: `
                    lastMessageEl.textContent = prefix + message.content
                }
                if (timeEl) {
                    const time = new Date(message.timestamp).toLocaleTimeString('es-ES', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                    })
                    timeEl.textContent = time
                }
            } else if (type === 'private') {
                const userId = isOwn ? message.recipientId : message.senderId
                conversationItem = document.querySelector(`[data-type="private"][data-id="${userId}"]`)
                
                if (conversationItem) {
                    const lastMessageEl = conversationItem.querySelector('.last-message')
                    const timeEl = conversationItem.querySelector('.conversation-time')
                    
                    if (lastMessageEl) {
                        const prefix = isOwn ? 'Tú: ' : ''
                        lastMessageEl.textContent = prefix + message.content
                    }
                    if (timeEl) {
                        const time = new Date(message.timestamp).toLocaleTimeString('es-ES', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                        })
                        timeEl.textContent = time
                    }
                }
            }
        }

        // Enviar mensaje
        elements.form.addEventListener('submit', (e) => {
            e.preventDefault()
            const message = elements.input.value.trim()
            
            if (!message) return
            
            if (currentTab === 'public') {
                socket.emit('chat message', { message })
            } else if (currentTab === 'private' && selectedUser) {
                socket.emit('private message', { 
                    recipientId: selectedUser.id, 
                    message 
                })
            } else if (currentTab === 'private' && !selectedUser) {
                addSystemMessage('<i class="fas fa-exclamation-triangle"></i> Selecciona un usuario para enviar un mensaje privado')
                return
            }
            
            elements.input.value = ''
        })



        // Logout
        elements.logoutBtn.addEventListener('click', async () => {
            try {
                await signOut(auth)
                localStorage.removeItem('user')
                if (socket) {
                    socket.disconnect()
                }
                switchScreen('login')
            } catch (error) {
                // Error al cerrar sesión
            }
        })

        // Scroll al final
        function scrollToBottom() {
            elements.messages.scrollTop = elements.messages.scrollHeight
        }

        // ===== NAVEGACIÓN MÓVIL ===== 
        let isMobile = window.innerWidth <= 768
        let sidebarVisible = false
        
        function updateMobileLayout() {
            const sidebar = document.querySelector('.sidebar')
            const mobileBackBtn = document.getElementById('mobileBackBtn')
            const sidebarToggle = document.getElementById('sidebarToggle')
            
            isMobile = window.innerWidth <= 768
            
            if (isMobile) {
                mobileBackBtn.style.display = 'flex'
                sidebarToggle.style.display = 'flex'
                
                // En móvil, mostrar sidebar inicialmente y ocultar después de seleccionar
                if (!sidebarVisible) {
                    showSidebar()
                }
            } else {
                mobileBackBtn.style.display = 'none'
                sidebarToggle.style.display = 'none'
                sidebar.classList.remove('show')
                sidebarVisible = false
            }
        }
        
        function showSidebar() {
            // En el nuevo diseño, esto significa volver a la lista de chats
            backToChatList()
        }
        
        function hideSidebar() {
            // Ya no es necesario, se maneja con la navegación de chats
            // La función se mantiene para compatibilidad
        }
        

        
        // Cerrar sidebar al tocar fuera en móvil
        document.addEventListener('click', (e) => {
            if (isMobile && sidebarVisible) {
                const sidebar = document.querySelector('.sidebar')
                const isClickInsideSidebar = sidebar.contains(e.target)
                const isToggleButton = e.target.id === 'sidebarToggle' || 
                                     e.target.id === 'mobileBackBtn' ||
                                     e.target.closest('#sidebarToggle') ||
                                     e.target.closest('#mobileBackBtn')
                
                if (!isClickInsideSidebar && !isToggleButton && sidebar.classList.contains('show')) {
                    hideSidebar()
                }
            }
        })
        
        // Botón de regresar a la lista de chats
        document.getElementById('mobileBackBtn').addEventListener('click', (e) => {
            e.stopPropagation()
            // Vibración táctil suave
            if (navigator.vibrate) {
                navigator.vibrate(30)
            }
            backToChatList()
        })
        
        document.getElementById('sidebarToggle').addEventListener('click', (e) => {
            e.stopPropagation()
            // Vibración táctil suave
            if (navigator.vibrate) {
                navigator.vibrate(30)
            }
            showSidebar()
        })
        
        // Funciones de navegación móvil
        function backToChatList() {
            document.querySelector('.main-container').classList.remove('chat-active')
        }
        
        function showChatFromList() {
            document.querySelector('.main-container').classList.add('chat-active')
        }
        
        // Actualizar layout al redimensionar
        window.addEventListener('resize', updateMobileLayout)
        

        
        // Inicializar layout móvil
        updateMobileLayout()
        
        // Prevenir zoom en iOS
        document.addEventListener('gesturestart', function (e) {
            e.preventDefault()
        })
        
        // Mejorar performance en dispositivos táctiles
        if ('ontouchstart' in window) {
            document.body.style.cursor = 'pointer'
        }