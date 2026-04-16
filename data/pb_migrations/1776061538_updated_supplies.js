/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2892170481")

  // add field
  collection.fields.addAt(1, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text1579384326",
    "max": 0,
    "min": 0,
    "name": "name",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": true,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(2, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text1843675174",
    "max": 0,
    "min": 0,
    "name": "description",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
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

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2892170481")

  // remove field
  collection.fields.removeById("text1579384326")

  // remove field
  collection.fields.removeById("text1843675174")

  // remove field
  collection.fields.removeById("select3703245907")

  return app.save(collection)
})
