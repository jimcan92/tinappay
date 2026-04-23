/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2536409462")

  // remove field
  collection.fields.removeById("relation1114567570")

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2536409462")

  // add field
  collection.fields.addAt(9, new Field({
    "cascadeDelete": false,
    "collectionId": "_pb_users_auth_",
    "hidden": false,
    "id": "relation1114567570",
    "maxSelect": 999,
    "minSelect": 0,
    "name": "staff",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
})
