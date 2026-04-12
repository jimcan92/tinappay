/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("prevmaint000000");

  return app.delete(collection);
}, (app) => {
  const collection = new Collection({
    "createRule": "",
    "deleteRule": "",
    "fields": [
      {
        "cascadeDelete": false,
        "collectionId": "equipment000000",
        "hidden": false,
        "id": "relation631574623",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "equipment_id",
        "presentable": true,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "hidden": false,
        "id": "date581464523",
        "max": "",
        "min": "",
        "name": "schedule_date",
        "presentable": true,
        "required": true,
        "system": false,
        "type": "date"
      },
      {
        "hidden": false,
        "id": "date909857972",
        "max": "",
        "min": "",
        "name": "performed_date",
        "presentable": true,
        "required": false,
        "system": false,
        "type": "date"
      },
      {
        "cascadeDelete": false,
        "collectionId": "_pb_users_auth_",
        "hidden": false,
        "id": "relation44408019",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "technician_id",
        "presentable": true,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "cascadeDelete": false,
        "collectionId": "vendors00000000",
        "hidden": false,
        "id": "relation565884643",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "vendor_id",
        "presentable": true,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text647205977",
        "max": 255,
        "min": 0,
        "name": "remarks",
        "pattern": "",
        "presentable": true,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "select245989685",
        "maxSelect": 1,
        "name": "status",
        "presentable": true,
        "required": false,
        "system": false,
        "type": "select",
        "values": [
          "scheduled",
          "in_progress",
          "completed",
          "cancelled",
          "overdue"
        ]
      },
      {
        "hidden": false,
        "id": "autodate162982426",
        "name": "created",
        "onCreate": true,
        "onUpdate": false,
        "presentable": false,
        "system": false,
        "type": "autodate"
      },
      {
        "hidden": false,
        "id": "autodate943765010",
        "name": "updated",
        "onCreate": true,
        "onUpdate": true,
        "presentable": false,
        "system": false,
        "type": "autodate"
      },
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "hidden": false,
        "id": "text3208210256",
        "max": 15,
        "min": 15,
        "name": "id",
        "pattern": "^[a-z0-9]+$",
        "presentable": false,
        "primaryKey": true,
        "required": true,
        "system": true,
        "type": "text"
      }
    ],
    "id": "prevmaint000000",
    "indexes": [],
    "listRule": "",
    "name": "preventive_maintenance",
    "system": false,
    "type": "base",
    "updateRule": "",
    "viewRule": ""
  });

  return app.save(collection);
})
