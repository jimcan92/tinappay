/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_");

  const record = new Record(collection);
  record.set("email", "admin@tinappay.com");
  record.set("password", "password123");
  record.set("passwordConfirm", "password123");
  record.set("name", "Admin User");
  record.set("role", "Admin");
  record.set("verified", true);

  return app.save(record);
}, (app) => {
  const record = app.findFirstRecordByData("users", "email", "admin@tinappay.com");
  if (record) {
    return app.delete(record);
  }
})
