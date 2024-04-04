"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
import AWS from 'aws-sdk'
AWS.config.getCredentials(function (err) {
    if (err) console.log(err.stack)
    // credentials not loaded
    else {
        console.log('Access key:', AWS.config.credentials?.accessKeyId)
    }
})
AWS.config.update({ region: 'ap-northeast-2' })

const dynamoDB = new AWS.DynamoDB.DocumentClient()

dynamoDB
    .get({
        TableName: 'seda_locker',
        Key: {
            uuid: '1234',
        },
    })
    .promise()
    .then(console.log)
*/
const LockerDB_1 = require("./api/LockerDB");
(0, LockerDB_1.setLockerData)('1234', { isRegistered: true }).then(console.log);
