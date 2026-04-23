/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2892170481")

  // add field
  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "number4012384612",
    "max": null,
    "min": 0,
    "name": "current_stock",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(5, new Field({
    "hidden": false,
    "id": "number801432874",
    "max": null,
    "min": 0,
    "name": "min_stock",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(6, new Field({
    "hidden": false,
    "id": "number4163852139",
    "max": null,
    "min": 0,
    "name": "max_stock",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2892170481")

  // remove field
  collection.fields.removeById("number4012384612")

  // remove field
  collection.fields.removeById("number801432874")

  // remove field
  collection.fields.removeById("number4163852139")

  return app.save(collection)
})
