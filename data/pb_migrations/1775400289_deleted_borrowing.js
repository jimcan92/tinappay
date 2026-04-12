/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("borrowing000000");

  return app.delete(collection);
}, (app) => {
  const collection = new Collection({
    "createRule": "",
    "deleteRule": "",
    "fields": [
      {
        "cascadeDelete": false,
        "collectionId": "equipment000000",
        "hidden": false,
        "id": "relation638065861",
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
        "id": "relation856826773",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "borrower_id",
        "presentable": true,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "cascadeDelete": false,
        "collectionId": "laboratories000",
        "hidden": false,
        "id": "relation3847536",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "lab_id",
        "presentable": true,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "cascadeDelete": false,
        "collectionId": "courses00000000",
        "hidden": false,
        "id": "relation768512501",
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
        "id": "date164322725",
        "max": "",
        "min": "",
        "name": "borrow_date",
        "presentable": true,
        "required": false,
        "system": false,
        "type": "date"
      },
      {
        "hidden": false,
        "id": "date282092410",
        "max": "",
        "min": "",
        "name": "expected_return_date",
        "presentable": true,
        "required": true,
        "system": false,
        "type": "date"
      },
      {
        "hidden": false,
        "id": "date584565039",
        "max": "",
        "min": "",
        "name": "actual_return_date",
        "presentable": true,
        "required": false,
        "system": false,
        "type": "date"
      },
      {
        "hidden": false,
        "id": "select110789508",
        "maxSelect": 1,
        "name": "condition_upon_borrowing",
        "presentable": true,
        "required": false,
        "system": false,
        "type": "select",
        "values": [
          "new",
          "good",
          "fair",
          "poor"
        ]
      },
      {
        "hidden": false,
        "id": "select990103299",
        "maxSelect": 1,
        "name": "condition_upon_return",
        "presentable": true,
        "required": false,
        "system": false,
        "type": "select",
        "values": [
          "new",
          "good",
          "fair",
          "poor",
          "damaged"
        ]
      },
      {
        "hidden": false,
        "id": "select341404046",
        "maxSelect": 1,
        "name": "status",
        "presentable": true,
        "required": false,
        "system": false,
        "type": "select",
        "values": [
          "borrowed",
          "returned",
          "overdue",
          "lost"
        ]
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text523226402",
        "max": 255,
        "min": 0,
        "name": "remarks",
        "pattern": "",
        "presentable": true,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "autodate405453701",
        "name": "created",
        "onCreate": true,
        "onUpdate": false,
        "presentable": false,
        "system": false,
        "type": "autodate"
      },
      {
        "hidden": false,
        "id": "autodate183559889",
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
    "id": "borrowing000000",
    "indexes": [],
    "listRule": "",
    "name": "borrowing",
    "system": false,
    "type": "base",
    "updateRule": "",
    "viewRule": ""
  });

  return app.save(collection);
})
