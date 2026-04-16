/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_40928548512")

  // update field
  collection.fields.addAt(3, new Field({
    "hidden": false,
    "id": "select3703245907",
    "maxSelect": 1,
    "name": "unit",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "kg",
      "g",
      "mL",
      "L",
      "pcs"
    ]
  }))

  // update field
  collection.fields.addAt(6, new Field({
    "hidden": false,
    "id": "file3760176746",
    "maxSelect": 99,
    "maxSize": 0,
    "mimeTypes": [
      "image/png",
      "image/jpeg",
      "image/webp",
      "video/webm",
      "image/gif"
    ],
    "name": "images",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": [],
    "type": "file"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_40928548512")

  // update field
  collection.fields.addAt(3, new Field({
    "hidden": false,
    "id": "select3703245907",
    "maxSelect": 1,
    "name": "unit",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "kg",
      "g",
      "pc",
      "mL",
      "L"
    ]
  }))

  // update field
  collection.fields.addAt(6, new Field({
    "hidden": false,
    "id": "file3760176746",
    "maxSelect": 99,
    "maxSize": 0,
    "mimeTypes": [],
    "name": "images",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": [],
    "type": "file"
  }))

  return app.save(collection)
})
