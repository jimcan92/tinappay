/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2536409462")

  // add field
  collection.fields.addAt(7, new Field({
    "hidden": false,
    "id": "number2499937429",
    "max": null,
    "min": null,
    "name": "lat",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(8, new Field({
    "hidden": false,
    "id": "number2518964612",
    "max": null,
    "min": null,
    "name": "lng",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2536409462")

  // remove field
  collection.fields.removeById("number2499937429")

  // remove field
  collection.fields.removeById("number2518964612")

  return app.save(collection)
})
