/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2536409462")

  // add field
  collection.fields.addAt(6, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_3967961299",
    "hidden": false,
    "id": "relation3326605866",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "bakery",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2536409462")

  // remove field
  collection.fields.removeById("relation3326605866")

  return app.save(collection)
})
