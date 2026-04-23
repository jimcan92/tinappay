/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_4219755904")

  // add field
  collection.fields.addAt(6, new Field({
    "hidden": false,
    "id": "select105650625",
    "maxSelect": 1,
    "name": "category",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "sales",
      "supplies",
      "utilities",
      "salary",
      "maintenance",
      "others"
    ]
  }))

  // add field
  collection.fields.addAt(7, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text373677737",
    "max": 0,
    "min": 0,
    "name": "reference_id",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_4219755904")

  // remove field
  collection.fields.removeById("select105650625")

  // remove field
  collection.fields.removeById("text373677737")

  return app.save(collection)
})
