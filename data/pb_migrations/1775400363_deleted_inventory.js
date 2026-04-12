/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("inventory000000");

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
        "id": "relation699527263",
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
        "id": "number154895629",
        "max": null,
        "min": null,
        "name": "quantity",
        "onlyInt": false,
        "presentable": true,
        "required": true,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "select853934682",
        "maxSelect": 1,
        "name": "condition",
        "presentable": true,
        "required": false,
        "system": false,
        "type": "select",
        "values": [
          "new",
          "good",
          "fair",
          "poor",
          "damaged"
        ]
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text588078548",
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
        "cascadeDelete": false,
        "collectionId": "_pb_users_auth_",
        "hidden": false,
        "id": "relation774220411",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "audited_by",
        "presentable": true,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "hidden": false,
        "id": "autodate913560439",
        "name": "created",
        "onCreate": true,
        "onUpdate": false,
        "presentable": false,
        "system": false,
        "type": "autodate"
      },
      {
        "hidden": false,
        "id": "autodate436194460",
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
    "id": "inventory000000",
    "indexes": [],
    "listRule": "",
    "name": "inventory",
    "system": false,
    "type": "base",
    "updateRule": "",
    "viewRule": ""
  });

  return app.save(collection);
})
