'use client'

import dayjs from 'dayjs'
import {
  Box,
  Button,
  Flex,
  Grid,
  GridCol,
  Text,
  TextInput
} from '@mantine/core'
import { NextPage } from 'next'
import { useState } from 'react'

let events: null | EventSource = null

const Page: NextPage = () => {
  const [command, setCommand] = useState('journalctl -fb')
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
      (event) => {
        const parsedData = JSON.parse(event.data)
        console.log(parsedData)

        setCommandOut((pre) => [
          ...pre,
          { ...parsedData, time: dayjs(event.data.time).format('HH:mm:ss.SSS') }
        ])
      },
      false
    )

    events.addEventListener(
      'stderr',
      (event) => {
        const parsedData = JSON.parse(event.data)
        console.log(parsedData)
        setCommandOut((pre) => [
          ...pre,
          { ...parsedData, time: dayjs(event.data.time).format('HH:mm:ss.SSS') }
        ])
      },
      false
    )

    events.addEventListener(
      'err',
      (event) => {
        const parsedData = JSON.parse(event.data)
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
      () => {
        if (events?.readyState == EventSource.CLOSED) {
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
                onClick={(event) => {
                  event.preventDefault()
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
          // overflowY: 'scroll',
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
            <Grid key={index}>
              <GridCol span={2}>
                <Text c='dimmed' ff='mono'>
                  {time}
                </Text>
              </GridCol>
              <GridCol span={10}>
                <Text ff='mono' span>
                  <pre
                    style={{
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      margin: 0
                    }}
                  >
                    {out}
                  </pre>
                </Text>
              </GridCol>
            </Grid>
          )
        })}
      </Box>
    </Flex>
  )
}

export default Page
