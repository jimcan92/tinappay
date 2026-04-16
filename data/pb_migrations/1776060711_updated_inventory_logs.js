/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2646768869")

  // update collection data
  unmarshal({
    "name": "inventory_logs_"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2646768869")

  // update collection data
  unmarshal({
    "name": "inventory_logs"
  }, collection)

  return app.save(collection)
})
