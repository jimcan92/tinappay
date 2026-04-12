/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("reservations000");

  return app.delete(collection);
}, (app) => {
  const collection = new Collection({
    "createRule": "",
    "deleteRule": "",
    "fields": [
      {
        "cascadeDelete": false,
        "collectionId": "laboratories000",
        "hidden": false,
        "id": "relation552606404",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "lab_id",
        "presentable": true,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "cascadeDelete": false,
        "collectionId": "equipment000000",
        "hidden": false,
        "id": "relation709162848",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "equipment_id",
        "presentable": true,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "cascadeDelete": false,
        "collectionId": "_pb_users_auth_",
        "hidden": false,
        "id": "relation577366312",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "user_id",
        "presentable": true,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "cascadeDelete": false,
        "collectionId": "courses00000000",
        "hidden": false,
        "id": "relation398354204",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "course_id",
        "presentable": true,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "hidden": false,
        "id": "date99007360",
        "max": "",
        "min": "",
        "name": "start_time",
        "presentable": true,
        "required": true,
        "system": false,
        "type": "date"
      },
      {
        "hidden": false,
        "id": "date324043057",
        "max": "",
        "min": "",
        "name": "end_time",
        "presentable": true,
        "required": true,
        "system": false,
        "type": "date"
      },
      {
        "hidden": false,
        "id": "select583926423",
        "maxSelect": 1,
        "name": "status",
        "presentable": true,
        "required": false,
        "system": false,
        "type": "select",
        "values": [
          "pending",
          "approved",
          "rejected",
          "cancelled",
          "completed"
        ]
      },
      {
        "hidden": false,
        "id": "autodate945463360",
        "name": "created",
        "onCreate": true,
        "onUpdate": false,
        "presentable": false,
        "system": false,
        "type": "autodate"
      },
      {
        "hidden": false,
        "id": "autodate736949073",
        "name": "updated",
        "onCreate": true,
        "onUpdate": true,
        "presentable": false,
        "system": false,
        "type": "autodate"
      },
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "hidden": false,
        "id": "text3208210256",
        "max": 15,
        "min": 15,
        "name": "id",
        "pattern": "^[a-z0-9]+$",
        "presentable": false,
        "primaryKey": true,
        "required": true,
        "system": true,
        "type": "text"
      }
    ],
    "id": "reservations000",
    "indexes": [],
    "listRule": "",
    "name": "reservations",
    "system": false,
    "type": "base",
    "updateRule": "",
    "viewRule": ""
  });

  return app.save(collection);
})
