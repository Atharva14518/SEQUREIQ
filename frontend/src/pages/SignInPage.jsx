import { SignIn } from '@clerk/clerk-react'

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
    card: {
      background: '#1E1E1E',
      border: '1px solid #35211A',
      borderRadius: '4px',
      boxShadow: 'none',
      padding: '40px',
    },
    headerTitle: {
      fontFamily: "'Clash Grotesk', sans-serif",
      fontWeight: '700',
      fontSize: '28px',
      textTransform: 'uppercase',
      letterSpacing: '-0.02em',
      color: '#EBDCC4',
    },
    headerSubtitle: { color: '#B6A596', fontSize: '13px' },
    socialButtonsBlockButton: {
      background: 'transparent',
      border: '1px solid #66473B',
      borderRadius: '4px',
      color: '#EBDCC4',
    },
    formFieldInput: {
      background: '#181818',
      border: '1px solid #66473B',
      borderRadius: '4px',
      color: '#EBDCC4',
    },
    formButtonPrimary: {
      background: '#DC9F85',
      color: '#181818',
      fontWeight: '700',
      fontSize: '12px',
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      borderRadius: '4px',
      boxShadow: 'none',
    },
    footerActionLink: { color: '#DC9F85' },
    dividerLine: { background: '#35211A' },
    dividerText: { color: '#66473B' },
    formFieldLabel: { color: '#B6A596', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' },
  },
}

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#181818' }}>
      <div className="w-full max-w-[420px]">
        <h1 className="display-md headline-depth" data-text="SECUREIQ"><span>SECUREIQ</span></h1>
        <p className="label-accent mt-2 mb-6">- SECURE ACCESS</p>
        <SignIn
          path="/sign-in"
          routing="path"
          signUpUrl="/sign-up"
          afterSignInUrl="/dashboard"
          appearance={appearance}
        />
      </div>
    </div>
  )
}
