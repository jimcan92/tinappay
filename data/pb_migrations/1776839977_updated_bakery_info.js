/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3967961299")

  // add field
  collection.fields.addAt(4, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text3289165131",
    "max": 0,
    "min": 0,
    "name": "receipt_footer",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // update field
  collection.fields.addAt(3, new Field({
    "hidden": false,
    "id": "file3834550803",
    "maxSelect": 1,
    "maxSize": 0,
    "mimeTypes": [
      "image/png",
      "image/jpeg",
      "image/x-icon",
      "image/bmp",
      "image/svg+xml"
    ],
    "name": "logo",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": [],
    "type": "file"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3967961299")

  // remove field
  collection.fields.removeById("text3289165131")

  // update field
  collection.fields.addAt(3, new Field({
    "hidden": false,
    "id": "file3834550803",
    "maxSelect": 1,
    "maxSize": 0,
    "mimeTypes": [],
    "name": "logo",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": [],
    "type": "file"
  }))

  return app.save(collection)
})
