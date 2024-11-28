import { AttributeValue } from 'aws-sdk/clients/dynamodb';
import { Item } from '../API';
export declare function mapDdbResponseToItem(item: {
    [key: string]: AttributeValue;
}): Item;
