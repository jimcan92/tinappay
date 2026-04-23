/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_40928548512")

  // remove field
  collection.fields.removeById("number4012384612")

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_40928548512")

  // add field
  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "number4012384612",
    "max": null,
    "min": 0,
    "name": "stock",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
})
