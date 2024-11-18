import { createRoot } from 'react-dom/client';
import App from './App'
import '@fontsource/inter'
import './index.css'
import './initAmplify'
const container = document.getElementById('root')

const root = createRoot(container)

root.render(<App />);
