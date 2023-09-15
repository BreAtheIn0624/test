"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.timeTable = exports.lockerClient = exports.lockerWss = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const lockerSocket_1 = require("./lockerSocket");
const LockerDB_1 = require("./api/LockerDB");
const morgan_1 = __importDefault(require("morgan"));
const ClassTimetable_1 = __importDefault(require("./api/ClassTimetable"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
exports.app = app;
const server = (0, http_1.createServer)(app);
const wss = (0, lockerSocket_1.initSocket)(server);
exports.lockerWss = wss;
const lockerClient = new Map();
exports.lockerClient = lockerClient;
const timeTable = new ClassTimetable_1.default(3600000);
exports.timeTable = timeTable;
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
app.use((0, cors_1.default)());
app.use('/api/:resource/:uuid', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    console.time('vaildation');
    const uuid = req.params.uuid;
    const locker = yield (0, LockerDB_1.getLockerData)(uuid);
    if (locker && Object.keys(locker).every((key) => LockerDB_1.lockerDataProperties.includes(key))) {
        next();
        console.timeEnd('vaildation');
        return;
    }
    res.status(400).json({ error: 'invalid locker' });
    res.end();
    console.timeEnd('vaildation');
}));
app.get('/api/lockerState', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const states = yield (0, LockerDB_1.scanLockerData)();
    res.json(states);
    res.end();
}));
app.get('/api/lockerState/:uuid', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const uuid = req.params.uuid;
    const state = yield (0, LockerDB_1.getLockerData)(uuid);
    res.json(state);
    res.end();
}));
app.put('/api/orderLocker/:uuid', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const uuid = req.params.uuid;
    const task = req.body.task;
    const locker = (yield (0, LockerDB_1.getLockerData)(uuid));
    const ws = lockerClient.get(uuid);
    if (!ws) {
        res.status(400).json({ error: 'locker not found' });
        res.end();
        return;
    }
    let response;
    switch (task) {
        case 'open':
            response = {
                type: lockerSocket_1.lockerSocketMessageType.LOCKER_OPEN,
            };
            ws.send(JSON.stringify(response));
            res.status(200).json({ message: 'ordered success' });
            res.end();
            return;
        case 'close':
            response = {
                type: lockerSocket_1.lockerSocketMessageType.LOCKER_CLOSE,
            };
            ws.send(JSON.stringify(response));
            res.status(200).json({ message: 'ordered success' });
            res.end();
            return;
        case 'onSchedule':
            response = {
                type: lockerSocket_1.lockerSocketMessageType.LOCKER_ON_SCHEDULE,
            };
            ws.send(JSON.stringify(response));
            response = {
                type: lockerSocket_1.lockerSocketMessageType.REQ_SYNC,
            };
            ws.send(JSON.stringify(response));
            yield (0, LockerDB_1.setLockerData)(uuid, { onSchedule: true });
            res.status(200).json({ message: 'ordered success' });
            res.end();
            return;
        case 'offSchedule':
            response = {
                type: lockerSocket_1.lockerSocketMessageType.LOCKER_OFF_SCHEDULE,
            };
            ws.send(JSON.stringify(response));
            yield (0, LockerDB_1.setLockerData)(uuid, { onSchedule: false });
            res.status(200).json({ message: 'ordered success' });
            res.end();
            return;
        case 'sync':
            response = {
                type: lockerSocket_1.lockerSocketMessageType.REQ_SYNC,
            };
            ws.send(JSON.stringify(response));
            res.status(200).json({ message: 'ordered success' });
            res.end();
            return;
    }
}));
app.get('/api/timetable/:uuid', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const locker = (yield (0, LockerDB_1.getLockerData)(req.params.uuid));
    const grade = Number(locker.grade);
    const classNumber = Number(locker.classNumber);
    const timetable = yield timeTable.getClassTimetable(grade, classNumber, [0, 1, 2, 3, 4]);
    res.json(timetable.map((item) => item.map((item) => {
        return {
            isMobile: timeTable.isMobileClass(item.subject),
            teacher: item.teacher,
            subject: item.subject,
        };
    })));
    res.end();
}));
const modifiableProperties = ['nickname', 'grade', 'classNumber'];
app.patch('/api/lockerState/:uuid', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const uuid = req.params.uuid;
    const data = req.body;
    //remove data properties that are not in modifiableProperties
    for (const key in data) {
        if (!modifiableProperties.includes(key)) {
            delete data[key];
        }
    }
    try {
        yield (0, LockerDB_1.setLockerData)(uuid, data);
        res.status(200);
        res.end();
    }
    catch (error) {
        res.status(500).json({ error: error.message });
        res.end();
    }
}));
server.listen(80);
