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
exports.setLockerData = exports.scanLockerData = exports.getLockerData = exports.lockerDataProperties = void 0;
const AWS = require("aws-sdk");
AWS.config.getCredentials(function (err) {
    if (err)
        console.log(err.stack);
});
AWS.config.update({ region: 'ap-northeast-2' });
const dynamoDB = new AWS.DynamoDB.DocumentClient();
exports.lockerDataProperties = ['uuid', 'nickname', 'isLocked', 'grade', 'classNumber', 'lastSync', 'onSchedule'];
function getLockerData(uuid) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        console.time('getLockerData()');
        const data = (_a = (yield dynamoDB
            .get({
            TableName: 'seda_locker',
            Key: {
                uuid,
            },
        })
            .promise())) === null || _a === void 0 ? void 0 : _a.Item;
        if (data === null || data === void 0 ? void 0 : data.uuid) {
            console.timeEnd('getLockerData()');
            return data;
        }
        console.timeEnd('getLockerData()');
        return null;
    });
}
exports.getLockerData = getLockerData;
function scanLockerData() {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const data = (_a = (yield dynamoDB
            .scan({
            TableName: 'seda_locker',
        })
            .promise())) === null || _a === void 0 ? void 0 : _a.Items;
        if (data) {
            return data;
        }
        return [];
    });
}
exports.scanLockerData = scanLockerData;
function setLockerData(uuid, data) {
    return __awaiter(this, void 0, void 0, function* () {
        const updateExpression = [];
        const updateAttributeValues = {};
        for (const key in data) {
            updateExpression.push(`${key} = :${key}`);
            //@ts-ignore
            updateAttributeValues[`:${key}`] = data[key];
        }
        const params = {
            TableName: 'seda_locker',
            Key: {
                uuid,
            },
            UpdateExpression: 'set ' + updateExpression.join(', '),
            ExpressionAttributeValues: updateAttributeValues,
        };
        try {
            yield dynamoDB.update(params).promise();
            return true;
        }
        catch (e) {
            console.error(e);
            return false;
        }
    });
}
exports.setLockerData = setLockerData;
