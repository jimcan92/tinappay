/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3355664324")

  // update collection data
  unmarshal({
    "name": "suppliers_"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3355664324")

  // update collection data
  unmarshal({
    "name": "suppliers"
  }, collection)

  return app.save(collection)
})
