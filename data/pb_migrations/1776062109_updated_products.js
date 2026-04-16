/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_40928548512")

  // remove field
  collection.fields.removeById("number801432874")

  // remove field
  collection.fields.removeById("number4163852139")

  // add field
  collection.fields.addAt(7, new Field({
    "hidden": false,
    "id": "number3402113753",
    "max": null,
    "min": 0,
    "name": "price",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // update field
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
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_40928548512")

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

  // remove field
  collection.fields.removeById("number3402113753")

  // update field
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

  return app.save(collection)
})
