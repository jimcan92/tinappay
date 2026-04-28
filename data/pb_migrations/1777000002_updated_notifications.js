/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1777000000");

  collection.fields.add(new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text1777000002",
    "max": 100,
    "min": 0,
    "name": "branch_name",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1777000000");
  collection.fields.removeById("text1777000002");
  return app.save(collection);
});
