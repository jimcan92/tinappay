/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("inventory_logs");
  const field = collection.fields.getByName("reason");
  field.values = ["sale", "waste", "restock", "adjustment", "production"];
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("inventory_logs");
  const field = collection.fields.getByName("reason");
  field.values = ["sale", "waste", "restock", "adjustment"];
  return app.save(collection);
});
