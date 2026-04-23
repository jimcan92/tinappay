/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_26467688692")

  // update field
  collection.fields.addAt(3, new Field({
    "hidden": false,
    "id": "select1001949196",
    "maxSelect": 1,
    "name": "reason",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "select",
    "values": [
      "sale",
      "waste",
      "restock",
      "adjustment"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_26467688692")

  // update field
  collection.fields.addAt(3, new Field({
    "hidden": false,
    "id": "select1001949196",
    "maxSelect": 1,
    "name": "reason",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "sale",
      "waste",
      "restock",
      "adjustment"
    ]
  }))

  return app.save(collection)
})
