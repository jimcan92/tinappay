/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_26467688692")

  // add field
  collection.fields.addAt(2, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_2892170481",
    "hidden": false,
    "id": "relation3524891788",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "supply",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  // add field
  collection.fields.addAt(3, new Field({
    "hidden": false,
    "id": "select1001949196",
    "maxSelect": 1,
    "name": "reason",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "sale",
      "waste"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_26467688692")

  // remove field
  collection.fields.removeById("relation3524891788")

  // remove field
  collection.fields.removeById("select1001949196")

  return app.save(collection)
})
