import express from 'express'
import { createServer } from 'http'
import { initSocket, lockerSocketMessageType } from './lockerSocket'
import { WebSocket } from 'ws'
import { getLockerData, LockerData, lockerDataProperties, scanLockerData } from './api/LockerDB'
import morgan from 'morgan'
import Timetable from './api/ClassTimetable'

const app = express()
const server = createServer(app)
const wss = initSocket(server)
const lockerClient = new Map<string, WebSocket>()
const timeTable = new Timetable()

app.use(morgan('dev'))
app.use(express.json())
app.use((req, res, next) => {
    console.log(lockerClient.keys())
    next()
})
server.listen(80)

export { app, wss as lockerWss, lockerClient, timeTable }

