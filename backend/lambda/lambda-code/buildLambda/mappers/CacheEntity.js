"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapDdbResponseToCacheEntity = mapDdbResponseToCacheEntity;
// DynamoDB Mapper Function
function mapDdbResponseToCacheEntity(item) {
    return {
        response: item.response.S, // DynamoDB string type
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ2FjaGVFbnRpdHkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbWFwcGVycy9DYWNoZUVudGl0eS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQU9BLGtFQUlDO0FBTEQsMkJBQTJCO0FBQzNCLFNBQWdCLDJCQUEyQixDQUFDLElBQXVDO0lBQy9FLE9BQU87UUFDSCxRQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsdUJBQXVCO0tBQ3JELENBQUE7QUFDTCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQXR0cmlidXRlVmFsdWUgfSBmcm9tICdhd3Mtc2RrL2NsaWVudHMvZHluYW1vZGInIC8vIFRoaXMgaXMgdGhlIGZvcm1hdCB1c2VkIGJ5IER5bmFtb0RCIGZvciBhdHRyaWJ1dGVzXG5cbmludGVyZmFjZSBDYWNoZUVudGl0eSB7XG4gICAgcmVzcG9uc2U6IHN0cmluZyB8IHVuZGVmaW5lZFxufVxuXG4vLyBEeW5hbW9EQiBNYXBwZXIgRnVuY3Rpb25cbmV4cG9ydCBmdW5jdGlvbiBtYXBEZGJSZXNwb25zZVRvQ2FjaGVFbnRpdHkoaXRlbTogeyBba2V5OiBzdHJpbmddOiBBdHRyaWJ1dGVWYWx1ZSB9KTogQ2FjaGVFbnRpdHkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3BvbnNlOiBpdGVtLnJlc3BvbnNlLlMsIC8vIER5bmFtb0RCIHN0cmluZyB0eXBlXG4gICAgfVxufVxuIl19