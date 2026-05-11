/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("categories");
  collection.fields.addAt(3, new Field({
    "hidden": false,
    "id": "bool1777000010",
    "name": "production",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }));
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("categories");
  collection.fields.removeById("bool1777000010");
  return app.save(collection);
});
