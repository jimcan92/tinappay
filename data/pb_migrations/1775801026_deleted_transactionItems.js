/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("col_trans_items");

  return app.delete(collection);
}, (app) => {
  const collection = new Collection({
    "createRule": "@request.auth.id != \"\"",
    "deleteRule": "@request.auth.role = \"Admin\"",
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
        "cascadeDelete": true,
        "collectionId": "col_transactions",
        "hidden": false,
        "id": "fld_ti_trans",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "transactionId",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "cascadeDelete": false,
        "collectionId": "col_products",
        "hidden": false,
        "id": "fld_ti_prod",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "productId",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "hidden": false,
        "id": "fld_ti_qty",
        "max": null,
        "min": 1,
        "name": "quantity",
        "onlyInt": false,
        "presentable": false,
        "required": true,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "fld_ti_sub",
        "max": null,
        "min": 0,
        "name": "subtotal",
        "onlyInt": false,
        "presentable": false,
        "required": true,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "autodate2990389176",
        "name": "created",
        "onCreate": true,
        "onUpdate": false,
        "presentable": false,
        "system": true,
        "type": "autodate"
      },
      {
        "hidden": false,
        "id": "autodate3332085495",
        "name": "updated",
        "onCreate": true,
        "onUpdate": true,
        "presentable": false,
        "system": true,
        "type": "autodate"
      }
    ],
    "id": "col_trans_items",
    "indexes": [],
    "listRule": "@request.auth.id != \"\"",
    "name": "transactionItems",
    "system": false,
    "type": "base",
    "updateRule": "@request.auth.role = \"Admin\"",
    "viewRule": "@request.auth.id != \"\""
  });

  return app.save(collection);
})
