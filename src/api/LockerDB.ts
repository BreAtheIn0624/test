import { AWSError } from 'aws-sdk'
import AWS = require('aws-sdk')
AWS.config.getCredentials(function (err) {
    if (err) console.log(err.stack)
})
AWS.config.update({ region: 'ap-northeast-2' })

const dynamoDB = new AWS.DynamoDB.DocumentClient()

export interface LockerData {
    uuid: string
    secretKey: string
    auth_key: string
    nickname: string | null
    isRegistered: boolean
    isAwaken: boolean
    isLocked: boolean
    isClosed: boolean
}

type SetLockerData = { [Property in keyof LockerData]?: LockerData[Property] }
export async function getLockerData(uuid: string) {
    const data = (
        await dynamoDB
            .get({
                TableName: 'seda_locker',
                Key: {
                    uuid,
                },
            })
            .promise()
    )?.Item
    if (data?.uuid && data?.secretKey) {
        return data as LockerData
    }
    return new Error('No locker data found or invalid locker data')
}
export async function setLockerData(uuid: string, data: SetLockerData) {
    const updateExpression = []
    const updateAttributeValues: { [key: string]: any } = {}
    for (const key in data) {
        updateExpression.push(`${key} = :${key}`)
        //@ts-ignore
        updateAttributeValues[`:${key}`] = data[key]
    }

    const params = {
        TableName: 'seda_locker',
        Key: {
            uuid,
        },
        UpdateExpression: 'set ' + updateExpression.join(', '),
        ExpressionAttributeValues: updateAttributeValues,
    }
    dynamoDB.update(params, function (err: AWSError, data: AWS.DynamoDB.DocumentClient.UpdateItemOutput) {
        if (err) {
            throw new Error('Unable to update item. Error JSON:')
        } else {
            console.log('UpdateItem succeeded:', JSON.stringify(data, null, 2))
        }
    })
}
