/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("equipment000000");

  return app.delete(collection);
}, (app) => {
  const collection = new Collection({
    "createRule": "",
    "deleteRule": "",
    "fields": [
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text326731503",
        "max": 255,
        "min": 0,
        "name": "name",
        "pattern": "",
        "presentable": true,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text828738883",
        "max": 255,
        "min": 0,
        "name": "category",
        "pattern": "",
        "presentable": true,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text476460336",
        "max": 255,
        "min": 0,
        "name": "serial_number",
        "pattern": "",
        "presentable": true,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text965673131",
        "max": 255,
        "min": 0,
        "name": "model",
        "pattern": "",
        "presentable": true,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text112838574",
        "max": 255,
        "min": 0,
        "name": "manufacturer",
        "pattern": "",
        "presentable": true,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "cascadeDelete": false,
        "collectionId": "vendors00000000",
        "hidden": false,
        "id": "relation482300110",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "vendor_id",
        "presentable": true,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "hidden": false,
        "id": "date237110418",
        "max": "",
        "min": "",
        "name": "purchase_date",
        "presentable": true,
        "required": false,
        "system": false,
        "type": "date"
      },
      {
        "hidden": false,
        "id": "date618008476",
        "max": "",
        "min": "",
        "name": "warranty_expiry",
        "presentable": true,
        "required": false,
        "system": false,
        "type": "date"
      },
      {
        "cascadeDelete": false,
        "collectionId": "locations000000",
        "hidden": false,
        "id": "relation217755864",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "primary_location_id",
        "presentable": true,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "hidden": false,
        "id": "select411130994",
        "maxSelect": 1,
        "name": "status",
        "presentable": true,
        "required": false,
        "system": false,
        "type": "select",
        "values": [
          "available",
          "borrowed",
          "in_maintenance",
          "calibrating",
          "decommissioned",
          "lost"
        ]
      },
      {
        "hidden": false,
        "id": "autodate185133634",
        "name": "created",
        "onCreate": true,
        "onUpdate": false,
        "presentable": false,
        "system": false,
        "type": "autodate"
      },
      {
        "hidden": false,
        "id": "autodate76770352",
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
    "id": "equipment000000",
    "indexes": [],
    "listRule": "",
    "name": "equipment",
    "system": false,
    "type": "base",
    "updateRule": "",
    "viewRule": ""
  });

  return app.save(collection);
})
