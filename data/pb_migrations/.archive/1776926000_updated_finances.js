/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_4219755904")

  // add category field
  collection.fields.addAt(6, new SchemaField({
    "hidden": false,
    "id": "select3208210257",
    "maxSelect": 1,
    "name": "category",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "sales",
      "supplies",
      "utilities",
      "salary",
      "maintenance",
      "others"
    ]
  }))

  // add reference_id field
  collection.fields.addAt(7, new SchemaField({
    "hidden": false,
    "id": "text3208210258",
    "max": 0,
    "min": 0,
    "name": "reference_id",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // update rules
  unmarshal({
    "listRule": "@request.auth.id != \"\"",
    "viewRule": "@request.auth.id != \"\"",
    "createRule": "@request.auth.id != \"\"",
    "updateRule": "@request.auth.role = \"admin\"",
    "deleteRule": "@request.auth.role = \"admin\""
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_4219755904")

  // remove fields
  collection.fields.removeById("select3208210257")
  collection.fields.removeById("text3208210258")

  // reset rules
  unmarshal({
    "listRule": null,
    "viewRule": null,
    "createRule": null,
    "updateRule": null,
    "deleteRule": null
  }, collection)

  return app.save(collection)
})
