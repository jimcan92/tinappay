/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_24569279402")

  // update field
  collection.fields.addAt(1, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_35271804482",
    "hidden": false,
    "id": "relation4113142680",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "order",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "relation"
  }))

  // update field
  collection.fields.addAt(2, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_40928548512",
    "hidden": false,
    "id": "relation3544843437",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "product",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "relation"
  }))

  // update field
  collection.fields.addAt(3, new Field({
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
  }))

  // update field
  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "number3402113753",
    "max": null,
    "min": null,
    "name": "price",
    "onlyInt": false,
    "presentable": false,
    "required": true,
    "system": false,
    "type": "number"
  }))

  // update field
  collection.fields.addAt(5, new Field({
    "hidden": false,
    "id": "number3097235076",
    "max": null,
    "min": null,
    "name": "subtotal",
    "onlyInt": false,
    "presentable": false,
    "required": true,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_24569279402")

  // update field
  collection.fields.addAt(1, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_35271804482",
    "hidden": false,
    "id": "relation4113142680",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "order",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  // update field
  collection.fields.addAt(2, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_40928548512",
    "hidden": false,
    "id": "relation3544843437",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "product",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  // update field
  collection.fields.addAt(3, new Field({
    "hidden": false,
    "id": "number2683508278",
    "max": null,
    "min": null,
    "name": "quantity",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // update field
  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "number3402113753",
    "max": null,
    "min": null,
    "name": "price",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // update field
  collection.fields.addAt(5, new Field({
    "hidden": false,
    "id": "number3097235076",
    "max": null,
    "min": null,
    "name": "subtotal",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
})
