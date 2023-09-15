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
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSocket = exports.lockerSocketMessageType = void 0;
const LockerDB_1 = require("./api/LockerDB");
const ws_1 = require("ws");
const index_1 = require("./index");
var lockerSocketMessageType;
(function (lockerSocketMessageType) {
    lockerSocketMessageType["CONNECTION_INIT"] = "CONNECTION_INIT";
    lockerSocketMessageType["CONNECTION_ERROR"] = "CONNECTION_ERROR";
    lockerSocketMessageType["LOCKER_OPEN"] = "LOCKER_OPEN";
    lockerSocketMessageType["LOCKER_CLOSE"] = "LOCKER_CLOSE";
    lockerSocketMessageType["LOCKER_OPEN_SUCCESS"] = "LOCKER_OPEN_SUCCESS";
    lockerSocketMessageType["LOCKER_CLOSE_SUCCESS"] = "LOCKER_CLOSE_SUCCESS";
    lockerSocketMessageType["LOCKER_CLOSE_FAILED"] = "LOCKER_CLOSE_FAILED";
    lockerSocketMessageType["LOCKER_OFF_SCHEDULE"] = "LOCKER_OFF_SCHEDULE";
    lockerSocketMessageType["LOCKER_ON_SCHEDULE"] = "LOCKER_ON_SCHEDULE";
    lockerSocketMessageType["REQ_MOBILE_CLASS"] = "REQ_MOBILE_CLASS";
    lockerSocketMessageType["RES_MOBILE_CLASS"] = "RES_MOBILE_CLASS";
    lockerSocketMessageType["REQ_TIMEPERIOD"] = "REQ_TIMEPERIOD";
    lockerSocketMessageType["RES_TIMEPERIOD"] = "RES_TIMEPERIOD";
    lockerSocketMessageType["REQ_SYNC"] = "REQ_SYNC";
    lockerSocketMessageType["RES_SYNC"] = "RES_SYNC";
})(lockerSocketMessageType || (exports.lockerSocketMessageType = lockerSocketMessageType = {}));
function initSocket(app) {
    const wss = new ws_1.WebSocket.Server({ server: app });
    wss.on('connection', function connection(ws) {
        ws.on('error', console.error);
        ws.on('open', function open() {
            console.log(1);
        });
        ws.on('close', () => {
            index_1.lockerClient.forEach((value, key) => __awaiter(this, void 0, void 0, function* () {
                if (value === ws) {
                    index_1.lockerClient.delete(key);
                    yield (0, LockerDB_1.setLockerData)(key, { isLocked: false });
                }
                return;
            }));
        });
        ws.on('message', (data) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g;
            let wsMessage;
            try {
                const res = JSON.parse(data.toString());
                console.log(JSON.stringify(res));
                const uuid = (_a = res.data) === null || _a === void 0 ? void 0 : _a.uuid;
                switch (res.type) {
                    case lockerSocketMessageType.CONNECTION_INIT:
                        if (index_1.lockerClient.has(uuid)) {
                            switch ((_b = index_1.lockerClient.get(uuid)) === null || _b === void 0 ? void 0 : _b.readyState) {
                                case ws_1.WebSocket.OPEN:
                                    (_c = index_1.lockerClient.get(uuid)) === null || _c === void 0 ? void 0 : _c.close();
                                    return;
                                case ws_1.WebSocket.CLOSED || undefined:
                                    index_1.lockerClient.set(uuid, ws);
                                    return;
                            }
                        }
                        index_1.lockerClient.set(uuid, ws);
                        wsMessage = {
                            type: lockerSocketMessageType.REQ_SYNC,
                        };
                        ws.send(JSON.stringify(wsMessage));
                        yield (0, LockerDB_1.setLockerData)(uuid, { isLocked: false });
                        return;
                    case lockerSocketMessageType.LOCKER_OPEN_SUCCESS:
                        yield (0, LockerDB_1.setLockerData)(uuid, { isLocked: false });
                        return;
                    case lockerSocketMessageType.LOCKER_CLOSE_SUCCESS:
                        yield (0, LockerDB_1.setLockerData)(uuid, { isLocked: true });
                        return;
                    case lockerSocketMessageType.LOCKER_CLOSE_FAILED:
                        yield (0, LockerDB_1.setLockerData)(uuid, { isLocked: false });
                        if (((_d = res.data) === null || _d === void 0 ? void 0 : _d.attempt) <= 2) {
                            wsMessage = {
                                type: lockerSocketMessageType.LOCKER_CLOSE,
                                data: {
                                    attempt: ((_e = res.data) === null || _e === void 0 ? void 0 : _e.attempt) + 1 || 1,
                                },
                            };
                            ws.send(JSON.stringify(wsMessage));
                        }
                        return;
                    case lockerSocketMessageType.REQ_MOBILE_CLASS || lockerSocketMessageType.REQ_TIMEPERIOD:
                        let { grade, classNumber } = (yield (0, LockerDB_1.getLockerData)(uuid));
                        const weekday = new Date().getDay() - 1;
                        if (res.type === lockerSocketMessageType.REQ_MOBILE_CLASS) {
                            const timetable = yield index_1.timeTable.getMobileClass(grade, classNumber, weekday);
                            wsMessage = {
                                type: lockerSocketMessageType.RES_MOBILE_CLASS,
                                data: {
                                    mobileClass: timetable,
                                },
                            };
                            ws.send(JSON.stringify(wsMessage));
                            return;
                        }
                        else {
                            const period = yield index_1.timeTable.getPeriods((_f = res.data) === null || _f === void 0 ? void 0 : _f.period);
                            wsMessage = {
                                type: lockerSocketMessageType.RES_TIMEPERIOD,
                                data: {
                                    period: {
                                        period: (_g = res.data) === null || _g === void 0 ? void 0 : _g.period,
                                        start: period.start,
                                        end: period.end,
                                        duration: period.duration,
                                    },
                                },
                            };
                            ws.send(JSON.stringify(wsMessage));
                            return;
                        }
                    case lockerSocketMessageType.RES_SYNC:
                        let now = Date.now();
                        yield (0, LockerDB_1.setLockerData)(uuid, { lastSync: now });
                        return;
                }
            }
            catch (error) {
                wsMessage = {
                    type: lockerSocketMessageType.CONNECTION_ERROR,
                };
                ws.send(JSON.stringify(wsMessage));
                console.error(error);
            }
        }));
    });
    return wss;
}
exports.initSocket = initSocket;
// 웹 소켓 서버 URL
