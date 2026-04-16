/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2646768869");

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
        "cascadeDelete": false,
        "collectionId": "pbc_4092854851",
        "hidden": false,
        "id": "relation3544843437",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "product",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "cascadeDelete": false,
        "collectionId": "pbc_3146854971",
        "hidden": false,
        "id": "relation1806661744",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "ingredient",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "hidden": false,
        "id": "number2683508278",
        "max": null,
        "min": null,
        "name": "quantity",
        "onlyInt": false,
        "presentable": false,
        "required": true,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "select1001949196",
        "maxSelect": 0,
        "name": "reason",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "sale",
          "restock",
          "waste",
          "adjustment"
        ]
      },
      {
        "cascadeDelete": false,
        "collectionId": "_pb_users_auth_",
        "hidden": false,
        "id": "relation2375276105",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "user",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      }
    ],
    "id": "pbc_2646768869",
    "indexes": [],
    "listRule": "id != ''",
    "name": "inventory_logs_",
    "system": false,
    "type": "base",
    "updateRule": "id != ''",
    "viewRule": "id != ''"
  });

  return app.save(collection);
})
