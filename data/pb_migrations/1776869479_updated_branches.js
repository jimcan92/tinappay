/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2536409462")

  // add field
  collection.fields.addAt(9, new Field({
    "hidden": false,
    "id": "bool719053637",
    "name": "is_main",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2536409462")

  // remove field
  collection.fields.removeById("bool719053637")

  return app.save(collection)
})
