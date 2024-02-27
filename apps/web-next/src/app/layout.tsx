import '@mantine/core/styles.css'
import '~/styles/globals.css'
import { PropsWithChildren } from 'react'
import { ColorSchemeScript, MantineProvider } from '@mantine/core'

const RootLayout = ({ children }: PropsWithChildren) => {
  return (
    <html lang='en'>
      <head>
        <title>Next SEE</title>
        <ColorSchemeScript defaultColorScheme='dark'></ColorSchemeScript>
      </head>
      <body>
        <MantineProvider defaultColorScheme='dark'>{children}</MantineProvider>
      </body>
    </html>
  )
}

export default RootLayout
