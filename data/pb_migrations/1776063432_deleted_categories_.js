/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3292755704");

  return app.delete(collection);
}, (app) => {
  const collection = new Collection({
    "createRule": "id != ''",
    "deleteRule": "id != ''",
    "fields": [
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
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text1579384326",
        "max": 0,
        "min": 0,
        "name": "name",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text2560465762",
        "max": 0,
        "min": 0,
        "name": "slug",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "select2363381545",
        "maxSelect": 0,
        "name": "type",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "product",
          "ingredient"
        ]
      }
    ],
    "id": "pbc_3292755704",
    "indexes": [],
    "listRule": "id != ''",
    "name": "categories_",
    "system": false,
    "type": "base",
    "updateRule": "id != ''",
    "viewRule": "id != ''"
  });

  return app.save(collection);
})
