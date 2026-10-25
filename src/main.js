import { createApp } from 'vue'
import { createPinia } from 'pinia'
import '@fontsource-variable/archivo/standard.css'
import '@fontsource-variable/jetbrains-mono'
import '@fontsource/patrick-hand'
import './styles/tokens.css'
import './styles/base.css'
import './styles/components.css'
import './styles/code.css'
import App from './App.vue'
import { createAppRouter } from './router/index.js'

const app = createApp(App)
app.use(createPinia())
app.use(createAppRouter())
app.mount('#app')
