/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("consumables0000");

  return app.delete(collection);
}, (app) => {
  const collection = new Collection({
    "createRule": "",
    "deleteRule": "",
    "fields": [
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text781669090",
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
        "hidden": false,
        "id": "select831080133",
        "maxSelect": 1,
        "name": "type",
        "presentable": true,
        "required": false,
        "system": false,
        "type": "select",
        "values": [
          "chemical",
          "reagent",
          "gas",
          "glassware"
        ]
      },
      {
        "hidden": false,
        "id": "number704338867",
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
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text339151407",
        "max": 255,
        "min": 0,
        "name": "unit",
        "pattern": "",
        "presentable": true,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "date749473138",
        "max": "",
        "min": "",
        "name": "expiry_date",
        "presentable": true,
        "required": false,
        "system": false,
        "type": "date"
      },
      {
        "cascadeDelete": false,
        "collectionId": "locations000000",
        "hidden": false,
        "id": "relation181752178",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "location_id",
        "presentable": true,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text341285082",
        "max": 255,
        "min": 0,
        "name": "storage_requirements",
        "pattern": "",
        "presentable": true,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "select885229063",
        "maxSelect": 1,
        "name": "hazard_classification",
        "presentable": true,
        "required": false,
        "system": false,
        "type": "select",
        "values": [
          "flammable",
          "toxic",
          "corrosive",
          "safe"
        ]
      },
      {
        "hidden": false,
        "id": "number864840556",
        "max": null,
        "min": null,
        "name": "minimum_threshold",
        "onlyInt": false,
        "presentable": true,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "autodate751143930",
        "name": "created",
        "onCreate": true,
        "onUpdate": false,
        "presentable": false,
        "system": false,
        "type": "autodate"
      },
      {
        "hidden": false,
        "id": "autodate474315484",
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
    "id": "consumables0000",
    "indexes": [],
    "listRule": "",
    "name": "consumables",
    "system": false,
    "type": "base",
    "updateRule": "",
    "viewRule": ""
  });

  return app.save(collection);
})
