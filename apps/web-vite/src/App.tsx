import '@mantine/core/styles.css'
import dayjs from 'dayjs'
import {
  Box,
  Button,
  Flex,
  Group,
  MantineProvider,
  Stack,
  Text,
  TextInput
} from '@mantine/core'
import { FormEvent, useState } from 'react'

let events: EventSource | null = null

const App = () => {
  const [command, setCommand] = useState('')
  const [commandOut, setCommandOut] = useState<
    Array<{ type: string; out: string; time: string }>
  >([])
  const [isActive, setIsActive] = useState(false)

  const sendCommand = (cmd: string) => {
    if (events) {
      console.log('close current event')

      setCommandOut([])
      events.close()
    }

    if (!cmd) {
      console.log('Empty command')

      return
    }

    events = new EventSource(`http://localhost:4000/run?cmd=${cmd}`)

    events.addEventListener(
      'stdout',
      (e) => {
        const parsedData = JSON.parse(e.data)
        console.log(parsedData)

        setCommandOut((pre) => [
          ...pre,
          { ...parsedData, time: dayjs(e.data.time).format('HH:mm:ss.SSS') }
        ])
      },
      false
    )

    events.addEventListener(
      'stderr',
      (e) => {
        const parsedData = JSON.parse(e.data)
        console.log(parsedData)
        setCommandOut((pre) => [
          ...pre,
          { ...parsedData, time: dayjs(e.data.time).format('HH:mm:ss.SSS') }
        ])
      },
      false
    )

    events.addEventListener(
      'err',
      (e) => {
        const parsedData = JSON.parse(e.data)
        console.log(parsedData)
        setCommandOut((pre) => [...pre, parsedData])
      },
      false
    )

    events.addEventListener(
      'open',
      () => {
        console.log('open')
        setIsActive(true)
      },
      false
    )

    events.addEventListener(
      'exit',
      () => {
        console.log('exited')

        events?.close()
        setIsActive(false)
      },
      false
    )

    events.addEventListener(
      'error',
      (event) => {
        if (event.readyState == EventSource.CLOSED) {
          // Connection was closed.
          setIsActive(false)
        }
      },
      false
    )

    events.addEventListener('error', () => {
      console.log('An error occurred while attempting to connect.')
      setIsActive(false)
      events?.close()
    })
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    sendCommand(command)
  }

  return (
    <MantineProvider defaultColorScheme='dark'>
      <Flex mih='100vh' direction='column' align='center' justify='center'>
        <Flex mb='xl'>
          <form onSubmit={handleSubmit}>
            <Flex gap='lg'>
              <TextInput
                placeholder='Enter command here...'
                value={command}
                onChange={(event) => setCommand(event.target.value)}
              ></TextInput>
              {isActive ? (
                <Button
                  onClick={() => {
                    events?.close()
                    setIsActive(false)
                  }}
                >
                  Close
                </Button>
              ) : (
                <Button type='submit' disabled={isActive}>
                  Send
                </Button>
              )}
            </Flex>
          </form>
        </Flex>
        <Box
          p='lg'
          style={{
            overflowY: 'scroll',
            boxShadow: 'var(--mantine-shadow-xl)',
            borderRadius: 'var(--mantine-radius-md)',
            minHeight: 420,
            width: '80%',
            border: '1px solid var(--mantine-color-dark-4)',
            backgroundColor: '#000'
          }}
        >
          {commandOut.map(({ time, out }, index) => {
            return (
              <Group key={index} align='flex-start'>
                <Text c='dimmed' ff='mono'>
                  {time}
                </Text>
                <Text ff='mono'>{out}</Text>
              </Group>
            )
          })}
        </Box>
      </Flex>
    </MantineProvider>
  )
}

export default App
