import express from 'express'
import expressWs from 'express-ws'

import lockerSocket from './socket/lockerSocket'

const app = express()
const wsInstance = expressWs(app)
const wsApp = wsInstance.app

expressWs(app)
lockerSocket(wsApp)

app.listen(80)
