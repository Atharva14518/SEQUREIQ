import { BrowserRouter } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import App from './App.jsx'

const appearance = {
  variables: {
    colorPrimary: '#DC9F85',
    colorBackground: '#1E1E1E',
    colorInputBackground: '#181818',
    colorInputText: '#EBDCC4',
    colorText: '#EBDCC4',
    colorTextSecondary: '#B6A596',
    colorNeutral: '#B6A596',
    borderRadius: '4px',
    fontFamily: "'General Sans', sans-serif",
    fontSize: '15px',
  },
  elements: {
    card: { background: '#1E1E1E', border: '1px solid #35211A', borderRadius: '4px', boxShadow: 'none', padding: '40px' },
    headerTitle: { color: '#EBDCC4', fontFamily: "'Clash Grotesk', sans-serif", fontWeight: '700', textTransform: 'uppercase', letterSpacing: '-0.02em' },
    formButtonPrimary: { background: '#DC9F85', color: '#181818', textTransform: 'uppercase', letterSpacing: '0.1em', boxShadow: 'none' },
    formFieldInput: { background: '#181818', border: '1px solid #66473B', color: '#EBDCC4', borderRadius: '4px' },
    formFieldLabel: { color: '#B6A596', textTransform: 'uppercase', letterSpacing: '0.08em' },
    footerActionLink: { color: '#DC9F85' },
    socialButtonsBlockButton: { background: 'transparent', border: '1px solid #66473B', color: '#EBDCC4', borderRadius: '4px' },
    dividerLine: { background: '#35211A' },
    dividerText: { color: '#66473B' },
  },
}

export default function AppWithClerk({ publishableKey }) {
  return (
    <ClerkProvider publishableKey={publishableKey} appearance={appearance}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ClerkProvider>
  )
}
